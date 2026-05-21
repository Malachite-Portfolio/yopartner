"use client";

type EndSessionConfirmModalProps = {
  open: boolean;
  loading?: boolean;
  error?: string;
  onStay: () => void;
  onEndSession: () => void;
};

export function EndSessionConfirmModal({
  open,
  loading = false,
  error = "",
  onStay,
  onEndSession,
}: EndSessionConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-[100svh] items-center justify-center bg-[#0f172a]/55 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-[340px] rounded-[24px] border border-white/70 bg-white p-5 text-center shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
        <h2 className="text-xl font-semibold text-[#0f172a]">End session?</h2>
        <p className="mt-2 text-sm leading-6 text-[#475569]">Leaving now will end this session for both people.</p>
        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onStay}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-60"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onEndSession}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#dc2626] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Ending..." : "End session"}
          </button>
        </div>
      </div>
    </div>
  );
}
