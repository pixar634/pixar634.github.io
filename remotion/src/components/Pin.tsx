import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "./SharedStyles";

export const Pin: React.FC<{
  x: number | string;
  y: number | string;
  color?: string;
  delay?: number;
  ring?: boolean;
}> = ({ x, y, color = COLORS.mint, delay = 0, ring = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.8 },
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: color,
          boxShadow: `0 0 20px 6px ${color}66`,
          transform: `scale(${scale})`,
        }}
      />
      {ring && (
        <div
          style={{
            position: "absolute",
            left: 7,
            top: 7,
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: `1px solid ${color}`,
            transform: "translate(-50%, -50%)",
            opacity: Math.max(0, 0.8 - (frame - delay) * 0.02),
          }}
        />
      )}
    </div>
  );
};
