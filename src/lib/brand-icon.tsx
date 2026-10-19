import { ImageResponse } from "next/og";

// The North app icon: a gold four-point star on the night sky.
export function brandIcon(size: number, { maskable = false } = {}) {
  const star = maskable ? size * 0.5 : size * 0.66;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 30%, #1d3270 0%, #0a1230 55%, #050a1c 100%)",
        }}
      >
        <svg width={star} height={star} viewBox="0 0 24 24">
          <path d="M12 1.5 13.9 10.1 22.5 12 13.9 13.9 12 22.5 10.1 13.9 1.5 12 10.1 10.1Z" fill="#f2c46d" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
