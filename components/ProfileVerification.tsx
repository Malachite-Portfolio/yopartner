import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { ConnectCompanion } from "@/lib/data";

type ProfileVerificationProps = {
  verification: ConnectCompanion["verification"];
};

export function ProfileVerification({ verification }: ProfileVerificationProps) {
  return (
    <section className="rounded-[22px] border border-[#e6e2eb] bg-white p-5 shadow-[0_10px_35px_rgba(43,31,63,0.06)] sm:p-7">
      <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#201a2f]">
        <ShieldCheck size={24} className="text-emerald-600" />
        YoPartner Verification
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {verification.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 rounded-xl border border-[#eee6f2] bg-[#fdf9ff] px-4 py-4"
          >
            <p className="text-[15px] font-medium text-[#44394f]">{item.label}</p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
              {item.status}
              <CheckCircle2 size={17} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
