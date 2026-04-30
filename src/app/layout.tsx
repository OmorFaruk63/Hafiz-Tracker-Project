import type { Metadata } from "next";
import { Inter, Amiri } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import AppThemeProvider from "@/components/AppThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const amiri = Amiri({ weight: ["400", "700"], subsets: ["arabic"], variable: "--font-amiri" });

export const metadata: Metadata = {
  title: "Hafiz Tracker",
  description: "Offline-first Quran reading tracker for Huffaz",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${amiri.variable} antialiased`} style={{ margin: 0 }}>
        <AppThemeProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AppThemeProvider>
      </body>
    </html>
  );
}
