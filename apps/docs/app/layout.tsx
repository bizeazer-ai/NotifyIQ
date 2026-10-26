import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://docs.notifyiq.app"),
  title: {
    template: "%s | NotifyIQ",
    default: "NotifyIQ | Enterprise WhatsApp Automation & Intelligence Platform",
  },
  description:
    "NotifyIQ is an omni-channel messaging and intelligence platform integrating with Meta APIs (WhatsApp Business Platform). Streamline customer engagement, visual flow automations, and AI copilot interactions.",
  keywords: [
    "WhatsApp Business API",
    "Meta Cloud API",
    "WABA Automation",
    "WhatsApp Chatbot",
    "Customer Support Inbox",
    "Broadcast Campaigns",
    "NotifyIQ",
    "Aadi IT Services LLP",
  ],
  authors: [{ name: "Aadi IT Services LLP" }],
  creator: "Aadi IT Services LLP",
  publisher: "Aadi IT Services LLP",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "NotifyIQ | Enterprise WhatsApp Automation & Intelligence Platform",
    description:
      "Enterprise WhatsApp Business API (WABA) intelligence, broadcast campaigns, visual flow automation, and AI-driven customer support.",
    url: "https://docs.notifyiq.app",
    siteName: "NotifyIQ",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NotifyIQ | Enterprise WhatsApp Automation & Intelligence Platform",
    description:
      "Enterprise WhatsApp Business API (WABA) intelligence, broadcast campaigns, visual flow automation, and AI-driven customer support.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
    ],
  },
};

const themeInitScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200`}
      >
        <Navbar />
        <div className="flex-1 w-full">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
