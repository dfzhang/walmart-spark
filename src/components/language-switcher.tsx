"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";

/**
 * EN/ES language toggle in the header.
 * Navigates to the equivalent page in the other locale.
 */
export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  // Build the path for the other locale
  const targetLocale: Locale = locale === "en" ? "es" : "en";
  const label = locale === "en" ? "ES" : "EN";
  const ariaLabel = locale === "en" ? "Cambiar a español" : "Switch to English";

  // Strip current locale prefix to get the base path
  let basePath = pathname;
  if (locale === "es" && pathname.startsWith("/es")) {
    basePath = pathname.slice(3) || "/";
  }
  // English has no prefix (middleware rewrites /en internally), so pathname is already the base

  // Build target path
  const targetPath = targetLocale === "en" ? basePath : `/es${basePath === "/" ? "" : basePath}`;

  return (
    <Link
      href={targetPath}
      aria-label={ariaLabel}
      className="text-sm font-medium px-2 py-1 rounded border border-white/30 hover:bg-white/10 hover:text-spark-yellow transition-colors focus:outline-none focus:ring-2 focus:ring-spark-yellow"
    >
      {label}
    </Link>
  );
}
