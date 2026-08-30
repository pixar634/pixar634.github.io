import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS } from "../components/SharedStyles";
import { StatusBar } from "../components/StatusBar";
import { IPhoneChrome } from "../components/IPhoneChrome";

export const Weather: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cycle = Math.floor(frame / 60) % 3;
  const modes = ["rain", "sun", "mist"] as const;
  const mode = modes[cycle];

  const data = {
    rain: { loc: "DUDHSAGAR FALLS", icon: "🌧️", temp: 24, cond: "HEAVY RAIN UNTIL 9AM", best: "LEAVE AFTER 10AM — VISIBILITY IMPROVES", bars: [70, 55, 30, 15, 8, 5], color: COLORS.blue },
    sun: { loc: "NANDI HILLS", icon: "☀️", temp: 18, cond: "CLEAR SKIES · PERFECT FOR SUNRISE", best: "LEAVE BY 4:15AM FOR THE 6:04 SUNRISE", bars: [10, 20, 55, 80, 90, 85], color: COLORS.amber },
    mist: { loc: "CHIKMAGALUR", icon: "🌫️", temp: 21, cond: "MISTY RIDGES · LIGHT DRIZZLE", best: "FOG CLEARS BY 8AM — SUMMIT AFTER", bars: [20, 35, 50, 60, 45, 30], color: COLORS.cyan },
  }[mode];

  const tempTarget = data.temp;

  const rainOpacity = mode === "rain" ? 1 : 0;
  const sunOpacity = mode === "sun" ? 1 : 0;
  const mistOpacity = mode === "mist" ? 1 : 0;

  const contentSpring = spring({ frame: frame - cycle * 60, fps, config: { damping: 18, stiffness: 140 } });

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
        <IPhoneChrome status={false} />
        <div
          style={{
            position: "relative",
            flex: 1,
            padding: "18px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* ambient effects */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {mode === "rain" &&
              Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${6 + i * 8}%`,
                    top: -20,
                    width: 2,
                    height: 18,
                    background: "linear-gradient(to bottom, transparent, rgba(93,202,165,0.45), transparent)",
                    opacity: rainOpacity,
                    transform: `translateY(${((frame + i * 7) % 40) * 12}px)`,
                  }}
                />
              ))}
            {mode === "sun" && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 40,
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${COLORS.amber}33 0%, transparent 70%)`,
                  transform: "translateX(-50%)",
                  opacity: sunOpacity,
                }}
              />
            )}
            {mode === "mist" && (
              <div
                style={{
                  position: "absolute",
                  left: -20,
                  right: -20,
                  top: "30%",
                  height: 120,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                  filter: "blur(20px)",
                  opacity: mistOpacity,
                }}
              />
            )}
          </div>

          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 11,
              color: COLORS.text3,
              letterSpacing: "0.12em",
              marginTop: 20,
              marginBottom: 24,
              opacity: contentSpring,
            }}
          >
            {data.loc}
          </div>

          <div
            style={{
              fontSize: 64,
              lineHeight: 1,
              marginBottom: 8,
              filter: `drop-shadow(0 0 20px ${data.color}55)`,
              opacity: contentSpring,
              transform: `translateY(${(1 - contentSpring) * 20}px)`,
            }}
          >
            {data.icon}
          </div>

          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 54,
              fontWeight: 700,
              color: COLORS.text,
              lineHeight: 1,
              marginBottom: 10,
              opacity: contentSpring,
            }}
          >
            {tempTarget}°<span style={{ fontSize: 24, color: COLORS.text3 }}>C</span>
          </div>

          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 11,
              color: data.color,
              letterSpacing: "0.06em",
              marginBottom: 36,
              opacity: contentSpring,
            }}
          >
            {data.cond}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              width: "100%",
              marginBottom: 24,
              opacity: contentSpring,
              transform: `translateY(${(1 - contentSpring) * 20}px)`,
            }}
          >
            {data.bars.map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 14,
                    height: 44,
                    borderRadius: 6,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: `${h}%`,
                      borderRadius: 6,
                      background: `linear-gradient(to top, ${data.color}, ${data.color}66)`,
                      opacity: contentSpring,
                    }}
                  />
                </div>
                <span style={{ fontFamily: FONTS.body, fontSize: 8, color: COLORS.text3, letterSpacing: "0.06em" }}>
                  {["6AM", "8AM", "10AM", "NOON", "2PM", "4PM"][i]}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: 14,
              backgroundColor: "rgba(26,26,31,0.72)",
              border: `1px solid ${COLORS.hairline}`,
              borderRadius: 18,
              opacity: contentSpring,
              transform: `translateY(${(1 - contentSpring) * 20}px)`,
              backdropFilter: "blur(8px)",
            }}
          >
            <span style={{ fontSize: 20 }}>🕐</span>
            <div>
              <div style={{ fontFamily: FONTS.display, fontSize: 13, color: COLORS.text, marginBottom: 2 }}>Best time to leave</div>
              <div style={{ fontFamily: FONTS.body, fontSize: 9, color: COLORS.text3, letterSpacing: "0.06em" }}>{data.best}</div>
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
