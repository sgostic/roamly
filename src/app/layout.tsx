import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { logEvent } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import Providers from "./providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Roamly — Travel offers come to you",
  description:
    "Post your dream trip. Get personalized offers from agencies, hotels and hosts. Compare and book the best one.",
  openGraph: {
    title: "Roamly — Travel offers come to you",
    description: "Reverse travel marketplace. Travelers post requests, providers compete.",
    type: "website",
  },
  twitter: {
    card: "summary",
    site: "@Lovable",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const pathname = h.get("x-roamly-pathname");
  const method = h.get("x-roamly-method") ?? "GET";

  // Only log GET navigations as page views — Server Action POSTs already log
  // their own typed events, so counting them here would double-count.
  if (pathname && method === "GET") {
    const user = await getCurrentUser();
    void logEvent({
      type: "page_viewed",
      actorId: user?.id ?? null,
      actorRole: user?.role ?? null,
      targetType: "page",
      metadata: {
        pathname,
        actor_email: user?.email ?? null,
        actor_name: user?.display_name ?? null,
        user_agent: h.get("user-agent"),
        referer: h.get("referer"),
      },
    });
  }

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
