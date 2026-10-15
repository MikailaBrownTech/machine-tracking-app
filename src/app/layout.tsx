import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { AppHeader, AppTabs } from "@/components/app-header";
import { FlashToaster } from "@/components/flash-toaster";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Maintenance tracker",
  description: "Assets, work orders and QR labels for shops and facilities.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pb-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom))] md:pb-0 print:pb-0">
        <AppHeader />
        {children}
        <AppTabs />
        <Toaster />
        <FlashToaster />
      </body>
    </html>
  );
}
