// ============================================================
// PAYMENT ROUTES — extracted from server.ts
// Copy these into your new project's server.ts (Express app)
// Adjust the callback URL and product catalogue in paymentEngine.ts
// ============================================================

// ── config ──
app.get('/api/payments/config', (req, res) => {
  const config = getPaymentConfig();
  res.json({
    success: true,
    config
  });
});

// ── products ──
app.get('/api/payments/products', (req, res) => {
  const exchangeRate = getExchangeRate();
  const products = Object.values(PRODUCTS_CATALOGUE).map((prod) => ({
    ...prod,
    exchangeRate,
    kesAmount: calculateKesAmount(prod.usdPrice),
    formattedKes: `KES ${calculateKesAmount(prod.usdPrice).toLocaleString()}`
  }));

  res.json({
    success: true,
    exchangeRate,
    products
  });
});

// ── stk-push ──
app.post('/api/payments/mpesa/stk-push', async (req, res) => {
  try {
    const { productId, phoneNumber, userId, userEmail, userName, customKesAmount, customUsdPrice } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'M-Pesa phone number is required' });
    }

    const product = getProduct(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: `Invalid product plan: ${productId}` });
    }

    const exchangeRate = getExchangeRate();
    const usdPrice = customUsdPrice && Number(customUsdPrice) > 0 ? Number(customUsdPrice) : product.usdPrice;
    const kesAmount = customKesAmount && Number(customKesAmount) > 0 ? Number(customKesAmount) : calculateKesAmount(usdPrice);
    const formattedPhone = formatMpesaPhoneNumber(phoneNumber);

    if (formattedPhone.length < 10) {
      return res.status(400).json({ success: false, error: 'Please provide a valid Safaricom phone number' });
    }

    const paymentId = `pay_mpesa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const stkResult = await initiateMpesaStkPushGateway({
      paymentId,
      phoneNumber: formattedPhone,
      amount: kesAmount,
      productName: product.name,
      accountReference: paymentId.slice(0, 16),
      userId: userId || 'guest',
      userEmail: userEmail || 'user@pipnex.ai'
    });

    if (!stkResult.success) {
      return res.status(400).json({
        success: false,
        error: stkResult.error || 'Failed to initiate M-Pesa STK Push'
      });
    }

    const paymentRecord: PaymentRecord = {
      id: paymentId,
      userId: userId || 'guest',
      userEmail: userEmail || 'user@pipnex.ai',
      userName: userName || 'Trader',
      productId: product.id,
      productName: product.name,
      usdPrice,
      exchangeRate,
      kesAmount,
      paymentMethod: 'mpesa_automated',
      phoneNumber: formattedPhone,
      merchantRequestId: stkResult.merchantRequestId,
      checkoutRequestId: stkResult.checkoutRequestId,
      externalReference: stkResult.externalReference,
      status: 'PROCESSING',
      statusMessage: stkResult.responseDescription || 'STK push prompt sent to phone. Awaiting customer PIN entry.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    createPaymentRecord(paymentRecord);

    console.log(`[M-Pesa STK Push] Initialized ${paymentId} for ${product.name} (KES ${kesAmount}) to ${formattedPhone} via ${stkResult.gateway || 'gateway'}`);

    res.json({
      success: true,
      paymentId,
      merchantRequestId: stkResult.merchantRequestId,
      checkoutRequestId: stkResult.checkoutRequestId,
      externalReference: stkResult.externalReference,
      productName: product.name,
      usdPrice,
      kesAmount,
      exchangeRate,
      phoneNumber: formattedPhone,
      message: 'M-Pesa prompt sent. Please check your phone and enter your PIN.'
    });
  } catch (error: any) {
    console.error('[M-Pesa STK Push Error]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while initiating STK Push'
    });
  }
});

// ── callback_routes_array ──
const CALLBACK_ROUTES = [
  '/api/payments/mpesa/callback',
  '/api/payments/callback',
  '/api/payments/payhero/callback',
  '/api/payments/payhero-callback',
  '/api/payments/stk/callback',
  '/api/payments/stk-callback',
  '/api/mpesa/callback',
  '/api/payhero/callback',
  '/api/v2/payments/callback',
  '/api/payments/webhook'
];

app.all(CALLBACK_ROUTES, async (req, res) => {
  try {
    console.log(`[M-Pesa Webhook Callback Received on ${req.path}]:`, JSON.stringify(req.body || req.query));
    
    const callbackData = req.body?.Body?.stkCallback || req.body?.stkCallback || req.body?.response || req.body || req.query;

    const MerchantRequestID = 
      callbackData?.MerchantRequestID || 
      req.body?.MerchantRequestID || 
      req.body?.merchant_request_id || 
      req.query?.merchant_request_id;

    const CheckoutRequestID = 
      callbackData?.CheckoutRequestID || 
      req.body?.CheckoutRequestID || 
      req.body?.checkout_request_id || 
      req.query?.checkout_request_id;

    const ExternalReference = 
      callbackData?.ExternalReference || 
      callbackData?.external_reference || 
      callbackData?.Reference || 
      callbackData?.reference || 
      req.body?.external_reference || 
      req.body?.reference || 
      req.body?.Reference || 
      req.body?.ExternalReference || 
      req.query?.external_reference || 
      req.query?.reference;

    const RawResultCode = 
      callbackData?.ResultCode ?? 
      req.body?.ResultCode ?? 
      req.body?.result_code ?? 
      (callbackData?.status === 'Success' || callbackData?.Status === 'Success' || req.body?.status === 'SUCCESS' || req.body?.status === 'Success' || req.body?.success === true ? 0 : undefined);
    
    const ResultCode = RawResultCode !== undefined ? Number(RawResultCode) : 0;
    const ResultDesc = callbackData?.ResultDesc || req.body?.ResultDesc || req.body?.result_description || req.body?.message || 'Processed successfully';
    const CallbackMetadata = callbackData?.CallbackMetadata || req.body?.CallbackMetadata;

    let receiptNumber = '';
    let paidAmountKes: number | undefined;
    let phoneFromCallback = '';

    if (CallbackMetadata?.Item && Array.isArray(CallbackMetadata.Item)) {
      for (const item of CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber' && item.Value) receiptNumber = String(item.Value);
        if (item.Name === 'Amount' && item.Value) paidAmountKes = Number(item.Value);
        if (item.Name === 'PhoneNumber' && item.Value) phoneFromCallback = String(item.Value);
      }
    }

    if (!receiptNumber) {
      receiptNumber = 
        callbackData?.MpesaReceiptNumber || 
        callbackData?.mpesa_receipt_number || 
        req.body?.mpesa_receipt_number || 
        req.body?.MpesaReceiptNumber || 
        req.body?.receipt_number || 
        req.body?.ReceiptNo || 
        '';
    }

    if (!phoneFromCallback) {
      phoneFromCallback = 
        callbackData?.Phone || 
        callbackData?.phone || 
        callbackData?.phone_number || 
        req.body?.phone_number || 
        req.body?.phone || 
        '';
    }

    const allPayments = getAllPayments();
    let payment = allPayments.find((p) => 
      (CheckoutRequestID && (p.checkoutRequestId === CheckoutRequestID || p.id === CheckoutRequestID)) || 
      (MerchantRequestID && (p.merchantRequestId === MerchantRequestID || p.id === MerchantRequestID)) ||
      (ExternalReference && (p.externalReference === ExternalReference || p.id === ExternalReference))
    );

    if (!payment && ExternalReference) {
      payment = findPaymentByReference(ExternalReference);
    }
    if (!payment && CheckoutRequestID) {
      payment = findPaymentByReference(CheckoutRequestID);
    }

    if (!payment && (CheckoutRequestID || MerchantRequestID || ExternalReference)) {
      const allDeposits = db.getAllDeposits();
      const matchedDeposit = allDeposits.find(
        (d) => (CheckoutRequestID && d.checkoutRequestId === CheckoutRequestID) ||
               (MerchantRequestID && d.merchantRequestId === MerchantRequestID) ||
               (ExternalReference && d.id === ExternalReference)
      );
      if (matchedDeposit) {
        payment = getPaymentRecord(matchedDeposit.id);
      }
    }

    if (!payment && phoneFromCallback) {
      const norm = formatMpesaPhoneNumber(phoneFromCallback);
      payment = allPayments.find(p => 
        p.paymentMethod === 'mpesa_automated' && 
        (p.status === 'PROCESSING' || p.status === 'PENDING') &&
        p.phoneNumber && formatMpesaPhoneNumber(p.phoneNumber) === norm
      );
    }

    if (payment) {
      if (payment.status === 'COMPLETED') {
        console.log(`[M-Pesa Callback IDEMPOTENT] Payment ${payment.id} is already COMPLETED.`);
        return res.json({ ResultCode: 0, ResultDesc: 'Payment already processed and credited.' });
      }

      const isSuccess = ResultCode === 0 || 
                        callbackData?.status === 'Success' || 
                        callbackData?.Status === 'Success' || 
                        req.body?.status === 'Success' || 
                        req.body?.status === 'SUCCESS';

      if (isSuccess) {
        if (!receiptNumber) {
          receiptNumber = `REC${Date.now().toString().slice(-8)}`;
        }

        // ⚠️ PAYMENT LEAK FIX: Do NOT auto-activate. Mark payment as PENDING
        // for admin audit instead. Only /api/payments/admin/verify can activate.
        updatePaymentRecord(payment.id, {
          status: 'PENDING' as any,
          statusMessage: `M-Pesa payment received (Receipt: ${receiptNumber}). Under admin audit — activation usually completes within 1–30 minutes.`,
          mpesaReceiptNumber: receiptNumber,
          completedAt: undefined, // not completed until admin approves
        });

        console.log(`[M-Pesa Callback Queued] Payment ${payment.id} received. Receipt: ${receiptNumber}. Awaiting admin audit.`);
      } else {
        updatePaymentRecord(payment.id, {
          status: ResultCode === 1032 ? 'CANCELLED' : 'FAILED',
          statusMessage: ResultDesc || 'STK Push transaction was cancelled or failed.'
        });

        const existingDeposit = db.getDepositById(payment.id);
        if (existingDeposit) {
          db.updateDeposit(payment.id, {
            status: ResultCode === 1032 ? 'CANCELLED' : 'FAILED',
            statusMessage: ResultDesc || 'STK Push deposit was cancelled or failed.'
          });
        }

        console.log(`[M-Pesa Callback Failed] Payment ${payment.id} finished with code ${ResultCode}: ${ResultDesc}`);
      }
    } else {
      console.warn(`[M-Pesa Callback Warning] No payment matched for Ref: ${ExternalReference} / Checkout: ${CheckoutRequestID} / Phone: ${phoneFromCallback}`);
    }

    res.json({ ResultCode: 0, ResultDesc: 'Callback processed successfully' });
  } catch (err: any) {
    console.error('[M-Pesa Callback Processing Error]:', err);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted with internal error' });
  }
});

// ── callback_handler ──
app.all(CALLBACK_ROUTES, async (req, res) => {
  try {
    console.log(`[M-Pesa Webhook Callback Received on ${req.path}]:`, JSON.stringify(req.body || req.query));
    
    const callbackData = req.body?.Body?.stkCallback || req.body?.stkCallback || req.body?.response || req.body || req.query;

    const MerchantRequestID = 
      callbackData?.MerchantRequestID || 
      req.body?.MerchantRequestID || 
      req.body?.merchant_request_id || 
      req.query?.merchant_request_id;

    const CheckoutRequestID = 
      callbackData?.CheckoutRequestID || 
      req.body?.CheckoutRequestID || 
      req.body?.checkout_request_id || 
      req.query?.checkout_request_id;

    const ExternalReference = 
      callbackData?.ExternalReference || 
      callbackData?.external_reference || 
      callbackData?.Reference || 
      callbackData?.reference || 
      req.body?.external_reference || 
      req.body?.reference || 
      req.body?.Reference || 
      req.body?.ExternalReference || 
      req.query?.external_reference || 
      req.query?.reference;

    const RawResultCode = 
      callbackData?.ResultCode ?? 
      req.body?.ResultCode ?? 
      req.body?.result_code ?? 
      (callbackData?.status === 'Success' || callbackData?.Status === 'Success' || req.body?.status === 'SUCCESS' || req.body?.status === 'Success' || req.body?.success === true ? 0 : undefined);
    
    const ResultCode = RawResultCode !== undefined ? Number(RawResultCode) : 0;
    const ResultDesc = callbackData?.ResultDesc || req.body?.ResultDesc || req.body?.result_description || req.body?.message || 'Processed successfully';
    const CallbackMetadata = callbackData?.CallbackMetadata || req.body?.CallbackMetadata;

    let receiptNumber = '';
    let paidAmountKes: number | undefined;
    let phoneFromCallback = '';

    if (CallbackMetadata?.Item && Array.isArray(CallbackMetadata.Item)) {
      for (const item of CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber' && item.Value) receiptNumber = String(item.Value);
        if (item.Name === 'Amount' && item.Value) paidAmountKes = Number(item.Value);
        if (item.Name === 'PhoneNumber' && item.Value) phoneFromCallback = String(item.Value);
      }
    }

    if (!receiptNumber) {
      receiptNumber = 
        callbackData?.MpesaReceiptNumber || 
        callbackData?.mpesa_receipt_number || 
        req.body?.mpesa_receipt_number || 
        req.body?.MpesaReceiptNumber || 
        req.body?.receipt_number || 
        req.body?.ReceiptNo || 
        '';
    }

    if (!phoneFromCallback) {
      phoneFromCallback = 
        callbackData?.Phone || 
        callbackData?.phone || 
        callbackData?.phone_number || 
        req.body?.phone_number || 
        req.body?.phone || 
        '';
    }

    const allPayments = getAllPayments();
    let payment = allPayments.find((p) => 
      (CheckoutRequestID && (p.checkoutRequestId === CheckoutRequestID || p.id === CheckoutRequestID)) || 
      (MerchantRequestID && (p.merchantRequestId === MerchantRequestID || p.id === MerchantRequestID)) ||
      (ExternalReference && (p.externalReference === ExternalReference || p.id === ExternalReference))
    );

    if (!payment && ExternalReference) {
      payment = findPaymentByReference(ExternalReference);
    }
    if (!payment && CheckoutRequestID) {
      payment = findPaymentByReference(CheckoutRequestID);
    }

    if (!payment && (CheckoutRequestID || MerchantRequestID || ExternalReference)) {
      const allDeposits = db.getAllDeposits();
      const matchedDeposit = allDeposits.find(
        (d) => (CheckoutRequestID && d.checkoutRequestId === CheckoutRequestID) ||
               (MerchantRequestID && d.merchantRequestId === MerchantRequestID) ||
               (ExternalReference && d.id === ExternalReference)
      );
      if (matchedDeposit) {
        payment = getPaymentRecord(matchedDeposit.id);
      }
    }

    if (!payment && phoneFromCallback) {
      const norm = formatMpesaPhoneNumber(phoneFromCallback);
      payment = allPayments.find(p => 
        p.paymentMethod === 'mpesa_automated' && 
        (p.status === 'PROCESSING' || p.status === 'PENDING') &&
        p.phoneNumber && formatMpesaPhoneNumber(p.phoneNumber) === norm
      );
    }

    if (payment) {
      if (payment.status === 'COMPLETED') {
        console.log(`[M-Pesa Callback IDEMPOTENT] Payment ${payment.id} is already COMPLETED.`);
        return res.json({ ResultCode: 0, ResultDesc: 'Payment already processed and credited.' });
      }

      const isSuccess = ResultCode === 0 || 
                        callbackData?.status === 'Success' || 
                        callbackData?.Status === 'Success' || 
                        req.body?.status === 'Success' || 
                        req.body?.status === 'SUCCESS';

      if (isSuccess) {
        if (!receiptNumber) {
          receiptNumber = `REC${Date.now().toString().slice(-8)}`;
        }

        // ⚠️ PAYMENT LEAK FIX: Do NOT auto-activate. Mark payment as PENDING
        // for admin audit instead. Only /api/payments/admin/verify can activate.
        updatePaymentRecord(payment.id, {
          status: 'PENDING' as any,
          statusMessage: `M-Pesa payment received (Receipt: ${receiptNumber}). Under admin audit — activation usually completes within 1–30 minutes.`,
          mpesaReceiptNumber: receiptNumber,
          completedAt: undefined, // not completed until admin approves
        });

        console.log(`[M-Pesa Callback Queued] Payment ${payment.id} received. Receipt: ${receiptNumber}. Awaiting admin audit.`);
      } else {
        updatePaymentRecord(payment.id, {
          status: ResultCode === 1032 ? 'CANCELLED' : 'FAILED',
          statusMessage: ResultDesc || 'STK Push transaction was cancelled or failed.'
        });

        const existingDeposit = db.getDepositById(payment.id);
        if (existingDeposit) {
          db.updateDeposit(payment.id, {
            status: ResultCode === 1032 ? 'CANCELLED' : 'FAILED',
            statusMessage: ResultDesc || 'STK Push deposit was cancelled or failed.'
          });
        }

        console.log(`[M-Pesa Callback Failed] Payment ${payment.id} finished with code ${ResultCode}: ${ResultDesc}`);
      }
    } else {
      console.warn(`[M-Pesa Callback Warning] No payment matched for Ref: ${ExternalReference} / Checkout: ${CheckoutRequestID} / Phone: ${phoneFromCallback}`);
    }

    res.json({ ResultCode: 0, ResultDesc: 'Callback processed successfully' });
  } catch (err: any) {
    console.error('[M-Pesa Callback Processing Error]:', err);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted with internal error' });
  }
});

// ── manual-submit ──
app.post('/api/payments/manual/submit', (req, res) => {
  try {
    const { 
      productId, 
      paymentMethod, 
      amountSent, 
      transactionRef, 
      binanceId,
      smsMessage, 
      userId, 
      userEmail, 
      userName 
    } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    if (!paymentMethod || (paymentMethod !== 'mpesa_manual' && paymentMethod !== 'binance_usdt')) {
      return res.status(400).json({ success: false, error: 'Invalid payment method' });
    }

    const product = getProduct(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: `Invalid product plan: ${productId}` });
    }

    const exchangeRate = getExchangeRate();
    const expectedKes = calculateKesAmount(product.usdPrice);
    const paymentId = `pay_man_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveEmail = userEmail || 'user@pipnex.ai';

    let verifiedCode = '';
    let isDirectlyCompleted = false;
    let completionMessage = '';

    if (paymentMethod === 'mpesa_manual') {
      const inputToVerify = (smsMessage || transactionRef || '').trim();
      if (!inputToVerify) {
        return res.status(400).json({
          success: false,
          error: 'Please provide your 10-character M-Pesa confirmation code or paste the full confirmation SMS.'
        });
      }

      const validation = extractAndValidateMpesaReceipt(inputToVerify);
      if (!validation.isValid || !validation.code) {
        return res.status(400).json({
          success: false,
          error: validation.error || 'Invalid M-Pesa transaction confirmation.'
        });
      }

      verifiedCode = validation.code;

      if (isReceiptClaimed(verifiedCode)) {
        return res.status(400).json({
          success: false,
          error: `M-Pesa receipt code (${verifiedCode}) has already been used and is expired.`
        });
      }

      claimReceipt(verifiedCode, paymentId, effectiveEmail);

      // ⚠️ PAYMENT LEAK FIX: Never auto-complete. Always route through admin audit.
      isDirectlyCompleted = false;
      completionMessage = `M-Pesa receipt ${verifiedCode} received. Payment is now under audit — activation usually completes within 1–30 minutes.`;
    } else if (paymentMethod === 'binance_usdt') {
      const txHash = (transactionRef || '').trim();
      if (!txHash || txHash.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid Binance Transaction Hash (TxID).'
        });
      }

      if (isReceiptClaimed(txHash)) {
        return res.status(400).json({
          success: false,
          error: `Binance Transaction Hash (${txHash}) has already been used and is expired.`
        });
      }

      claimReceipt(txHash, paymentId, effectiveEmail);
      verifiedCode = txHash;
      // ⚠️ PAYMENT LEAK FIX: Never auto-complete Binance payments either.
      isDirectlyCompleted = false;
      completionMessage = `Binance TxID ${txHash.slice(0, 10)}... received. Payment is now under audit — activation usually completes within 1–30 minutes.`;
    }

    const nowIso = new Date().toISOString();
    const paymentRecord: PaymentRecord = {
      id: paymentId,
      userId: userId || 'guest',
      userEmail: effectiveEmail,
      userName: userName || 'Trader',
      productId: product.id,
      productName: product.name,
      usdPrice: product.usdPrice,
      exchangeRate,
      kesAmount: expectedKes,
      paymentMethod: paymentMethod as PaymentMethod,
      mpesaReceiptNumber: paymentMethod === 'mpesa_manual' ? verifiedCode : undefined,
      transactionHash: paymentMethod === 'binance_usdt' ? verifiedCode : undefined,
      binanceId: paymentMethod === 'binance_usdt' ? binanceId : undefined,
      smsMessage: paymentMethod === 'mpesa_manual' ? smsMessage : undefined,
      // ── Always PENDING until admin approves ──
      status: 'PENDING' as any,
      statusMessage: completionMessage || (paymentMethod === 'mpesa_manual' 
        ? 'M-Pesa confirmation submitted. Awaiting admin audit.' 
        : 'Binance TxID submitted. Awaiting admin audit.'),
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: isDirectlyCompleted ? nowIso : undefined
    };

    createPaymentRecord(paymentRecord);

    // ⚠️ PAYMENT LEAK FIX: DO NOT activate the plan here.
    // Plan activation ONLY happens in /api/payments/admin/verify when admin approves.

    console.log(`[Manual Payment Received] ${paymentId} (${paymentMethod}) -> PENDING AUDIT for ${product.name} by ${effectiveEmail}`);

    res.json({
      success: true,
      payment: paymentRecord,
      message: completionMessage || 'Payment submitted successfully.'
    });
  } catch (error: any) {
    console.error('[Manual Payment Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Error submitting manual payment' });
  }
});

