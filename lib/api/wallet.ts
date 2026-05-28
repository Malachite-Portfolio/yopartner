import { apiRequest } from "@/lib/api/client";

export type WalletData = {
  balance: number;
  currency: "INR";
};

export type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  description?: string;
  reason?: string;
};

export async function getWallet() {
  const result = await apiRequest<(WalletData & { message?: string; wallet?: WalletData }) | { wallet: WalletData; message?: string }>("/api/wallet");
  if (result.error) {
    return { data: null, error: { ...result.error, message: "We couldn't load wallet details right now. Please retry." } };
  }

  const payload = result.data;
  let normalizedWallet: WalletData | null = null;

  if (payload && typeof (payload as WalletData).balance === "number") {
    normalizedWallet = {
      balance: (payload as WalletData).balance,
      currency: "INR",
    };
  } else if (payload && "wallet" in payload && payload.wallet && typeof payload.wallet.balance === "number") {
    normalizedWallet = {
      balance: payload.wallet.balance,
      currency: "INR",
    };
  }

  if (!normalizedWallet) {
    return { data: null, error: { message: "We couldn't load wallet details right now. Please retry." } };
  }

  return { data: normalizedWallet, error: null };
}

export async function getWalletTransactions() {
  const result = await apiRequest<{ transactions: WalletTransaction[] }>("/api/wallet/transactions");
  if (result.error) {
    return { data: [], error: { ...result.error, message: "We couldn't load wallet details right now. Please retry." } };
  }
  return { data: result.data?.transactions ?? [], error: null };
}

export async function createRechargeOrder(amount: number) {
  const result = await apiRequest<{ orderId: string }>("/api/wallet/recharge-order", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
  if (result.error) {
    return { data: null, error: { ...result.error, message: "Payments are not live yet. Please try later." } };
  }
  return result;
}

export async function verifyRechargePayment(payload: Record<string, unknown>) {
  const result = await apiRequest<{ success: boolean }>("/api/wallet/verify-recharge", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.error) {
    return { data: null, error: { ...result.error, message: "Payments are not live yet. Please try later." } };
  }
  return result;
}

export type RazorpayOrderRequest = {
  amount: number;
  walletCredit: number;
  gstAmount: number;
  bonusAmount: number;
  planId?: string;
};

export type RazorpayOrderResponse = {
  success: true;
  orderId: string;
  amount: number;
  currency: "INR";
  keyId: string;
  transactionCode: string;
};

export async function createRazorpayOrder(payload: RazorpayOrderRequest) {
  const result = await apiRequest<RazorpayOrderResponse>("/api/payments/razorpay/order", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (result.error) {
    return { data: null, error: { ...result.error, message: result.error.message || "Unable to start payment." } };
  }

  return result;
}

export type RazorpayVerifyRequest = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
  walletCredit: number;
  gstAmount: number;
  bonusAmount: number;
  planId?: string;
};

export async function verifyRazorpayPayment(payload: RazorpayVerifyRequest) {
  const result = await apiRequest<{ success: boolean }>("/api/payments/razorpay/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (result.error) {
    return { data: null, error: { ...result.error, message: result.error.message || "Payment verification failed." } };
  }

  return result;
}

export async function createAdminCredit(payload: Record<string, unknown>) {
  const result = await apiRequest<{ success: boolean }>("/api/wallet/admin-credit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.error) {
    return { data: null, error: { ...result.error, message: "We couldn't complete this wallet operation right now. Please retry." } };
  }
  return result;
}
