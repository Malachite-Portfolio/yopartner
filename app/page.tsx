import { Heart, MessageCircle, ShieldCheck, Sparkles, Star, UsersRound } from "lucide-react";
import { Outfit } from "next/font/google";
import Link from "next/link";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit-home",
});

const wellbeingCards = [
  {
    title: "Verified Safety First",
    text: "Every companion is reviewed, identity checked, and guided by clear boundaries.",
    icon: ShieldCheck,
    tone: "bg-[#ecf8f3] text-[#145c43]",
  },
  {
    title: "Heart-to-Heart",
    text: "Talk with someone who listens gently, remembers context, and keeps things human.",
    icon: Heart,
    tone: "bg-[#f7efff] text-[#6f4aa8]",
  },
  {
    title: "No Judgment",
    text: "Share what is on your mind without pressure, advice overload, or awkwardness.",
    icon: Sparkles,
    tone: "bg-[#fff4de] text-[#936415]",
  },
  {
    title: "Real-time Connections",
    text: "Start with chat, audio, or video when you need a calm presence in the moment.",
    icon: MessageCircle,
    tone: "bg-[#e8f5f3] text-[#0f766e]",
  },
];

const companions = [
  { name: "Aanya", tag: "Calm listener", status: "Online" },
  { name: "Meera", tag: "Gentle check-ins", status: "Available" },
  { name: "Riya", tag: "Everyday support", status: "Online" },
];

export default function HomePage() {
  return (
    <div className={`${outfit.variable} bg-[#fbf8ef] font-[var(--font-outfit-home)] text-[#1a2e25]`}>
      <section className="relative isolate overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="absolute inset-x-0 top-0 -z-10 h-[78%] bg-[radial-gradient(circle_at_20%_16%,rgba(209,232,219,0.95),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(231,218,246,0.78),transparent_28%),linear-gradient(180deg,#fbf8ef_0%,#edf7f1_100%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.03fr_0.97fr]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#cfe4d7] bg-white/55 px-4 py-2 text-sm font-semibold text-[#315b48] shadow-sm backdrop-blur">
              <UsersRound size={16} />
              Trusted community support
            </span>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.02] text-[#133b2e] sm:text-6xl lg:text-7xl">
              Your safe space for authentic connection.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4d675d]">
              YoPartner helps you find verified companions for calm conversations, emotional support, and everyday moments when being heard matters.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/connect-now"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#123f30] px-6 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(18,63,48,0.22)] hover:bg-[#0d3226]"
              >
                Talk to Someone Now
              </Link>
              <Link
                href="/partner"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#b9d5c7] bg-white/65 px-6 text-sm font-semibold text-[#123f30] backdrop-blur hover:bg-white"
              >
                Become a Partner
              </Link>
            </div>
          </div>

          <div className="relative min-h-[430px] lg:min-h-[560px]">
            <div className="absolute right-0 top-4 w-[78%] rounded-[34px] border border-white/70 bg-white/45 p-5 shadow-[0_30px_80px_rgba(57,92,77,0.16)] backdrop-blur-xl sm:w-[68%] lg:w-[74%]">
              <div className="rounded-[26px] bg-[#e5f4ec] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#164733] text-xl font-semibold text-white">
                    YP
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#123f30]">Active companions</p>
                    <p className="text-sm text-[#5d746b]">Ready when you are</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {companions.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white/75 px-4 py-3">
                      <div>
                        <p className="font-semibold text-[#153b2f]">{item.name}</p>
                        <p className="text-sm text-[#60756d]">{item.tag}</p>
                      </div>
                      <span className="rounded-full bg-[#d8f2e5] px-3 py-1 text-xs font-semibold text-[#1d6b4b]">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute left-0 top-20 w-[70%] rounded-[30px] border border-white/70 bg-white/65 p-5 shadow-[0_22px_70px_rgba(57,92,77,0.14)] backdrop-blur-xl sm:w-[54%]">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dbeee5] text-lg font-semibold text-[#174a37]">
                  A
                </div>
                <div>
                  <p className="font-semibold text-[#143d30]">A safe hello</p>
                  <p className="text-sm text-[#687b73]">Start with chat, move at your pace.</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 left-8 w-[78%] rounded-[30px] border border-white/70 bg-white/70 p-5 shadow-[0_24px_74px_rgba(57,92,77,0.16)] backdrop-blur-xl sm:w-[58%]">
              <div className="flex items-center gap-2 text-[#174a37]">
                <Star size={18} fill="currentColor" />
                <span className="font-semibold">4.9 average warmth rating</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#60756d]">Verified companions for chat, audio, and video support.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="wellbeing" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-[#7a6aa5]">Designed for emotional wellbeing</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#143d30] sm:text-4xl">Support that feels steady, private, and human.</h2>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {wellbeingCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-3xl border border-[#dce7dd] bg-white/68 p-5 shadow-[0_16px_48px_rgba(56,82,69,0.08)] backdrop-blur">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone}`}>
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-[#173f32]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#60756d]">{card.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[36px] border border-[#dce7dd] bg-[#eef7f0] p-6 shadow-[0_20px_70px_rgba(56,82,69,0.08)] sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:p-12">
          <div>
            <p className="text-sm font-semibold uppercase text-[#174a37]">From our community</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#143d30]">A softer way to feel less alone.</h2>
          </div>
          <blockquote className="text-xl leading-9 text-[#315b48]">
            “I did not need a lecture. I just needed someone kind to stay with me through the moment. YoPartner made that feel simple and safe.”
            <footer className="mt-5 text-sm font-semibold text-[#6f4aa8]">Member story, shared anonymously</footer>
          </blockquote>
        </div>
      </section>

      <section className="px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-4xl font-semibold text-[#143d30] sm:text-5xl">Start your journey today.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#60756d]">
            Choose a verified companion, begin with a calm message, or apply to support others with empathy.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/partner" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#b9d5c7] bg-white px-6 text-sm font-semibold text-[#123f30] hover:bg-[#f5fbf7]">
              Become a Partner
            </Link>
            <Link href="/connect-now" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#123f30] px-6 text-sm font-semibold text-white hover:bg-[#0d3226]">
              Talk to Someone Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
