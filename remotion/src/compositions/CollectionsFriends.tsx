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
import { Typewriter } from "../components/Typewriter";

export const CollectionsFriends: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const step1 = spring({ frame: frame - 0, fps, config: { damping: 18, stiffness: 140 } });
  const step2 = spring({ frame: frame - 70, fps, config: { damping: 18, stiffness: 140 } });
  const step3 = spring({ frame: frame - 130, fps, config: { damping: 18, stiffness: 140 } });

  const saved = ["Dudhsagar", "Coorg", "Hampi", "Gokarna", "Chikmagalur", "Wayanad"];
  const colors = [COLORS.aqua, COLORS.blue, COLORS.amber, COLORS.mint, COLORS.cyan, COLORS.aqua];

  const taste = [
    { label: "OFFBEAT", icon: "🏔️", pct: 82 },
    { label: "MISTY", icon: "🌫️", pct: 74 },
    { label: "TREK", icon: "🥾", pct: 68 },
    { label: "MONSOON", icon: "🌧️", pct: 55 },
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
          {/* Saved grid */}
          <div
            style={{
              position: "absolute",
              inset: "18px",
              opacity: step1,
              transform: `translateY(${(1 - step1) * 30}px)`,
              pointerEvents: step1 > 0.5 ? "auto" : "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <div style={{ fontFamily: FONTS.display, fontSize: 18, color: COLORS.text }}>My Collections</div>
              <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.mint, letterSpacing: "0.06em" }}>24 SAVED PLACES</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {saved.map((name, i) => (
                <div
                  key={name}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${colors[i]}22, ${colors[i]}44)`,
                    position: "relative",
                    overflow: "hidden",
                    opacity: frame > 10 + i * 8 ? 1 : 0,
                    transform: `scale(${frame > 10 + i * 8 ? 1 : 0.9})`,
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 6,
                      right: 6,
                      bottom: 6,
                      fontFamily: FONTS.body,
                      fontSize: 9,
                      fontWeight: 600,
                      color: COLORS.text,
                    }}
                  >
                    {name}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 12,
                backgroundColor: "rgba(26,26,31,0.72)",
                border: `1px solid ${COLORS.hairline}`,
                borderRadius: 16,
              }}
            >
              <span style={{ color: COLORS.mint, fontSize: 16 }}>✦</span>
              <span style={{ fontFamily: FONTS.body, fontSize: 9, color: COLORS.text3, letterSpacing: "0.06em" }}>
                TOP CATEGORY: WATERFALLS · UPDATED 2 MIN AGO
              </span>
            </div>
          </div>

          {/* Taste profile */}
          <div
            style={{
              position: "absolute",
              inset: "18px",
              opacity: step2,
              transform: `translateY(${(1 - step2) * 30}px)`,
              pointerEvents: step2 > 0.5 ? "auto" : "none",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: COLORS.mint,
                letterSpacing: "0.14em",
                marginBottom: 14,
              }}
            >
              LEARNING YOUR TASTE
            </div>
            <GlassCard style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>🏔️</span>
              <span style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.text3, letterSpacing: "0.06em" }}>
                TOP VIBE: <strong style={{ color: COLORS.mint }}>OFFBEAT</strong> · FROM 24 SAVES
              </span>
            </GlassCard>
            {taste.map((t, i) => {
              const w = Math.max(0, Math.min(t.pct, (frame - (85 + i * 10)) * 4));
              return (
                <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, width: 20 }}>{t.icon}</span>
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 9,
                      color: COLORS.text3,
                      letterSpacing: "0.08em",
                      width: 70,
                    }}
                  >
                    {t.label}
                  </span>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${w}%`,
                        borderRadius: 3,
                        backgroundColor: COLORS.mint,
                      }}
                    />
                  </div>
                  <span style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.mint, width: 32, textAlign: "right" }}>
                    {w}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Suggestion + friends */}
          <div
            style={{
              position: "absolute",
              inset: "18px",
              opacity: step3,
              transform: `translateY(${(1 - step3) * 30}px)`,
              pointerEvents: step3 > 0.5 ? "auto" : "none",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: COLORS.mint,
                letterSpacing: "0.14em",
                marginBottom: 14,
              }}
            >
              TAP FOR A SUGGESTION
            </div>
            <GlassCard style={{ marginBottom: 14 }} accent={COLORS.mintDim}>
              <div style={{ fontFamily: FONTS.body, fontSize: 9, color: COLORS.mint, letterSpacing: "0.06em", marginBottom: 4 }}>
                96% MATCH
              </div>
              <div style={{ fontFamily: FONTS.display, fontSize: 18, color: COLORS.text, marginBottom: 4 }}>Kudremukh Trek</div>
              <div style={{ fontFamily: FONTS.body, fontSize: 9, color: COLORS.text3, letterSpacing: "0.06em" }}>
                MISTY · TREK · OFFBEAT
              </div>
            </GlassCard>
            <button
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 999,
                border: `1px solid ${COLORS.hairline}`,
                backgroundColor: "rgba(26,26,31,0.72)",
                color: COLORS.text,
                fontFamily: FONTS.body,
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span>🎲</span> Surprise me
            </button>

            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 10,
                color: COLORS.text3,
                letterSpacing: "0.14em",
                marginBottom: 10,
              }}
            >
              FRIENDS (5)
            </div>
            {[
              { name: "Anaya", collections: 2 },
              { name: "Rohit", collections: 1 },
              { name: "Meera", collections: 0 },
            ].map((f, i) => (
              <div
                key={f.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  backgroundColor: "rgba(26,26,31,0.55)",
                  border: `1px solid ${COLORS.hairline}`,
                  borderRadius: 14,
                  marginBottom: 8,
                  opacity: frame > 150 + i * 10 ? 1 : 0.5,
                  transform: `translateX(${frame > 150 + i * 10 ? 0 : -20}px)`,
                  transition: "all 0.25s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: "rgba(93,202,165,0.18)",
                      color: COLORS.mint,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: FONTS.display,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {f.name[0]}
                  </div>
                  <span style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.text }}>{f.name}</span>
                </div>
                <span style={{ fontFamily: FONTS.body, fontSize: 9, color: COLORS.text3, letterSpacing: "0.06em" }}>
                  {f.collections} public collection{f.collections !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
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
