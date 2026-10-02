// ═══════════════════════════════════════════════════════════════════
// MT5-BRIDGE PAYMENT ROUTES
// Express Router. Mount on /v1/payments
// Feature-flagged via PAYMENTS_ENABLED (checked in index.ts)
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import {
  PaymentMethod,
  PRODUCTS_CATALOGUE,
  getPaymentConfig,
  getExchangeRate,
  calculateKesAmount,
  getProduct,
  generatePaymentReference,
  normalizeMpesaPhone,
  createPaymentRecord,
  getPaymentRecord,
  updatePaymentRecord,
  getAllPayments,
  getPaymentsByUser,
  findPaymentByReference,
  checkRecentDuplicatePayment,
  isReceiptClaimed,
  claimReceipt,
  extractAndValidateMpesaReceipt,
  initiateMpesaStkPushGateway,
  completePaymentAndSyncUser,
} from './engine';
import { query } from '../db';

const router = Router();

// ═══════════════════════════════════════════════════════════════════
// GET /v1/payments/config — public config (wallet addresses, exchange rate)
// ═══════════════════════════════════════════════════════════════════
router.get('/config', (_req: Request, res: Response) => {
  res.json({ success: true, config: getPaymentConfig() });
});

// ═══════════════════════════════════════════════════════════════════
// GET /v1/payments/products — product catalogue
// ═══════════════════════════════════════════════════════════════════
router.get('/products', (_req: Request, res: Response) => {
  const exchangeRate = getExchangeRate();
  const products = Object.values(PRODUCTS_CATALOGUE).map((prod) => ({
    ...prod,
    exchangeRate,
    kesAmount: calculateKesAmount(prod.usdPrice),
    formattedKes: `KES ${calculateKesAmount(prod.usdPrice).toLocaleString()}`,
  }));
  res.json({ success: true, exchangeRate, products });
});

