export const WALLET_BALANCE_KEY = "yopartner_wallet_balance";
export const WALLET_TRANSACTIONS_KEY = "yopartner_wallet_transactions";
export const WALLET_UPDATED_EVENT = "yopartner-wallet-updated";

export type SessionServiceType = "chat" | "audio" | "video" | "visit";

export type WalletTransaction = {
  id: string;
  type: "recharge" | "booking" | "gift";
  amountAdded: number;
  paidAmount: number;
  bonus: number;
  createdAt: string;
  description: string;
  status: "success";
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function notifyWalletUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WALLET_UPDATED_EVENT));
}

function normalizeTransactionType(value: unknown): WalletTransaction["type"] {
  if (value === "booking") return "booking";
  if (value === "gift") return "gift";
  return "recharge";
}

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(sanitizeNumber(value));
}

export function getWalletBalance() {
  if (!canUseStorage()) return 0;
  return sanitizeNumber(window.localStorage.getItem(WALLET_BALANCE_KEY), 0);
}

export function setWalletBalance(value: number) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(WALLET_BALANCE_KEY, String(sanitizeNumber(value, 0)));
  notifyWalletUpdate();
}

export function getWalletTransactions(): WalletTransaction[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(WALLET_TRANSACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item) => item && typeof item === "object").map((item) => ({
      id: String(item.id ?? `${Date.now()}`),
      type: normalizeTransactionType(item.type),
      amountAdded: sanitizeNumber(item.amountAdded, 0),
      paidAmount: sanitizeNumber(item.paidAmount, 0),
      bonus: sanitizeNumber(item.bonus, 0),
      createdAt: String(item.createdAt ?? new Date().toISOString()),
      description: String(item.description ?? "Wallet recharge"),
      status: "success",
    }));
  } catch {
    return [];
  }
}

export function setWalletTransactions(transactions: WalletTransaction[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(WALLET_TRANSACTIONS_KEY, JSON.stringify(transactions));
  notifyWalletUpdate();
}

export function addWalletRecharge(params: {
  amountAdded: number;
  paidAmount: number;
  bonus: number;
  description: string;
}) {
  return addWalletTransaction({
    type: "recharge",
    amountAdded: params.amountAdded,
    paidAmount: params.paidAmount,
    bonus: params.bonus,
    description: params.description,
  });
}

export function addWalletTransaction(params: {
  type: WalletTransaction["type"];
  amountAdded: number;
  paidAmount: number;
  bonus: number;
  description: string;
}) {
  const amountAdded = sanitizeNumber(params.amountAdded, 0);
  const paidAmount = sanitizeNumber(params.paidAmount, 0);
  const bonus = sanitizeNumber(params.bonus, 0);
  const type = params.type === "booking" ? "booking" : params.type === "gift" ? "gift" : "recharge";

  if (!canUseStorage()) {
    return { balance: getWalletBalance(), transactions: getWalletTransactions() };
  }

  const nextBalance = getWalletBalance() + amountAdded;
  const tx: WalletTransaction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    amountAdded,
    paidAmount,
    bonus,
    createdAt: new Date().toISOString(),
    description: params.description,
    status: "success",
  };

  const allTransactions = [tx, ...getWalletTransactions()];

  window.localStorage.setItem(WALLET_BALANCE_KEY, String(nextBalance));
  window.localStorage.setItem(WALLET_TRANSACTIONS_KEY, JSON.stringify(allTransactions));
  notifyWalletUpdate();

  return { balance: nextBalance, transactions: allTransactions };
}

export function getWalletSummary() {
  const balance = getWalletBalance();
  const transactions = getWalletTransactions();
  const totalRecharged = transactions
    .filter((tx) => tx.type === "recharge")
    .reduce((sum, tx) => sum + Math.max(sanitizeNumber(tx.amountAdded, 0), 0), 0);
  const totalSpent = transactions
    .filter((tx) => tx.type === "booking" || tx.type === "gift")
    .reduce((sum, tx) => sum + Math.abs(sanitizeNumber(tx.amountAdded, 0)), 0);

  return {
    balance,
    transactions,
    totalRecharged,
    totalSpent,
    transactionCount: transactions.length,
  };
}

export function subscribeWalletUpdates(onUpdate: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: Event) => {
    if (event instanceof StorageEvent) {
      if (event.key && event.key !== WALLET_BALANCE_KEY && event.key !== WALLET_TRANSACTIONS_KEY) return;
    }
    onUpdate();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(WALLET_UPDATED_EVENT, handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(WALLET_UPDATED_EVENT, handleStorage);
  };
}
