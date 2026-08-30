import React from "react";
import { COLORS } from "./SharedStyles";

export const GlassCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}> = ({ children, style, accent = COLORS.hairline }) => {
  return (
    <div
      style={{
        backgroundColor: "rgba(26,26,31,0.72)",
        border: `1px solid ${accent}`,
        borderRadius: 20,
        padding: 18,
        boxShadow: "0 16px 50px -20px rgba(0,0,0,0.55)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
