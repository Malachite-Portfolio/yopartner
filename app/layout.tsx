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
  title: "YoPartner | Premium Verified Companionship Platform",
  description:
    "YoPartner is India's premium companionship platform for verified companions, voice call companionship, video companionship, home visit companionship, social companionship, and trusted human connection.",
  keywords: [
    "companionship platform",
    "verified companions",
    "voice call companionship",
    "video companionship",
    "home visit companionship",
    "social companionship",
    "human connection",
  ],
  metadataBase: new URL("https://yopartner.com"),
  alternates: {
    canonical: "/",
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8PMNJLDEZP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8PMNJLDEZP');
          `}
        </Script>
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



