import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import AppThemeProvider from "@/components/AppThemeProvider";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "Hafiz Tracker",
  description: "Offline-first Quran reading tracker for Huffaz",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} antialiased`} style={{ margin: 0 }}>
        <AppThemeProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AppThemeProvider>
      </body>
    </html>
  );
}
