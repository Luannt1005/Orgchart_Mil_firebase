import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/app.header";
import AppFooter from "@/components/app.footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrgChart TTI SHTP",
  description: "Organization Chart Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-gray-50`}>
        <AppHeader />
        <main className="min-h-screen flex flex-col w-full" style={{ paddingTop: '75px' }}>
          <div className="flex-1">
            {children}
          </div>
        </main>
        <AppFooter />
      </body>
    </html>
  );
}
