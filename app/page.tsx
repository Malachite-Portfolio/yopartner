import { HeartHandshake, MessageCircleHeart, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { Outfit } from "next/font/google";
import Link from "next/link";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit-home",
});

export default function HomePage() {
  return (
    <div className={`${outfit.variable} overflow-hidden bg-[#FFFDF8] font-[var(--font-outfit-home)] text-[#102f2b]`}>
      <section className="relative isolate min-h-[calc(100svh-1px)] px-4 pb-[4.5rem] pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-[8.5rem]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_18%,rgba(238,248,245,1),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(199,210,254,0.46),transparent_24%),radial-gradient(circle_at_72%_82%,rgba(227,255,254,0.82),transparent_30%),linear-gradient(180deg,#FFFDF8_0%,#F4FBF8_58%,#EEF8F5_100%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#cce3da] bg-white/60 px-4 py-2 text-sm font-semibold text-[#00433d] shadow-sm backdrop-blur-md">
              <UsersRound size={16} />
              Trusted Community Support
            </span>
            <h1 className="mt-7 max-w-4xl text-[3.35rem] font-semibold leading-[0.98] text-[#00433d] sm:text-7xl lg:text-[5.45rem]">
              Your safe space for authentic connection.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#516962]">
              Experience compassionate listening and platonic companionship. We provide a digital sanctuary where you can express yourself freely without judgment.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/connect-now"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#00433d] px-7 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(0,67,61,0.24)] hover:-translate-y-0.5 hover:bg-[#005c55]"
              >
                Find a Companion
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#bdd7cf] bg-white/70 px-7 text-sm font-semibold text-[#00433d] backdrop-blur hover:-translate-y-0.5 hover:bg-white"
              >
                Learn Our Story
              </Link>
            </div>
          </div>

          <div className="relative min-h-[520px] lg:min-h-[650px]">
            <div className="absolute left-[4%] top-12 h-[430px] w-[44%] overflow-hidden rounded-[2.2rem] border border-white/80 bg-[#e3fffe] shadow-[0_32px_90px_rgba(0,67,61,0.17)] sm:left-[8%] sm:w-[39%] lg:h-[500px]">
              <div className="flex h-full flex-col justify-between bg-[linear-gradient(155deg,#d2f6ea_0%,#e3fffe_48%,#C7D2FE_150%)] p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/70 text-2xl font-semibold text-[#00433d] shadow-sm">M</div>
                <div>
                  <p className="text-2xl font-semibold text-[#00433d]">Mira</p>
                  <p className="mt-1 text-sm font-medium text-[#527168]">Mindful listener</p>
                </div>
              </div>
            </div>

            <div className="absolute right-[3%] top-0 h-[455px] w-[44%] overflow-hidden rounded-[2.2rem] border border-white/80 bg-[#EEF8F5] shadow-[0_32px_90px_rgba(0,67,61,0.16)] sm:right-[9%] sm:w-[39%] lg:h-[525px]">
              <div className="flex h-full flex-col justify-between bg-[linear-gradient(160deg,#f7fffc_0%,#bdece1_58%,#005c55_145%)] p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#00433d] text-2xl font-semibold text-white shadow-sm">A</div>
                <div>
                  <p className="text-2xl font-semibold text-[#00433d]">Aanya</p>
                  <p className="mt-1 text-sm font-medium text-[#527168]">Calm companion</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-10 left-1/2 w-[82%] -translate-x-1/2 rounded-[2rem] border border-white/75 bg-white/62 p-5 shadow-[0_22px_70px_rgba(0,67,61,0.16)] backdrop-blur-xl sm:w-[60%]">
              <div className="flex items-center gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e3fffe] text-[#00433d]">
                  <UsersRound size={24} />
                </span>
                <div>
                  <p className="text-2xl font-semibold text-[#00433d]">1,240 Active Companions</p>
                  <p className="mt-1 text-sm leading-6 text-[#5a7069]">Ready to talk and listen whenever you need support.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="wellbeing" className="bg-[#FFFDF8] px-4 py-[4.5rem] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold text-[#00433d] sm:text-5xl">Designed for Emotional Wellbeing</h2>
            <p className="mt-4 text-lg leading-8 text-[#5a7069]">We&apos;ve built a sanctuary based on empathy, safety, and mutual respect.</p>
          </div>

          <div className="mt-12 grid auto-rows-[minmax(230px,auto)] gap-5 lg:grid-cols-4">
            <article className="rounded-[2rem] border border-[#d8ebe4] bg-[#EEF8F5] p-7 shadow-[0_22px_70px_rgba(0,67,61,0.08)] lg:col-span-2 lg:row-span-2">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#00433d]">
                <ShieldCheck size={28} />
              </span>
              <h3 className="mt-8 text-3xl font-semibold text-[#00433d]">Verified Safety First</h3>
              <p className="mt-4 max-w-lg text-base leading-8 text-[#5a7069]">
                Every companion is carefully reviewed, identity checked, and guided by strong platonic boundaries so support feels calm and trustworthy.
              </p>
              <div className="mt-9 rounded-[1.5rem] bg-white/70 p-5 text-sm font-semibold text-[#00433d]">Private conversations, reviewed companions, clear standards.</div>
            </article>

            <article className="rounded-[2rem] bg-[#005c55] p-7 text-white shadow-[0_22px_70px_rgba(0,67,61,0.18)] lg:col-span-2">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <HeartHandshake size={28} />
              </span>
              <h3 className="mt-7 text-3xl font-semibold">Heart-to-Heart</h3>
              <p className="mt-4 text-base leading-7 text-[#d5efeb]">Warm conversations with real humans who listen first and let you set the pace.</p>
            </article>

            <article className="rounded-[2rem] border border-[#e3e7dc] bg-white p-7 shadow-[0_22px_70px_rgba(0,67,61,0.07)]">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2f0ff] text-[#6b5bb8]">
                <Sparkles size={28} />
              </span>
              <h3 className="mt-7 text-2xl font-semibold text-[#00433d]">No Judgment</h3>
              <p className="mt-4 text-base leading-7 text-[#5a7069]">Bring your thoughts as they are. No pressure, no labels, no awkward expectations.</p>
            </article>

            <article className="rounded-[2rem] border border-[#d8ebe4] bg-[#e3fffe] p-7 shadow-[0_22px_70px_rgba(0,67,61,0.08)] lg:col-span-1">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#00433d]">
                <MessageCircleHeart size={28} />
              </span>
              <h3 className="mt-7 text-2xl font-semibold text-[#00433d]">Real-time Connections</h3>
              <p className="mt-4 text-base leading-7 text-[#5a7069]">Chat, audio, and video support when you want someone steady nearby.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] bg-[#00433d] p-7 text-white shadow-[0_30px_90px_rgba(0,67,61,0.22)] sm:p-10 lg:p-14">
          <blockquote className="mx-auto max-w-4xl text-center text-2xl font-medium leading-10 sm:text-3xl">
            &quot;YoPartner wasn&apos;t just a service; it was the bridge I needed during a lonely transition. Having someone who truly listens changed everything.&quot;
          </blockquote>
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#e3fffe] text-lg font-semibold text-[#00433d]">J</span>
            <div>
              <p className="font-semibold">James R.</p>
              <p className="text-sm text-[#c8e5df]">Community Member since 2023</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-[5.5rem] pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-4xl font-semibold text-[#00433d] sm:text-5xl">Start your journey today.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#5a7069]">
            Join thousands of others finding support and connection. Your first 10 minutes are on us.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/partner" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#bdd7cf] bg-white px-7 text-sm font-semibold text-[#00433d] hover:-translate-y-0.5 hover:bg-[#F7FCFA]">
              Become a Partner
            </Link>
            <Link href="/connect-now" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#00433d] px-7 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(0,67,61,0.2)] hover:-translate-y-0.5 hover:bg-[#005c55]">
              Talk to Someone Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
