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
import { IPhoneChrome, screenInset } from "../components/IPhoneChrome";

/**
 * S5 Search — Return Clock on the collection counts.
 * Full-bleed 390×844, Dynamic Island safe. Matches `/search` CountBasis + CollectionCard.
 *
 * Timeline (30fps, 264 frames ≈ 8.8s): four 2200ms beats, same as
 * landing/main.js clocklist cycle. Each beat: tap the amber horizon,
 * pick the next preset, counts shimmer then rise in.
 */

export const CLOCK_FPS = 30;
export const CLOCK_BEAT = 66;
export const CLOCK_DURATION = CLOCK_BEAT * 4;

const MARK = {
  tapTrigger: 8,
  pickerOpen: 12,
  tapChip: 30,
  pickerClose: 38,
  countIn: 50,
};

const PRESETS = [
  { id: "dark", chip: "Back by dark", trigger: "back by 6:45pm", unbounded: false },
  { id: "midnight", chip: "Back by midnight", trigger: "back by midnight", unbounded: false },
  { id: "overnight", chip: "Overnight", trigger: "overnight", unbounded: false },
  { id: "weekend", chip: "Whole weekend", trigger: "whole weekend", unbounded: true },
] as const;

const CARDS = [
  { title: "Breakfast Runs", blurb: "Out by six, eating by eight, home before it gets hot.", accent: "#E0A458", img: staticFile("places/turahalli.jpg"), n: [15, 32, 40, 40] },
  { title: "Tarmac Therapy", blurb: "Roads worth driving for their own sake.", accent: "#E0A458", img: staticFile("places/manchanabele.jpg"), n: [3, 3, 13, 16] },
  { title: "Corner Craving", blurb: "Ghat sections with enough bends to justify the fuel.", accent: "#E0A458", img: staticFile("places/devarayanadurga.jpg"), n: [1, 2, 11, 11] },
  { title: "Wild Lakeside", blurb: "Backwaters and lake bunds worth three slow hours.", accent: "#4FB0C6", img: staticFile("places/gundamagere.jpg"), n: [13, 18, 40, 40] },
  { title: "Secret Cascades", blurb: "Falls nobody has packaged yet. Most of them need rain.", accent: "#7FE3D6", img: staticFile("places/ganalu.jpg"), n: [1, 2, 25, 29] },
  { title: "Summit Treks", blurb: "Betta climbs that pay out. Start before the rock bakes.", accent: "#8FA6C4", img: staticFile("places/skandagiri.jpg"), n: [5, 9, 40, 40] },
];

function countLabel(n: number) {
  if (!n) return "Nothing in range yet";
  return n + (n === 1 ? " place" : " places");
}

function sentence(idx: number) {
  const p = PRESETS[idx];
  if (p.unbounded) return { before: "Counting everything in range — ", trigger: p.trigger, after: "." };
  return { before: "Counting what you can reach and still be ", trigger: p.trigger, after: "." };
}

const ease = Easing.bezier(0.22, 1, 0.36, 1);

