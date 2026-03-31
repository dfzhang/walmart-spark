import "./globals.css";

/**
 * Root layout — minimal shell. The [locale] layout handles
 * the <html lang>, metadata, header, footer, and chrome.
 * This exists because Next.js requires a root layout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
