import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "YoPartner | Verified Human Companionship",
  description:
    "YoPartner offers safe, verified, strictly platonic companionship for chats, calls, activities, and emotional support.",
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
      </body>
    </html>
  );
}