export const ReturnClock: React.FC = () => {
  const frame = useCurrentFrame();
  const t = ((frame % CLOCK_DURATION) + CLOCK_DURATION) % CLOCK_DURATION;
  const idx = Math.floor(t / CLOCK_BEAT);
  const local = t % CLOCK_BEAT;
  const prev = (idx + PRESETS.length - 1) % PRESETS.length;

  const pickerOpen = local >= MARK.pickerOpen && local < MARK.pickerClose;
  const pickerH = interpolate(local, [MARK.pickerOpen, MARK.pickerOpen + 8, MARK.pickerClose, MARK.pickerClose + 8], [0, 104, 104, 0], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pickerOp = interpolate(local, [MARK.pickerOpen, MARK.pickerOpen + 5, MARK.pickerClose, MARK.pickerClose + 5], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const selected = local < MARK.tapChip ? prev : idx;
  const basisIdx = local < MARK.tapChip ? prev : idx;
  const shimmer = local >= MARK.tapChip && local < MARK.countIn;
  const shown = local < MARK.countIn ? prev : idx;
  const reveal = interpolate(local, [MARK.countIn, MARK.countIn + 13], [110, 0], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const revealOp = interpolate(local, [MARK.countIn, MARK.countIn + 13], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tapTrigger = local >= MARK.tapTrigger && local < MARK.tapTrigger + 16;
  const tapChip = local >= MARK.tapChip && local < MARK.tapChip + 16;
  const tapLocal = tapTrigger
    ? local - MARK.tapTrigger
    : tapChip
      ? local - MARK.tapChip
      : 0;
  const tapScale = interpolate(tapLocal, [0, 16], [0.5, 1.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tapOp = interpolate(tapLocal, [0, 16], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const copy = sentence(basisIdx);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: FONTS.body, overflow: "hidden" }}>
      <div style={{ ...screenInset, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div
          style={{
            width: 36,
            height: 36,
            flex: "none",
            borderRadius: 18,
            border: "0.5px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          ‹
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 999,
            border: "0.5px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            padding: "10px 16px",
            color: COLORS.text3,
            fontSize: 14,
          }}
        >
          Search nearby places
        </div>
      </div>

      <div
        style={{
          fontFamily: FONTS.body,
          fontSize: 11,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: COLORS.text3,
          marginBottom: 6,
        }}
      >
        Collections
      </div>
      <p style={{ fontSize: 12, lineHeight: 1.4, color: COLORS.text3, margin: 0, position: "relative" }}>
        {copy.before}
        <span
          style={{
            fontWeight: 500,
            color: pickerOpen ? COLORS.amber : "rgba(224,164,88,0.9)",
            textDecoration: "underline",
            textDecorationStyle: pickerOpen ? "solid" : "dotted",
            textUnderlineOffset: 3,
            textDecorationColor: pickerOpen ? "rgba(224,164,88,0.7)" : "rgba(224,164,88,0.4)",
          }}
        >
          {copy.trigger}
        </span>
        {copy.after}
        {tapTrigger ? (
          <span
            style={{
              position: "absolute",
              left: "72%",
              top: "50%",
              width: 22,
              height: 22,
              margin: "-11px 0 0 -11px",
              borderRadius: 11,
              border: "1.5px solid " + COLORS.mint,
              background: "rgba(93,202,165,0.22)",
              transform: `scale(${tapScale})`,
              opacity: tapOp,
            }}
          />
        ) : null}
      </p>

      <div style={{ overflow: "hidden", height: pickerH, opacity: pickerOp }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, paddingTop: 8 }}>
          {PRESETS.map((p, i) => {
            const on = i === selected;
            const enter = interpolate(local, [MARK.pickerOpen + 1 + i * 1.05, MARK.pickerOpen + 8 + i * 1.05], [0, 1], {
              easing: ease,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={p.id}
                style={{
                  borderRadius: 999,
                  border: on ? "0.5px solid " + COLORS.mint : "0.5px solid rgba(255,255,255,0.15)",
                  background: on ? "rgba(93,202,165,0.1)" : "rgba(255,255,255,0.04)",
                  color: on ? COLORS.mint : COLORS.text2,
                  fontSize: 12,
                  padding: "7px 10px",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  opacity: enter,
                  transform: `translateY(${(1 - enter) * -6}px)`,
                  position: "relative",
                }}
              >
                {p.chip}
                {tapChip && i === idx ? (
                  <span
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: 22,
                      height: 22,
                      margin: "-11px 0 0 -11px",
                      borderRadius: 11,
                      border: "1.5px solid " + COLORS.mint,
                      background: "rgba(93,202,165,0.22)",
                      transform: `scale(${tapScale})`,
                      opacity: tapOp,
                    }}
                  />
                ) : null}
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10, minHeight: 0, flex: 1, overflow: "hidden" }}>
        {CARDS.map((card) => (
          <div
            key={card.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderRadius: 32,
              border: "0.5px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div
              style={{
                width: 112,
                height: 84,
                flex: "none",
                borderRadius: 22,
                overflow: "hidden",
                background: card.accent + "1F",
              }}
            >
              {card.img ? (
                <Img src={card.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : null}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ display: "block", overflow: "hidden", minHeight: 12 }}>
                {shimmer ? (
                  <span
                    style={{
                      display: "block",
                      width: 80,
                      height: 10,
                      margin: "3px 0",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.1)",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      display: "block",
                      fontFamily: FONTS.accent,
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: card.accent,
                      transform: `translateY(${local >= MARK.countIn ? reveal : 0}%)`,
                      opacity: local >= MARK.countIn ? revealOp : 1,
                    }}
                  >
                    {countLabel(card.n[shown])}
                  </span>
                )}
              </span>
              <span
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: 1.15,
                  color: COLORS.text,
                }}
              >
                {card.title}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  color: COLORS.text3,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {card.blurb}
              </span>
            </div>
          </div>
        ))}
      </div>
      </div>
      <IPhoneChrome />
    </AbsoluteFill>
  );
};
