import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { BottomNav } from "@/components/BottomNav";
import { ServiceWorker } from "@/components/ServiceWorker";
import { ThemeSync } from "@/components/theme";
import { themeInitScript } from "@/lib/theme-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "North",
  description: "Your heading for today.",
  applicationName: "North",
  appleWebApp: {
    capable: true,
    title: "North",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1230",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is set before paint by the inline script, so the server value may differ.
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh">
        <div className="starfield" aria-hidden />
        <main className="mx-auto max-w-md px-4 pb-32 pt-[max(env(safe-area-inset-top),1rem)]">
          <Suspense fallback={<PageLoading />}>{children}</Suspense>
        </main>
        <Suspense fallback={<BottomNav static />}>
          <BottomNav />
        </Suspense>
        <ServiceWorker />
        <ThemeSync />
      </body>
    </html>
  );
}

function PageLoading() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
    </div>
  );
}
