import React from "react";
import { COLORS, FONTS } from "./SharedStyles";

/** iPhone 17 Pro Max safe areas at 390-wide full-bleed. */
export const SAFE_TOP = 62;
export const SAFE_BOTTOM = 34;

export const screenInset: React.CSSProperties = {
  paddingTop: SAFE_TOP,
  paddingRight: 16,
  paddingBottom: SAFE_BOTTOM,
  paddingLeft: 16,
};

const Island: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 11,
      left: "50%",
      width: "28.6%",
      height: 37,
      transform: "translateX(-50%)",
      background: "#0a0a0c",
      borderRadius: 19,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 8,
      paddingRight: 10,
      boxSizing: "border-box",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
    }}
  >
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        background: "#1a2230",
        boxShadow: "inset 0 0 0 1.5px #0d121c",
        marginRight: "auto",
        marginLeft: 12,
      }}
    />
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        background: "radial-gradient(circle at 40% 40%, #3a5a8a, #0b1020 70%)",
      }}
    />
  </div>
);

const StatusRow: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: SAFE_TOP,
      padding: "14px 22px 0 22px",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      fontFamily: FONTS.body,
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "#fff",
      boxSizing: "border-box",
    }}
  >
    <span>9:41</span>
    <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
      <span
        style={{
          width: 17,
          height: 11,
          background:
            "linear-gradient(#fff,#fff) 0 100%/3px 4px no-repeat, linear-gradient(#fff,#fff) 5px 100%/3px 6px no-repeat, linear-gradient(#fff,#fff) 10px 100%/3px 8px no-repeat, linear-gradient(#fff,#fff) 15px 100%/3px 11px no-repeat",
        }}
      />
      <span
        style={{
          width: 25,
          height: 12,
          border: "1.5px solid rgba(255,255,255,0.9)",
          borderRadius: 3.5,
          boxShadow: "inset 15px 0 0 #fff",
        }}
      />
    </span>
  </div>
);

const HomeBar: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      bottom: 8,
      width: "32%",
      height: 5,
      transform: "translateX(-50%)",
      borderRadius: 99,
      background: "rgba(255,255,255,0.42)",
    }}
  />
);

/** Overlay for full-bleed 390×844 compositions. */
export const IPhoneChrome: React.FC<{ home?: boolean; status?: boolean }> = ({
  home = true,
  status = true,
}) => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50 }}>
    {status ? (
      <>
        <StatusRow />
        <Island />
      </>
    ) : null}
    {home ? <HomeBar /> : null}
  </div>
);

/**
 * In-flow top chrome for nested phone frames (1080 comps).
 * Occupies SAFE_TOP so content below never hits the island.
 */
export const StatusBar: React.FC = () => (
  <div style={{ height: SAFE_TOP, position: "relative", flexShrink: 0, color: COLORS.text }}>
    <StatusRow />
    <Island />
  </div>
);
