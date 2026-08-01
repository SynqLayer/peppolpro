import { ImageResponse } from "next/og";

export const alt = "Peppol-Check van SynqLayer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#0f172a,#1d4ed8)", color: "white", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, fontFamily: "Arial" }}>
        <div style={{ fontSize: 34, opacity: 0.8 }}>SynqLayer</div>
        <div style={{ fontSize: 86, fontWeight: 800, marginTop: 24 }}>Peppol-Check</div>
        <div style={{ fontSize: 36, marginTop: 24, maxWidth: 900 }}>Gratis Peppol ID opzoeken via de officiële Directory</div>
      </div>
    ),
    size,
  );
}
