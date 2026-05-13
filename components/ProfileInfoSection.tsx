import type { ConnectCompanion } from "@/lib/data";

type ProfileInfoSectionProps = {
  companion: ConnectCompanion;
};

export function ProfileInfoSection({ companion }: ProfileInfoSectionProps) {
  return (
    <>
      <section className="rounded-2xl bg-gradient-to-r from-[#1f2a44] via-[#2b1f48] to-[#4338ca] px-6 py-5 text-white shadow-sm">
        <p className="text-sm uppercase tracking-[0.18em] text-cyan-200">YoPartner Sessions</p>
        <p className="mt-2 text-4xl font-semibold">{companion.sessions} Sessions</p>
      </section>

      <section className="rounded-2xl bg-gradient-to-br from-[#f0f8ff] via-[#f5f3ff] to-[#ffffff] p-6 shadow-sm">
        <h3 className="text-2xl font-semibold text-slate-900">About</h3>
        <p className="mt-3 text-sm leading-7 text-slate-700">{companion.about}</p>

        <h4 className="mt-6 text-lg font-semibold text-slate-900">Services Offered</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {companion.servicesOffered.map((service) => (
            <span
              key={service}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              {service}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
