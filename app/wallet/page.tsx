"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
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
  addWalletRecharge,
  formatINR,
  getWalletSummary,
  subscribeWalletUpdates,
  type WalletTransaction,
} from "@/lib/wallet";
import {
  createRechargeOrder,
  getWallet,
  getWalletTransactions as getWalletTransactionsFromApi,
} from "@/lib/api/wallet";
import { demoWallet, isClientDemoEnabled } from "@/lib/clientDemoData";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";

type WalletTab = "overview" | "transactions" | "recharge";

type RechargePlan = {
  id: string;
  amount: number;
  pay: number;
  credit: number;
  bonusLabel: string;
};

const rechargePlans: RechargePlan[] = [
  { id: "100", amount: 100, pay: 118, credit: 105, bonusLabel: "+5% Bonus" },
  { id: "200", amount: 200, pay: 236, credit: 210, bonusLabel: "+5% Bonus" },
  { id: "300", amount: 300, pay: 354, credit: 315, bonusLabel: "+5% Bonus" },
  { id: "400", amount: 400, pay: 472, credit: 420, bonusLabel: "+5% Bonus" },
  { id: "500", amount: 500, pay: 590, credit: 550, bonusLabel: "+10% Bonus" },
  { id: "2000", amount: 2000, pay: 2360, credit: 2400, bonusLabel: "+20% Bonus" },
  { id: "4000", amount: 4000, pay: 4720, credit: 4800, bonusLabel: "+20% Bonus" },
  { id: "5000", amount: 5000, pay: 5900, credit: 6500, bonusLabel: "+30% Bonus" },
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
          <p className="text-2xl font-semibold text-slate-900">{formatINR(plan.amount)}</p>
          <p className="mt-1 text-xs text-slate-500">Pay {formatINR(plan.pay)} (incl. 18% GST)</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            {plan.bonusLabel}
          </span>
          {selected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white">
              <CheckCircle2 size={12} />
              Selected
            </span>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-700">Get {formatINR(plan.credit)} in your wallet</p>
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
              {tx.type === "booking" ? "Session Booking" : "Wallet Recharge"}
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

export default function WalletPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<WalletTab>("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [rechargeError, setRechargeError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isDemoWalletPreview, setIsDemoWalletPreview] = useState(false);

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [bellMessage, setBellMessage] = useState("");

  const mapApiTransactions = (input: Awaited<ReturnType<typeof getWalletTransactionsFromApi>>["data"]) =>
    (input ?? []).map((tx) => ({
      id: tx.id,
      type: tx.type === "Booking" ? "booking" : "recharge",
      amountAdded: tx.amount,
      paidAmount: Math.abs(tx.amount),
      bonus: 0,
      createdAt: tx.createdAt,
      description: tx.description ?? tx.type,
      status: tx.status === "Success" ? "success" : "success",
    })) as WalletTransaction[];

  useEffect(() => {
    if (IS_PRODUCTION_READY_MODE) {
      void (async () => {
        const [walletResponse, transactionResponse] = await Promise.all([
          getWallet(),
          getWalletTransactionsFromApi(),
        ]);
        const hasRealWallet = Boolean(walletResponse.data);
        const hasRealTransactions = Boolean(transactionResponse.data && transactionResponse.data.length > 0);

        if (hasRealWallet && walletResponse.data) {
          setBalance(walletResponse.data.balance);
          setIsDemoWalletPreview(false);
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
        if (!hasRealWallet && !hasRealTransactions && isClientDemoEnabled()) {
          setBalance(demoWallet.balance);
          setTransactions(demoWallet.transactions);
          setTotalSpent(
            demoWallet.transactions
              .filter((tx) => tx.type === "booking")
              .reduce((sum, tx) => sum + Math.abs(tx.amountAdded), 0),
          );
          setApiError("");
          setIsDemoWalletPreview(true);
          return;
        }
        if (walletResponse.error || transactionResponse.error) setApiError("Wallet service is not connected yet.");
      })();
      return () => undefined;
    }

    const sync = () => {
      const summary = getWalletSummary();
      setBalance(summary.balance);
      setTransactions(summary.transactions);
      setTotalSpent(summary.totalSpent);
    };

    sync();
    return subscribeWalletUpdates(sync);
  }, []);

  const selectedPlan = useMemo(
    () => rechargePlans.find((plan) => plan.id === selectedPlanId) ?? null,
    [selectedPlanId],
  );

  const parsedCustom = Number(customAmount);
  const validCustom = Number.isFinite(parsedCustom) && parsedCustom >= 1 && parsedCustom <= 50000;
  const canProceed = Boolean(selectedPlan || validCustom);
  const proceedCreditAmount = selectedPlan ? selectedPlan.credit : validCustom ? parsedCustom : null;

  const totalRecharged = transactions
    .filter((tx) => tx.type === "recharge")
    .reduce((sum, tx) => sum + Math.max(tx.amountAdded, 0), 0);

  const openModal = () => {
    setIsModalOpen(true);
    setSuccessMessage("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPlanId(null);
    setCustomAmount("");
    setRechargeError("");
  };

  const handleProceed = () => {
    if (IS_PRODUCTION_READY_MODE) {
      if (!canProceed) {
        setRechargeError("Select a recharge plan or enter a custom amount between ₹1 and ₹50,000.");
        return;
      }
      const amount = selectedPlan ? selectedPlan.pay : validCustom ? parsedCustom : 0;
      if (!amount) {
        setRechargeError("Invalid recharge amount.");
        return;
      }
      void (async () => {
        const response = await createRechargeOrder(amount);
        if (response.error) {
          setRechargeError("Payments are not live yet. Please try later.");
          return;
        }
        setRechargeError("");
        setSuccessMessage("Recharge order created successfully.");
      })();
      return;
    }

    if (!canProceed) {
      setRechargeError("Select a recharge plan or enter a custom amount between ₹1 and ₹50,000.");
      return;
    }

    if (selectedPlan) {
      addWalletRecharge({
        amountAdded: selectedPlan.credit,
        paidAmount: selectedPlan.pay,
        bonus: selectedPlan.credit - selectedPlan.amount,
        description: `Wallet recharge plan ${formatINR(selectedPlan.amount)} added ${formatINR(selectedPlan.credit)}`,
      });
    } else if (validCustom) {
      addWalletRecharge({
        amountAdded: parsedCustom,
        paidAmount: parsedCustom,
        bonus: 0,
        description: `Wallet recharge added ${formatINR(parsedCustom)}`,
      });
    }

    closeModal();
    setSuccessMessage("Demo money added successfully.");
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <section className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Wallet</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                View your balance, review transactions, and recharge securely.
              </p>
              {isDemoWalletPreview ? (
                <p className="mt-2 text-xs font-semibold text-slate-500">Demo wallet for preview</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (IS_PRODUCTION_READY_MODE) {
                    void (async () => {
                      const [walletResponse, txResponse] = await Promise.all([
                        getWallet(),
                        getWalletTransactionsFromApi(),
                      ]);
                      const hasRealWallet = Boolean(walletResponse.data);
                      const hasRealTransactions = Boolean(txResponse.data && txResponse.data.length > 0);

                      if (hasRealWallet && walletResponse.data) {
                        setBalance(walletResponse.data.balance);
                        setIsDemoWalletPreview(false);
                      }
                      if (txResponse.data) {
                        const mapped = mapApiTransactions(txResponse.data);
                        setTransactions(mapped);
                        setTotalSpent(
                          mapped
                            .filter((tx) => tx.type === "booking")
                            .reduce((sum, tx) => sum + Math.abs(tx.amountAdded), 0),
                        );
                      }
                      if (!hasRealWallet && !hasRealTransactions && isClientDemoEnabled()) {
                        setBalance(demoWallet.balance);
                        setTransactions(demoWallet.transactions);
                        setTotalSpent(
                          demoWallet.transactions
                            .filter((tx) => tx.type === "booking")
                            .reduce((sum, tx) => sum + Math.abs(tx.amountAdded), 0),
                        );
                        setApiError("");
                        setIsDemoWalletPreview(true);
                        setSuccessMessage("Demo wallet loaded.");
                        return;
                      }
                      if (walletResponse.error || txResponse.error) setApiError("Wallet service is not connected yet.");
                      setSuccessMessage("Wallet summary refreshed.");
                    })();
                    return;
                  }
                  const summary = getWalletSummary();
                  setBalance(summary.balance);
                  setTransactions(summary.transactions);
                  setTotalSpent(summary.totalSpent);
                  setSuccessMessage("Wallet summary refreshed.");
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

        <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
              <h2 className="text-base font-semibold text-slate-900">Add Money to Wallet</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Recharge will appear as &quot;Malachite Technologies PVT Ltd&quot; in your Bank/UPI statement.
              </p>
              <button
                type="button"
                onClick={openModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                <Plus size={15} />
                Add Money
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Recharged</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(totalRecharged)}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                <ArrowUpRight size={14} />
                credited
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Spent</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(totalSpent)}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                <ArrowDownLeft size={14} />
                debited
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transactions</p>
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
        {IS_PRODUCTION_READY_MODE && !apiError ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
            Payments are not live yet. Please try later.
          </p>
        ) : null}

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
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
                    active ? "bg-black text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
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
                <h3 className="mb-3 text-lg font-semibold text-slate-900">Recent Activity</h3>
                {recentTransactions.length === 0 ? (
                  <EmptyState title="No recent transactions" />
                ) : (
                  <TransactionList transactions={recentTransactions} />
                )}
              </div>
            )}

            {activeTab === "transactions" && (
              <div>
                <h3 className="mb-3 text-lg font-semibold text-slate-900">Transaction History</h3>
                <TransactionList transactions={transactions} />
              </div>
            )}

            {activeTab === "recharge" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-slate-900">Recharge Plans</h3>
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
                  Add Money to Wallet
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

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Balance</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900">{formatINR(balance)}</p>
            </div>

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
              onClick={handleProceed}
              disabled={!canProceed}
              className={`mt-5 h-12 w-full rounded-xl text-sm font-semibold text-white ${
                canProceed ? "bg-[#2563EB] hover:opacity-95" : "bg-slate-300"
              }`}
            >
              {proceedCreditAmount ? `Proceed with ${formatINR(proceedCreditAmount)}` : "Proceed"}
            </button>
            {rechargeError ? <p className="mt-2 text-xs font-medium text-rose-600">{rechargeError}</p> : null}

            <p className="mt-4 inline-flex w-full items-center justify-center gap-2 text-xs font-medium text-slate-500">
              <ShieldCheck size={14} className="text-emerald-600" />
              Razorpay &amp; Cashfree • Bank-level security
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
