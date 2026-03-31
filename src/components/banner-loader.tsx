import { getActiveBanner } from "@/lib/sanity";
import { NotificationBanner } from "./notification-banner";

/**
 * Server component that fetches the active banner from Sanity
 * and renders the client-side NotificationBanner if one exists.
 */
export async function BannerLoader() {
  const banner = await getActiveBanner();
  if (!banner) return null;

  return (
    <NotificationBanner message={banner.message} severity={banner.severity} />
  );
}
