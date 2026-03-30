import type { Metadata } from "next";
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
        <header className="bg-[#0071DC] text-white">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-bold text-xl">
              <span className="text-[#FFC220]">⚡</span> Spark Driver™ Help Center
            </a>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="hover:text-[#FFC220] transition-colors">Home</a>
              <a href="/contact" className="hover:text-[#FFC220] transition-colors">Contact</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-gray-800 text-gray-400 text-sm mt-16">
          <div className="mx-auto max-w-5xl px-4 py-8 text-center">
            © {new Date().getFullYear()} Walmart Inc. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
