import React from "react";

export const Typewriter: React.FC<{ text: string; frame: number; speed?: number }> = ({
  text,
  frame,
  speed = 2,
}) => {
  const shown = Math.min(text.length, Math.max(0, Math.floor(frame / speed)));
  const display = text.slice(0, shown);
  const blink = Math.floor(frame / 15) % 2 === 0;

  return (
    <span>
      {display}
      {shown < text.length && blink ? <span style={{ opacity: 0.7 }}>|</span> : null}
    </span>
  );
};
