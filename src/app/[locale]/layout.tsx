import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BannerLoader } from "@/components/banner-loader";
import { ChatWidget } from "@/components/chat-widget";
import { MobileNav } from "@/components/mobile-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { isValidLocale, localePath, buildHreflangAlternates, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Spark Driver™ Help Center",
  description: "Find answers to your questions about the Spark Driver™ app.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  const dict = getDictionary(locale);

  const navLinks = [
    { href: localePath(locale, "/"), label: dict.nav.home },
    { href: localePath(locale, "/contact"), label: dict.nav.contact },
  ];

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {/* Skip to content link — visible on focus for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-spark-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg"
        >
          {dict.nav.skipToContent}
        </a>

        {/* Notification banner — fetched from Sanity, dismissible */}
        <BannerLoader locale={locale} />

        <header className="bg-spark-blue text-white">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <Link
              href={localePath(locale, "/")}
              className="flex items-center gap-2 font-bold text-xl"
            >
              <span className="text-spark-yellow">⚡</span> Spark Driver™ Help
              Center
            </Link>

            <div className="flex items-center gap-4">
              {/* Desktop nav */}
              <nav aria-label={locale === "es" ? "Navegación principal" : "Main navigation"} className="hidden sm:flex gap-4 text-sm">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="hover:text-spark-yellow transition-colors focus:outline-none focus:ring-2 focus:ring-spark-yellow focus:ring-offset-2 focus:ring-offset-spark-blue rounded px-1"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Language switcher */}
              <LanguageSwitcher locale={locale} />

              {/* Mobile hamburger */}
              <MobileNav links={navLinks} />
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </main>

        <footer className="bg-gray-800 text-gray-400 text-sm mt-16">
          <div className="mx-auto max-w-5xl px-4 py-8 text-center">
            {dict.footer.copyright
              .replace("{year}", new Date().getFullYear().toString())}
          </div>
        </footer>

        <ChatWidget locale={locale} />
      </body>
    </html>
  );
}
