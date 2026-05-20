import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <div
            style={{
              fontSize: 130,
              lineHeight: 1,
              fontWeight: 900,
              color: "#84cc16",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: -8,
            }}
          >
            b
          </div>
          <div
            style={{
              width: 11,
              height: 11,
              borderRadius: 6,
              background: "#fde047",
              marginLeft: -6,
              marginBottom: 8,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
