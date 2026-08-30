import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { COLORS, FONTS } from "../components/SharedStyles";

/**
 * Fragments — six UI pieces, in pairs, one pair per panel of the landing
 * page's pinned "answers" section (Look around / Pick a hunger / Take people).
 *
 * These are **clones of the shipped web components**, not impressions of them.
 * Every measurement below was read off `lighthouse-frontend/src`:
 *
 *   PeekCard        explore/PeekCard.tsx      112px row, 92px thumb, p-2.5,
 *                                             0.5px white/15, black/55, r16
 *   CategoryRail    explore/CategoryRail.tsx  h-9 pills, r20, 0.5px white/15,
 *                                             black/40; active = mint
 *   Candidate card  trip/TripCandidateCard.tsx r16, p-2.5, 64px thumb r10,
 *                                             winner = mint border + mint/8
 *   Tally bar       trip/VoteTallyBar.tsx     h-1.5 r999, success/warning/danger
 *
 * Tokens come from tailwind.config.js + index.css (lh-sm 10, lh-md 16,
 * lh-pill 20; success #10B981, warning #F59E0B, danger #EF4444) and the
 * category accents from store/canvas.ts (TREK #8FA6C4, LAKE #4FB0C6,
 * DRIVE #E0A458, WATERFALL #7FE3D6).
 *
 * They are separate compositions on purpose: the page floats the two pieces of
 * a pair at different scroll depths to get real parallax, and one flat
 * rectangle cannot parallax against itself.
 *
 * Every background is exactly the page's `--bg` (#0F0F12) so the clip edge
 * disappears into the page — alpha does not survive H.264, and a matching flat
 * is cheaper and more reliable than a webm-alpha path.
 */

const BG = COLORS.bg;

/* Real design tokens, not approximations. */
const R_SM = 10;   // rounded-lh-sm
const R_MD = 16;   // rounded-lh-md
const R_PILL = 20; // rounded-lh-pill
const SUCCESS = "#10B981";
const WARNING = "#F59E0B";
const DANGER = "#EF4444";

/* CATEGORY_ACCENT (store/canvas.ts) */
const TREK = "#8FA6C4";
const LAKE = "#4FB0C6";
const DRIVE = "#E0A458";

/** Real catalog rows — the same places the landing hero already flies to. */
const PLACES = [
  {
    name: "Skandagiri",
    dur: "1h 30m",
    km: "68 km",
    city: "Chikballapur",
    lane: "SUMMIT TREKS",
    accent: TREK,
    img: staticFile("places/skandagiri.jpg"),
    at: { x: 0.62, y: 0.24 },
  },
  {
    name: "Manchanabele",
    dur: "1h 05m",
    km: "40 km",
    city: "Magadi Road",
    lane: "WILD LAKESIDE",
    accent: LAKE,
    img: staticFile("places/manchanabele.jpg"),
    at: { x: 0.26, y: 0.63 },
  },
  {
    name: "Savandurga",
    dur: "57m",
    km: "43 km",
    city: "Magadi",
    lane: "SUMMIT TREKS",
    accent: TREK,
    img: staticFile("places/savandurga.jpg"),
    at: { x: 0.35, y: 0.45 },
  },
];

const HOLD = 50; // frames per card — 150 total, one full rail pass
const activeAt = (frame: number) => Math.floor((frame % (HOLD * PLACES.length)) / HOLD);

/** The real map raster, shared by both map fragments. */
const MapBase: React.FC = () => (
  <>
    <Img
      src={staticFile("maps/blr-dark.jpg")}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: 0.92,
      }}
    />
    <AbsoluteFill
      style={{
        background: "linear-gradient(to bottom, rgba(15,15,18,0.22), rgba(15,15,18,0.70))",
      }}
    />
  </>
);

