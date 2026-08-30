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
import { IPhoneChrome, SAFE_BOTTOM, SAFE_TOP } from "../components/IPhoneChrome";

/**
 * Trip plan, end to end — Saved → create sheet → trip → invite →
 * WhatsApp to six people → live vote → organizer finalize.
 * Full-bleed 390×844. Matches `/saved` + CreateTripSheet + `/trip/:code`
 * + InviteShareSheet + FinalizeBar.
 *
 * Timeline (30fps, 510 frames ≈ 17s), same numbers as landing/main.js.
 */

const SUCCESS = "#10B981";
const WARNING = "#F59E0B";
const DANGER = "#EF4444";
const TITLE = "Weekend north?";
const CODE = "LH-7F3K2";

export const FLOW = {
  saved: [0, 36],
  create: [36, 150],
  trip: [150, 200],
  invite: [200, 258],
  chat: [258, 338],
  vote: [338, 430],
  final: [430, 510],
} as const;

const CANDIDATES = [
  {
    name: "Skandagiri",
    cat: "trek",
    yes: 5,
    maybe: 1,
    no: 0,
    vote: "yes" as const,
    img: staticFile("places/skandagiri.jpg"),
  },
  {
    name: "Makalidurga",
    cat: "trek",
    yes: 2,
    maybe: 3,
    no: 1,
    vote: "maybe" as const,
    img: staticFile("places/makalidurga.jpg"),
  },
  {
    name: "Savandurga",
    cat: "trek",
    yes: 1,
    maybe: 1,
    no: 3,
    vote: "no" as const,
    img: staticFile("places/savandurga.jpg"),
  },
];

const MEMBERS = ["A", "R", "S", "K", "D", "M"];
const CHAT_JOINS = ["Rohan", "Samira", "Kabir", "Diya", "Mira"];

function inRange(frame: number, range: readonly [number, number]) {
  return frame >= range[0] && frame < range[1];
}

function typed(frame: number, start: number, end: number, text: string) {
  const n = interpolate(frame, [start, end], [0, text.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return text.slice(0, Math.round(n));
}

function selectedCount(frame: number) {
  if (frame < 70) return 0;
  if (frame < 95) return 1;
  if (frame < 118) return 2;
  return 3;
}

function tallyAt(local: number, yes: number, maybe: number, no: number) {
  const t = interpolate(local, [12, 70], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return {
    yes: Math.round(yes * t),
    maybe: Math.round(maybe * t),
    no: Math.round(no * t),
  };
}

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const IconShare = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconCheck = ({ color = "currentColor" }: { color?: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4">
    <path d="M5 12l5 5L20 7" />
  </svg>
);
const IconTrophy = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.mint} strokeWidth="1.75">
    <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 01-10 0V4z" />
    <path d="M7 6H4a3 3 0 003 6M17 6h3a3 3 0 01-3 6" />
  </svg>
);
const IconFlag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.amber} strokeWidth="1.75">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1v16" />
  </svg>
);

const Tap: React.FC<{ x: string; y: string; on: boolean }> = ({ x, y, on }) => (
  <span
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 22,
      height: 22,
      marginLeft: -11,
      marginTop: -11,
      borderRadius: 11,
      border: `1.5px solid ${COLORS.mint}`,
      background: "rgba(93,202,165,0.22)",
      opacity: on ? 1 : 0,
      transform: on ? "scale(1)" : "scale(0.4)",
      zIndex: 8,
    }}
  />
);

const RoundBtn: React.FC<{ children: React.ReactNode; hot?: boolean }> = ({ children, hot }) => (
  <span
    style={{
      width: 36,
      height: 36,
      borderRadius: 18,
      border: `0.5px solid ${hot ? COLORS.mint : "rgba(255,255,255,0.15)"}`,
      background: hot ? "rgba(93,202,165,0.18)" : "rgba(255,255,255,0.06)",
      color: hot ? COLORS.mint : COLORS.text2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none",
    }}
  >
    {children}
  </span>
);

const CoverCard: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div
    style={{
      position: "relative",
      borderRadius: 14,
      overflow: "hidden",
      border: "0.5px solid rgba(255,255,255,0.1)",
      aspectRatio: compact ? "1.6" : "1.9",
    }}
  >
    <Img src={CANDIDATES[0].img} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(6,7,8,0.92) 0%, rgba(6,7,8,0.2) 55%, rgba(6,7,8,0.4) 100%)",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <span style={{ fontSize: 9, letterSpacing: "0.22em", color: COLORS.mint }}>LIGHTHOUSE · 3 VOTING</span>
      <span style={{ fontFamily: FONTS.display, fontSize: compact ? 16 : 18, fontWeight: 600, color: COLORS.text }}>
        {TITLE}
      </span>
    </div>
  </div>
);

