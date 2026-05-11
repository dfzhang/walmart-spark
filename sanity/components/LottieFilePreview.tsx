import { useCallback, useEffect, useRef, useState } from "react";
import { type ObjectInputProps, useClient } from "sanity";
import Lottie from "lottie-react";
import type { LottieRefCurrentProps } from "lottie-react";

/**
 * Custom input component for the `lottieFile` field on `animatedAsset`.
 * Renders the default file input, then shows a live Lottie preview
 * with play/pause controls once a file is uploaded.
 */
export function LottieFilePreview(props: ObjectInputProps) {
  const client = useClient({ apiVersion: "2024-01-01" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Lottie JSON is untyped
  const [animationData, setAnimationData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Extract the file asset reference from the field value
  const fileValue = props.value as
    | { asset?: { _ref?: string } }
    | undefined;
  const assetRef = fileValue?.asset?._ref;

  // Resolve asset URL and fetch animation data
  useEffect(() => {
    if (!assetRef) {
      setAnimationData(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchAnimation() {
      try {
        // Resolve the file asset URL from the reference
        const asset = await client.fetch<{ url: string }>(
          `*[_id == $id][0]{ url }`,
          { id: assetRef }
        );

        if (cancelled || !asset?.url) return;

        const res = await fetch(asset.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!cancelled) {
          setAnimationData(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load animation"
          );
          setAnimationData(null);
        }
      }
    }

    fetchAnimation();
    return () => {
      cancelled = true;
    };
  }, [assetRef, client]);

  const togglePlayback = useCallback(() => {
    if (!lottieRef.current) return;
    if (isPlaying) {
      lottieRef.current.pause();
    } else {
      lottieRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  return (
    <div>
      {/* Render the default file upload input */}
      {props.renderDefault(props)}

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "#FEF2F2",
            borderRadius: 6,
            color: "#991B1B",
            fontSize: 13,
          }}
        >
          ⚠️ Preview error: {error}
        </div>
      )}

      {animationData && (
        <div
          style={{
            marginTop: 12,
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            overflow: "hidden",
            background: "#F9FAFB",
          }}
        >
          <div
            style={{
              maxWidth: 400,
              margin: "0 auto",
              padding: 16,
            }}
          >
            <Lottie
              lottieRef={lottieRef}
              animationData={animationData}
              loop
              autoplay
              style={{ width: "100%", height: "auto" }}
            />
          </div>

          {/* Controls bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "8px 16px",
              borderTop: "1px solid #E5E7EB",
              background: "#FFFFFF",
            }}
          >
            <button
              type="button"
              onClick={togglePlayback}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 500,
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                background: "#FFFFFF",
                cursor: "pointer",
                color: "#374151",
              }}
            >
              {isPlaying ? "⏸ Pause" : "▶️ Play"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
