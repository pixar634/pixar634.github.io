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

export const Radar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scanOpacity = spring({ frame: frame - 0, fps, config: { damping: 18, stiffness: 140 } });
  const detectOpacity = spring({ frame: frame - 80, fps, config: { damping: 18, stiffness: 140 } });

  const sweepAngle = interpolate(frame, [0, 180], [0, 720], { extrapolateLeft: "clamp" });

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
        <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
          <MapGrid />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 360,
              height: 360,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              border: `1px solid ${COLORS.mint}22`,
              opacity: scanOpacity,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: `conic-gradient(from ${sweepAngle}deg, transparent 70%, ${COLORS.mint}33 100%)`,
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: COLORS.mint,
              boxShadow: `0 0 24px 8px ${COLORS.mint}66`,
              transform: "translate(-50%, -50%)",
            }}
          />

          <Pin x="62%" y="30%" color={COLORS.mint} delay={40} />
          <Pin x="30%" y="56%" color={COLORS.mint} delay={55} />
          <Pin x="70%" y="70%" color={COLORS.amber} delay={70} />

          <div
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              bottom: 18,
              opacity: detectOpacity,
              transform: `translateY(${(1 - detectOpacity) * 30}px)`,
              padding: 16,
              backgroundColor: "rgba(26,26,31,0.72)",
              borderLeft: `2px solid ${COLORS.amber}`,
              borderRadius: 18,
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ fontFamily: FONTS.display, fontSize: 15, color: COLORS.text, marginBottom: 4 }}>
              4-day weekend detected
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.amber, letterSpacing: "0.06em" }}>
              OCT 17–20 · 6 PLACES FIT · TAP TO PLAN
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
