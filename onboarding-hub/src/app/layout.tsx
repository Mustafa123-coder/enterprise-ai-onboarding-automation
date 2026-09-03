import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";

const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Manrope({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Orbit — Employee onboarding command center",
  description: "A calm, AI-assisted workspace for getting every new hire ready for day one.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
  <html lang="en">
    <body className={`${bodyFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
      {children}
    </body>
  </html>
);
}
