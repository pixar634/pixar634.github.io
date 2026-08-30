import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Beam } from "../components/Beam";
import { MapGrid } from "../components/MapGrid";
import { Pin } from "../components/Pin";
import { COLORS, FONTS } from "../components/SharedStyles";
import { IPhoneChrome } from "../components/IPhoneChrome";
import { Typewriter } from "../components/Typewriter";

export const HeroMorph: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const morphStart = 60;
  const morphEnd = 150;
  const morphProgress = interpolate(frame, [morphStart, morphEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const deviceWidth = interpolate(morphProgress, [0, 1], [320, 960]);
  const deviceHeight = interpolate(morphProgress, [0, 1], [690, 620]);
  const deviceRadius = interpolate(morphProgress, [0, 1], [42, 16]);
  const padding = interpolate(morphProgress, [0, 1], [8, 12]);
  const showBrowserChrome = frame > morphStart + 30 ? 1 : 0;

  const titleOpacity = spring({
    frame: frame - 20,
    fps,
    config: { damping: 20, stiffness: 120 },
  });

  const ctaOpacity = spring({
    frame: frame - 90,
    fps,
    config: { damping: 20, stiffness: 120 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <Beam delay={0} />
      <div
        style={{
          width: deviceWidth,
          height: deviceHeight,
          borderRadius: deviceRadius,
          backgroundColor: "#08080A",
          padding,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 50px 120px -40px rgba(0,0,0,0.85)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {showBrowserChrome > 0.5 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 14px",
              opacity: showBrowserChrome,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF5F57" }} />
            <span style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFBD2E" }} />
            <span style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#28C840" }} />
          </div>
        )}
        <div
          style={{
            flex: 1,
            borderRadius: deviceRadius - 4,
            backgroundColor: COLORS.bg,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <MapGrid />
          <Pin x={120} y={260} color={COLORS.mint} delay={40} />
          <Pin x={220} y={340} color={COLORS.aqua} delay={55} />
          <Pin x={180} y={180} color={COLORS.amber} delay={70} />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 220,
              background: "linear-gradient(to top, rgba(15,15,18,0.95), transparent)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              bottom: 28,
              opacity: titleOpacity,
              transform: `translateY(${(1 - titleOpacity) * 20}px)`,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.accent,
                fontSize: 42,
                fontWeight: 700,
                color: COLORS.text,
                lineHeight: 1.05,
                marginBottom: 12,
              }}
            >
              <Typewriter text="What's good this weekend?" frame={frame - 25} speed={2} />
            </div>
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 16,
                color: COLORS.text2,
                marginBottom: 20,
              }}
            >
              Bangalore first. Every escape within a weekend's reach.
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: COLORS.mint,
                color: "#08110D",
                fontFamily: FONTS.body,
                fontWeight: 600,
                fontSize: 14,
                padding: "12px 24px",
                borderRadius: 999,
                opacity: ctaOpacity,
                transform: `translateY(${(1 - ctaOpacity) * 10}px)`,
              }}
            >
              Join waitlist <span style={{ color: "#08110D" }}>→</span>
            </div>
          </div>
          {!showBrowserChrome && <IPhoneChrome />}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          opacity: interpolate(frame, [morphEnd, durationInFrames], [1, 0], {
            extrapolateLeft: "clamp",
          }),
        }}
      >
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: "50%",
            border: `1px solid ${COLORS.mint}22`,
            transform: `scale(${interpolate(frame, [0, durationInFrames], [1, 2.5])})`,
            opacity: interpolate(frame, [0, durationInFrames], [0.8, 0]),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
