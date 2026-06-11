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
      "Every active companion completes a multi-step verification process before joining the platform. Our verification includes identity validation, profile review, and ongoing quality checks to help ensure every connection begins with trust.",
    miniTitle: "Includes",
    points: ["Identity Verification", "Profile Authentication", "Ongoing Monitoring"],
    icon: IdCard,
    iconTone: "bg-[#dff2ef] text-[#0b5b52]",
  },
  {
    title: "Carefully Reviewed Profiles",
    description:
      "Quality matters just as much as safety. Every companion profile is reviewed to ensure it reflects authenticity, professionalism, communication quality, and alignment with our community standards.",
    miniTitle: "What We Review",
    points: ["Profile Accuracy", "Communication Standards", "Community Guidelines", "Platform Suitability"],
    icon: UserRoundCheck,
    iconTone: "bg-[#e5edff] text-[#3557b7]",
  },
  {
    title: "Privacy By Design",
    description:
      "Your personal information and conversations deserve protection. We use privacy-first practices that help safeguard your data and keep your interactions secure, confidential, and under your control.",
    miniTitle: "Privacy Features",
    points: ["Protected Communication", "Secure Data Handling", "Confidential Sessions", "User-Controlled Privacy"],
    icon: EyeOff,
    iconTone: "bg-[#f1ebff] text-[#5c3faf]",
  },
  {
    title: "Respectful Community Standards",
    description:
      "Meaningful connections thrive in respectful environments. We maintain clear community guidelines that promote kindness, professionalism, and appropriate interactions across the platform.",
    miniTitle: "Community Values",
    points: ["Respect", "Professionalism", "Inclusivity", "Accountability"],
    icon: ShieldAlert,
    iconTone: "bg-[#ffe9ea] text-[#b53e48]",
  },
  {
    title: "Secure Communication Channels",
    description:
      "Whether you choose chat, voice, video, or in-person companionship, every interaction begins through secure platform communication designed to protect your experience.",
    miniTitle: "Security Features",
    points: ["Secure Messaging", "Protected Voice Sessions", "Safe Video Connections", "Account Security Measures"],
    icon: BellRing,
    iconTone: "bg-[#fff1dd] text-[#a56717]",
  },
  {
    title: "Continuous Trust & Support",
    description:
      "Trust is something that must be maintained every day. Our team continuously monitors platform quality, reviews feedback, and provides support whenever needed to help ensure a positive experience for all members.",
    miniTitle: "Ongoing Protection",
    points: ["Quality Monitoring", "User Support", "Feedback Reviews", "Continuous Improvements"],
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
              Meaningful Connections Begin With Trust
            </h1>
            <p className="mt-6 max-w-[650px] text-[16px] leading-8 text-[#4f6762] sm:text-[17px]">
              At YoPartner, trust isn&apos;t an afterthought&mdash;it&apos;s the foundation of every interaction. We&apos;ve
              built a platform where safety, privacy, and authenticity come first, allowing you to focus on what truly
              matters: genuine human connection.
            </p>
            <p className="mt-4 max-w-[650px] text-[16px] leading-8 text-[#4f6762] sm:text-[17px]">
              Every profile, conversation, and session is supported by clear standards designed to create a comfortable
              and respectful experience for everyone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/connect-now"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#00433d] px-6 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,67,61,0.2)] transition hover:bg-[#00554d]"
              >
                Explore Verified Companions
              </Link>
              <Link
                href="#foundations"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#cadbd5] bg-white px-6 text-sm font-medium text-[#204d46] transition hover:bg-[#f5faf8]"
              >
                Learn About Our Safety Standards
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="foundations" className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto w-full max-w-[1180px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4e7169]">OUR COMMITMENT</p>
          <h2 className="mt-3 text-[2rem] font-semibold leading-tight text-[#123e37] sm:text-[2.5rem]">
            Six Principles Behind Every Safe Connection
          </h2>
          <p className="mt-4 max-w-[820px] text-[15px] leading-7 text-[#546965]">
            We believe companionship should feel comfortable, transparent, and secure from the very first interaction.
            These six principles guide everything we do and help create an environment where meaningful conversations can
            thrive.
          </p>

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
                  <p className="mt-5 text-sm font-semibold text-[#153b35]">{pillar.miniTitle}</p>
                  <ul className="mt-2 space-y-1.5 text-[13px] leading-6 text-[#546965]">
                    {pillar.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
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
              A Platform Designed For Genuine Human Connection
            </h3>
            <p className="mx-auto mt-4 max-w-[760px] text-[15px] leading-7 text-[#d4ece8] sm:text-[16px]">
              Building meaningful companionship starts with creating an environment where people feel safe, respected,
              and valued.
            </p>
            <p className="mx-auto mt-3 max-w-[760px] text-[15px] leading-7 text-[#d4ece8] sm:text-[16px]">
              That&apos;s why every feature, policy, and process at YoPartner is designed around one goal:
            </p>
            <p className="mx-auto mt-3 max-w-[760px] text-[15px] font-semibold leading-7 text-white sm:text-[16px]">
              Helping real people build real connections with confidence.
            </p>

            <h3 className="mt-10 font-['Georgia','Times_New_Roman',serif] text-[2.1rem] font-semibold leading-tight sm:text-[2.8rem]">
              Trust Earned Through Every Interaction
            </h3>
            <p className="mx-auto mt-4 max-w-[760px] text-[15px] leading-7 text-[#d4ece8] sm:text-[16px]">
              Meaningful companionship starts with feeling safe, respected, and valued.
            </p>
            <p className="mx-auto mt-3 max-w-[760px] text-[15px] leading-7 text-[#d4ece8] sm:text-[16px]">
              From verified profiles and privacy-first communication to clear community standards and dedicated support,
              every part of YoPartner is designed to create an environment where genuine human connection can thrive.
            </p>
            <p className="mx-auto mt-3 max-w-[760px] text-[15px] leading-7 text-[#d4ece8] sm:text-[16px]">
              Because trust isn&apos;t something we ask for&mdash;it&apos;s something we work to earn with every conversation.
            </p>
            <Link
              href="/connect-now"
              className="yp-light-pill-on-dark mt-8 inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#0f4d47] transition hover:bg-[#eaf7f4]"
            >
              Explore Verified Companions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
