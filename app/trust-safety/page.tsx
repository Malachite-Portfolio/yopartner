import {
  BellRing,
  EyeOff,
  HeartHandshake,
  IdCard,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";

const trustPillars = [
  {
    title: "Verified Companions",
    description:
      "Every active profile passes identity and background verification before going live.",
    icon: IdCard,
    iconTone: "bg-[#dff2ef] text-[#0b5b52]",
  },
  {
    title: "Quality Review",
    description:
      "Profiles are manually reviewed for authenticity, communication quality, and platform fit.",
    icon: UserRoundCheck,
    iconTone: "bg-[#e5edff] text-[#3557b7]",
  },
  {
    title: "Privacy First",
    description:
      "Session data is handled with privacy-first practices to protect personal communication.",
    icon: EyeOff,
    iconTone: "bg-[#f1ebff] text-[#5c3faf]",
  },
  {
    title: "Policy Enforcement",
    description:
      "Abuse, harassment, and non-platonic behavior are actively reviewed and strictly enforced.",
    icon: ShieldAlert,
    iconTone: "bg-[#ffe9ea] text-[#b53e48]",
  },
  {
    title: "Safety Support",
    description:
      "Users and companions can quickly report concerns through dedicated support channels.",
    icon: BellRing,
    iconTone: "bg-[#fff1dd] text-[#a56717]",
  },
  {
    title: "Secure Communication",
    description:
      "Chat, voice, and video companionship happen in secure in-app communication channels.",
    icon: HeartHandshake,
    iconTone: "bg-[#e4f5ea] text-[#2b7b4e]",
  },
];

export default function TrustSafetyPage() {
  return (
    <div className="bg-[#fbfcfb] text-[#133b35]">
      <section className="px-4 pb-16 pt-[7rem] sm:px-6 lg:px-8 lg:pb-24 lg:pt-[8.2rem]">
        <div className="mx-auto w-full max-w-[1180px]">
          <div className="max-w-[760px]">
            <h1 className="font-['Georgia','Times_New_Roman',serif] text-[2.7rem] font-semibold leading-[1.05] text-[#0d3832] sm:text-[3.4rem] lg:text-[4.5rem]">
              YoPartner Safety: Verified Profiles and Privacy First
            </h1>
            <p className="mt-6 max-w-[650px] text-[16px] leading-8 text-[#4f6762] sm:text-[17px]">
              YoPartner is a premium companionship platform with verified companions, strict standards, and privacy-first
              communication from day one.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/connect-now"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#00433d] px-6 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,67,61,0.2)] transition hover:bg-[#00554d]"
              >
                Browse Verified Companions
              </Link>
              <Link
                href="#foundations"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#cadbd5] bg-white px-6 text-sm font-medium text-[#204d46] transition hover:bg-[#f5faf8]"
              >
                View Safety Pillars
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="foundations" className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto w-full max-w-[1180px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4e7169]">Our Foundations</p>
          <h2 className="mt-3 text-[2rem] font-semibold leading-tight text-[#123e37] sm:text-[2.5rem]">
            Six pillars that protect every session
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trustPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={pillar.title}
                  className="flex h-full flex-col rounded-[22px] border border-[#dfe8e5] bg-white p-6 shadow-[0_10px_24px_rgba(5,55,47,0.07)]"
                >
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${pillar.iconTone}`}
                  >
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-4 text-[1.1rem] font-semibold text-[#153b35]">{pillar.title}</h3>
                  <p className="mt-3 text-[14px] leading-7 text-[#546965]">{pillar.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 lg:px-8 lg:pb-16">
        <div className="mx-auto w-full max-w-[1180px]">
          <div className="rounded-[30px] bg-[linear-gradient(140deg,#013e38_0%,#00554f_45%,#0b6e67_100%)] px-6 py-12 text-center text-white shadow-[0_24px_56px_rgba(0,67,61,0.34)] sm:px-10 lg:px-16 lg:py-14">
            <h3 className="font-['Georgia','Times_New_Roman',serif] text-[2.1rem] font-semibold leading-tight sm:text-[2.8rem]">
              Trusted by design, not by chance
            </h3>
            <p className="mx-auto mt-4 max-w-[760px] text-[15px] leading-7 text-[#d4ece8] sm:text-[16px]">
              Verified companions, policy enforcement, and secure communication keep every interaction private, respectful,
              and reliably safe.
            </p>
            <Link
              href="/connect-now"
              className="yp-light-pill-on-dark mt-8 inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#0f4d47] transition hover:bg-[#eaf7f4]"
            >
              Browse Verified Companions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
