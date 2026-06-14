import Link from "next/link";

type TermsSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const termsSections: TermsSection[] = [
  {
    id: "acceptance-of-terms",
    title: "Acceptance of Terms",
    paragraphs: [
      "These terms and conditions (\"Terms of Use\"), together with the Privacy Policy and any other policies, notices, rules, or guidelines incorporated by reference, create a legally binding agreement between the Company and you.",
      "These Terms of Use define your legal rights, duties, responsibilities, restrictions, and obligations in relation to your access to and use of YoPartner, including the platform, tools, wallet system, communication services, and all interactions, bookings, communications, sessions, or services availed through the platform.",
      "By visiting, accessing, registering on, using, or participating in YoPartner, and by clicking or selecting any confirmation such as \"I have read and agree to the Terms of Use\", you confirm that you have legal authority and capacity to enter into these Terms and that you agree to be bound by these Terms, the Privacy Policy, and all incorporated rules and policies.",
      "The Company may update, revise, modify, amend, replace, or change these Terms of Use, the Privacy Policy, or other incorporated policies at any time. Continued use of YoPartner after any update constitutes acceptance of the revised terms.",
      "If you are not legally competent, your legal guardian must have accepted these Terms on your behalf, and your use must be under such guardian supervision.",
    ],
  },
  {
    id: "platform-description-and-scope-of-services",
    title: "Platform Description and Scope of Services",
    paragraphs: [
      "YoPartner is a technology-enabled platform that facilitates online and, where applicable, in-person interaction between Users and Happiness Executives for friendly companionship, general conversation, and interest-based engagement.",
      "Services available through YoPartner are strictly non-professional, non-clinical, non-therapeutic, non-medical, non-advisory, and non-sexual in nature.",
      "Happiness Executives are not authorized to provide professional, regulated, specialized, or expert services. Category listings or interest tags do not represent professional qualifications or licensed services.",
      "YoPartner follows an anonymity-focused and privacy-conscious model. During chat and audio interactions, personal identity may be masked. You should not share personal, identifying, sensitive, private, financial, social media, or contact information.",
      "During video calls, your face may be visible. For in-person visits, verification may be mandatory, including Aadhaar or address proof. Such verification documents are retained by the Company and are not disclosed to Happiness Executives except as legally required.",
      "All interactions must remain respectful, safe, lawful, non-sexual, and non-abusive. Violations may result in suspension, restriction, termination, wallet restriction, legal action, and reporting to authorities.",
    ],
  },
  {
    id: "membership-and-accessibility",
    title: "Membership and Accessibility",
    paragraphs: [
      "Subject to compliance with these Terms, the Company grants a limited, non-exclusive, non-transferable, revocable, and personal license to access and use YoPartner for its intended purpose.",
      "Use of YoPartner is available to individuals at least 18 years of age and legally capable of entering into a binding contract, or minors only where a legal guardian has accepted these Terms and use remains under guardian supervision.",
      "You represent that all information submitted by you is true, accurate, complete, and current, and that your use does not violate applicable law, regulation, order, or third-party rights.",
      "Interactive features may require creation of a password-protected and OTP-authenticated account. You are responsible for account confidentiality, device security, and all account activity.",
      "You must not impersonate others, use another user account, attempt to expose the identity of any Happiness Executive, bypass anonymity or safety systems, or engage with Happiness Executives outside YoPartner.",
      "Your access may also be governed by Additional Policies, including safety standards, content policies, wallet policies, cancellation and refund policies, and other operational rules published by the Company.",
    ],
  },
  {
    id: "member-conduct",
    title: "Member Conduct",
    paragraphs: [
      "You must not upload, post, send, transmit, publish, distribute, display, or submit any content that is false, misleading, infringing, illegal, abusive, harassing, threatening, discriminatory, defamatory, exploitative, explicit, sexual, or otherwise prohibited under these Terms or applicable law.",
      "You must not attempt to identify, unmask, or disclose private information of any Happiness Executive, and must not bypass privacy, safety, moderation, billing, or identity-masking tools.",
      "You must not submit harmful software, malware, spyware, or any technology that can harm the platform, users, or third parties.",
      "Unlawful discrimination is prohibited. The Company may remove, restrict, report, or act on content or conduct that is unsafe, discriminatory, illegal, or otherwise in violation of policy.",
    ],
  },
  {
    id: "rules-for-users",
    title: "Rules for Users",
    paragraphs: [
      "Users shall not post misleading profile information, promote external services, solicit off-platform meetings or payments, manipulate wallet or billing systems, harass Happiness Executives, request personal identity details, or engage in explicit or inappropriate behavior.",
      "Users must not request payment through cash, UPI, bank transfer, external wallets, or any unapproved payment method. Platform payments must be routed only through Company-approved systems.",
      "If violations are detected, the Company may blacklist, suspend, terminate, restrict access, cancel sessions, withhold wallet amounts where legally permitted, report to authorities, and take legal or contractual action.",
    ],
  },
  {
    id: "submitted-content",
    title: "Submitted Content",
    paragraphs: [
      "YoPartner does not guarantee confidentiality for content that you intentionally make public, searchable, or visible through platform features.",
      "You are solely responsible for Submitted Content and represent that you own or are duly authorized to submit it, and that it does not violate any law, third-party rights, privacy rights, or platform restrictions.",
      "You retain ownership of your Submitted Content, but grant the Company a worldwide, perpetual, non-exclusive, royalty-free, transferable, sublicensable license to host, store, reproduce, display, distribute, modify, publish, process, and use such content in connection with operating, protecting, and improving YoPartner.",
      "The Company may review, remove, disable, restrict, block, or delete Submitted Content that violates these Terms, safety guidelines, applicable law, or platform standards.",
    ],
  },
  {
    id: "copyright-infringement",
    title: "Copyright Infringement",
    paragraphs: [
      "The Company respects intellectual property rights and may restrict, suspend, or terminate accounts involved in infringement.",
      "If you believe content on YoPartner infringes your copyright or trademark rights, you may submit a written notice to support@yopartner.com with sufficient details, including identification of the work, location of the allegedly infringing material, contact details, good-faith statement, authorization statement, and signature.",
      "This process cannot be used to request disclosure or confirmation of the real identity of a Happiness Executive.",
    ],
  },
  {
    id: "termination",
    title: "Termination",
    paragraphs: [
      "The Company may modify, suspend, discontinue, or terminate YoPartner services, in whole or in part, at its discretion.",
      "The Company may suspend or terminate your account for violations including attempts to expose identity, explicit or abusive behavior, off-platform solicitation, payment misuse, safety violations, policy breaches, or unlawful conduct.",
      "You may terminate your use by discontinuing access and requesting account closure where applicable. On termination, access rights end and certain records may be retained for legal, compliance, security, fraud prevention, moderation, audit, and dispute-resolution purposes.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    paragraphs: [
      "All content and materials on YoPartner, excluding user-owned Submitted Content, including text, software, graphics, interfaces, workflows, designs, databases, algorithms, and trademarks, are owned by or licensed to the Company.",
      "Platform data may include profile formats, pseudonymized presentations, category structures, matching workflows, privacy and safety tools, and interface elements.",
      "You are granted only a limited, revocable, non-transferable license for personal, non-commercial use in accordance with these Terms. You must not copy, extract, record, scrape, distribute, or commercially exploit protected content or marks.",
    ],
  },
  {
    id: "fees-wallet-sessions-refunds",
    title: "Fees, Wallet, Sessions, Refunds",
    paragraphs: [
      "Account creation and browsing may be free, but the Company may charge fees for services, sessions, premium features, wallet usage, bookings, and other platform functionality.",
      "Users may be required to maintain sufficient wallet balance before session initiation, including prescribed minimum balances for chat, audio, video, or in-person sessions.",
      "Users must not bypass wallet or billing systems, make direct payments to Happiness Executives, or manipulate deduction and recharge mechanisms.",
      "Chat sessions may be billed per message. Audio and video sessions may be billed per minute. In-person sessions may be billed hourly with minimum duration and verification requirements.",
      "Cancellation and refund rules apply as per Company policy. Refunds may be limited and may be denied for user-side issues, late cancellation, no-shows, misuse, or policy violations.",
      "If a scheduled session is unavailable due to assigned executive unavailability, the Company may offer replacement or wallet credit as per policy.",
    ],
  },
  {
    id: "dispute-resolution",
    title: "Dispute Resolution",
    paragraphs: [
      "Parties shall first attempt to resolve disputes through good-faith discussions and reasonable negotiations.",
      "If unresolved within 15 days of being raised, disputes may be referred to arbitration by a sole arbitrator jointly appointed by the parties, under the Arbitration and Conciliation Act, 1996.",
      "The seat and legal place of arbitration shall be Gurgaon, Haryana, and proceedings shall be in English.",
      "Subject to arbitration provisions, courts located in Gurgaon, Haryana shall have exclusive jurisdiction. These Terms are governed by laws of India.",
    ],
  },
  {
    id: "third-party-links",
    title: "Third-Party Links",
    paragraphs: [
      "YoPartner may contain third-party links, contact forms, advertisements, phone numbers, integrations, payment gateways, and external resources.",
      "The Company does not control third-party websites or resources and is not responsible for their availability, content, services, policies, security, privacy practices, or resulting loss.",
      "Unless expressly stated, third-party links do not constitute endorsement, approval, guarantee, sponsorship, or recommendation by the Company.",
    ],
  },
  {
    id: "disclaimer",
    title: "Disclaimer",
    paragraphs: [
      "Your use of YoPartner is at your own risk. To the maximum extent permitted by law, YoPartner and all related services, data, tools, and content are provided on an \"as is\", \"as available\", and \"where-is\" basis.",
      "The Company disclaims express, implied, statutory, or other warranties, including merchantability, fitness for a particular purpose, non-infringement, reliability, quality, accuracy, and uninterrupted availability.",
      "YoPartner connects users with Happiness Executives for non-clinical, non-professional companionship interactions only. Happiness Executives do not provide medical, psychiatric, legal, financial, or regulated professional services through YoPartner.",
      "In-person interactions and voluntary disclosures are undertaken at your sole risk, except to the extent liability cannot be excluded under applicable law.",
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, the Company and its officers, directors, employees, affiliates, suppliers, and service providers are not liable for direct, indirect, incidental, special, punitive, consequential, or exemplary damages.",
      "This includes loss of business, profit, revenue, data, goodwill, service interruption, device damage, emotional distress, user misconduct, or other economic and non-economic loss.",
      "The total aggregate liability of the Company, arising out of or related to YoPartner, shall not exceed the total fees actually paid by you to the Company for the specific service giving rise to the claim.",
    ],
  },
  {
    id: "force-majeure",
    title: "Force Majeure",
    paragraphs: [
      "Neither party shall be liable for delay, interruption, or non-performance (except payment obligations) caused by events beyond reasonable control and without fault or negligence.",
    ],
    bullets: [
      "Fire, flood, earthquake, natural disaster, and other acts of God",
      "Power failure, internet failure, utility disruption, platform outage, or payment gateway disruption",
      "Strike, labor dispute, pandemic, epidemic, war, terrorism, national emergency",
      "Government action, regulatory order, court order, or any similar event beyond reasonable control",
    ],
  },
  {
    id: "indemnification",
    title: "Indemnification",
    paragraphs: [
      "You agree to defend, indemnify, and hold harmless the Company and its officers, directors, employees, affiliates, suppliers, and service providers from all claims, losses, liabilities, damages, penalties, expenses, and reasonable legal costs arising from your access to or use of YoPartner.",
      "This includes claims related to your conduct, submitted content, policy violations, unlawful behavior, identity disclosure attempts, payment misuse, off-platform engagement, and interactions with Happiness Executives or third parties.",
      "If you have disputes with other users, Happiness Executives, or third parties, you release the Company from related claims and liabilities to the extent permitted by law.",
    ],
  },
  {
    id: "notice",
    title: "Notice",
    paragraphs: [
      "The Company may provide notices by email, SMS, in-app notifications, website postings, regular mail, WhatsApp, or other communication channels associated with your account.",
      "Notices may include updates to Terms, Privacy Policy, service changes, safety alerts, account notices, billing notices, and legal communications.",
      "You may send written notices to the Company's registered office or through the official support contact published on YoPartner.",
    ],
  },
  {
    id: "general-information",
    title: "General Information",
    paragraphs: [
      "These Terms of Use, together with Privacy Policy, Additional Policies, legal notices, safety guidelines, and other published rules, constitute the entire agreement between you and the Company regarding YoPartner.",
      "If any provision is held invalid or unenforceable, remaining provisions continue in full force.",
      "Any claim arising from YoPartner must be commenced within one (1) year from the date the cause of action arose, unless a longer mandatory period is required under applicable law.",
      "Section headings are for convenience only and do not affect interpretation.",
      "YoPartner is a technology and service facilitation platform. Nothing in these Terms creates agency, partnership, joint venture, employment, franchise, fiduciary, or representative relationship between you and the Company, or between you and any Happiness Executive.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f8] text-[#1a2f2b]">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article className="rounded-3xl border border-[#d7e6e1] bg-white p-6 shadow-[0_14px_40px_rgba(8,55,49,0.06)] sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f766e]">Legal</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0d2b27] sm:text-4xl">Terms of Use - User Side</h1>
            <p className="mt-5 text-[15px] leading-7 text-[#425a56]">
              <span className="font-semibold text-[#173a35]">Malachite Technologies Private Limited</span> owns, operates, manages,
              and controls services made available through its registered office at{" "}
              <span className="font-medium text-[#173a35]">
                OC-629, 6th Floor, Gaur City Center, Sector 4, Noida Extension, Uttar Pradesh - 203207, India
              </span>
              .
            </p>
            <p className="mt-3 text-[15px] leading-7 text-[#425a56]">
              The policy source for this page is the uploaded PDF titled <span className="font-medium">&quot;YOPATNER TERMS OF USE - USER SIDE&quot;</span>,
              with branding typo normalized to YoPartner for display title consistency.
            </p>

            <div className="mt-10 space-y-10">
              {termsSections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-[#123833]">
                    {index + 1}. {section.title}
                  </h2>
                  <div className="mt-4 space-y-4">
                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${section.id}-p-${paragraphIndex}`} className="text-[15px] leading-7 text-[#425a56]">
                        {paragraph}
                      </p>
                    ))}
                    {section.bullets?.length ? (
                      <ul className="space-y-2 pl-5 text-[15px] leading-7 text-[#425a56]">
                        {section.bullets.map((bullet, bulletIndex) => (
                          <li key={`${section.id}-b-${bulletIndex}`} className="list-disc">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <nav className="rounded-2xl border border-[#d7e6e1] bg-white p-4 shadow-[0_10px_28px_rgba(8,55,49,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f766e]">On this page</p>
              <ul className="mt-3 space-y-2">
                {termsSections.map((section) => (
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
