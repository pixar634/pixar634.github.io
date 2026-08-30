import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "./SharedStyles";
import { IPhoneChrome } from "./IPhoneChrome";

export const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 320,
          height: 690,
          borderRadius: 52,
          backgroundColor: "#08080A",
          padding: 10,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 50px 120px -40px rgba(0,0,0,0.85)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 44,
            backgroundColor: COLORS.bg,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {children}
          <IPhoneChrome status={false} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
