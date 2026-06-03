import type { Metadata } from "next";
import { Manrope } from "next/font/google";
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
      <body className="min-h-screen bg-background text-foreground">
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



