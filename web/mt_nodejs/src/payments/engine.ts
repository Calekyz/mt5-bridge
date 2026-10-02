// ═══════════════════════════════════════════════════════════════════
// MT5-BRIDGE PAYMENT ENGINE (Postgres-native)
// Adapts the exported engine from piptraderai-cal to use pg + new pricing
// ═══════════════════════════════════════════════════════════════════

import { query } from '../db';
import axios from 'axios';
import crypto from 'crypto';

// ─── Types ───
export type PaymentMethod = 'mpesa_automated' | 'mpesa_manual' | 'binance_usdt';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export interface ProductPlan {
  id: string;
  name: string;
  usdPrice: number;
  billing: string;
  subtitle: string;
  badge?: string;
  highlighted?: boolean;
  color?: string;
  features: string[];
}

export interface PaymentRecord {
  id: string;
  userId?: string;
  userEmail: string;
  userName?: string;
  productId: string;
  productName: string;
  usdPrice: number;
  exchangeRate: number;
  kesAmount: number;
  paymentMethod: PaymentMethod;
  phoneNumber?: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  externalReference?: string;
  mpesaReceiptNumber?: string;
  transactionHash?: string;
  binanceId?: string;
  smsMessage?: string;
  notes?: string;
  status: PaymentStatus;
  statusMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCT CATALOGUE — $255 lifetime / $160 yearly
// ═══════════════════════════════════════════════════════════════════
export const PRODUCTS_CATALOGUE: Record<string, ProductPlan> = {
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime Access',
    usdPrice: 255,
    billing: 'one-time',
    subtitle: 'Pay once. Full access forever.',
    badge: 'BEST VALUE',
    highlighted: true,
    color: 'from-amber-500 to-orange-600',
    features: [
      'Full MT5 Bridge dashboard',
      'Auto-trading signals (unlimited)',
      'VPS included — lifetime',
      'EA license — lifetime',
      'All future features included',
      'Priority support',
    ],
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Access',
    usdPrice: 160,
    billing: '/ year',
    subtitle: 'Everything included. VPS bundled.',
    highlighted: false,
    color: 'from-emerald-500 to-teal-600',
    features: [
      'Full MT5 Bridge dashboard',
      'Auto-trading signals (unlimited)',
      'VPS included ($10/mo — bundled)',
      'EA license — 12 months',
      'All features during subscription',
      'Support via WhatsApp/Telegram',
    ],
  },
};

export function getProduct(productId: string): ProductPlan | undefined {
  return PRODUCTS_CATALOGUE[productId];
}

// ═══════════════════════════════════════════════════════════════════
// EXCHANGE RATE
// ═══════════════════════════════════════════════════════════════════
export function getExchangeRate(): number {
  const rate = parseFloat(process.env.USD_TO_KES_RATE || '129');
  return isNaN(rate) || rate <= 0 ? 129 : rate;
}

export function calculateKesAmount(usdPrice: number): number {
  return Math.ceil(usdPrice * getExchangeRate());
}

// ═══════════════════════════════════════════════════════════════════
// PAYWAVE XPRESS (STK push provider)
// ═══════════════════════════════════════════════════════════════════
export function getPayWaveXpressApiKey(): string | undefined {
  return process.env.PAYWAVE_API_KEY;
}
export function getPayWaveXpressEmail(): string | undefined {
  return process.env.PAYWAVE_EMAIL;
}
export function getPayWaveXpressBaseUrl(): string {
  return process.env.PAYWAVE_BASE_URL || 'https://api.paywave.co.ke';
}

export function getCallbackUrl(reqHost?: string): string {
  const explicit = process.env.MPESA_CALLBACK_URL;
  if (explicit) return explicit;
  if (reqHost) return `https://${reqHost}/v1/payments/mpesa/callback`;
  return 'https://your-domain.com/v1/payments/mpesa/callback';
}

// ═══════════════════════════════════════════════════════════════════
// PHONE HELPERS
// ═══════════════════════════════════════════════════════════════════
export function normalizeMpesaPhone(phone: string): { normalized: string; isValid: boolean; error?: string } {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) return { normalized: digits, isValid: true };
  if (digits.startsWith('0') && digits.length === 10) return { normalized: '254' + digits.slice(1), isValid: true };
  if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) return { normalized: '254' + digits, isValid: true };
  return { normalized: digits, isValid: false, error: 'Invalid Kenyan phone number' };
}

export function formatMpesaPhoneNumber(phone: string): string {
  return normalizeMpesaPhone(phone).normalized;
}