const SavedScene: React.FC<{ frame: number }> = ({ frame }) => {
  const tap = frame >= 18 && frame < 32;
  return (
    <div style={{ padding: `${SAFE_TOP}px 16px ${SAFE_BOTTOM}px`, height: "100%", boxSizing: "border-box", position: "relative" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.28em", color: COLORS.text3, marginBottom: 6 }}>SAVED</div>
      <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.text, marginBottom: 18 }}>
        Your places
      </div>
      {CANDIDATES.map((c) => (
        <div
          key={c.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 0",
            borderTop: "0.5px solid rgba(255,255,255,0.08)",
          }}
        >
          <Img src={c.img} style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} />
          <span style={{ flex: 1, fontSize: 13, color: COLORS.text }}>{c.name}</span>
          <span style={{ color: COLORS.mint, fontSize: 12 }}>🔖</span>
        </div>
      ))}
      <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.22em", color: COLORS.text3 }}>TRIPS</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            letterSpacing: "0.14em",
            color: COLORS.mint,
            background: tap ? "rgba(93,202,165,0.16)" : "transparent",
            borderRadius: 999,
            padding: "4px 8px",
          }}
        >
          <IconPlus /> START A TRIP PLAN
        </span>
      </div>
      <p style={{ marginTop: 10, fontSize: 12, color: COLORS.text3, lineHeight: 1.45 }}>
        Shortlist a few saved places and vote on where to go with friends.
      </p>
      <Tap x="82%" y="62%" on={tap} />
    </div>
  );
};

const CreateScene: React.FC<{ frame: number }> = ({ frame }) => {
  const n = selectedCount(frame);
  const title = typed(frame, 44, 88, TITLE);
  const tapCreate = frame >= 136 && frame < 148;
  const can = title.trim().length > 0 && n >= 2;
  return (
    <div style={{ padding: `${SAFE_TOP}px 16px ${SAFE_BOTTOM}px`, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 600, color: COLORS.text }}>Start a trip plan</span>
        <RoundBtn>
          <IconX />
        </RoundBtn>
      </div>
      <div
        style={{
          borderRadius: 10,
          border: `0.5px solid ${title ? COLORS.mint : "rgba(255,255,255,0.12)"}`,
          background: COLORS.surface,
          padding: "10px 12px",
          fontSize: 15,
          color: title ? COLORS.text : "#6B7280",
          minHeight: 42,
        }}
      >
        {title || "e.g. Weekend near Coorg?"}
        {frame >= 44 && frame < 88 ? (
          <span style={{ display: "inline-block", width: 1, height: 14, background: COLORS.mint, marginLeft: 2 }} />
        ) : null}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", margin: "14px 0 8px", fontSize: 11, letterSpacing: "0.16em", color: COLORS.text3 }}>
        <span>PICK 2–5 PLACES</span>
        <span>{n}/5</span>
      </div>
      {CANDIDATES.map((c, i) => {
        const on = i < n;
        const just = (i === 0 && frame >= 70 && frame < 82) || (i === 1 && frame >= 95 && frame < 107) || (i === 2 && frame >= 118 && frame < 130);
        return (
          <div
            key={c.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 8,
              marginBottom: 8,
              borderRadius: 10,
              border: `0.5px solid ${on ? "rgba(93,202,165,0.7)" : "rgba(255,255,255,0.12)"}`,
              background: on ? "rgba(93,202,165,0.08)" : "rgba(255,255,255,0.03)",
              transform: just ? "scale(0.98)" : "scale(1)",
            }}
          >
            <Img src={c.img} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} />
            <span style={{ flex: 1, fontSize: 13, color: COLORS.text }}>{c.name}</span>
            {on ? (
              <span style={{ width: 20, height: 20, borderRadius: 10, background: COLORS.mint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconCheck color="#08110D" />
              </span>
            ) : null}
          </div>
        );
      })}
      <div
        style={{
          marginTop: "auto",
          borderRadius: 999,
          background: COLORS.mint,
          color: "#08110D",
          textAlign: "center",
          padding: "12px 16px",
          fontWeight: 600,
          fontSize: 14,
          opacity: can ? 1 : 0.4,
          transform: tapCreate ? "scale(0.97)" : "scale(1)",
        }}
      >
        Create trip plan
      </div>
    </div>
  );
};

const TripHead: React.FC<{ shareHot?: boolean }> = ({ shareHot }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
    <RoundBtn>
      <IconX />
    </RoundBtn>
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: COLORS.text3 }}>Trip plan</div>
      <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.text }}>{TITLE}</div>
    </div>
    <RoundBtn hot={shareHot}>
      <IconShare />
    </RoundBtn>
  </div>
);

