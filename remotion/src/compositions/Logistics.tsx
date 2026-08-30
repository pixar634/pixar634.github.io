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
import { StatusBar } from "../components/StatusBar";
import { IPhoneChrome } from "../components/IPhoneChrome";

export const Logistics: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ frame: frame - 0, fps, config: { damping: 18, stiffness: 140 } });
  const splitReveal = spring({ frame: frame - 60, fps, config: { damping: 18, stiffness: 140 } });
  const handoffReveal = spring({ frame: frame - 130, fps, config: { damping: 18, stiffness: 140 } });

  const options = [
    { icon: "🚗", title: "Two hatchbacks", total: 5600, perHead: 1120, seats: 5, count: 2 },
    { icon: "🚐", title: "One 7-seater", total: 7200, perHead: 1200, seats: 6, count: 1 },
    { icon: "🏍️", title: "Three bikes", total: 1800, perHead: 300, seats: 2, count: 3 },
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
        <IPhoneChrome status={false} />
        <div
          style={{
            position: "relative",
            flex: 1,
            padding: "18px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              opacity: reveal,
              transform: `translateY(${(1 - reveal) * 20}px)`,
              marginBottom: 18,
            }}
          >
            <div style={{ fontFamily: FONTS.display, fontSize: 22, color: COLORS.text, marginBottom: 4 }}>
              Coorg it is.
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.text3, letterSpacing: "0.08em" }}>
              6 FRIENDS · FINALIZED NOW
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginBottom: 18,
              opacity: reveal,
              transform: `translateY(${(1 - reveal) * 20}px)`,
            }}
          >
            {["A", "R", "S", "K", "D", "M"].map((l, i) => (
              <div
                key={l}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONTS.display,
                  fontSize: 12,
                  color: COLORS.text,
                  backgroundColor: "rgba(26,26,31,0.72)",
                  border: `1px solid ${i === 0 ? COLORS.amber : COLORS.mint}`,
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: 6 - i,
                }}
              >
                {l}
              </div>
            ))}
          </div>

          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 10,
              color: COLORS.mint,
              letterSpacing: "0.14em",
              marginBottom: 12,
              opacity: splitReveal,
            }}
          >
            SPLIT THE RIDE
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
            {options.map((opt, i) => {
              const optReveal = spring({ frame: frame - (70 + i * 12), fps, config: { damping: 18, stiffness: 140 } });
              return (
                <GlassCard
                  key={opt.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    opacity: optReveal,
                    transform: `translateY(${(1 - optReveal) * 20}px)`,
                    borderColor: i === 1 ? COLORS.mintDim : COLORS.hairline,
                  }}
                  accent={i === 1 ? COLORS.mintDim : COLORS.hairline}
                >
                  <span style={{ fontSize: 26 }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONTS.display, fontSize: 14, color: COLORS.text, marginBottom: 2 }}>
                      {opt.title}
                    </div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 9, color: COLORS.text3, letterSpacing: "0.06em" }}>
                      {opt.count} vehicle{opt.count > 1 ? "s" : ""} · {opt.seats} seats
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: FONTS.display, fontSize: 16, color: COLORS.text }}>₹{opt.perHead}</div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 9, color: COLORS.text3 }}>per head</div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          <div
            style={{
              opacity: handoffReveal,
              transform: `translateY(${(1 - handoffReveal) * 20}px)`,
              padding: 14,
              backgroundColor: "rgba(26,26,31,0.72)",
              border: `1px solid ${COLORS.amberDim}`,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backdropFilter: "blur(8px)",
            }}
          >
            <div>
              <div style={{ fontFamily: FONTS.display, fontSize: 13, color: COLORS.text, marginBottom: 2 }}>
                Send to the group
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 9, color: COLORS.text3, letterSpacing: "0.06em" }}>
                One booking link per driver
              </div>
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: COLORS.amber,
                color: "#241505",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              ↗
            </div>
          </div>

          <div
            style={{
              marginTop: "auto",
              fontFamily: FONTS.body,
              fontSize: 8,
              color: COLORS.text3,
              letterSpacing: "0.06em",
              textAlign: "center",
              opacity: handoffReveal,
            }}
          >
            Rates are indicative · computed from real distance
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
