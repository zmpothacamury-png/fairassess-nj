import { ImageResponse } from "next/og";
import { loadTown, loadTowns } from "@/lib/data/load";
import { fontFile, labelColors, publicImage, token } from "@/lib/og";

/**
 * Share image for each town page (Prompt 14): the town name, its label, and
 * the logo on the mist background, with the NJ outline as in the page header.
 */
export const alt = "Fair Assess NJ town page: the town's name and its assessment label, with the Fair Assess NJ logo.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const towns = await loadTowns();
  return towns.map((t) => ({ slug: t.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const town = await loadTown(slug);
  const pill = labelColors(town.label);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: token("mist-50"),
          fontFamily: "Montserrat",
          borderTop: `12px solid ${token("blue-600")}`,
        }}
      >
        {/* Split accent: blue left half (the border above), green right half. */}
        <div style={{ position: "absolute", top: -12, right: 0, width: 600, height: 12, background: token("green-600") }} />
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse needs a plain <img>. */}
        <img src={publicImage("nj-outline.png")} alt="" width={420} height={745} style={{ position: "absolute", right: 40, top: -60, opacity: 0.5 }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse needs a plain <img>. */}
            <img src={publicImage("logo-icon.png")} alt="" width={63} height={112} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: 2, color: token("navy-700") }}>FAIR ASSESS NJ</span>
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 4, color: token("ink-600") }}>PUBLIC ASSESSMENT EQUITY</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3, color: token("blue-600") }}>
              BERGEN COUNTY TOWN RESULTS
            </span>
            <span style={{ fontSize: town.name.length > 20 ? 72 : 96, fontWeight: 800, color: token("navy-900"), lineHeight: 1.05, maxWidth: 820 }}>
              {town.name}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                alignSelf: "flex-start",
                background: pill.background,
                color: pill.text,
                border: `2px solid ${pill.dot}`,
                borderRadius: 999,
                padding: "12px 28px",
                fontSize: 34,
                fontWeight: 700,
              }}
            >
              <div style={{ width: 22, height: 22, borderRadius: 999, background: pill.dot }} />
              {town.label}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Montserrat", data: fontFile("montserrat-latin-700-normal.woff"), weight: 700, style: "normal" },
        { name: "Montserrat", data: fontFile("montserrat-latin-800-normal.woff"), weight: 800, style: "normal" },
      ],
    },
  );
}
