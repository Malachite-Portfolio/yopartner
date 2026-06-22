import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { LuckyWheelLauncher } from "@/components/LuckyWheelLauncher";
import { MetaPixelPageView } from "@/components/MetaPixelPageView";
import { META_PIXEL_ID } from "@/lib/metaPixel";
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
    "YoPartner offers safe, verified, strictly platonic companionship through chat, audio, and video calls. Connect with verified profiles online, no app needed.",
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
      "YoPartner offers safe, verified, strictly platonic companionship through chat, audio, and video calls. Connect with verified profiles online, no app needed.",
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
      "YoPartner offers safe, verified, strictly platonic companionship through chat, audio, and video calls. Connect with verified profiles online, no app needed.",
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
            fbq.disablePushState = true;
            fbq('init', '${META_PIXEL_ID}');
            (window.__metaPixelPendingEvents || []).forEach(function(event) {
              if (event.eventName === 'PageView') {
                fbq('trackSingle', '${META_PIXEL_ID}', event.eventName, event.params);
              } else {
                fbq('track', event.eventName, event.params);
              }
            });
            window.__metaPixelPendingEvents = [];
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <MetaPixelPageView />
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



