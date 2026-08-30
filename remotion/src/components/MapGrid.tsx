import React from "react";

export const MapGrid: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)
        `,
        backgroundSize: "44px 44px",
      }}
    />
  );
};
