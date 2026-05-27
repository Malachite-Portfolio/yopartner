import Link from "next/link";

type PrivacySection = {
  id: string;
  title: string;
  paragraphs: string[];
};

const privacySections: PrivacySection[] = [
  {
    id: "overview",
    title: "Overview",
    paragraphs: [
      "This Privacy Policy explains how YoPartner collects, uses, stores, protects, and discloses information when you access or use the platform.",
      "YoPartner is operated by Malachite Technologies Private Limited through its registered office at OC-629, 6th Floor, Gaur City Center, Sector 4, Noida Extension, Uttar Pradesh - 203207, India.",
      "By using YoPartner, you agree to this Privacy Policy and related legal terms, including the Terms of Use.",
    ],
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    paragraphs: [
      "We may collect account and profile data such as mobile number, OTP verification status, and user-provided profile fields required for platform access and support.",
      "We may collect transaction and wallet information, including recharge records, session billing details, and payment references required for lawful accounting and dispute handling.",
      "We may collect technical and device metadata such as browser details, device identifiers, timestamps, IP-related signals, and usage logs for security, fraud prevention, and service stability.",
      "Where required for specific services such as verified in-person flows, we may collect compliance documents and verification details in accordance with applicable law.",
    ],
  },
  {
    id: "how-we-use-information",
    title: "How We Use Information",
    paragraphs: [
      "We use data to provide and maintain platform features, including account access, wallet operations, session connectivity, support workflows, and safety controls.",
      "We use data to enforce platform policies, prevent abuse, detect fraud, monitor prohibited conduct, and comply with legal or regulatory obligations.",
      "We use limited operational analytics to improve service quality, reliability, and user experience without exposing private user details publicly.",
    ],
  },
  {
    id: "privacy-and-anonymity",
    title: "Privacy and Anonymity",
    paragraphs: [
      "YoPartner follows privacy-focused design, including identity-masking features in supported interactions. Personal details are not intended to be publicly exposed through platform usage.",
      "Users should avoid sharing sensitive personal, financial, identity, or contact information during sessions. Voluntary disclosure by users is at their own risk.",
      "Private logs may be reviewed only for safety, moderation, dispute handling, fraud prevention, legal compliance, and enforcement of platform rules.",
    ],
  },
  {
    id: "sharing-and-disclosure",
    title: "Sharing and Disclosure",
    paragraphs: [
      "We do not sell personal data. We may share information with trusted service providers strictly for platform operations such as payments, infrastructure, security tooling, and support services under contractual controls.",
      "We may disclose information where required by law, lawful process, regulatory direction, court order, or to protect rights, safety, and integrity of users, the platform, or the public.",
      "If a legal dispute or safety incident arises, we may preserve and share relevant records with authorized authorities as permitted by law.",
    ],
  },
  {
    id: "data-retention",
    title: "Data Retention",
    paragraphs: [
      "We retain information for as long as necessary to provide services, comply with legal obligations, resolve disputes, enforce agreements, and maintain audit and security records.",
      "Retention periods may vary by data category, transaction requirements, safety needs, and applicable statutory rules.",
    ],
  },
  {
    id: "data-security",
    title: "Data Security",
    paragraphs: [
      "We apply reasonable technical and organizational safeguards to protect user information from unauthorized access, misuse, disclosure, alteration, or destruction.",
      "No system can guarantee absolute security. Users should also maintain account security, including device protection and OTP confidentiality.",
    ],
  },
  {
    id: "user-choices",
    title: "User Choices and Rights",
    paragraphs: [
      "Users may request updates or corrections to profile information available through account controls or support channels.",
      "Subject to legal and operational constraints, users may request account closure and data handling clarification through official support contact methods.",
      "Certain records may continue to be retained where required for legal compliance, billing integrity, fraud prevention, safety, or dispute resolution.",
    ],
  },
  {
    id: "children-privacy",
    title: "Children's Privacy",
    paragraphs: [
      "YoPartner is intended for legally eligible users. Where use by minors is permitted under guardianship frameworks, legal guardian consent and supervision are required.",
      "If unauthorized minor usage is identified, the platform may restrict or terminate access in accordance with policy and applicable law.",
    ],
  },
  {
    id: "policy-updates",
    title: "Policy Updates",
    paragraphs: [
      "We may update this Privacy Policy from time to time for legal, operational, security, or product reasons.",
      "Updated versions are published on the platform. Continued use after publication constitutes acceptance of the revised policy.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: [
      "For privacy questions or requests, use the official YoPartner support channel listed on the platform.",
      "You may also write to Malachite Technologies Private Limited at the registered office address stated on this page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f8] text-[#1a2f2b]">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article className="rounded-3xl border border-[#d7e6e1] bg-white p-6 shadow-[0_14px_40px_rgba(8,55,49,0.06)] sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f766e]">Legal</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0d2b27] sm:text-4xl">Privacy Policy</h1>
            <p className="mt-5 text-[15px] leading-7 text-[#425a56]">
              This page provides the privacy framework for users of YoPartner and should be read together with{" "}
              <Link href="/terms" className="font-medium text-[#0f766e] hover:text-[#00433d]">
                Terms of Use
              </Link>
              .
            </p>

            <div className="mt-10 space-y-10">
              {privacySections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-[#123833]">
                    {index + 1}. {section.title}
                  </h2>
                  <div className="mt-4 space-y-4">
                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${section.id}-${paragraphIndex}`} className="text-[15px] leading-7 text-[#425a56]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <nav className="rounded-2xl border border-[#d7e6e1] bg-white p-4 shadow-[0_10px_28px_rgba(8,55,49,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f766e]">On this page</p>
              <ul className="mt-3 space-y-2">
                {privacySections.map((section) => (
                  <li key={section.id}>
                    <Link href={`#${section.id}`} className="text-sm leading-6 text-[#3f5652] transition hover:text-[#00433d]">
                      {section.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </div>
    </main>
  );
}

