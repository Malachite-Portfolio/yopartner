import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { LuckyWheelLauncher } from "@/components/LuckyWheelLauncher";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yopartner.com"),
  title: {
    default: "YoPartner - 100% Verified Profiles, No App Needed",
    template: "%s | YoPartner",
  },
  description:
    "YoPartner is a safe platonic companionship platform with 100% verified profiles. Connect instantly through chat, audio, and video calls. No app needed.",
  keywords: [
    "YoPartner",
    "verified profiles",
    "platonic companionship",
    "no app needed",
    "chat companion",
    "audio call companion",
    "video call companion",
    "safe companionship platform",
    "verified companion India",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "YoPartner",
    url: "/",
    title: "YoPartner - 100% Verified Profiles, No App Needed",
    description:
      "YoPartner is a safe platonic companionship platform with 100% verified profiles. Connect instantly through chat, audio, and video calls. No app needed.",
    images: [
      {
        url: "/logo.png",
        alt: "YoPartner - Safe platonic companionship",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YoPartner - 100% Verified Profiles, No App Needed",
    description:
      "YoPartner is a safe platonic companionship platform with 100% verified profiles. Connect instantly through chat, audio, and video calls. No app needed.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={manrope.variable}>
      <head>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1756224879086245');
            fbq('track', 'PageView');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1756224879086245&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <LuckyWheelLauncher />
      </body>
    </html>
  );
}



