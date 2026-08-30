import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GlassCard } from "../components/GlassCard";
import { COLORS, FONTS } from "../components/SharedStyles";

export const ProUpgrade: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isAnnual = frame > 80;
  const price = isAnnual ? "₹999" : "₹149";
  const period = isAnnual ? "/ YEAR" : "/ MONTH";
  const strike = isAnnual ? "₹1,999" : "₹199";

  const cardReveal = spring({ frame: frame - 0, fps, config: { damping: 18, stiffness: 140 } });
  const toggle = spring({ frame: frame - 60, fps, config: { damping: 20, stiffness: 160 } });

  const explorerFeatures = [
    { yes: true, text: "Unlimited weekend discovery" },
    { yes: true, text: "Save up to 10 places" },
    { yes: true, text: "AI Scout — 10 queries/day" },
    { yes: true, text: "How-to-reach on every place" },
    { yes: false, text: "Unlimited saves & collections" },
    { yes: false, text: "Unlimited trip plans" },
  ];

  const proFeatures = [
    "Everything in Explorer",
    "Unlimited saves & collections",
    "AI Scout — 50 queries/day",
    "AI personal suggestions, on tap",
    "Full place briefs — budget, tips, warnings",
    "Unlimited trip plans",
    "Offline trip packs",
    "Zero ads, ever",
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 20, transform: "scale(0.92)" }}>
        {/* Explorer */}
        <GlassCard
          style={{
            width: 260,
            height: 420,
            display: "flex",
            flexDirection: "column",
            opacity: cardReveal,
            transform: `translateY(${(1 - cardReveal) * 30}px)`,
          }}
        >
          <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.text3, letterSpacing: "0.18em", marginBottom: 12 }}>
            EXPLORER
          </div>
          <div style={{ fontFamily: FONTS.display, fontSize: 44, fontWeight: 700, color: COLORS.text, lineHeight: 1, marginBottom: 4 }}>
            ₹0
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.text3, letterSpacing: "0.08em", marginBottom: 18 }}>
            FOREVER FREE
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.text2, marginBottom: 18 }}>
            Everything you need for weekend discovery.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {explorerFeatures.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    backgroundColor: f.yes ? COLORS.mintDim : "rgba(255,255,255,0.05)",
                    color: f.yes ? COLORS.mint : COLORS.text3,
                  }}
                >
                  {f.yes ? "✓" : "×"}
                </span>
                <span style={{ fontFamily: FONTS.body, fontSize: 12, color: f.yes ? COLORS.text2 : COLORS.text3 }}>{f.text}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 16,
              textAlign: "center",
              padding: "12px",
              borderRadius: 999,
              border: `1px solid ${COLORS.hairline}`,
              color: COLORS.text,
              fontFamily: FONTS.body,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Get started
          </div>
        </GlassCard>

        {/* Pro */}
        <GlassCard
          accent={COLORS.mintDim}
          style={{
            width: 280,
            height: 460,
            display: "flex",
            flexDirection: "column",
            opacity: cardReveal,
            transform: `translateY(${(1 - cardReveal) * 30}px) scale(1.05)`,
            borderColor: COLORS.mintDim,
            boxShadow: `0 30px 90px -40px ${COLORS.mint}33`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -12,
              left: 24,
              backgroundColor: COLORS.mint,
              color: "#08110D",
              fontFamily: FONTS.body,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "5px 12px",
              borderRadius: 999,
            }}
          >
            MOST POPULAR
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.mint, letterSpacing: "0.18em", marginBottom: 12 }}>
            LIGHTHOUSE PRO
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <span
              style={{
                fontFamily: FONTS.body,
                fontSize: 18,
                color: COLORS.text3,
                textDecoration: "line-through",
                textDecorationColor: COLORS.amber,
                textDecorationThickness: 2,
              }}
            >
              {strike}
            </span>
            <span style={{ fontFamily: FONTS.display, fontSize: 46, fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>
              {price}
            </span>
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.text3, letterSpacing: "0.08em", marginBottom: 18 }}>
            {period}
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.text2, marginBottom: 18 }}>
            For the friend who actually organizes the trips.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {proFeatures.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    backgroundColor: COLORS.mintDim,
                    color: COLORS.mint,
                  }}
                >
                  ✓
                </span>
                <span style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text2 }}>{f}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 16,
              textAlign: "center",
              padding: "12px",
              borderRadius: 999,
              backgroundColor: COLORS.mint,
              color: "#08110D",
              fontFamily: FONTS.body,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Go Pro
          </div>
        </GlassCard>
      </div>

      {/* Toggle */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          backgroundColor: "rgba(26,26,31,0.72)",
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 999,
          padding: 4,
          opacity: toggle,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            width: 150,
            height: 36,
            borderRadius: 999,
            backgroundColor: COLORS.mint,
            transform: `translateX(${interpolate(frame, [60, 90], [0, 150], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
            transition: "transform 0.3s",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: 150,
            textAlign: "center",
            padding: "10px 0",
            fontFamily: FONTS.body,
            fontSize: 12,
            fontWeight: 600,
            color: frame < 80 ? "#08110D" : COLORS.text3,
          }}
        >
          Monthly
        </div>
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: 150,
            textAlign: "center",
            padding: "10px 0",
            fontFamily: FONTS.body,
            fontSize: 12,
            fontWeight: 600,
            color: frame >= 80 ? "#08110D" : COLORS.text3,
          }}
        >
          Annual <span style={{ fontSize: 9, color: frame >= 80 ? "#08110D" : COLORS.amber }}>SAVE 44%</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
