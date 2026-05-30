import { ArrowRight, HeartHandshake, MessageCircleHeart, Quote, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Outfit } from "next/font/google";
import Link from "next/link";
import { ActiveCompanionsCount } from "@/components/home/ActiveCompanionsCount";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit-home",
});

const statPills = ["ID + Background Verified", "Private by Design", "Secure In-App Sessions"];
const heroBenefits = [
  "Chat companionship",
  "Voice call companionship",
  "Video companionship",
  "Home visit companionship",
];

export default function HomePage() {
  return (
    <div className={`${outfit.variable} overflow-hidden bg-[#FFFDF8] font-[var(--font-outfit-home)] text-[#0f2f2c]`}>
      <section className="relative px-4 pb-16 pt-[7.25rem] sm:px-6 lg:px-8 lg:pb-24 lg:pt-[8rem]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(227,255,254,0.62),transparent_28%),radial-gradient(circle_at_83%_18%,rgba(199,210,254,0.28),transparent_24%),linear-gradient(90deg,#FFFDF8_0%,#F7FCF9_52%,#FFFDF8_100%)]" />
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="max-w-[620px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6e7de] bg-white/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.13em] text-[#40605b]">
              <Users size={13} />
              India&apos;s Premium Companionship Platform
            </span>

            <h1 className="mt-6 text-[2.65rem] font-semibold leading-[1.04] text-[#00433d] sm:text-[3.2rem] lg:text-[3.8rem]">
              Verified companions for real conversations.
            </h1>

            <p className="mt-5 max-w-[560px] text-[15px] leading-7 text-[#4f6661] sm:text-[16px]">
              YoPartner helps you connect through chat, voice calls, video sessions, and home visit companionship.
              Built for social companionship, quality time, and trusted human connection.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {heroBenefits.map((benefit) => (
                <span key={benefit} className="rounded-full border border-[#d6e7de] bg-white/85 px-3 py-1 text-[11px] font-medium text-[#315851]">
                  {benefit}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/connect-now"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#00433d] px-6 text-sm font-semibold !text-white shadow-[0_12px_30px_rgba(0,67,61,0.24)] transition hover:-translate-y-0.5 hover:bg-[#005c55]"
              >
                Start Connecting
                <ArrowRight size={15} className="text-white" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex h-11 items-center rounded-full border border-[#cadcd4] bg-white/70 px-6 text-sm font-medium text-[#244d47] transition hover:-translate-y-0.5 hover:bg-white"
              >
                How It Works
              </Link>
            </div>
          </div>

          <div className="relative mx-auto h-[390px] w-full max-w-[470px] sm:h-[440px] lg:h-[470px] lg:max-w-[500px]">
            <article className="absolute left-[4%] top-[22%] h-[250px] w-[44%] overflow-hidden rounded-[24px] border border-white/90 bg-white shadow-[0_16px_48px_rgba(0,67,61,0.18)] sm:h-[290px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.pinimg.com/736x/bb/5b/42/bb5b4215d43654b0fe2fe868d7022d38.jpg"
                alt="Companion portrait"
                className="h-full w-full object-cover"
              />
            </article>

            <article className="absolute right-[2%] top-[5%] h-[290px] w-[46%] overflow-hidden rounded-[24px] border border-white/90 bg-white shadow-[0_16px_48px_rgba(0,67,61,0.2)] sm:h-[340px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://photolive.in/wp-content/uploads/2025/10/Cute-Girl-Pic-for-Dp-5.jpg"
                alt="Companion portrait"
                className="h-full w-full object-cover"
              />
            </article>

            <div className="absolute left-[10%] top-[56%] w-[260px] rounded-[24px] border border-white/80 bg-white/78 p-4 shadow-[0_14px_36px_rgba(0,67,61,0.2)] backdrop-blur-md sm:left-[14%]">
              <ActiveCompanionsCount />
              <p className="mt-1 text-xs leading-5 text-[#5b716c]">Online now for secure, private, real-time sessions.</p>
            </div>
          </div>
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
