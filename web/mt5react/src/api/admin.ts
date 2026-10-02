// ═══════════════════════════════════════════════════════════════════
// AdminApi — thin wrapper around /v1/payments/admin/*
// Reads JWT from localStorage, sends as Bearer.
// ═══════════════════════════════════════════════════════════════════

import type { PaymentRecordDTO } from '../payments/types';

const BASE_URL = import.meta.env.VITE_API_URL || '/v1';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token
    ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const AdminApi = {
  async getAllPayments(): Promise<PaymentRecordDTO[]> {
    const res = await fetch(`${BASE_URL}/payments/admin/all`, {
      headers: authHeaders(),
    });
    const data = await handle<{ success: boolean; payments: PaymentRecordDTO[] }>(res);
    return data.payments || [];
  },

  async verifyPayment(paymentId: string, approve: boolean, note?: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${BASE_URL}/payments/admin/verify`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ paymentId, approve, note }),
    });
    return handle<{ success: boolean; message?: string }>(res);
  },
};