/** Tier-1 bubble pin: photo + name + duration, exactly as the map draws it. */
const BubblePin: React.FC<{ p: (typeof PLACES)[number] }> = ({ p }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: 5,
      paddingRight: 12,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.72)",
      border: `1px solid ${p.accent}`,
      boxShadow: `0 0 28px -6px ${p.accent}`,
      whiteSpace: "nowrap",
    }}
  >
    <Img src={p.img} style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
    <div>
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.text,
          lineHeight: 1.15,
        }}
      >
        {p.name}
      </div>
      <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.text3 }}>
        {p.dur} · {p.km}
      </div>
    </div>
  </div>
);

const Dot: React.FC = () => (
  <div
    style={{
      width: 9,
      height: 9,
      borderRadius: "50%",
      backgroundColor: "rgba(255,255,255,0.5)",
      border: "1px solid rgba(255,255,255,0.25)",
    }}
  />
);

/* ================================================================== *
 * Panel 1 — "Look around."
 * The map answers before you ask it, and the card walks the answers.
 * ================================================================== */

export const LookMap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = activeAt(frame);
  const local = frame % HOLD;

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <MapBase />
      {PLACES.map((p, i) => {
        const on = i === active;
        // The selected pin is promoted to tier 1 — the same lift S1 does when
        // the rail settles, because the card and the pin read one index (P4).
        const lift = spring({ frame: on ? local : 0, fps, config: { damping: 15, stiffness: 160 } });
        return (
          <div
            key={p.name}
            style={{
              position: "absolute",
              left: `${p.at.x * 100}%`,
              top: `${p.at.y * 100}%`,
              transform: `translate(-50%,-50%) scale(${on ? 0.9 + lift * 0.32 : 0.86})`,
              zIndex: on ? 3 : 1,
            }}
          >
            {on ? <BubblePin p={p} /> : <Dot />}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 22,
          bottom: 18,
          fontFamily: FONTS.body,
          fontSize: 11,
          letterSpacing: "0.22em",
          color: COLORS.text3,
        }}
      >
        WITHIN YOUR RETURN TIME
      </div>
    </AbsoluteFill>
  );
};

/** `explore/PeekCard.tsx`, reproduced at its real measurements. */
const PeekCardClone: React.FC<{ p: (typeof PLACES)[number] }> = ({ p }) => (
  <div
    style={{
      display: "flex",
      height: "100%",
      width: "100%",
      alignItems: "center",
      gap: 12,
      borderRadius: R_MD,
      border: "0.5px solid rgba(255,255,255,0.15)",
      backgroundColor: "#16161A",
      padding: 10,
      boxSizing: "border-box",
    }}
  >
    <div style={{ position: "relative", width: 92, height: 92, flexShrink: 0 }}>
      <Img src={p.img} style={{ width: 92, height: 92, borderRadius: R_SM, objectFit: "cover" }} />
      <div
        style={{
          position: "absolute",
          right: 4,
          bottom: 4,
          borderRadius: 999,
          backgroundColor: "rgba(0,0,0,0.65)",
          padding: "2px 6px",
          fontFamily: FONTS.body,
          fontSize: 9,
          lineHeight: 1,
          color: "rgba(255,255,255,0.9)",
        }}
      >
        {p.km}
      </div>
    </div>

    <div style={{ display: "flex", minWidth: 0, flex: 1, flexDirection: "column", gap: 5 }}>
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: 19,
          fontWeight: 600,
          lineHeight: 1.1,
          color: COLORS.text,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {p.name}
      </div>
      <div style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.text3 }}>
        {p.dur} · {p.city}
      </div>
      <div
        style={{
          width: "fit-content",
          borderRadius: 999,
          padding: "2px 8px",
          fontFamily: FONTS.body,
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: p.accent,
          backgroundColor: `${p.accent}1F`,
        }}
      >
        {p.lane}
      </div>
    </div>

    <div
      style={{
        display: "flex",
        flexShrink: 0,
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
        alignSelf: "flex-end",
      }}
    >
      <div
        style={{
          borderRadius: R_PILL,
          border: "0.5px solid rgba(255,255,255,0.2)",
          backgroundColor: "rgba(255,255,255,0.06)",
          padding: "4px 10px",
          fontFamily: FONTS.body,
          fontSize: 10,
          color: COLORS.text2,
        }}
      >
        See route
      </div>
      <div
        style={{
          borderRadius: R_PILL,
          backgroundColor: COLORS.mint,
          padding: "8px 14px",
          fontFamily: FONTS.body,
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.bg,
        }}
      >
        Let&rsquo;s go
      </div>
    </div>
  </div>
);

