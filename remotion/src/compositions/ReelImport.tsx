import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GlassCard } from "../components/GlassCard";
import { MapGrid } from "../components/MapGrid";
import { Pin } from "../components/Pin";
import { COLORS, FONTS } from "../components/SharedStyles";
import { StatusBar } from "../components/StatusBar";
import { IPhoneChrome } from "../components/IPhoneChrome";
import { Typewriter } from "../components/Typewriter";

export const ReelImport: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reelOpacity = interpolate(frame, [0, 20, 70, 90], [1, 1, 1, 0]);
  const shareTap = spring({ frame: frame - 35, fps, config: { damping: 10, stiffness: 300 } });

  const pasteOpacity = spring({ frame: frame - 80, fps, config: { damping: 16, stiffness: 140 } });
  const pasteProgress = interpolate(frame, [80, 120], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const resultOpacity = spring({ frame: frame - 130, fps, config: { damping: 16, stiffness: 140 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ ...phoneBodyStyle }}>
        <StatusBar />
        <IPhoneChrome status={false} />
        <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
          <MapGrid />

          {/* Reel overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(160deg, #1c332c, #0a1210)",
              opacity: reelOpacity,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: 18,
            }}
          >
            <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text, marginBottom: 24 }}>
              <strong style={{ display: "block", fontSize: 13, marginBottom: 4 }}>@wildkarnataka</strong>
              hidden waterfall near Bangalore #travel #karnataka
            </div>
            <div
              style={{
                alignSelf: "flex-end",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginBottom: 8,
              }}
            >
              {["♡", "💬", "↗", "⋮"].map((icon, i) => (
                <span
                  key={icon}
                  style={{
                    fontSize: 18,
                    color: COLORS.text,
                    transform: i === 2 ? `scale(${1 + shareTap * 0.35})` : "none",
                    opacity: i === 2 ? 1 : 0.85,
                  }}
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>

          {/* Paste sheet */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 18,
              opacity: pasteOpacity,
              transform: `translateY(${(1 - pasteOpacity) * 30}px)`,
            }}
          >
            <GlassCard style={{ width: "100%" }} accent={COLORS.mintDim}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ color: COLORS.mint, fontSize: 20 }}>✦</span>
                <div>
                  <div style={{ fontFamily: FONTS.display, fontSize: 13, color: COLORS.text, marginBottom: 2 }}>
                    Paste the reel you copied?
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.text3, letterSpacing: "0.12em" }}>
                    DETECTING LINK…
                  </div>
                </div>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pasteProgress}%`,
                    backgroundColor: COLORS.mint,
                    borderRadius: 2,
                  }}
                />
              </div>
            </GlassCard>
          </div>

          {/* Result */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: resultOpacity,
              transform: `translateY(${(1 - resultOpacity) * 30}px)`,
              padding: "14px 18px 18px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(26,26,31,0.72)",
                border: `1px solid ${COLORS.hairline}`,
                borderRadius: 18,
                padding: "10px 14px",
                marginBottom: 10,
                backdropFilter: "blur(8px)",
              }}
            >
              <span style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text2 }}>
                <Typewriter text="waterfalls near me…" frame={frame - 130} speed={2} />
              </span>
              <span style={{ color: COLORS.mint, fontSize: 14 }}>✦</span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 8,
              }}
            >
              {["Falls", "Treks", "Lakes", "Drives"].map((p, i) => (
                <span
                  key={p}
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    borderRadius: 999,
                    backgroundColor: i === 0 ? COLORS.mint : "rgba(255,255,255,0.06)",
                    color: i === 0 ? "#08110D" : COLORS.text3,
                    border: `1px solid ${i === 0 ? COLORS.mint : COLORS.hairline}`,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
            <div style={{ position: "relative", flex: 1, borderRadius: 18, overflow: "hidden" }}>
              <MapGrid />
              <Pin x={40} y={80} color={COLORS.text3} delay={140} ring={false} />
              <Pin x={70} y={45} color={COLORS.amber} delay={155} />
              <Pin x={85} y={22} color={COLORS.mint} delay={170} />
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                <path
                  d="M40,80 Q55,52 70,45 T85,22"
                  fill="none"
                  stroke={COLORS.mint}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray={180}
                  strokeDashoffset={Math.max(0, 180 - (frame - 150) * 6)}
                />
              </svg>
            </div>
            <div
              style={{
                marginTop: 10,
                padding: 14,
                backgroundColor: "rgba(26,26,31,0.72)",
                border: `1px solid ${COLORS.mintDim}`,
                borderRadius: 18,
                backdropFilter: "blur(8px)",
              }}
            >
              <div style={{ fontFamily: FONTS.display, fontSize: 16, color: COLORS.text, marginBottom: 4 }}>Dudhsagar Falls</div>
              <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.mint, letterSpacing: "0.06em", marginBottom: 8 }}>
                🚗 8H DRIVE · ₹2,500 · MONSOON ✦
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 9, color: COLORS.text3, letterSpacing: "0.1em" }}>
                VIA THAT REEL YOU SAVED
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const phoneBodyStyle: React.CSSProperties = {
  width: 320,
  height: 690,
  borderRadius: 52,
  backgroundColor: "#08080A",
  padding: 10,
  boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 50px 120px -40px rgba(0,0,0,0.85)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  position: "relative",
};
