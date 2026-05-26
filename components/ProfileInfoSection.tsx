import type { ConnectCompanion } from "@/lib/data";

type ProfileInfoSectionProps = {
  companion: ConnectCompanion;
};

export function ProfileInfoSection({ companion }: ProfileInfoSectionProps) {
  const chips = companion.servicesOffered.filter(Boolean);

  return (
    <>
      {companion.about ? (
        <section className="rounded-[22px] border border-[#e6e2eb] bg-white p-5 shadow-[0_10px_35px_rgba(43,31,63,0.06)] sm:p-7">
          <h2 className="text-2xl font-semibold text-[#201a2f]">About</h2>
          <p className="mt-3 text-[15px] leading-7 text-[#5f536a]">{companion.about}</p>
        </section>
      ) : null}

      <section className="rounded-[22px] border border-[#e6e2eb] bg-white p-5 shadow-[0_10px_35px_rgba(43,31,63,0.06)] sm:p-7">
        <h2 className="text-2xl font-semibold text-[#201a2f]">Services Offered</h2>
        {chips.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((service) => (
              <span
                key={service}
                className="rounded-full border border-[#ded1ff] bg-[#f0e9ff] px-4 py-1.5 text-sm font-semibold text-[#5a28d6]"
              >
                {service}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#7d7288]">No services listed yet.</p>
        )}
      </section>
    </>
  );
}
