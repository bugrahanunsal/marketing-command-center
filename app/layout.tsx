import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Mono, Syne } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
});
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

const APP = process.env.NEXT_PUBLIC_APP_NAME ?? "MarketingOS";
const URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new globalThis.URL(URL),
  title: { default: APP, template: `%s · ${APP}` },
  description: "All-in-one marketing management platform",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d14" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning
      className={`${dmSans.variable} ${syne.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-surface-0 font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(224 20% 10%)",
              color: "hsl(220 9% 92%)",
              border: "1px solid hsl(224 16% 18%)",
              borderRadius: "0.625rem",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
