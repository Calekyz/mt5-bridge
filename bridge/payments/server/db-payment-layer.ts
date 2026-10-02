// ============================================================
// PAYMENT DB LAYER — extracted from server/db.ts
// Paste these into your new project's db.ts (Database class)
// ============================================================

export interface PaymentEntity {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  productId: string;
  productName: string;
  usdPrice: number;
  exchangeRate: number;
  kesAmount: number;
  paymentMethod: 'mpesa_automated' | 'mpesa_manual' | 'binance_usdt';
  phoneNumber?: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  mpesaReceiptNumber?: string;
  transactionHash?: string;
  binanceId?: string;
  smsMessage?: string;
  notes?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  statusMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface DepositEntity {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  amount: number;
  kesAmount: number;
  exchangeRate: number;
  phoneNumber?: string;
  paymentMethod: 'mpesa_automated' | 'mpesa_manual' | 'binance_usdt';
  checkoutRequestId?: string;
  merchantRequestId?: string;
  externalReference?: string;
  mpesaReceiptNumber?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  statusMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreditTransactionEntity {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  action: 'ADD' | 'REMOVE' | 'SET';
  reason: string;
  adminEmail: string;
  adminName: string;
  previousBalance: number;
  newBalance: number;
  createdAt: string;
}

// ── Map declarations (add these as private fields in your Database class) ──
  private payments: Map<string, PaymentEntity> = new Map();
  private deposits: Map<string, DepositEntity> = new Map();
  private creditTransactions: Map<string, CreditTransactionEntity> = new Map();

// ── createPayment ──
  public createPayment(payment: PaymentEntity): PaymentEntity {
      this.payments.set(payment.id, payment);
      this.persistPayment(payment);
      return payment;
    }

// ── getPaymentById ──
  public getPaymentById(id: string) { return this.payments.get(id); }

// ── updatePayment ──
  public updatePayment(id: string, updates: Partial<PaymentEntity>) {
      const existing = this.payments.get(id);
      if (!existing) return undefined;
      const updated: PaymentEntity = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      this.payments.set(id, updated);
      this.persistPayment(updated);
      return updated;
    }

// ── getAllPayments ──
  public getAllPayments() {
      return Array.from(this.payments.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

// ── getPaymentsByUser ──
  public getPaymentsByUser(userEmail: string) {
      const norm = userEmail.trim().toLowerCase();
      return Array.from(this.payments.values())
        .filter(p => p.userEmail.toLowerCase() === norm)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

// ── createDeposit ──
  public createDeposit(deposit: DepositEntity): DepositEntity {
      this.deposits.set(deposit.id, deposit);
      this.persistDeposit(deposit);
      return deposit;
    }

// ── getDepositById ──
  public getDepositById(id: string) { return this.deposits.get(id); }

// ── updateDeposit ──
  public updateDeposit(id: string, updates: Partial<DepositEntity>) {
      const existing = this.deposits.get(id);
      if (!existing) return undefined;
      const updated: DepositEntity = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      this.deposits.set(id, updated);
      this.persistDeposit(updated);
      return updated;
    }

// ── getAllDeposits ──
  public getAllDeposits() {
      return Array.from(this.deposits.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

// ── getDepositsByUser ──
  public getDepositsByUser(emailOrUserId: string) {
      const norm = emailOrUserId.trim().toLowerCase();
      return Array.from(this.deposits.values())
        .filter(d => d.userEmail.toLowerCase() === norm || d.userId === emailOrUserId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

// ── consumeUserCredits ──
  public consumeUserCredits(
      userEmail: string,
      amount: number,
      reason: string
    ): { ok: true; newBalance: number }

// ── getAllCreditTransactions ──
  public getAllCreditTransactions(limit = 100) {
      return Array.from(this.creditTransactions.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    }

// ── getCreditTransactionsByUser ──
  public getCreditTransactionsByUser(userId: string) {
      return Array.from(this.creditTransactions.values())
        .filter(t => t.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