// ── status ──
app.get('/api/payments/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    let payment = getPaymentRecord(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    if (payment.status === 'COMPLETED') {
      return res.json({
        success: true,
        payment,
        isCompleted: true,
        isFailed: false,
        plan: payment.productName
      });
    }

    if (payment.status === 'PROCESSING' || payment.status === 'PENDING') {
      const payHeroResult = await queryPayHeroPaymentStatus(
        payment.checkoutRequestId || payment.externalReference || payment.id
      );

      if (payHeroResult.isSuccess && payHeroResult.status === 'COMPLETED') {
        // ⚠️ PAYMENT LEAK FIX: Do NOT auto-activate.
        // Mark as PENDING — admin must approve.
        console.log(`[Status Polling] PayHero reported ${payment.id} as COMPLETED — queuing for admin audit.`);
        const updated = updatePaymentRecord(payment.id, {
          status: 'PENDING' as any,
          statusMessage: 'Payment confirmed by gateway. Awaiting admin audit.',
          mpesaReceiptNumber: payHeroResult.receiptNumber || payment.mpesaReceiptNumber,
          completedAt: undefined,
        });

        if (updated) payment = updated;

        return res.json({
          success: true,
          payment,
          isCompleted: false,
          isFailed: false,
          isPendingAudit: true,
          plan: payment.productName,
          message: 'Payment received. Under admin audit — usually 1–30 minutes.'
        });
      }

      const isSimulated = !process.env.PAYHERO_BASIC_AUTH && 
                          !process.env.PAYHERO_USERNAME && 
                          !process.env.MPESA_CONSUMER_KEY;
      const elapsedSeconds = (Date.now() - new Date(payment.createdAt).getTime()) / 1000;
      const forceComplete = req.query.forceComplete === 'true';

      if ((isSimulated && elapsedSeconds > 4) || forceComplete) {
        // ⚠️ PAYMENT LEAK FIX: Sandbox/test payments also route through admin audit.
        console.log(`[Status Polling] Sandbox payment ${payment.id} after ${Math.round(elapsedSeconds)}s — queuing for admin audit.`);
        const simReceipt = `QKB${Math.floor(1000000 + Math.random() * 9000000)}`;
        const updated = updatePaymentRecord(payment.id, {
          status: 'PENDING' as any,
          statusMessage: 'Sandbox payment received. Awaiting admin audit.',
          mpesaReceiptNumber: simReceipt,
          completedAt: undefined,
        });

        if (updated) payment = updated;

        return res.json({
          success: true,
          payment,
          isCompleted: true,
          isFailed: false,
          plan: payment.productName
        });
      }
    }

    res.json({
      success: true,
      payment,
      isCompleted: (payment.status as string) === 'COMPLETED',
      isFailed: payment.status === 'FAILED' || payment.status === 'CANCELLED' || payment.status === 'EXPIRED',
      plan: payment.productName
    });
  } catch (err: any) {
    console.error('[Status Polling Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Status check failed' });
  }
});

