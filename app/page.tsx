import { HeartHandshake, MessageCircleHeart, Quote, ShieldCheck, Sparkles } from "lucide-react";
import { Outfit } from "next/font/google";
import Link from "next/link";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit-home",
});

const statPills = ["ID + Background Verified", "Private by Design", "Secure In-App Sessions"];

export default function HomePage() {
  return (
    <div className={`${outfit.variable} overflow-hidden bg-[#FFFDF8] font-[var(--font-outfit-home)] text-[#0f2f2c]`}>
      <section className="relative min-h-[640px] overflow-hidden bg-[#f4f6ef] sm:min-h-[720px] lg:min-h-[760px]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/yp video_1.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 top-0 h-[30%] bg-[linear-gradient(180deg,rgba(255,255,255,0.68)_0%,rgba(255,255,255,0.28)_48%,rgba(255,255,255,0)_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-[640px] w-full max-w-[1180px] flex-col items-center px-4 pt-8 text-center sm:min-h-[720px] sm:px-6 sm:pt-10 lg:min-h-[760px] lg:px-8">
          <div className="mx-auto max-w-[1040px]">
            <h1 className="text-[1.35rem] font-semibold leading-[1.16] text-black drop-shadow-[0_1px_14px_rgba(255,255,255,0.72)] sm:text-[1.85rem] lg:whitespace-nowrap lg:text-[2.15rem]">
              You Don&apos;t Have To Go Through It Alone.
            </h1>
            <p className="mt-2 text-[1.22rem] font-medium leading-tight text-black drop-shadow-[0_1px_12px_rgba(255,255,255,0.72)] sm:text-[1.5rem] lg:text-[1.75rem]">
              Hum Hai Na...
            </p>
          </div>

          <Link
            href="/connect-now"
            className="mt-64 inline-flex min-h-12 items-center justify-center rounded-full bg-[#0969f4] px-7 py-3 text-base font-semibold !text-white shadow-[0_14px_26px_rgba(9,105,244,0.28)] transition hover:-translate-y-0.5 hover:bg-[#075bd2] focus:outline-none focus:ring-4 focus:ring-[#0969f4]/25 sm:mt-80 sm:min-h-14 sm:px-10 sm:text-lg lg:mt-[26rem]"
          >
            Talk Now – Starts at ₹5/min
          </Link>
        </div>
      </section>

      <section className="bg-[#EEF4F1] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto w-full max-w-[1180px]">
          <div className="text-center">
            <h2 className="text-[2rem] font-semibold text-[#102f2b] sm:text-[2.25rem]">Trust, Safety, and Privacy by Default</h2>
            <p className="mt-3 text-[15px] text-[#536965]">A modern companionship platform with verified companions and secure communication.</p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-12">
            <article className="rounded-[24px] bg-[#f8faf9] p-6 shadow-[0_12px_28px_rgba(0,67,61,0.08)] lg:col-span-8">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#c8eee8] text-[#00433d]">
                <ShieldCheck size={18} />
              </span>
              <div className="mt-3 grid gap-5 md:grid-cols-[1fr_210px] md:items-start">
                <div>
                  <h3 className="text-[1.75rem] font-semibold text-[#102f2b]">Verification You Can Trust</h3>
                  <p className="mt-3 text-sm leading-7 text-[#4f6661]">
                    Every profile goes through structured verification before going live.
                    You connect with real people on a platform built for accountability.
                  </p>
                  <p className="mt-5 text-sm font-semibold text-[#123f39]">Verification layers</p>
                </div>
                <div className="rounded-[20px] bg-[#d7f4f3] p-4">
                  <div className="space-y-2">
                    {statPills.map((pill) => (
                      <span key={pill} className="block rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-[#446660]">
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[24px] bg-[#005c55] p-6 text-white shadow-[0_16px_36px_rgba(0,67,61,0.22)] lg:col-span-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/12">
                <HeartHandshake size={18} />
              </span>
              <h3 className="mt-4 text-[1.65rem] font-semibold">Companionship, Not Dating</h3>
              <p className="mt-3 text-sm leading-7 text-[#d4ece8]">YoPartner is strictly platonic. No dating. No therapy. Just quality social companionship.</p>
              <Link href="/trust-safety" className="mt-8 inline-flex h-9 w-full items-center justify-center rounded-full bg-white text-xs font-semibold text-[#0b4e47]">
                See Safety Standards
              </Link>
            </article>

            <article className="rounded-[24px] bg-[#d7ecef] p-6 shadow-[0_12px_28px_rgba(0,67,61,0.08)] lg:col-span-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#3d5b57]">
                <Sparkles size={18} />
              </span>
              <h3 className="mt-4 text-[1.7rem] font-semibold text-[#173934]">Premium Experience</h3>
              <p className="mt-3 text-sm leading-7 text-[#4f6661]">
                Clean session flow, verified profiles, and professional support designed for modern human connection.
              </p>
            </article>

            <article className="rounded-[24px] bg-[#f8faf9] p-6 shadow-[0_12px_28px_rgba(0,67,61,0.08)] lg:col-span-8">
              <div className="grid gap-5 md:grid-cols-[1fr_230px]">
                <div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#d8efea] text-[#00433d]">
                    <MessageCircleHeart size={18} />
                  </span>
                  <h3 className="mt-4 text-[1.75rem] font-semibold text-[#102f2b]">Secure Communication</h3>
                  <p className="mt-3 text-sm leading-7 text-[#4f6661]">
                    Message instantly or schedule sessions on your time.
                    Chat, voice, and video companionship stay inside protected in-app channels.
                  </p>
                </div>
                <div className="rounded-[18px] bg-[#eaf2ef] p-4 text-xs text-[#4a615c]">
                  <div className="flex items-center justify-between rounded-full bg-white px-3 py-2">
                    <span>Current Availability</span>
                    <span className="rounded-full bg-[#ccedd8] px-2 py-0.5 text-[10px] font-semibold text-[#1f6f56]">HIGH</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-full bg-white px-3 py-2">
                    <span>Average Response</span>
                    <span className="font-semibold text-[#214c45]">2 mins</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto w-full max-w-[1180px] rounded-[24px] bg-[#005c55] px-6 py-10 text-white shadow-[0_24px_50px_rgba(0,67,61,0.26)] sm:px-10 sm:py-12">
          <Quote size={38} className="text-white/35" />
          <blockquote className="mx-auto mt-2 max-w-[860px] text-center text-[2rem] font-semibold leading-[1.25] sm:text-[2.3rem]">
            &quot;Fast onboarding, verified profiles, and high-quality conversations.
            YoPartner made social companionship simple and safe.&quot;
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/home-avatar-james.svg" alt="Verified member" className="h-11 w-11 rounded-full border border-white/70" />
            <div>
              <p className="text-sm font-semibold">Verified Member</p>
              <p className="text-[11px] text-[#c8e5df]">Bengaluru</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto w-full max-w-[860px] text-center">
          <h2 className="text-[2.6rem] font-semibold leading-[1.1] text-[#00433d] sm:text-[3.3rem]">Real conversations. Real people. Better days.</h2>
          <p className="mx-auto mt-4 max-w-[660px] text-[15px] leading-7 text-[#4f6661]">
            Join India&apos;s premium companionship platform for trusted chat, voice, video, and home visit companionship.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/partner"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#00433d] px-7 text-sm font-semibold !text-white shadow-[0_10px_24px_rgba(0,67,61,0.22)] transition hover:-translate-y-0.5 hover:bg-[#005c55]"
            >
              Become a Verified Companion
            </Link>
            <Link
              href="/connect-now"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#c6d9d1] bg-white px-7 text-sm font-medium text-[#224d46] transition hover:-translate-y-0.5 hover:bg-[#f9fcfb]"
            >
              Explore Companions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
