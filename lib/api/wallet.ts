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
};

export async function getWallet() {
  const result = await apiRequest<WalletData & { message?: string }>("/api/wallet");
  if (result.error) {
    return { data: null, error: { ...result.error, message: "Wallet API is not connected." } };
  }
  return { data: result.data, error: null };
}

export async function getWalletTransactions() {
  const result = await apiRequest<{ transactions: WalletTransaction[] }>("/api/wallet/transactions");
  if (result.error) {
    return { data: [], error: { ...result.error, message: "Wallet API is not connected." } };
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

export async function createAdminCredit(payload: Record<string, unknown>) {
  const result = await apiRequest<{ success: boolean }>("/api/wallet/admin-credit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.error) {
    return { data: null, error: { ...result.error, message: "Wallet API is not connected." } };
  }
  return result;
}
