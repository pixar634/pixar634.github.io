import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "./SharedStyles";

export const Beam: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const t = Math.max(0, frame - delay);
  const angle = (t * 2) % 360;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 1200,
        height: 1200,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        opacity: 0.15,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          width: "100%",
          height: 2,
          transform: "translateY(-50%)",
          background: `linear-gradient(90deg, transparent 0%, ${COLORS.mint} 50%, transparent 100%)`,
        }}
      />
    </div>
  );
};