const Crew: React.FC<{ count: number; extra?: string }> = ({ count, extra }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
    <div style={{ display: "flex" }}>
      {MEMBERS.slice(0, Math.max(1, count)).map((m, i) => (
        <span
          key={m}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            marginLeft: i === 0 ? 0 : -8,
            background: i % 2 ? COLORS.mint : COLORS.surface,
            color: i % 2 ? "#08110D" : COLORS.text2,
            border: `2px solid ${COLORS.bg}`,
            fontSize: 10,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {m}
        </span>
      ))}
    </div>
    <span style={{ fontSize: 12, color: COLORS.text3 }}>
      {count} joined{extra ?? ""}
    </span>
  </div>
);

const CandidateList: React.FC<{
  frame: number;
  mode: "preview" | "voting" | "finalized";
  staged?: boolean;
}> = ({ frame, mode, staged }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14, flex: 1 }}>
    {CANDIDATES.map((c, i) => {
      const local = frame - i * 8;
      const t = mode === "preview" ? { yes: 0, maybe: 0, no: 0 } : tallyAt(local, c.yes, c.maybe, c.no);
      const total = Math.max(1, t.yes + t.maybe + t.no);
      const isWinner = mode === "finalized" && i === 0;
      const isStaged = staged && i === 0 && mode !== "finalized";
      return (
        <div key={c.name} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderRadius: 32,
              border: `0.5px solid ${
                isWinner || isStaged ? "rgba(93,202,165,0.7)" : "rgba(255,255,255,0.15)"
              }`,
              background: isWinner || isStaged ? "rgba(93,202,165,0.08)" : "rgba(0,0,0,0.45)",
            }}
          >
            <Img src={c.img} style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", flex: "none" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {isWinner ? <IconTrophy /> : null}
                <span style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, color: COLORS.text }}>{c.name}</span>
              </div>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 4,
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: COLORS.mint,
                  background: COLORS.mintDim,
                  borderRadius: 999,
                  padding: "2px 8px",
                }}
              >
                {c.cat}
              </span>
              {mode !== "preview" ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", height: 6, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.1)" }}>
                    <div style={{ width: `${(t.yes / total) * 100}%`, background: SUCCESS }} />
                    <div style={{ width: `${(t.maybe / total) * 100}%`, background: WARNING }} />
                    <div style={{ width: `${(t.no / total) * 100}%`, background: DANGER }} />
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 12, fontSize: 10, color: COLORS.text3 }}>
                    <span>{t.yes} yes</span>
                    <span>{t.maybe} maybe</span>
                    <span>{t.no} no</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          {mode === "voting" ? (
            <div style={{ display: "flex", gap: 6, paddingLeft: 4 }}>
              {(["yes", "maybe", "no"] as const).map((v) => {
                const tone = v === "yes" ? SUCCESS : v === "maybe" ? WARNING : DANGER;
                const on = c.vote === v && frame > 18;
                return (
                  <span
                    key={v}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      borderRadius: 999,
                      border: `0.5px solid ${on ? tone : "rgba(255,255,255,0.15)"}`,
                      background: on ? `${tone}26` : "rgba(255,255,255,0.04)",
                      color: on ? tone : COLORS.text2,
                      fontSize: 12,
                      padding: "6px 12px",
                      textTransform: "capitalize",
                    }}
                  >
                    {on ? <IconCheck color={tone} /> : null}
                    {v}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
      );
    })}
  </div>
);

const TripScene: React.FC<{
  frame: number;
  mode: "preview" | "voting" | "finalized";
  members: number;
  shareHot?: boolean;
  staged?: boolean;
  confirming?: boolean;
}> = ({ frame, mode, members, shareHot, staged, confirming }) => (
  <div style={{ padding: `${SAFE_TOP}px 16px ${SAFE_BOTTOM}px`, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", position: "relative" }}>
    <TripHead shareHot={shareHot} />
    <Crew count={members} extra={mode === "finalized" ? " · finalized" : ""} />
    {mode === "finalized" ? (
      <div
        style={{
          marginTop: 14,
          padding: 14,
          borderRadius: 28,
          border: "0.5px solid rgba(93,202,165,0.4)",
          background: "rgba(93,202,165,0.08)",
          fontFamily: FONTS.display,
          fontSize: 16,
          fontWeight: 600,
          color: COLORS.text,
        }}
      >
        They picked Skandagiri!
      </div>
    ) : null}
    <CandidateList frame={frame} mode={mode} staged={staged} />
    {(staged || confirming) && mode !== "finalized" ? (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 8,
          padding: 10,
          borderRadius: 14,
          border: "0.5px solid rgba(255,255,255,0.15)",
          background: "rgba(0,0,0,0.8)",
        }}
      >
        <IconFlag />
        <span style={{ flex: 1, fontSize: 13, color: COLORS.text }}>
          Finalize with <b>Skandagiri</b>?
        </span>
        <span
          style={{
            borderRadius: 999,
            background: COLORS.mint,
            color: "#08110D",
            fontWeight: 600,
            fontSize: 12,
            padding: "8px 12px",
            transform: confirming ? "scale(0.96)" : "scale(1)",
          }}
        >
          Confirm
        </span>
      </div>
    ) : null}
    <div style={{ marginTop: 8, textAlign: "center", fontSize: 10, letterSpacing: "0.18em", color: COLORS.mint }}>{CODE}</div>
    {shareHot ? <Tap x="90%" y="44px" on /> : null}
  </div>
);

