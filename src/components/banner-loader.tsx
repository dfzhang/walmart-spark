import { getActiveBanner } from "@/lib/sanity";
import { NotificationBanner } from "./notification-banner";
import type { Locale } from "@/lib/i18n/config";

/**
 * Server component that fetches the active banner from Sanity
 * and renders the client-side NotificationBanner if one exists.
 */
export async function BannerLoader({ locale = "en" }: { locale?: Locale }) {
  const banner = await getActiveBanner();
  if (!banner) return null;

  return (
    <NotificationBanner
      message={banner.message}
      severity={banner.severity}
      locale={locale}
    />
  );
}
