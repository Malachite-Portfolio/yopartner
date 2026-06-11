import { HeartHandshake, MessageCircleHeart, Quote, ShieldCheck, Sparkles } from "lucide-react";
import { Outfit } from "next/font/google";
import Link from "next/link";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit-home",
});

const verificationStandards = [
  "Identity Verification",
  "Profile Screening",
  "Background Validation",
  "Community Compliance",
  "Continuous Quality Monitoring",
];

const connectionFocus = [
  "Social Companionship",
  "Meaningful Conversations",
  "Emotional Connection",
  "Shared Experiences",
  "Respectful Interaction",
];

const experienceExpectations = [
  "Easy Session Booking",
  "Verified Companions",
  "Flexible Scheduling",
  "Consistent Service Quality",
  "Dedicated Support Team",
  "User-Friendly Experience",
];

const privacyFeatures = [
  "Secure Messaging",
  "Protected Voice Sessions",
  "Confidential Video Calls",
  "Privacy-First Design",
  "Account Protection Systems",
  "Safe Communication Standards",
];

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
        <div className="absolute inset-x-0 top-0 h-[48%] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0.78)_34%,rgba(255,255,255,0.38)_72%,rgba(255,255,255,0)_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-[640px] w-full max-w-[1180px] flex-col items-center px-4 pt-8 text-center sm:min-h-[720px] sm:px-6 sm:pt-10 lg:min-h-[760px] lg:px-8">
          <div className="mx-auto max-w-[1040px]">
            <h1 className="text-[1.3rem] font-semibold leading-[1.16] text-black drop-shadow-[0_1px_14px_rgba(255,255,255,0.72)] sm:text-[1.55rem] lg:whitespace-nowrap lg:text-[1.72rem]">
              You Don&apos;t Have To Go Through It Alone.
            </h1>
            <p className="mt-2 text-[1.08rem] font-medium leading-tight text-black drop-shadow-[0_1px_12px_rgba(255,255,255,0.72)] sm:text-[1.2rem] lg:text-[1.28rem]">
              Hum Hai Na...
            </p>
          </div>

          <Link
            href="/connect-now"
            className="mt-[22rem] inline-flex min-h-12 items-center justify-center rounded-full bg-[#0969f4] px-7 py-3 text-base font-semibold !text-white shadow-[0_14px_26px_rgba(9,105,244,0.28)] transition hover:-translate-y-0.5 hover:bg-[#075bd2] focus:outline-none focus:ring-4 focus:ring-[#0969f4]/25 sm:mt-[22rem] sm:min-h-14 sm:px-10 sm:text-lg lg:mt-[30rem]"
          >
            Talk Now – Starts at ₹5/min
          </Link>
        </div>
      </section>

      <section className="bg-[#EEF4F1] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto w-full max-w-[1180px]">
          <div className="text-center">
            <h2 className="text-[2rem] font-semibold text-[#102f2b] sm:text-[2.25rem]">
              Built Around Trust, Designed For Human Connection
            </h2>
            <p className="mx-auto mt-3 max-w-[920px] text-[15px] leading-7 text-[#536965]">
              Every meaningful connection begins with trust. That&apos;s why we&apos;ve created a platform where safety,
              privacy, and authenticity are part of every interaction. From verified profiles to secure communication,
              every detail is designed to help you connect with confidence.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-12">
            <article className="rounded-[24px] bg-[#f8faf9] p-6 shadow-[0_12px_28px_rgba(0,67,61,0.08)] lg:col-span-8">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#c8eee8] text-[#00433d]">
                <ShieldCheck size={18} />
              </span>
              <div className="mt-3 grid gap-5 md:grid-cols-[1fr_210px] md:items-start">
                <div>
                  <h3 className="text-[1.75rem] font-semibold text-[#102f2b]">Real People. Real Verification.</h3>
                  <p className="mt-3 text-sm leading-7 text-[#4f6661]">
                    Behind every profile is a real person who has completed our verification process. We carefully review
                    companion profiles before they become available, helping create a trusted environment where genuine
                    conversations can happen naturally.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#4f6661]">
                    Whether you&apos;re looking for companionship, conversation, or emotional support, you can connect
                    knowing accountability and transparency come first.
                  </p>
                </div>
                <div className="rounded-[20px] bg-[#d7f4f3] p-4">
                  <p className="mb-3 text-sm font-semibold text-[#123f39]">Verification Standards</p>
                  <div className="space-y-2">
                    {verificationStandards.map((pill) => (
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
              <h3 className="mt-4 text-[1.65rem] font-semibold">Human Connection Without Expectations</h3>
              <p className="mt-3 text-sm leading-7 text-[#d4ece8]">
                Our platform is built for companionship, conversation, and meaningful social interaction.
              </p>
              <p className="mt-3 text-sm leading-7 text-[#d4ece8]">
                There is no pressure to impress, no dating culture, and no hidden expectations. Just authentic human
                connection designed to help people feel seen, heard, and supported.
              </p>
              <p className="mt-3 text-sm leading-7 text-[#d4ece8]">
                Whether you&apos;re sharing your thoughts, discussing your day, or simply spending time with someone who
                listens, every interaction is rooted in respect and understanding.
              </p>
              <p className="mt-5 text-sm font-semibold text-white">Our Focus</p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#d4ece8]">
                {connectionFocus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href="/trust-safety" className="mt-8 inline-flex h-9 w-full items-center justify-center rounded-full bg-white text-xs font-semibold !text-[#0b4e47] shadow-sm">
                See Safety Standards
              </Link>
            </article>

            <article className="rounded-[24px] bg-[#d7ecef] p-6 shadow-[0_12px_28px_rgba(0,67,61,0.08)] lg:col-span-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#3d5b57]">
                <Sparkles size={18} />
              </span>
              <h3 className="mt-4 text-[1.7rem] font-semibold text-[#173934]">A Thoughtfully Curated Experience</h3>
              <p className="mt-3 text-sm leading-7 text-[#4f6661]">
                We believe companionship should feel comfortable from the very first interaction.
              </p>
              <p className="mt-3 text-sm leading-7 text-[#4f6661]">
                From seamless booking and verified profiles to responsive support and intuitive communication, every step
                has been designed to create a smooth and enjoyable experience.
              </p>
              <p className="mt-3 text-sm leading-7 text-[#4f6661]">
                Our goal is simple &mdash; remove the barriers that often prevent people from connecting and make meaningful
                companionship more accessible.
              </p>
              <p className="mt-5 text-sm font-semibold text-[#173934]">What You Can Expect</p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#4f6661]">
                {experienceExpectations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-[24px] bg-[#f8faf9] p-6 shadow-[0_12px_28px_rgba(0,67,61,0.08)] lg:col-span-8">
              <div className="grid gap-5 md:grid-cols-[1fr_230px]">
                <div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#d8efea] text-[#00433d]">
                    <MessageCircleHeart size={18} />
                  </span>
                  <h3 className="mt-4 text-[1.75rem] font-semibold text-[#102f2b]">
                    Private Conversations, Protected Always
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#4f6661]">
                    Trust grows when people feel safe sharing their thoughts.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#4f6661]">
                    That&apos;s why all communication happens through secure channels designed to protect your privacy and
                    personal information. Whether you&apos;re chatting, talking over voice, or connecting through video,
                    your conversations remain confidential and protected.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#4f6661]">
                    You focus on the conversation. We&apos;ll handle the security.
                  </p>
                  <p className="mt-5 text-sm font-semibold text-[#123f39]">Privacy Features</p>
                  <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-[#4f6661] sm:grid-cols-2">
                    {privacyFeatures.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[18px] bg-[#eaf2ef] p-4 text-xs text-[#4a615c]">
                  <div className="flex items-center justify-between rounded-full bg-white px-3 py-2">
                    <span>Availability:</span>
                    <span className="rounded-full bg-[#ccedd8] px-2 py-0.5 text-[10px] font-semibold text-[#1f6f56]">High</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-full bg-white px-3 py-2">
                    <span>Average Response Time:</span>
                    <span className="font-semibold text-[#214c45]">Under 2 Minutes</span>
                  </div>
                  <p className="mt-4 leading-5 text-[#4a615c]">
                    Reliable support whenever meaningful connection matters most.
                  </p>
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
            &quot;Finding genuine conversations online felt impossible until I joined YoPartner. The experience was simple,
            respectful, and exactly what I was looking for. It feels good knowing there are real people ready to
            connect.&quot;
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/home-avatar-james.svg" alt="Verified member" className="h-11 w-11 rounded-full border border-white/70" />
            <div>
              <p className="text-sm font-semibold">Verified Member</p>
              <p className="text-[11px] text-[#c8e5df]">Mumbai</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto w-full max-w-[860px] text-center">
          <h2 className="text-[2.6rem] font-semibold leading-[1.1] text-[#00433d] sm:text-[3.3rem]">
            Meaningful Connections Start With A Simple Conversation
          </h2>
          <p className="mx-auto mt-4 max-w-[660px] text-[15px] leading-7 text-[#4f6661]">
            Thousands of people are discovering the value of genuine human connection through trusted companionship
            experiences.
          </p>
          <p className="mx-auto mt-3 max-w-[760px] text-[15px] leading-7 text-[#4f6661]">
            Whether you&apos;re looking for someone to talk to, share a hobby with, spend quality time with, or simply enjoy
            a meaningful conversation, YoPartner makes it easier to connect with people who understand the importance of
            companionship.
          </p>
          <p className="mx-auto mt-5 max-w-[760px] text-[15px] leading-7 text-[#4f6661]">
            Join India&apos;s growing community of people who believe that meaningful conversations, shared experiences,
            and human connection can make everyday life better.
          </p>
          <p className="mx-auto mt-3 max-w-[760px] text-[15px] leading-7 text-[#4f6661]">
            From chat and voice calls to video sessions and in-person companionship, every interaction is designed to be
            safe, respectful, and authentic.
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
              Explore Companionships
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