export const LookCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const active = activeAt(frame);
  const local = frame % HOLD;

  // The snap rail: cards translate as one strip and settle, which is the real
  // P4 gesture. A crossfade would lose the thing the panel is about.
  const slide = interpolate(local, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  // The strip carries a leading clone of the LAST card, so index i lives at
  // strip position i+1 and the incoming slide for i=0 comes from a real card
  // instead of empty space. Without it the first card of every loop slid in
  // from nothing and the frame was blank for most of its hold.
  const strip = [PLACES[PLACES.length - 1], ...PLACES];
  const offset = -(active + slide) * width;

  return (
    <AbsoluteFill style={{ backgroundColor: BG, justifyContent: "center", overflow: "hidden" }}>
      <div style={{ display: "flex", height: "100%", transform: `translateX(${offset}px)`, willChange: "transform" }}>
        {strip.map((p, i) => (
          <div
            key={`${p.name}-${i}`}
            style={{ width, height: "100%", flexShrink: 0, boxSizing: "border-box" }}
          >
            <PeekCardClone p={p} />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ================================================================== *
 * Panel 2 — "Pick a hunger."  A lane, not a feed.
 * ================================================================== */

/**
 * Real lanes, their real catalog counts (config/places_seed.yaml), and real
 * licensed photographs of places that actually sit in each lane. The backend's
 * collection card carries up to four preview images (`_preview_images`,
 * routers/collections.py), so the clone below shows a stack of three rather
 * than a colour swatch.
 */
const LANES = [
  {
    name: "Summit Treks",
    n: 43,
    accent: TREK,
    imgs: ["places/skandagiri.jpg", "places/makalidurga.jpg", "places/savandurga.jpg"],
  },
  {
    name: "Wild Lakeside",
    n: 67,
    accent: LAKE,
    imgs: ["places/manchanabele.jpg", "places/muthathi.jpg", "places/gundamagere.jpg"],
  },
  {
    name: "Breakfast Runs",
    n: 50,
    accent: DRIVE,
    imgs: ["places/devarayanadurga.jpg", "places/turahalli.jpg", "places/jogimatti.jpg"],
  },
  {
    name: "Night Drives",
    n: 5,
    accent: DRIVE,
    imgs: ["places/rayakottai.jpg", "places/alangayam.jpg", "places/ganalu.jpg"],
  },
];

const LANE_HOLD = 45;

/** `explore/CategoryRail.tsx` — h-9 pills, r20, 0.5px border, mint when on. */
const RailPill: React.FC<{ label: string; on: boolean; accent: string }> = ({ label, on, accent }) => (
  <div
    style={{
      display: "flex",
      height: 36,
      flexShrink: 0,
      alignItems: "center",
      borderRadius: R_PILL,
      padding: "0 12px",
      fontFamily: FONTS.body,
      fontSize: 12,
      whiteSpace: "nowrap",
      color: on ? accent : "rgba(255,255,255,0.65)",
      border: `0.5px solid ${on ? accent : "rgba(255,255,255,0.15)"}`,
      backgroundColor: on ? `${accent}26` : "rgba(0,0,0,0.4)",
    }}
  >
    {label}
  </div>
);

export const HungerRail: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = Math.floor(frame / LANE_HOLD) % LANES.length;
  const lane = LANES[active];

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <MapBase />

      <div style={{ position: "relative", display: "flex", gap: 6, padding: 18, flexWrap: "wrap" }}>
        {LANES.map((l, i) => (
          <RailPill key={l.name} label={l.name} on={i === active} accent={l.accent} />
        ))}
      </div>

      {/* the map refills with that lane only */}
      <div style={{ position: "absolute", inset: 0, top: 78 }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const local = frame - active * LANE_HOLD;
          const pop = spring({
            frame: local - i * 3,
            fps,
            config: { damping: 14, stiffness: 190 },
          });
          const seed = (i * 97 + active * 41) % 100;
          return (
            <div
              key={`${active}-${i}`}
              style={{
                position: "absolute",
                left: `${8 + ((seed * 7) % 82)}%`,
                top: `${6 + ((seed * 13) % 70)}%`,
                width: 10,
                height: 10,
                marginLeft: -5,
                marginTop: -5,
                borderRadius: "50%",
                backgroundColor: lane.accent,
                boxShadow: `0 0 14px ${lane.accent}`,
                transform: `scale(${pop})`,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const HungerCount: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = Math.floor(frame / LANE_HOLD) % LANES.length;
  const lane = LANES[idx];
  const local = frame % LANE_HOLD;

  const inn = interpolate(local, [0, 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(local, [LANE_HOLD - 9, LANE_HOLD], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shown = Math.round(
    interpolate(local, [0, 22], [0, lane.n], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    })
  );

  return (
    <AbsoluteFill
      style={{ backgroundColor: BG }}
    >
      <div
        style={{
          width: "100%",
          padding: 14,
          borderRadius: R_MD,
          border: "0.5px solid rgba(255,255,255,0.15)",
          backgroundColor: "rgba(0,0,0,0.55)",
          opacity: inn * out,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* the collection's own preview stack — real, credited photographs */}
        <div style={{ display: "flex", flexShrink: 0 }}>
          {lane.imgs.map((src, i) => (
            <Img
              key={src}
              src={staticFile(src)}
              style={{
                width: 64,
                height: 64,
                borderRadius: R_SM,
                objectFit: "cover",
                marginLeft: i === 0 ? 0 : -26,
                border: `1.5px solid ${BG}`,
                zIndex: 3 - i,
                position: "relative",
              }}
            />
          ))}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: lane.accent,
              marginBottom: 6,
            }}
          >
            A finite deck
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            <span
              style={{
                fontFamily: FONTS.display,
                fontSize: 30,
                fontWeight: 700,
                color: COLORS.text,
                lineHeight: 1,
              }}
            >
              {shown}
            </span>
            <span
              style={{
                fontFamily: FONTS.display,
                fontSize: 16,
                fontWeight: 600,
                color: COLORS.text2,
              }}
            >
              {lane.name}
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ================================================================== *
 * Panel 3 — "Take people."  One link, they vote, it's decided.
 * ================================================================== */

const CANDIDATES = [
  { p: PLACES[0], yes: 4, maybe: 0, no: 0 },
  { p: PLACES[2], yes: 1, maybe: 2, no: 1 },
  { p: PLACES[1], yes: 0, maybe: 1, no: 3 },
];
const VOTE_LOOP = 165;

/** `trip/VoteTallyBar.tsx` — h-1.5 rounded-full, three semantic segments. */
const TallyBar: React.FC<{ yes: number; maybe: number; no: number; grow: number }> = ({
  yes,
  maybe,
  no,
  grow,
}) => {
  const total = yes + maybe + no || 1;
  return (
    <div
      style={{
        display: "flex",
        height: 6,
        width: "100%",
        overflow: "hidden",
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.1)",
        marginTop: 8,
      }}
    >
      <div style={{ height: "100%", width: `${(yes / total) * 100 * grow}%`, backgroundColor: SUCCESS }} />
      <div style={{ height: "100%", width: `${(maybe / total) * 100 * grow}%`, backgroundColor: WARNING }} />
      <div style={{ height: "100%", width: `${(no / total) * 100 * grow}%`, backgroundColor: DANGER }} />
    </div>
  );
};

/** `trip/TripCandidateCard.tsx` — r16, p-2.5, 64px thumb, winner goes mint. */
const CandidateClone: React.FC<{
  c: (typeof CANDIDATES)[number];
  win: boolean;
  grow: number;
}> = ({ c, win, grow }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      borderRadius: R_MD,
      padding: 10,
      border: `0.5px solid ${win ? COLORS.mint : "rgba(255,255,255,0.15)"}`,
      backgroundColor: win ? "rgba(93,202,165,0.08)" : "rgba(0,0,0,0.45)",
    }}
  >
    <Img
      src={c.p.img}
      style={{ width: 64, height: 64, flexShrink: 0, borderRadius: R_SM, objectFit: "cover" }}
    />
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {win && <span style={{ color: COLORS.mint, fontSize: 13 }}>&#9733;</span>}
        <span
          style={{
            fontFamily: FONTS.display,
            fontSize: 16,
            fontWeight: 600,
            color: COLORS.text,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {c.p.name}
        </span>
      </div>
      <div
        style={{
          marginTop: 4,
          width: "fit-content",
          borderRadius: 999,
          padding: "2px 8px",
          fontFamily: FONTS.body,
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: c.p.accent,
          backgroundColor: `${c.p.accent}1F`,
        }}
      >
        {c.p.lane}
      </div>
      <TallyBar yes={c.yes} maybe={c.maybe} no={c.no} grow={grow} />
    </div>
  </div>
);

export const PeopleVote: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame % VOTE_LOOP;

  return (
    <AbsoluteFill style={{ backgroundColor: BG, padding: 18, justifyContent: "center", gap: 10 }}>
      <div
        style={{
          fontFamily: FONTS.body,
          fontSize: 10,
          letterSpacing: "0.22em",
          color: COLORS.text3,
          marginBottom: 4,
        }}
      >
        WEEKEND NORTH? · 4 VOTED
      </div>
      {CANDIDATES.map((c, i) => {
        const grow = interpolate(t, [16 + i * 12, 60 + i * 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
        return <CandidateClone key={c.p.name} c={c} win={i === 0 && t > 96} grow={grow} />;
      })}
    </AbsoluteFill>
  );
};

export const PeopleInvite: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame % VOTE_LOOP;
  const inn = spring({ frame: t - 12, fps, config: { damping: 15 } });
  const out = interpolate(t, [142, 160], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ backgroundColor: BG }}
    >
      <div
        style={{
          width: "100%",
          padding: 14,
          borderRadius: R_MD,
          border: "0.5px solid rgba(93,202,165,0.32)",
          backgroundColor: "rgba(0,0,0,0.55)",
          opacity: inn * out,
          transform: `translateY(${(1 - inn) * 12}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 10,
            letterSpacing: "0.22em",
            color: COLORS.text3,
            marginBottom: 9,
          }}
        >
          ONE LINK · THEY VOTE
        </div>
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 12.5,
            color: COLORS.mint,
            marginBottom: 12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          letsgolighthouse.co.in/go?to=trip-plan/LH-7F3K2
        </div>
        <div style={{ display: "flex" }}>
          {["#3d5a52", "#4a4257", "#2f4a5c", "#553f3f"].map((c, i) => {
            const pop = spring({
              frame: t - 34 - i * 9,
              fps,
              config: { damping: 12, stiffness: 200 },
            });
            return (
              <div
                key={i}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  backgroundColor: c,
                  border: `2px solid ${BG}`,
                  marginLeft: i === 0 ? 0 : -6,
                  transform: `scale(${pop})`,
                }}
              />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