// ── verify-stk ──
app.post('/api/payments/verify-stk/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { receiptCode } = req.body || {};
    let payment = getPaymentRecord(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    if (payment.status === 'COMPLETED') {
      return res.json({
        success: true,
        payment,
        isCompleted: true,
        message: 'Payment has already been completed and confirmed.'
      });
    }

    let finalReceipt = receiptCode ? receiptCode.trim().toUpperCase() : '';

    if (finalReceipt) {
      const receiptCheck = extractAndValidateMpesaReceipt(finalReceipt);
      if (!receiptCheck.isValid) {
        return res.status(400).json({ success: false, error: receiptCheck.error || 'Invalid M-Pesa receipt format.' });
      }
      finalReceipt = receiptCheck.code || finalReceipt;
    }

    const payHeroResult = await queryPayHeroPaymentStatus(
      payment.checkoutRequestId || payment.externalReference || payment.id
    );

    if (payHeroResult.isSuccess && payHeroResult.receiptNumber) {
      finalReceipt = finalReceipt || payHeroResult.receiptNumber;
    }

    if (!finalReceipt) {
      finalReceipt = `TLK${Math.floor(1000000 + Math.random() * 9000000)}`;
    }

    // ⚠️ PAYMENT LEAK FIX: route to admin audit instead of auto-activating
    const updated = updatePaymentRecord(payment.id, {
      status: 'PENDING' as any,
      statusMessage: `M-Pesa payment received (Receipt: ${finalReceipt}). Awaiting admin audit.`,
      mpesaReceiptNumber: finalReceipt,
      completedAt: undefined,
    });

    res.json({
      success: true,
      payment: updated || payment,
      isCompleted: false,
      isPendingAudit: true,
      message: 'Payment received! Under admin audit — plan activates after approval.'
    });
  } catch (err: any) {
    console.error('[STK Verification Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Verification failed' });
  }
});

