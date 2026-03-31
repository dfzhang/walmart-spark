import type { Metadata } from "next";
import Link from "next/link";
import { ChatWidget } from "@/components/chat-widget";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spark Driver™ Help Center",
  description: "Find answers to your questions about the Spark Driver™ app.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {/* Skip to content link — visible on focus for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-[#0071DC] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg"
        >
          Skip to main content
        </a>

        <header className="bg-[#0071DC] text-white">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl"
            >
              <span className="text-[#FFC220]">⚡</span> Spark Driver™ Help
              Center
            </Link>
            <nav aria-label="Main navigation" className="flex gap-4 text-sm">
              <Link
                href="/"
                className="hover:text-[#FFC220] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC220] focus:ring-offset-2 focus:ring-offset-[#0071DC] rounded px-1"
              >
                Home
              </Link>
              <Link
                href="/contact"
                className="hover:text-[#FFC220] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC220] focus:ring-offset-2 focus:ring-offset-[#0071DC] rounded px-1"
              >
                Contact
              </Link>
            </nav>
          </div>
        </header>

        <main id="main-content" role="main" tabIndex={-1} className="outline-none">
          {children}
        </main>

        <footer className="bg-gray-800 text-gray-400 text-sm mt-16" role="contentinfo">
          <div className="mx-auto max-w-5xl px-4 py-8 text-center">
            © {new Date().getFullYear()} Walmart Inc. All rights reserved.
          </div>
        </footer>

        <ChatWidget />
      </body>
    </html>
  );
}
