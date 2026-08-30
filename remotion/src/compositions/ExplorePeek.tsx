import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { COLORS, FONTS } from "../components/SharedStyles";
import { IPhoneChrome, SAFE_BOTTOM, SAFE_TOP } from "../components/IPhoneChrome";

/**
 * S1 Explore — peek swipe and pin follow the same index (UX P4).
 * Full-bleed app UI. 390×844. Do not nest a phone inside a square frame.
 */

const PLACES = [
  { name: "Skandagiri", meta: "1h 30m · 68 km", city: "Chikballapur", cat: "TREK", x: 65.47, y: 16.06, color: "#5DCAA5", img: staticFile("places/skandagiri.jpg") },
  { name: "Makalidurga", meta: "1h 31m · 68 km", city: "Gunjuru", cat: "TREK", x: 48.29, y: 14.53, color: "#E0A458", img: staticFile("places/makalidurga.jpg") },
  { name: "Savandurga", meta: "57m · 43 km", city: "Magadi", cat: "TREK", x: 28.97, y: 64.87, color: "#5DCAA5", img: staticFile("places/savandurga.jpg") },
];

const HOLD = 48;
const SWIPE = 14; // ~440ms at 30fps — DURATION.medium

function activeIndex(frame: number) {
  const cycle = HOLD + SWIPE;
  const total = PLACES.length * cycle;
  const t = ((frame % total) + total) % total;
  const i = Math.floor(t / cycle);
  const local = t % cycle;
  const from = i;
  const to = (i + 1) % PLACES.length;
  const p = local < HOLD ? 0 : interpolate(local, [HOLD, HOLD + SWIPE], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { from, to, p, settled: p < 0.001 ? from : p > 0.999 ? to : from };
}

export const ExplorePeek: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to, p, settled } = activeIndex(frame);
  const selected = p < 0.5 ? from : to;
  const trackX = interpolate(p, [0, 1], [-from * 100, -to * 100]);
  const camX = interpolate(p, [0, 1], [50 - PLACES[from].x, 50 - PLACES[to].x]);
  const camY = interpolate(p, [0, 1], [42 - PLACES[from].y, 42 - PLACES[to].y]);
  const blur = p > 0.02 && p < 0.98 ? interpolate(p, [0, 0.45, 1], [0, 8, 0]) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: FONTS.body }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          filter: `blur(${blur}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "160%",
            height: "160%",
            left: "-30%",
            top: "-30%",
            transform: `translate(${camX * 0.7}%, ${camY * 0.7}%)`,
          }}
        >
          <Img
            src={staticFile("maps/blr-dark.jpg")}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
            }}
          />
          {PLACES.map((place, i) => {
            const on = i === selected;
            return (
              <div
                key={place.name}
                style={{
                  position: "absolute",
                  left: `${place.x}%`,
                  top: `${place.y}%`,
                  transform: `translate(-50%, -100%) scale(${on ? 1.12 : 1})`,
                  zIndex: on ? 3 : 1,
                  opacity: on ? 1 : 0.7,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    height: 44,
                    padding: "0 12px 0 4px",
                    borderRadius: 999,
                    background: "rgba(26,26,31,0.95)",
                    border: `1.5px solid ${place.color}`,
                    boxShadow: on ? `0 0 24px ${place.color}66` : "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: `${place.color}33`,
                      flex: "none",
                    }}
                  />
                  <span>
                    <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text, fontWeight: 500 }}>
                      {place.name}
                    </div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.text3 }}>{place.meta}</div>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          boxShadow: "inset 0 0 120px 48px rgba(0,0,0,0.55)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: SAFE_TOP,
          left: 16,
          right: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          zIndex: 4,
        }}
      >
        <div style={{ display: "flex", gap: 6, minWidth: 0, overflow: "hidden" }}>
          <span
            style={{
              height: 32,
              padding: "0 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              color: "rgba(255,255,255,0.65)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              background: "rgba(0,0,0,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            See more
          </span>
          <span
            style={{
              height: 32,
              padding: "0 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              color: COLORS.mint,
              border: "0.5px solid rgba(93,202,165,0.55)",
              background: "rgba(93,202,165,0.15)",
              whiteSpace: "nowrap",
            }}
          >
            Corner Craving
          </span>
        </div>
        <span
          style={{
            fontSize: 12,
            color: COLORS.mint,
            border: "0.5px solid rgba(93,202,165,0.4)",
            borderRadius: 999,
            padding: "6px 12px",
            background: "rgba(93,202,165,0.12)",
            flex: "none",
          }}
        >
          Back by 7pm
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 140,
          zIndex: 4,
          fontFamily: FONTS.body,
          fontSize: 9,
          color: "rgba(255,255,255,0.28)",
        }}
      >
        © OpenStreetMap
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: SAFE_BOTTOM,
          zIndex: 5,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "300%",
            transform: `translateX(${trackX}%)`,
          }}
        >
          {PLACES.map((place, i) => (
            <div key={place.name} style={{ width: "33.333%", padding: "0 12px", boxSizing: "border-box" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 112,
                  padding: 10,
                  overflow: "hidden",
                  borderRadius: 32,
                  border: "0.5px solid rgba(255,255,255,0.15)",
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <Img
                  src={place.img}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 20,
                    flex: "none",
                    objectFit: "cover",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontSize: 14,
                      fontWeight: 600,
                      color: COLORS.text,
                      lineHeight: 1.2,
                      letterSpacing: "-0.02em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {place.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: COLORS.text3,
                      marginTop: 3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {place.meta} · {place.city}
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      display: "inline-block",
                      maxWidth: "100%",
                      fontSize: 8,
                      letterSpacing: "0.08em",
                      color: place.color,
                      background: `${place.color}1F`,
                      borderRadius: 999,
                      padding: "2px 7px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {place.cat}
                  </div>
                </div>
                <div
                  style={{
                    flex: "none",
                    whiteSpace: "nowrap",
                    background: COLORS.mint,
                    color: "#08110D",
                    fontWeight: 600,
                    fontSize: 11,
                    borderRadius: 999,
                    padding: "6px 12px",
                    opacity: i === settled ? 1 : 0.85,
                  }}
                >
                  Let's go
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <IPhoneChrome />
    </AbsoluteFill>
  );
};