// ── simulate-complete ──
app.post('/api/payments/simulate-complete', (req, res) => {
  try {
    const { paymentId, receiptNumber } = req.body;
    const payment = getPaymentRecord(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // ⚠️ PAYMENT LEAK FIX: route to admin audit instead of auto-activating.
    const simReceipt = receiptNumber || payment.mpesaReceiptNumber || `REC${Date.now().toString().slice(-8)}`;
    const updated = updatePaymentRecord(paymentId, {
      status: 'PENDING' as any,
      statusMessage: 'Payment received. Awaiting admin audit.',
      mpesaReceiptNumber: simReceipt,
      completedAt: undefined,
    });

    res.json({
      success: true,
      payment: updated || payment,
      message: 'Payment received — under admin audit. Plan activates after approval.',
      isPendingAudit: true
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed' });
  }
});

// ── user-history ──
app.get('/api/payments/user/:userEmail', (req, res) => {
  const { userEmail } = req.params;
  const history = getPaymentsByUser(userEmail);
  res.json({
    success: true,
    payments: history
  });
});

// ── user-pending ──
app.get('/api/payments/user/:email/pending', (req, res) => {
  try {
    const { email } = req.params;
    const payments = getPaymentsByUser(email.toLowerCase());
    const pending = payments.filter((p: any) => 
      p.status === 'PENDING' || p.status === 'PROCESSING'
    );
    res.json({ success: true, pending, count: pending.length });
  } catch (err: any) {
    res.json({ success: true, pending: [], count: 0 });
  }
});

// ── admin-all ──
app.get('/api/payments/admin/all', (req, res) => {
  const payments = getAllPayments();
  res.json({
    success: true,
    payments
  });
});

// ── admin-verify ──
app.post('/api/payments/admin/verify', (req, res) => {
  try {
    const { paymentId, action, notes } = req.body;
    const payment = getPaymentRecord(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    const isApproved = action === 'approve';
    const isBan = action === 'reject_ban';

    // ── 1. Update the payment record ──
    const updated = updatePaymentRecord(paymentId, {
      status: isApproved ? 'COMPLETED' : 'FAILED',
      statusMessage: isApproved 
        ? 'Payment verified and approved by admin.' 
        : (notes || 'Payment was rejected during admin verification.'),
      notes,
      completedAt: new Date().toISOString(),
    });

    // ── 2. On approve: ACTIVATE the plan + grant credits + set dates ──
    let activation: any = null;
    if (isApproved && payment.userEmail) {
      try {
        const user = db.getUserByEmail(payment.userEmail);
        if (user) {
          // Map product → plan
          let assignedPlan: PlanTier = 'Starter';
          if (payment.productId === 'pro') assignedPlan = 'Pro';
          else if (payment.productId === 'elite') assignedPlan = 'Elite';
          else if (payment.productId === 'starter') assignedPlan = 'Starter';

          // Duration per plan (days)
          const DURATION_DAYS: Record<string, number> = {
            Starter: 15,
            Pro: 30,
            Elite: 90,
          };
          const days = DURATION_DAYS[assignedPlan] || 30;
          const start = new Date();
          const expiry = new Date(start.getTime() + days * 86400000);

          // Credits per plan (from PLAN_CREDITS)
          const creditMap: Record<string, number> = { Starter: 500, Pro: 1000, Elite: 2000 };
          const grantCredits = creditMap[assignedPlan] || 500;

          const previousPlan = user.plan;
          const previousCredits = user.credits ?? 0;

          const activated = db.updateUser(user.id, {
            plan: assignedPlan,
            credits: previousCredits + grantCredits,
            subscriptionStartDate: start.toISOString(),
            subscriptionExpiry: expiry.toISOString(),
          });

          // Log the audit
          try {
            db.createAuditLog({
              adminEmail: ADMIN_ALLOWED_USERNAME,
              adminName: 'Super Admin',
              adminRole: 'SUPER_ADMIN',
              action: 'PAYMENT_APPROVED',
              targetId: user.id,
              targetEmail: user.email,
              userAffected: `${user.firstName} ${user.lastName} (${user.email})`,
              previousValue: `${previousPlan} · ${previousCredits} credits`,
              newValue: `${assignedPlan} · ${previousCredits + grantCredits} credits`,
              details: `Payment ${paymentId} (${payment.productName}) approved. Plan upgraded ${previousPlan} → ${assignedPlan}. +${grantCredits} credits. Expires ${expiry.toISOString().split('T')[0]}.`,
              reason: notes || 'Payment verified by admin',
            });
          } catch (auditErr) {
            console.warn('[Admin Verify] Audit log failed:', (auditErr as any)?.message);
          }

          // Notify the user via their notification bell
          try {
            db.createAdminNotification({
              type: 'SUBSCRIPTION_CHANGE',
              title: 'Your plan is now active!',
              message: `Your ${assignedPlan} plan has been activated. +${grantCredits} credits added. Valid until ${expiry.toLocaleDateString()}.`,
              isRead: false,
            } as any);
          } catch {}

          activation = {
            plan: assignedPlan,
            creditsGranted: grantCredits,
            newBalance: previousCredits + grantCredits,
            expiresAt: expiry.toISOString(),
          };

          console.log(`[Admin Verify] Approved ${paymentId} → ${assignedPlan} activated for ${user.email}`);

          // ── Award referral earnings to whoever referred this user ──
          try {
            const refResult = awardReferral(user.id, user.email, assignedPlan);
            if (refResult.ok) {
              console.log(`[Admin Verify] Referral bonus $${refResult.reward} awarded to ${refResult.referrerEmail}`);
            }
          } catch (refErr: any) {
            console.warn('[Admin Verify] Referral award failed:', refErr?.message);
          }

          // ── Award referral earnings to whoever referred this user ──
          try {
            const refResult = awardReferral(user.id, user.email, assignedPlan);
            if (refResult.ok) {
              console.log(`[Admin Verify] Referral bonus $${refResult.reward} awarded to ${refResult.referrerEmail}`);
            }
          } catch (refErr: any) {
            console.warn('[Admin Verify] Referral award failed:', refErr?.message);
          }
        }
      } catch (err: any) {
        console.error('[Admin Verify] Activation failed:', err?.message);
      }
    }

    // ── Ban the user if the admin chose reject + ban ──
    if (isBan && payment.userEmail) {
      try {
        const user = db.getUserByEmail(payment.userEmail);
        if (user) {
          db.adminBanUser(
            user.id,
            notes || 'Payment rejected — fraudulent or invalid submission',
            ADMIN_ALLOWED_USERNAME,
            'Super Admin'
          );
          console.log(`[Admin Verify] User ${user.email} BANNED after rejected payment ${paymentId}`);
        }
      } catch (banErr: any) {
        console.warn('[Admin Verify] Ban failed:', banErr?.message);
      }
    }

    res.json({
      success: true,
      payment: updated,
      activation,
      message: isApproved 
        ? (activation ? `${activation.plan} activated + ${activation.creditsGranted} credits granted.` : 'Payment approved.') 
        : isBan
          ? 'Payment rejected and user banned.'
          : 'Payment rejected.'
    });
  } catch (err: any) {
    console.error('[Admin Verify Error]:', err);
    res.status(500).json({ success: false, error: err?.message || 'Verification failed' });
  }
});

// ── completePaymentAndSyncUser ──
export function completePaymentAndSyncUser(
  paymentId: string,
  receiptNumber?: string,
  statusMessage?: string,
  actualKesAmount?: number
): PaymentRecord | null {
  const payment = getPaymentRecord(paymentId);
  if (!payment) return null;

  if (payment.status === 'COMPLETED') {
    return payment;
  }

  const finalReceipt = receiptNumber || payment.mpesaReceiptNumber || `REC${Date.now().toString().slice(-8)}`;
  if (finalReceipt && !isReceiptClaimed(finalReceipt)) {
    claimReceipt(finalReceipt, payment.id, payment.userEmail);
  }

  const nowIso = new Date().toISOString();
  const updatedPayment = updatePaymentRecord(payment.id, {
    status: 'COMPLETED',
    statusMessage: statusMessage || 'Payment verified and confirmed via Safaricom M-Pesa.',
    mpesaReceiptNumber: finalReceipt,
    completedAt: nowIso
  });

  const existingDeposit = db.getDepositById(payment.id);
  if (existingDeposit) {
    db.updateDeposit(payment.id, {
      status: 'COMPLETED',
      statusMessage: statusMessage || 'Deposit confirmed via M-Pesa STK push.',
      mpesaReceiptNumber: finalReceipt,
      completedAt: nowIso
    });
  }

  if (payment.userEmail) {
    const user = db.getUserByEmail(payment.userEmail);
    if (user) {
      const currentExchangeRate = payment.exchangeRate || getExchangeRate() || 129;
      const paidKes = actualKesAmount || payment.kesAmount;
      const creditedUsd = payment.usdPrice || Number((paidKes / currentExchangeRate).toFixed(2));
      const newBalance = Number(((user.balance || 0) + creditedUsd).toFixed(2));

      let updatedPlan: PlanTier = user.plan;
      const prodId = (payment.productId || '').toLowerCase();
      if (prodId === 'starter') updatedPlan = 'Starter';
      else if (prodId === 'pro') updatedPlan = 'Pro';
      else if (prodId === 'elite') updatedPlan = 'Elite';

      db.updateUser(user.id, {
        balance: newBalance,
        plan: updatedPlan
      });

      db.createTransaction({
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        userEmail: user.email,
        type: 'DEPOSIT',
        amount: creditedUsd,
        kesAmount: paidKes,
        balanceAfter: newBalance,
        description: `M-Pesa Deposit / ${payment.productName} (Receipt: ${finalReceipt})`,
        reference: finalReceipt,
        status: 'COMPLETED',
        createdAt: nowIso
      });

      console.log(`[Payment Complete & Synced] User ${user.email} (${user.id}) credited $${creditedUsd}. Balance: $${newBalance}. Plan: ${updatedPlan}. Receipt: ${finalReceipt}`);
    } else {
      console.warn(`[Payment Complete] User email ${payment.userEmail} not found in database for sync.`);
    }
  }

  return updatedPayment || null;
}

// 4. Official Safaricom Daraja & PayHero Webhook Callback Endpoints (Universal Handler)
const CALLBACK_ROUTES = [
  '/api/payments/mpesa/callback',
  '/api/payments/callback',
  '/api/payments/payhero/callback',
  '/api/payments/payhero-callback',
  '/api/payments/stk/callback',
  '/api/payments/stk-callback',
  '/api/mpesa/callback',
  '/api/payhero/callback',
  '/api/v2/payments/callback',
  '/api/payments/webhook'
];
