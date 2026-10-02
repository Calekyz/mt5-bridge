// ═══════════════════════════════════════════════════════════════════
// Shared types for payments UI
// Matches mt5-bridge's existing user shape (id, email, role)
// ═══════════════════════════════════════════════════════════════════

export interface UserProfile {
  id?: number | string;
  email: string;
  role?: string;
  // Optional — filled by UI if we ever add them
  firstName?: string;
  lastName?: string;
  mt5?: {
    account?: number;
    broker?: string;
  };
}

export interface PaymentConfig {
  exchangeRate: number;
  mpesa: {
    tillNumber: string;
    businessName: string;
    paybillNumber?: string;
    accountName?: string;
  };
  binance: {
    binanceId?: string;
    walletAddress: string;
    walletProvider: string;
    network: string;
    minDeposit: string;
  };
  stkPushConfigured: boolean;
  isSimulationMode: boolean;
}

export interface ProductPlanInfo {
  id: string;
  name: string;
  usdPrice: number;
  exchangeRate: number;
  kesAmount: number;
  formattedKes: string;
  billing: string;
  subtitle: string;
  badge?: string;
  highlighted?: boolean;
  color?: string;
  features: string[];
}

export interface PaymentRecordDTO {
  id: string;
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
  externalReference?: string;
  mpesaReceiptNumber?: string;
  transactionHash?: string;
  binanceId?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  statusMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AdminTransactionItem extends PaymentRecordDTO {
  userNameResolved?: string;
}

export interface TransactionAnalytics {
  totalRevenueUsd: number;
  totalRevenueKes: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  methodBreakdown: {
    mpesa_automated: number;
    mpesa_manual: number;
    binance_usdt: number;
  };
}