// ═══════════════════════════════════════════════════════════════════
// POST /v1/payments/mpesa/stk-push — start automated M-Pesa payment
// Body: { productId, phoneNumber, userEmail, userName? }
// ═══════════════════════════════════════════════════════════════════
router.post('/mpesa/stk-push', async (req: Request, res: Response): Promise<any> => {
  try {
    const { productId, phoneNumber, userEmail, userName } = req.body;

    if (!productId) return res.status(400).json({ success: false, error: 'productId required' });
    if (!phoneNumber) return res.status(400).json({ success: false, error: 'phoneNumber required' });
    if (!userEmail) return res.status(400).json({ success: false, error: 'userEmail required' });

    const product = getProduct(productId);
    if (!product) return res.status(400).json({ success: false, error: 'Unknown product' });

    const phone = normalizeMpesaPhone(phoneNumber);
    if (!phone.isValid) return res.status(400).json({ success: false, error: phone.error });

    // Duplicate guard
    const dup = await checkRecentDuplicatePayment(phone.normalized);
    if (dup) {
      return res.status(429).json({
        success: false,
        error: 'A payment is already processing for this number. Please wait.',
        paymentId: dup.id,
      });
    }

    const exchangeRate = getExchangeRate();
    const kesAmount = calculateKesAmount(product.usdPrice);
    const paymentId = generatePaymentReference('PTA');
    const accountRef = paymentId;

    // Create pending record
    await createPaymentRecord({
      id: paymentId,
      userEmail,
      userName,
      productId: product.id,
      productName: product.name,
      usdPrice: product.usdPrice,
      exchangeRate,
      kesAmount,
      paymentMethod: 'mpesa_automated',
      phoneNumber: phone.normalized,
      status: 'PENDING',
      statusMessage: 'STK push initiated',
    });

    // Fire STK
    const stk = await initiateMpesaStkPushGateway({
      phoneNumber: phone.normalized,
      amount: kesAmount,
      accountReference: accountRef,
      transactionDesc: `PipTrader AI - ${product.name}`,
      callbackUrl: process.env.MPESA_CALLBACK_URL,
    });

    if (!stk.success) {
      await updatePaymentRecord(paymentId, {
        status: 'FAILED',
        statusMessage: stk.message || 'STK push failed',
      });
      return res.status(400).json({ success: false, error: stk.message || 'STK push failed' });
    }

    await updatePaymentRecord(paymentId, {
      status: 'PROCESSING',
      checkoutRequestId: stk.checkoutRequestId,
      merchantRequestId: stk.merchantRequestId,
      statusMessage: 'Awaiting M-Pesa confirmation',
    });

    res.json({
      success: true,
      paymentId,
      checkoutRequestId: stk.checkoutRequestId,
      message: 'STK push sent. Enter your M-Pesa PIN.',
      kesAmount,
    });
  } catch (err: any) {
    console.error('stk-push error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// POST /v1/payments/mpesa/callback — M-Pesa/PayWave webhook
// This is what auto-completes payments. No auth (provider signs).
// ═══════════════════════════════════════════════════════════════════
router.post('/mpesa/callback', async (req: Request, res: Response): Promise<any> => {
  try {
    const body = req.body || {};
    console.log('📥 M-Pesa callback:', JSON.stringify(body).slice(0, 500));

    // Extract fields across common provider shapes
    const stkCallback = body?.Body?.stkCallback || body;
    const checkoutRequestId = stkCallback?.CheckoutRequestID || body?.checkout_request_id;
    const merchantRequestId = stkCallback?.MerchantRequestID || body?.merchant_request_id;
    const resultCode = stkCallback?.ResultCode ?? body?.result_code;
    const resultDesc = stkCallback?.ResultDesc || body?.result_desc;
    const items = stkCallback?.CallbackMetadata?.Item || body?.metadata?.items || [];

    const getItem = (name: string) => items.find((i: any) => i.Name === name || i.name === name)?.Value
      ?? items.find((i: any) => i.Name === name || i.name === name)?.value;

    const receipt = getItem('MpesaReceiptNumber');
    const amount = getItem('Amount');
    const phone = getItem('PhoneNumber');

    if (!checkoutRequestId && !merchantRequestId) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'No IDs, ignored' });
    }

    // Find matching payment
    const { rows } = await query(
      'SELECT * FROM pipnex_payments WHERE checkout_request_id = $1 OR merchant_request_id = $1 LIMIT 1',
      [checkoutRequestId || merchantRequestId]
    );
    const payment = rows[0];
    if (!payment) {
      console.warn('Callback for unknown payment:', checkoutRequestId);
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Unknown payment, ignored' });
    }

    if (Number(resultCode) === 0) {
      // Success — auto complete
      await completePaymentAndSyncUser(payment.id, {
        receiptNumber: receipt,
        note: `Auto-verified via callback. Amount=${amount} Phone=${phone}`,
      });
      console.log(`✅ Payment ${payment.id} auto-completed for ${payment.user_email}`);
    } else {
      // Failure / cancellation
      await updatePaymentRecord(payment.id, {
        status: 'FAILED',
        statusMessage: resultDesc || 'M-Pesa rejected',
      });
      console.log(`❌ Payment ${payment.id} failed: ${resultDesc}`);
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err: any) {
    console.error('callback error:', err);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// POST /v1/payments/manual/submit — manual M-Pesa or Binance USDT
// Body: { paymentMethod, productId, userEmail, userName?,
//         transactionRef, binanceId?, phoneNumber?, amountSent? }
// ═══════════════════════════════════════════════════════════════════
router.post('/manual/submit', async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      paymentMethod, productId, userEmail, userName,
      transactionRef, binanceId, phoneNumber, amountSent,
    } = req.body;

    if (paymentMethod !== 'mpesa_manual' && paymentMethod !== 'binance_usdt') {
      return res.status(400).json({ success: false, error: 'Manual submit only for mpesa_manual or binance_usdt' });
    }
    if (!transactionRef) {
      return res.status(400).json({ success: false, error: 'transactionRef is required' });
    }
    if (!productId || !userEmail) {
      return res.status(400).json({ success: false, error: 'productId and userEmail required' });
    }

    const product = getProduct(productId);
    if (!product) return res.status(400).json({ success: false, error: 'Unknown product' });

    const exchangeRate = getExchangeRate();
    const kesAmount = calculateKesAmount(product.usdPrice);

    // Dedup by transaction ref
    const existing = await findPaymentByReference(transactionRef);
    if (existing) {
      return res.status(409).json({ success: false, error: 'This transaction reference was already submitted' });
    }

    let receipt = transactionRef;
    if (paymentMethod === 'mpesa_manual') {
      const check = extractAndValidateMpesaReceipt(transactionRef);
      if (!check.valid) return res.status(400).json({ success: false, error: check.error });
      receipt = check.code!;
      if (await isReceiptClaimed(receipt)) {
        return res.status(409).json({ success: false, error: 'This M-Pesa receipt was already used' });
      }
    }

    const paymentId = generatePaymentReference('PTA');
    await createPaymentRecord({
      id: paymentId,
      userEmail,
      userName,
      productId: product.id,
      productName: product.name,
      usdPrice: product.usdPrice,
      exchangeRate,
      kesAmount,
      paymentMethod: paymentMethod as PaymentMethod,
      phoneNumber,
      transactionHash: paymentMethod === 'binance_usdt' ? transactionRef : undefined,
      binanceId: paymentMethod === 'binance_usdt' ? binanceId : undefined,
      mpesaReceiptNumber: paymentMethod === 'mpesa_manual' ? receipt : undefined,
      externalReference: transactionRef,
      status: 'PROCESSING',
      statusMessage: paymentMethod === 'binance_usdt'
        ? 'Binance TxID submitted. Awaiting admin audit.'
        : 'M-Pesa receipt submitted. Awaiting admin audit.',
    });

    if (paymentMethod === 'mpesa_manual') {
      await claimReceipt(receipt, paymentId, userEmail);
    }

    res.json({
      success: true,
      paymentId,
      message: 'Submitted. Activation usually completes within 1–30 minutes after admin audit.',
    });
  } catch (err: any) {
    console.error('manual-submit error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// GET /v1/payments/status/:paymentId — poll current status
// ═══════════════════════════════════════════════════════════════════
router.get('/status/:paymentId', async (req: Request, res: Response): Promise<any> => {
  const rec = await getPaymentRecord(String(req.params.paymentId));
  if (!rec) return res.status(404).json({ success: false, error: 'Payment not found' });
  res.json({ success: true, payment: rec });
});

// ═══════════════════════════════════════════════════════════════════
// GET /v1/payments/user/:userEmail — payment history for a user
// ═══════════════════════════════════════════════════════════════════
router.get('/user/:userEmail', async (req: Request, res: Response): Promise<any> => {
  const list = await getPaymentsByUser(String(req.params.userEmail));
  res.json({ success: true, payments: list });
});

// ═══════════════════════════════════════════════════════════════════
// GET /v1/payments/user/:email/pending — any pending payments
// ═══════════════════════════════════════════════════════════════════
router.get('/user/:email/pending', async (req: Request, res: Response): Promise<any> => {
  const { rows } = await query(
    `SELECT * FROM pipnex_payments
     WHERE user_email = $1 AND status IN ('PENDING','PROCESSING')
     ORDER BY created_at DESC LIMIT 1`,
    [String(req.params.email)]
  );
  res.json({ success: true, pending: rows[0] || null });
});

// ═══════════════════════════════════════════════════════════════════
// ADMIN — list all payments, verify manually
// (mounted behind adminAuth in index.ts)
// ═══════════════════════════════════════════════════════════════════
router.get('/admin/all', async (_req: Request, res: Response): Promise<any> => {
  const list = await getAllPayments();
  res.json({ success: true, payments: list });
});

router.post('/admin/verify', async (req: Request, res: Response): Promise<any> => {
  const { paymentId, approve, note } = req.body;
  if (!paymentId) return res.status(400).json({ success: false, error: 'paymentId required' });

  const rec = await getPaymentRecord(paymentId);
  if (!rec) return res.status(404).json({ success: false, error: 'Payment not found' });

  if (approve) {
    const r = await completePaymentAndSyncUser(paymentId, { note });
    if (!r.ok) return res.status(400).json({ success: false, error: r.error });
    return res.json({ success: true, message: 'Payment approved and user activated' });
  }

  await updatePaymentRecord(paymentId, { status: 'CANCELLED', statusMessage: note || 'Rejected by admin' });
  res.json({ success: true, message: 'Payment rejected' });
});

// ═══════════════════════════════════════════════════════════════════
// POST /v1/payments/simulate-complete — DEV ONLY
// Only works when PAYMENTS_SIMULATE=true
// ═══════════════════════════════════════════════════════════════════
router.post('/simulate-complete', async (req: Request, res: Response): Promise<any> => {
  if (process.env.PAYMENTS_SIMULATE !== 'true') {
    return res.status(403).json({ success: false, error: 'Simulation disabled' });
  }
  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ success: false, error: 'paymentId required' });
  const r = await completePaymentAndSyncUser(paymentId, { note: 'SIMULATED' });
  res.json({ success: r.ok, error: r.error });
});

export default router;
