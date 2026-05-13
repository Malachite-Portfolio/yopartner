import type { ConnectCompanion } from "@/lib/data";

type ProfileVerificationProps = {
  verification: ConnectCompanion["verification"];
};

export function ProfileVerification({ verification }: ProfileVerificationProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-semibold text-slate-900">YoPartner Verification</h3>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        {verification.map((item, idx) => (
          <div
            key={item.label}
            className={`grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_auto] ${
              idx !== verification.length - 1 ? "border-b border-slate-200" : ""
            }`}
          >
            <p className="font-semibold text-slate-700">{item.label}</p>
            <p className="font-semibold text-emerald-700">{item.status}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
