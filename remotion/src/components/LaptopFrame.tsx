import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "./SharedStyles";

export const LaptopFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 1040,
          height: 680,
          borderRadius: 18,
          background: "linear-gradient(180deg, #141418 0%, #0A0A0C 100%)",
          padding: "12px 12px 24px 12px",
          boxShadow: "0 60px 140px -50px rgba(0,0,0,0.8)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "10px 14px",
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF5F57" }} />
          <span style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFBD2E" }} />
          <span style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#28C840" }} />
        </div>
        <div
          style={{
            flex: 1,
            borderRadius: 12,
            backgroundColor: COLORS.bg,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
