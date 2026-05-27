"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Plus,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import {
  formatINR,
  getWalletSummary,
  subscribeWalletUpdates,
  type WalletTransaction,
} from "@/lib/wallet";
import {
  createRazorpayOrder,
  getWallet,
  getWalletTransactions as getWalletTransactionsFromApi,
  verifyRazorpayPayment,
} from "@/lib/api/wallet";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { getUserAuthState, getUserAuthTokenWithRestore } from "@/lib/auth/userAuth";
import { WALLET_UPDATED_EVENT } from "@/lib/wallet";

type WalletTab = "overview" | "transactions" | "recharge";
type ModalStep = "amount" | "checkout";

type RechargePlan = {
  id: string;
  rechargeAmount: number;
  bonusPercent: number;
};

const rechargePlans: RechargePlan[] = [
  { id: "100", rechargeAmount: 100, bonusPercent: 5 },
  { id: "200", rechargeAmount: 200, bonusPercent: 5 },
  { id: "300", rechargeAmount: 300, bonusPercent: 5 },
  { id: "400", rechargeAmount: 400, bonusPercent: 5 },
  { id: "500", rechargeAmount: 500, bonusPercent: 10 },
  { id: "2000", rechargeAmount: 2000, bonusPercent: 20 },
];

function RechargePlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: RechargePlan;
  selected: boolean;
  onSelect: () => void;
}) {
  const bonus = Math.round((plan.rechargeAmount * plan.bonusPercent) / 100);
  const gstAmount = Math.round(plan.rechargeAmount * 0.18);
  const walletCredit = plan.rechargeAmount + bonus;
  const payAmount = plan.rechargeAmount + gstAmount;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`cursor-pointer rounded-2xl border bg-white p-4 text-left transition ${
        selected
          ? "border-emerald-500 bg-emerald-50/40 shadow-md shadow-emerald-100"
          : "border-slate-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-semibold text-slate-900">{formatINR(plan.rechargeAmount)}</p>
          <p className="mt-1 text-xs text-slate-500">Pay {formatINR(payAmount)} (incl. 18% GST)</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            +{plan.bonusPercent}% Bonus
          </span>
          {selected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white">
              <CheckCircle2 size={12} />
              Selected
            </span>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-700">Get {formatINR(walletCredit)} in your wallet</p>
    </button>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2563EB]">
        <ReceiptText size={26} />
      </span>
      <p className="mt-4 text-lg font-semibold text-slate-900">{title}</p>
    </div>
  );
}

function TransactionList({ transactions }: { transactions: WalletTransaction[] }) {
  if (transactions.length === 0) {
    return <EmptyState title="No transactions yet" />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {transactions.map((tx, index) => (
        <article
          key={tx.id}
          className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 ${
            index !== transactions.length - 1 ? "border-b border-slate-200" : ""
          }`}
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {tx.type === "booking" ? "Conversation payment" : "Balance recharge"}
            </p>
            <p className="text-xs text-slate-500">{tx.description}</p>
            <p className="mt-1 text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString("en-IN")}</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${tx.amountAdded >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {tx.amountAdded >= 0 ? "+" : ""}{formatINR(tx.amountAdded)}
            </p>
            <p className="text-xs text-slate-500">
              {tx.type === "booking" ? "Charged" : "Paid"} {formatINR(tx.paidAmount)}
            </p>
            <p className="text-xs font-semibold text-emerald-600">Success</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function buildRechargeSummary(plan: RechargePlan | null, customAmount: number) {
  const rechargeAmount = plan ? plan.rechargeAmount : customAmount;
  const bonusAmount = plan ? Math.round((plan.rechargeAmount * plan.bonusPercent) / 100) : 0;
  const gstAmount = Math.round(rechargeAmount * 0.18);
  const walletCredit = rechargeAmount + bonusAmount;
  const payAmount = rechargeAmount + gstAmount;
  return {
    planId: plan?.id,
    rechargeAmount,
    bonusAmount,
    gstAmount,
    walletCredit,
    payAmount,
  };
}

type RazorpaySuccessPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailurePayload = {
  error?: {
    description?: string;
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    contact?: string;
    email?: string;
    name?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpaySuccessPayload) => void;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", callback: (response: RazorpayFailurePayload) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let razorpayScriptPromise: Promise<boolean> | null = null;

function ensureRazorpayScript() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export default function WalletPage() {
  const router = useRouter();
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<WalletTab>("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("amount");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [rechargeError, setRechargeError] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [apiError, setApiError] = useState("");
  const [authReady, setAuthReady] = useState(!IS_PRODUCTION_READY_MODE);

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [bellMessage, setBellMessage] = useState("");

  const mapApiTransactions = useCallback((input: Awaited<ReturnType<typeof getWalletTransactionsFromApi>>["data"]) =>
    (input ?? [])
      .filter((tx) => tx.status === "SUCCESS")
      .map((tx) => ({
        id: tx.id,
        type: tx.type === "BOOKING" ? "booking" : "recharge",
        amountAdded: tx.amount,
        paidAmount: Math.abs(tx.amount),
        bonus: 0,
        createdAt: tx.createdAt,
        description: tx.description ?? tx.type,
        status: "success",
      })) as WalletTransaction[], []);

  const refreshWalletDataFromApi = useCallback(async () => {
    const [walletResponse, transactionResponse] = await Promise.all([
      getWallet(),
      getWalletTransactionsFromApi(),
    ]);
    const hasRealWallet = Boolean(walletResponse.data);

    if (hasRealWallet && walletResponse.data) {
      setBalance(walletResponse.data.balance);
    }
    if (transactionResponse.data) {
      const mapped = mapApiTransactions(transactionResponse.data);
      setTransactions(mapped);
      setTotalSpent(
        mapped
          .filter((tx) => tx.type === "booking")
          .reduce((sum, tx) => sum + Math.abs(tx.amountAdded), 0),
      );
    }
    if (walletResponse.error || transactionResponse.error) {
      setApiError("We couldn't load wallet details right now. Please retry.");
      return false;
    }
    setApiError("");
    return true;
  }, [mapApiTransactions]);

  useEffect(() => {
    if (!IS_PRODUCTION_READY_MODE) return;
    let active = true;
    void (async () => {
      const token = await getUserAuthTokenWithRestore();
      if (!active) return;
      if (!token) {
        router.replace("/login?returnUrl=%2Fwallet");
        return;
      }
      setAuthReady(true);
    })();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("addMoney") !== "1") return;

    const timer = window.setTimeout(() => {
      setIsModalOpen(true);
      setModalStep("amount");
      params.delete("addMoney");
      const query = params.toString();
      router.replace(query ? `/wallet?${query}` : "/wallet");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (IS_PRODUCTION_READY_MODE) {
      if (!authReady) return () => undefined;
      const timer = window.setTimeout(() => {
        void refreshWalletDataFromApi();
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const sync = () => {
      const summary = getWalletSummary();
      setBalance(summary.balance);
      setTransactions(summary.transactions);
      setTotalSpent(summary.totalSpent);
    };

    sync();
    return subscribeWalletUpdates(sync);
  }, [authReady, refreshWalletDataFromApi]);

  const selectedPlan = useMemo(
    () => rechargePlans.find((plan) => plan.id === selectedPlanId) ?? null,
    [selectedPlanId],
  );

  const parsedCustom = Number(customAmount);
  const validCustom = Number.isFinite(parsedCustom) && Number.isInteger(parsedCustom) && parsedCustom >= 1 && parsedCustom <= 50000;
  const canProceed = Boolean(selectedPlan || validCustom);
  const rechargeSummary = canProceed ? buildRechargeSummary(selectedPlan, validCustom ? parsedCustom : 0) : null;

  const totalRecharged = transactions
    .filter((tx) => tx.type === "recharge")
    .reduce((sum, tx) => sum + Math.max(tx.amountAdded, 0), 0);

  const openModal = () => {
    setIsModalOpen(true);
    setModalStep("amount");
    setSuccessMessage("");
    setRechargeError("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalStep("amount");
    setIsProcessingPayment(false);
    setSelectedPlanId(null);
    setCustomAmount("");
    setRechargeError("");
  };

  const moveToCheckoutStep = () => {
    if (!canProceed) {
      setRechargeError("Select a recharge plan or enter a custom amount between ₹1 and ₹50,000.");
      return;
    }
    setModalStep("checkout");
    setRechargeError("");
  };

  const handleRazorpayCheckout = () => {
    if (!IS_PRODUCTION_READY_MODE) {
      setSuccessMessage("Razorpay is available in production mode.");
      return;
    }

    if (!rechargeSummary) {
      setRechargeError("Select a recharge plan or enter a custom amount between ₹1 and ₹50,000.");
      return;
    }

    void (async () => {
      setIsProcessingPayment(true);
      setRechargeError("");

      const scriptLoaded = await ensureRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setIsProcessingPayment(false);
        setRechargeError("Unable to load Razorpay checkout. Please try again.");
        return;
      }

      const orderResponse = await createRazorpayOrder({
        amount: rechargeSummary.payAmount,
        walletCredit: rechargeSummary.walletCredit,
        gstAmount: rechargeSummary.gstAmount,
        bonusAmount: rechargeSummary.bonusAmount,
        planId: rechargeSummary.planId,
      });

      if (orderResponse.error || !orderResponse.data) {
        setIsProcessingPayment(false);
        setRechargeError(orderResponse.error?.message ?? "Unable to create payment order.");
        return;
      }

      const authState = getUserAuthState();
      const prefillPhone = authState.phone?.replace(/^\+91/, "");

      const instance = new window.Razorpay({
        key: orderResponse.data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "YoPartner",
        description: "Wallet Recharge",
        order_id: orderResponse.data.orderId,
        prefill: {
          contact: prefillPhone,
        },
        theme: {
          color: "#00433D",
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
            setRechargeError("Payment cancelled.");
          },
        },
        handler: (paymentPayload) => {
          void (async () => {
            const verifyResponse = await verifyRazorpayPayment({
              razorpay_order_id: paymentPayload.razorpay_order_id,
              razorpay_payment_id: paymentPayload.razorpay_payment_id,
              razorpay_signature: paymentPayload.razorpay_signature,
              amount: rechargeSummary.payAmount,
              walletCredit: rechargeSummary.walletCredit,
              gstAmount: rechargeSummary.gstAmount,
              bonusAmount: rechargeSummary.bonusAmount,
              planId: rechargeSummary.planId,
            });

            if (verifyResponse.error) {
              setIsProcessingPayment(false);
              setRechargeError(verifyResponse.error.message || "Payment verification failed.");
              return;
            }

            await refreshWalletDataFromApi();
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent(WALLET_UPDATED_EVENT));
            }
            setIsProcessingPayment(false);
            closeModal();
            setSuccessMessage("Recharge successful. Wallet balance updated.");
          })();
        },
      });

      instance.on("payment.failed", (failure) => {
        setIsProcessingPayment(false);
        setRechargeError(failure.error?.description ?? "Payment failed. Please try again.");
      });

      instance.open();
    })();
  };

  const recentTransactions = transactions.slice(0, 5);

  if (IS_PRODUCTION_READY_MODE && !authReady) {
    return <section className="min-h-[60vh] bg-[#fffdf8]" />;
  }

  return (
    <div className="min-h-screen bg-[#fffdf8]">
      <section className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-[#dceae5] bg-white p-6 shadow-sm shadow-teal-900/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
            <h1 className="text-3xl font-semibold text-slate-900">Your balance</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Platform-protected payments for calm conversations with verified companions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (IS_PRODUCTION_READY_MODE) {
                    void (async () => {
                      await refreshWalletDataFromApi();
                      setSuccessMessage("Balance refreshed.");
                    })();
                    return;
                  }
                  const summary = getWalletSummary();
                  setBalance(summary.balance);
                  setTransactions(summary.transactions);
                  setTotalSpent(summary.totalSpent);
                  setSuccessMessage("Balance refreshed.");
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              >
                <RefreshCcw size={17} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setBellMessage("No new alerts right now.");
                  window.setTimeout(() => setBellMessage(""), 1800);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              >
                <Bell size={17} />
              </button>
            </div>
          </div>
          {bellMessage ? <p className="mt-3 text-xs text-slate-500">{bellMessage}</p> : null}
        </article>

        <article className="mt-5 rounded-3xl border border-[#dceae5] bg-white p-6 shadow-sm shadow-teal-900/5">
          <div className="grid gap-5 lg:grid-cols-[1fr_390px]">
            <div>
              <div className="flex items-center gap-2 text-slate-500">
                <Wallet size={18} />
                <p className="text-sm font-medium">Balance</p>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-4xl font-semibold text-slate-900 sm:text-5xl">
                  {showBalance ? formatINR(balance) : "₹••••••"}
                </p>
                <button
                  type="button"
                  onClick={() => setShowBalance((prev) => !prev)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                >
                  {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-base font-semibold text-slate-900">Add money to your balance</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Recharge will appear as &quot;Malachite Technologies PVT Ltd&quot; in your Bank/UPI statement.
              </p>
              <button
                type="button"
                onClick={openModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#115e59]"
              >
                <Plus size={15} />
                Add Money
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total added</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(totalRecharged)}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                <ArrowUpRight size={14} />
                credited
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversation spend</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(totalSpent)}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                <ArrowDownLeft size={14} />
                debited
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Balance activity</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{transactions.length}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                <ReceiptText size={14} />
                records
              </span>
            </div>
          </div>
        </article>

        {successMessage && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            {successMessage}
          </p>
        )}
        {apiError ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
            {apiError}
          </p>
        ) : null}

        <div className="mt-5 rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { key: "overview", label: "Overview" },
              { key: "transactions", label: "Transactions" },
              { key: "recharge", label: "Recharge" },
            ] as Array<{ key: WalletTab; label: string }>).map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active ? "bg-[#0f766e] text-white" : "border border-[#dceae5] text-slate-700 hover:bg-[#eef8f5]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            {activeTab === "overview" && (
              <div>
                <h3 className="mb-3 text-lg font-semibold text-slate-900">Recent balance activity</h3>
                {recentTransactions.length === 0 ? (
                  <EmptyState title="No recent transactions" />
                ) : (
                  <TransactionList transactions={recentTransactions} />
                )}
              </div>
            )}

            {activeTab === "transactions" && (
              <div>
                <h3 className="mb-3 text-lg font-semibold text-slate-900">Balance history</h3>
                <TransactionList transactions={transactions} />
              </div>
            )}

            {activeTab === "recharge" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-slate-900">Recharge plans</h3>
                  <button
                    type="button"
                    onClick={openModal}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <Plus size={13} />
                    Add Money
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {rechargePlans.map((plan) => (
                    <RechargePlanCard
                      key={plan.id}
                      plan={plan}
                      selected={selectedPlanId === plan.id}
                      onSelect={() => {
                        setSelectedPlanId(plan.id);
                        setCustomAmount("");
                        setRechargeError("");
                        openModal();
                        setModalStep("checkout");
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Wallet size={16} />
                  Add money to balance
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Recharge will appear as &quot;Malachite Technologies PVT Ltd&quot; in your Bank/UPI statement.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300"
              >
                <X size={16} />
              </button>
            </div>

            {modalStep === "amount" ? (
              <>
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <p className="font-semibold">Pick a recharge plan</p>
                  <p className="mt-1">Plans include bonus credits. Or enter a custom amount below.</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {rechargePlans.map((plan) => (
                    <RechargePlanCard
                      key={`modal-${plan.id}`}
                      plan={plan}
                      selected={selectedPlanId === plan.id}
                      onSelect={() => {
                        setSelectedPlanId(plan.id);
                        setCustomAmount("");
                        setRechargeError("");
                        setModalStep("checkout");
                      }}
                    />
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-base font-semibold text-slate-900">Or enter custom amount</p>
                  <input
                    type="number"
                    min={1}
                    max={50000}
                    value={customAmount}
                    onChange={(event) => {
                      setCustomAmount(event.target.value);
                      setSelectedPlanId(null);
                      setRechargeError("");
                    }}
                    placeholder="₹ 1 – 50,000"
                    className="mt-3 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#2563EB]"
                  />
                </div>

                <button
                  type="button"
                  onClick={moveToCheckoutStep}
                  disabled={!canProceed}
                  className={`mt-5 h-12 w-full rounded-xl text-sm font-semibold text-white ${
                    canProceed ? "bg-[#0f766e] hover:opacity-95" : "bg-slate-300"
                  }`}
                >
                  Continue to Payment
                </button>
              </>
            ) : (
              <>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setModalStep("amount")}
                    className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700"
                    disabled={isProcessingPayment}
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>
                </div>

                {rechargeSummary ? (
                  <div className="mt-4 rounded-2xl bg-[linear-gradient(135deg,#0f766e_0%,#0b5f65_45%,#1d4ed8_100%)] p-4 text-white">
                    <p className="text-sm font-semibold">Payment Summary</p>
                    <div className="mt-3 space-y-1.5 text-sm text-white/90">
                      <p className="flex items-center justify-between"><span>Recharge Amount</span><span>{formatINR(rechargeSummary.rechargeAmount)}</span></p>
                      <p className="flex items-center justify-between"><span>GST (18%)</span><span>{formatINR(rechargeSummary.gstAmount)}</span></p>
                      <p className="flex items-center justify-between"><span>Bonus</span><span>{formatINR(rechargeSummary.bonusAmount)}</span></p>
                      <p className="flex items-center justify-between font-semibold text-white"><span>Wallet Credit</span><span>{formatINR(rechargeSummary.walletCredit)}</span></p>
                      <p className="mt-2 border-t border-white/30 pt-2 flex items-center justify-between text-base font-semibold text-white"><span>You Pay</span><span>{formatINR(rechargeSummary.payAmount)}</span></p>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <p className="font-semibold">Razorpay</p>
                  <p className="mt-1">Fast UPI, cards, netbanking, and wallets.</p>
                </div>

                <button
                  type="button"
                  onClick={handleRazorpayCheckout}
                  disabled={isProcessingPayment}
                  className={`mt-5 h-12 w-full rounded-xl text-sm font-semibold text-white ${
                    isProcessingPayment ? "bg-slate-300" : "bg-[#0f766e] hover:opacity-95"
                  }`}
                >
                  {isProcessingPayment ? "Processing..." : "Continue with Razorpay"}
                </button>
              </>
            )}

            {rechargeError ? <p className="mt-2 text-xs font-medium text-rose-600">{rechargeError}</p> : null}

            <p className="mt-4 inline-flex w-full items-center justify-center gap-2 text-xs font-medium text-slate-500">
              <ShieldCheck size={14} className="text-emerald-600" />
              Razorpay • Bank-level security
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