export function toLocalKenyanPhone(phone: string): string {
  const { normalized } = normalizeMpesaPhone(phone);
  if (normalized.startsWith('254')) return '0' + normalized.slice(3);
  return normalized;
}

// ═══════════════════════════════════════════════════════════════════
// REFERENCE GENERATION
// ═══════════════════════════════════════════════════════════════════
export function generatePaymentReference(prefix = 'PTA'): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}_${stamp}_${rand}`;
}

// ═══════════════════════════════════════════════════════════════════
// DB ROW ↔ RECORD MAPPING
// ═══════════════════════════════════════════════════════════════════
function rowToRecord(r: any): PaymentRecord {
  return {
    id: r.id,
    userId: r.user_id || undefined,
    userEmail: r.user_email,
    userName: r.user_name || undefined,
    productId: r.product_id,
    productName: r.product_name,
    usdPrice: r.usd_price,
    exchangeRate: r.exchange_rate,
    kesAmount: r.kes_amount,
    paymentMethod: r.payment_method,
    phoneNumber: r.phone_number || undefined,
    merchantRequestId: r.merchant_request_id || undefined,
    checkoutRequestId: r.checkout_request_id || undefined,
    externalReference: r.external_reference || undefined,
    mpesaReceiptNumber: r.mpesa_receipt_number || undefined,
    transactionHash: r.transaction_hash || undefined,
    binanceId: r.binance_id || undefined,
    smsMessage: r.sms_message || undefined,
    notes: r.notes || undefined,
    status: r.status,
    statusMessage: r.status_message || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    completedAt: r.completed_at || undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CRUD
// ═══════════════════════════════════════════════════════════════════
export async function createPaymentRecord(rec: Partial<PaymentRecord> & { id: string; userEmail: string; productId: string; paymentMethod: PaymentMethod; status: PaymentStatus; usdPrice: number; exchangeRate: number; kesAmount: number; productName: string }): Promise<PaymentRecord> {
  const sql = `
    INSERT INTO pipnex_payments (
      id, user_id, user_email, user_name, product_id, product_name,
      usd_price, exchange_rate, kes_amount, payment_method, phone_number,
      merchant_request_id, checkout_request_id, external_reference,
      mpesa_receipt_number, transaction_hash, binance_id, sms_message,
      notes, status, status_message
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
    RETURNING *`;
  const vals = [
    rec.id, rec.userId || null, rec.userEmail, rec.userName || null,
    rec.productId, rec.productName, rec.usdPrice, rec.exchangeRate, rec.kesAmount,
    rec.paymentMethod, rec.phoneNumber || null, rec.merchantRequestId || null,
    rec.checkoutRequestId || null, rec.externalReference || null,
    rec.mpesaReceiptNumber || null, rec.transactionHash || null,
    rec.binanceId || null, rec.smsMessage || null, rec.notes || null,
    rec.status, rec.statusMessage || null,
  ];
  const { rows } = await query(sql, vals);
  return rowToRecord(rows[0]);
}

export async function getPaymentRecord(id: string): Promise<PaymentRecord | undefined> {
  const { rows } = await query('SELECT * FROM pipnex_payments WHERE id = $1', [id]);
  return rows[0] ? rowToRecord(rows[0]) : undefined;
}

export async function updatePaymentRecord(id: string, updates: Partial<PaymentRecord>): Promise<PaymentRecord | undefined> {
  const map: Record<string, string> = {
    status: 'status', statusMessage: 'status_message',
    mpesaReceiptNumber: 'mpesa_receipt_number', transactionHash: 'transaction_hash',
    binanceId: 'binance_id', merchantRequestId: 'merchant_request_id',
    checkoutRequestId: 'checkout_request_id', externalReference: 'external_reference',
    completedAt: 'completed_at', notes: 'notes', smsMessage: 'sms_message',
  };
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  for (const [k, v] of Object.entries(updates)) {
    const col = map[k];
    if (!col) continue;
    sets.push(`${col} = $${i++}`);
    vals.push(v);
  }
  sets.push(`updated_at = NOW()`);
  vals.push(id);
  const sql = `UPDATE pipnex_payments SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`;
  const { rows } = await query(sql, vals);
  return rows[0] ? rowToRecord(rows[0]) : undefined;
}

export async function getAllPayments(): Promise<PaymentRecord[]> {
  const { rows } = await query('SELECT * FROM pipnex_payments ORDER BY created_at DESC LIMIT 500');
  return rows.map(rowToRecord);
}

export async function getPaymentsByUser(userEmail: string): Promise<PaymentRecord[]> {
  const { rows } = await query('SELECT * FROM pipnex_payments WHERE user_email = $1 ORDER BY created_at DESC', [userEmail]);
  return rows.map(rowToRecord);
}

export async function findPaymentByReference(reference: string): Promise<PaymentRecord | undefined> {
  const { rows } = await query(
    'SELECT * FROM pipnex_payments WHERE external_reference = $1 OR checkout_request_id = $1 OR mpesa_receipt_number = $1 LIMIT 1',
    [reference]
  );
  return rows[0] ? rowToRecord(rows[0]) : undefined;
}

// ═══════════════════════════════════════════════════════════════════
// DUPLICATE GUARD
// ═══════════════════════════════════════════════════════════════════
export async function checkRecentDuplicatePayment(phone: string, windowSeconds = 20): Promise<PaymentRecord | undefined> {
  const { rows } = await query(
    `SELECT * FROM pipnex_payments
     WHERE phone_number = $1
       AND status IN ('PENDING','PROCESSING')
       AND created_at > NOW() - INTERVAL '${windowSeconds} seconds'
     ORDER BY created_at DESC LIMIT 1`,
    [phone]
  );
  return rows[0] ? rowToRecord(rows[0]) : undefined;
}

// ═══════════════════════════════════════════════════════════════════
// RECEIPT CLAIM (prevents reuse of M-Pesa codes)
// ═══════════════════════════════════════════════════════════════════
export async function isReceiptClaimed(receiptCode: string): Promise<boolean> {
  const { rows } = await query(
    'SELECT 1 FROM pipnex_payments WHERE mpesa_receipt_number = $1 AND status = $2 LIMIT 1',
    [receiptCode, 'COMPLETED']
  );
  return rows.length > 0;
}

export async function claimReceipt(receiptCode: string, paymentId: string, userEmail: string): Promise<boolean> {
  const already = await isReceiptClaimed(receiptCode);
  if (already) return false;
  await updatePaymentRecord(paymentId, { mpesaReceiptNumber: receiptCode });
  return true;
}

export function extractAndValidateMpesaReceipt(smsOrCode: string, expectedTill?: string): { valid: boolean; code?: string; error?: string } {
  const cleaned = (smsOrCode || '').toUpperCase().trim();
  const match = cleaned.match(/\b[A-Z]{3}[0-9A-Z]{7}\b/);
  if (!match) return { valid: false, error: 'Could not find a valid M-Pesa receipt code' };
  const code = match[0];
  if (expectedTill && cleaned.includes(expectedTill)) {
    return { valid: true, code };
  }
  return { valid: true, code };
}

// ═══════════════════════════════════════════════════════════════════
// PAYWAVE STK PUSH
// ═══════════════════════════════════════════════════════════════════
export async function initiateMpesaStkPushGateway(params: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl?: string;
}): Promise<{ success: boolean; checkoutRequestId?: string; merchantRequestId?: string; message?: string; raw?: any }> {
  const apiKey = getPayWaveXpressApiKey();
  const email = getPayWaveXpressEmail();
  const baseUrl = getPayWaveXpressBaseUrl();

  if (!apiKey || !email) {
    return { success: false, message: 'PayWave credentials not configured (PAYWAVE_API_KEY, PAYWAVE_EMAIL)' };
  }

  const { normalized, isValid } = normalizeMpesaPhone(params.phoneNumber);
  if (!isValid) return { success: false, message: 'Invalid phone number' };

  try {
    // PayWave Xpress request format (from their docs):
    // POST /v1/stkpush
    // Body: { api_key, email, amount, msisdn, reference, account_number? }
    const payload: Record<string, any> = {
      api_key: apiKey,
      email,
      amount: Math.round(params.amount),   // KES integer
      msisdn: normalized,                  // 254XXXXXXXXX
      reference: params.accountReference,
    };

    const res = await axios.post(`${baseUrl}/v1/stkpush`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    const data = res.data || {};
    const resultCode = String(data.ResultCode ?? data.resultCode ?? '');

    // Success codes: "0" (docs example) or missing ResultCode with a request id
    const isSuccess = resultCode === '0' || data.success === true ||
                      !!(data.transaction_request_id || data.TransactionRequestID || data.CheckoutRequestID);

    if (!isSuccess) {
      return {
        success: false,
        message: data.errorMessage || data.message || `PayWave error code ${resultCode}`,
        raw: data,
      };
    }

    // Extract request/transaction ids — field names vary
    const requestId = data.transaction_request_id
                   || data.TransactionRequestID
                   || data.CheckoutRequestID
                   || data.checkout_request_id
                   || data.request_id;

    const merchantId = data.merchant_request_id
                    || data.MerchantRequestID
                    || undefined;

    return {
      success: true,
      checkoutRequestId: requestId,
      merchantRequestId: merchantId,
      message: data.CustomerMessage || data.message || 'STK push sent. Enter your M-Pesa PIN.',
      raw: data,
    };
  } catch (err: any) {
    const raw = err?.response?.data?.errorMessage
             || err?.response?.data?.message
             || err?.message
             || 'STK push failed';
    const msg = raw.includes('ENOTFOUND')
      ? `Cannot reach PayWave at ${baseUrl}. Check PAYWAVE_BASE_URL in env.`
      : raw;
    return { success: false, message: msg, raw: err?.response?.data };
  }
}

// ─── PayWave transaction status check ───
export async function queryPayWaveTransactionStatus(transactionRequestId: string): Promise<{
  success: boolean;
  status?: string;
  raw?: any;
  message?: string;
}> {
  const apiKey = getPayWaveXpressApiKey();
  const email = getPayWaveXpressEmail();
  const baseUrl = getPayWaveXpressBaseUrl();

  if (!apiKey || !email) return { success: false, message: 'PayWave credentials not configured' };

  try {
    const res = await axios.post(`${baseUrl}/v1/tstatus`, {
      api_key: apiKey,
      email,
      transaction_request_id: transactionRequestId,
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 15000 });

    const data = res.data || {};
    return { success: true, status: data.status || data.Status || data.transaction_status, raw: data };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Status check failed', raw: err?.response?.data };
  }
}

export const initiateDarajaStkPush = initiateMpesaStkPushGateway;

// ═══════════════════════════════════════════════════════════════════
// COMPLETE PAYMENT + SYNC USER
// When a payment completes, this:
//   1. Marks the payment as COMPLETED
//   2. Updates the user row: plan, expires_at, payment_status='active'
// ═══════════════════════════════════════════════════════════════════
export async function completePaymentAndSyncUser(
  paymentId: string,
  opts: { receiptNumber?: string; note?: string } = {}
): Promise<{ ok: boolean; error?: string }> {
  const rec = await getPaymentRecord(paymentId);
  if (!rec) return { ok: false, error: 'Payment not found' };
  if (rec.status === 'COMPLETED') return { ok: true };

  await updatePaymentRecord(paymentId, {
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
    ...(opts.receiptNumber ? { mpesaReceiptNumber: opts.receiptNumber } : {}),
    ...(opts.note ? { notes: opts.note } : {}),
  });

  // Determine plan + expiry
  const plan = rec.productId === 'lifetime' ? 'lifetime' : 'yearly';
  const expiresAt = plan === 'lifetime'
    ? null
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  await query(
    `UPDATE users
       SET plan = $1,
           plan_expires_at = $2,
           payment_status = 'active',
           activated_at = COALESCE(activated_at, NOW())
     WHERE email = $3`,
    [plan, expiresAt, rec.userEmail]
  );

  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════════
// CONFIG (for /config endpoint)
// ═══════════════════════════════════════════════════════════════════
export function getPaymentConfig() {
  return {
    exchangeRate: getExchangeRate(),
    mpesa: {
      tillNumber: process.env.MPESA_TILL || '',
      businessName: process.env.MPESA_BUSINESS_NAME || 'PipTrader AI',
      paybillNumber: process.env.MPESA_PAYBILL || undefined,
      accountName: process.env.MPESA_ACCOUNT_NAME || undefined,
    },
    binance: {
      binanceId: process.env.BINANCE_ID || '1067841957',
      walletAddress: process.env.BINANCE_WALLET_ADDRESS || 'TVvYRDdPyQCCg22onuaau56rS5PNP3Gx7s',
      walletProvider: process.env.BINANCE_WALLET_PROVIDER || 'OKX USDT (TRC20)',
      network: process.env.BINANCE_NETWORK || 'USDT (TRC20)',
      minDeposit: process.env.BINANCE_MIN_DEPOSIT || '10 USDT',
    },
    stkPushConfigured: !!(process.env.PAYWAVE_API_KEY && process.env.PAYWAVE_EMAIL),
    isSimulationMode: process.env.PAYMENTS_SIMULATE === 'true',
  };
}
