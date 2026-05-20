import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: 112,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "baseline",
            gap: 0,
          }}
        >
          {/* Lowercase "b" mark - lime accent, white stem */}
          <div
            style={{
              fontSize: 360,
              lineHeight: 1,
              fontWeight: 900,
              color: "#84cc16",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: -20,
            }}
          >
            b
          </div>
          {/* Yellow accent dot (price marker) */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background: "#fde047",
              marginLeft: -16,
              marginBottom: 24,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
