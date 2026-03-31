import type { Metadata } from "next";
import { ChatWidget } from "@/components/chat-widget";
import { MobileNav } from "@/components/mobile-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spark Driver™ Help Center",
  description: "Find answers to your questions about the Spark Driver™ app.",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/contact", label: "Contact" },
];

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
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-spark-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg"
        >
          Skip to main content
        </a>

        <header className="bg-spark-blue text-white">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-2 font-bold text-xl"
            >
              <span className="text-spark-yellow">⚡</span> Spark Driver™ Help
              Center
            </a>

            {/* Desktop nav */}
            <nav aria-label="Main navigation" className="hidden sm:flex gap-4 text-sm">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:text-spark-yellow transition-colors focus:outline-none focus:ring-2 focus:ring-spark-yellow focus:ring-offset-2 focus:ring-offset-spark-blue rounded px-1"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Mobile hamburger */}
            <MobileNav links={navLinks} />
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </main>

        <footer className="bg-gray-800 text-gray-400 text-sm mt-16">
          <div className="mx-auto max-w-5xl px-4 py-8 text-center">
            © {new Date().getFullYear()} Walmart Inc. All rights reserved.
          </div>
        </footer>

        <ChatWidget />
      </body>
    </html>
  );
}
