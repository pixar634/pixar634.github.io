import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MapGrid } from "../components/MapGrid";
import { Pin } from "../components/Pin";
import { COLORS, FONTS } from "../components/SharedStyles";
import { StatusBar } from "../components/StatusBar";
import { IPhoneChrome } from "../components/IPhoneChrome";
import { Typewriter } from "../components/Typewriter";

export const AiScout: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const queryOpacity = spring({ frame: frame - 0, fps, config: { damping: 18, stiffness: 140 } });
  const typeFrame = frame - 20;
  const zoomProgress = interpolate(frame, [70, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cardOpacity = spring({ frame: frame - 120, fps, config: { damping: 18, stiffness: 140 } });

  const pins = [
    { x: 30, y: 74, color: COLORS.text3 },
    { x: 46, y: 16, color: COLORS.text3 },
    { x: 60, y: 30, color: COLORS.text3 },
    { x: 40, y: 88, color: COLORS.text3 },
    { x: 78, y: 78, color: COLORS.text3 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={phoneBodyStyle}>
        <StatusBar />
        <div
          style={{
            position: "relative",
            flex: 1,
            padding: "14px 18px 18px",
            overflow: "hidden",
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
              opacity: queryOpacity,
              transform: `translateY(${(1 - queryOpacity) * 20}px)`,
            }}
          >
            <span style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text2 }}>
              <Typewriter text="somewhere misty to trek this weekend" frame={typeFrame} speed={2} />
            </span>
            <span style={{ color: COLORS.mint, fontSize: 14 }}>✦</span>
          </div>

          <div
            style={{
              position: "relative",
              flex: 1,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `scale(${1 + zoomProgress * 1.5})`,
                transformOrigin: "34% 52%",
              }}
            >
              <MapGrid />
              {pins.map((p, i) => (
                <Pin key={i} x={`${p.x}%`} y={`${p.y}%`} color={p.color} delay={i * 4} ring={false} />
              ))}
              <Pin x="34%" y="52%" color={COLORS.mint} delay={80} />
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              padding: 14,
              backgroundColor: "rgba(26,26,31,0.72)",
              border: `1px solid ${COLORS.mintDim}`,
              borderRadius: 18,
              opacity: cardOpacity,
              transform: `translateY(${(1 - cardOpacity) * 20}px)`,
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ fontFamily: FONTS.display, fontSize: 17, color: COLORS.text, marginBottom: 4 }}>Chikmagalur</div>
            <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.mint, letterSpacing: "0.06em", marginBottom: 8 }}>
              🥾 5H DRIVE · MULLAYANAGIRI TREK
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 9, color: COLORS.text3, letterSpacing: "0.1em" }}>
              LEAVE BY 5:00AM · MISTY RIDGES
            </div>
            <div
              style={{
                marginTop: 10,
                textAlign: "center",
                padding: "10px",
                borderRadius: 999,
                backgroundColor: COLORS.mint,
                color: "#08110D",
                fontFamily: FONTS.body,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              Let's go →
            </div>
          </div>
        </div>
        <IPhoneChrome status={false} />
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
