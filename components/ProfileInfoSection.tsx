import type { ConnectCompanion } from "@/lib/data";

type ProfileInfoSectionProps = {
  companion: ConnectCompanion;
};

export function ProfileInfoSection({ companion }: ProfileInfoSectionProps) {
  return (
    <>
      <section className="rounded-3xl bg-[#102a2a] px-6 py-5 text-white shadow-sm">
        <p className="text-sm uppercase text-[#a7f3d0]">YoPartner conversations</p>
        <p className="mt-2 text-4xl font-semibold">{companion.sessions} Conversations</p>
      </section>

      <section className="rounded-3xl border border-[#dceae5] bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-semibold text-slate-900">Why people talk to me</h3>
        <p className="mt-3 text-sm leading-7 text-slate-700">{companion.about}</p>

        <h4 className="mt-6 text-lg font-semibold text-slate-900">Good for</h4>
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

        <div className="mt-6 rounded-3xl border border-orange-200 bg-[#fff7ed] p-4">
          <h4 className="text-sm font-semibold text-orange-800">Boundaries</h4>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Strictly platonic, no outside payments, no personal contact sharing, and platform rules apply.
          </p>
        </div>
      </section>
    </>
  );
}
