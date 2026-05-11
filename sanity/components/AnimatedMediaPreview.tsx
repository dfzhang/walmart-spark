import { lazy, Suspense, useEffect, useState } from "react";
import { type PreviewProps, useClient } from "sanity";

// Lazy-load lottie-react so it's never evaluated during `sanity deploy`
// (lottie-web accesses HTMLCanvasElement.getContext which doesn't exist in Node)
const Lottie = lazy(() => import("lottie-react"));

/**
 * Custom preview component for the `animatedMedia` PT block.
 * Shows a small live animation thumbnail inline in the Portable Text editor
 * when an animatedAsset reference is selected.
 */
export function AnimatedMediaPreview(props: PreviewProps) {
  const client = useClient({ apiVersion: "2024-01-01" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Lottie JSON is untyped
  const [animationData, setAnimationData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Only render Lottie in the browser — skip during SSR/build
  useEffect(() => setIsClient(true), []);

  // The animation ref ID comes through the preview select mapping
  const assetFileRef = (props as PreviewProps & { animationFileRef?: string })
    .animationFileRef;

  useEffect(() => {
    if (!assetFileRef) {
      setAnimationData(null);
      return;
    }

    let cancelled = false;

    async function fetchAnimation() {
      try {
        const asset = await client.fetch<{ url: string }>(
          `*[_id == $id][0]{ url }`,
          { id: assetFileRef }
        );

        if (cancelled || !asset?.url) return;

        const res = await fetch(asset.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!cancelled) {
          setAnimationData(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    fetchAnimation();
    return () => {
      cancelled = true;
    };
  }, [assetFileRef, client]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {/* Animation thumbnail */}
      <div
        style={{
          width: 60,
          height: 60,
          flexShrink: 0,
          borderRadius: 6,
          overflow: "hidden",
          background: "#F3F4F6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isClient && animationData ? (
          <Suspense
            fallback={
              <span style={{ fontSize: 11, color: "#9CA3AF" }} role="status">
                …
              </span>
            }
          >
            <Lottie
              animationData={animationData}
              loop
              autoplay
              style={{ width: 60, height: 60 }}
            />
          </Suspense>
        ) : error ? (
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>⚠️</span>
        ) : assetFileRef ? (
          <span
            style={{ fontSize: 11, color: "#9CA3AF" }}
            role="status"
          >
            …
          </span>
        ) : (
          <span style={{ fontSize: 24 }}>🎬</span>
        )}
      </div>

      {/* Default text preview (title/subtitle) */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {props.renderDefault(props)}
      </div>
    </div>
  );
}