const InviteScene: React.FC<{ frame: number }> = ({ frame }) => {
  const tap = frame >= 36 && frame < 50;
  return (
    <div style={{ padding: `${SAFE_TOP}px 16px ${SAFE_BOTTOM}px`, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 600, color: COLORS.text }}>Invite friends</span>
        <RoundBtn>
          <IconX />
        </RoundBtn>
      </div>
      <p style={{ fontSize: 12, color: COLORS.text2, lineHeight: 1.45, marginBottom: 12 }}>
        Anyone with this link can join and vote — drop it in the group.
      </p>
      <CoverCard />
      <div
        style={{
          marginTop: 10,
          borderRadius: 12,
          border: "0.5px solid rgba(255,255,255,0.15)",
          background: "rgba(0,0,0,0.4)",
          padding: "8px 10px",
          fontSize: 11,
          color: COLORS.text3,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        letsgolighthouse.co.in/go?to=trip-plan/{CODE}
      </div>
      <div
        style={{
          marginTop: "auto",
          borderRadius: 999,
          border: `0.5px solid ${tap ? COLORS.mint : "rgba(255,255,255,0.15)"}`,
          background: tap ? "rgba(93,202,165,0.12)" : "rgba(255,255,255,0.06)",
          color: COLORS.text,
          textAlign: "center",
          padding: "12px 16px",
          fontSize: 14,
        }}
      >
        Send on WhatsApp
      </div>
    </div>
  );
};

const ChatScene: React.FC<{ frame: number }> = ({ frame }) => {
  const joined = Math.min(CHAT_JOINS.length, Math.max(0, Math.floor((frame - 18) / 12)));
  return (
    <div style={{ padding: `${SAFE_TOP}px 16px ${SAFE_BOTTOM}px`, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", background: COLORS.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ color: COLORS.text2 }}>‹</span>
        <div>
          <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, color: COLORS.text }}>Weekend?</div>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", color: COLORS.mint }}>WHATSAPP · 6 PEOPLE</div>
        </div>
      </div>
      <div style={{ alignSelf: "flex-end", maxWidth: "88%" }}>
        <div style={{ fontSize: 10, color: COLORS.text3, textAlign: "right", marginBottom: 4 }}>You</div>
        <div
          style={{
            background: "rgba(93,202,165,0.12)",
            border: "0.5px solid rgba(93,202,165,0.28)",
            borderRadius: "14px 14px 4px 14px",
            padding: 8,
          }}
        >
          <CoverCard compact />
          <div style={{ fontSize: 11, color: COLORS.text2, marginTop: 8, lineHeight: 1.4 }}>
            Vote on our trip plan: {TITLE}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {CHAT_JOINS.slice(0, joined).map((name) => (
          <div key={name} style={{ fontSize: 11, color: COLORS.text3, textAlign: "center" }}>
            {name} opened the invite
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "center" }}>
        <Crew count={1 + joined} />
      </div>
    </div>
  );
};

export const GroupVote: React.FC = () => {
  const frame = useCurrentFrame();
  let body: React.ReactNode = <SavedScene frame={frame} />;
  if (inRange(frame, FLOW.create)) body = <CreateScene frame={frame} />;
  else if (inRange(frame, FLOW.trip)) {
    body = <TripScene frame={frame - FLOW.trip[0]} mode="preview" members={1} shareHot={frame >= 178 && frame < 192} />;
  } else if (inRange(frame, FLOW.invite)) body = <InviteScene frame={frame - FLOW.invite[0]} />;
  else if (inRange(frame, FLOW.chat)) body = <ChatScene frame={frame - FLOW.chat[0]} />;
  else if (inRange(frame, FLOW.vote)) {
    body = <TripScene frame={frame - FLOW.vote[0]} mode="voting" members={6} />;
  } else if (inRange(frame, FLOW.final) || frame >= FLOW.final[0]) {
    const local = frame - FLOW.final[0];
    const done = local > 36;
    body = (
      <TripScene
        frame={80}
        mode={done ? "finalized" : "voting"}
        members={6}
        staged={!done}
        confirming={local >= 22 && local < 36}
      />
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: FONTS.body }}>
      {body}
      <IPhoneChrome />
    </AbsoluteFill>
  );
};
