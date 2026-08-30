// Lighthouse brand constants used across every composition.
export const COLORS = {
  bg: "#0F0F12",
  surface: "#1A1A1F",
  hairline: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  text2: "#D1D5DB",
  text3: "#9CA3AF",
  mint: "#5DCAA5",
  mintDim: "rgba(93,202,165,0.18)",
  amber: "#E0A458",
  amberDim: "rgba(224,164,88,0.18)",
  blue: "#8FA6C4",
  cyan: "#4FB0C6",
  aqua: "#7FE3D6",
};

export const FONTS = {
  display: "'Clash Display', 'Space Grotesk', sans-serif",
  accent: "'Syne', 'Space Grotesk', sans-serif",
  body: "'Space Grotesk', sans-serif",
};

export const EASES = {
  standard: [0.22, 1, 0.36, 1] as const,
  elastic: [0.25, 1, 0.5, 1] as const,
  sonar: [0.1, 0.7, 0.3, 1] as const,
};

export const commonCard: React.CSSProperties = {
  backgroundColor: "rgba(26,26,31,0.72)",
  border: `1px solid ${COLORS.hairline}`,
  borderRadius: 22,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "0 20px 60px -20px rgba(0,0,0,0.55)",
  overflow: "hidden",
};

export const phoneBody: React.CSSProperties = {
  width: 320,
  height: 690,
  borderRadius: 42,
  backgroundColor: COLORS.bg,
  border: "2px solid rgba(255,255,255,0.06)",
  boxShadow: "0 0 0 6px rgba(20,20,24,0.95), 0 40px 100px -30px rgba(0,0,0,0.7)",
  overflow: "hidden",
  position: "relative",
};

export const laptopBody: React.CSSProperties = {
  width: 960,
  height: 620,
  borderRadius: 16,
  backgroundColor: COLORS.bg,
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 30px 80px -30px rgba(0,0,0,0.7)",
  overflow: "hidden",
  position: "relative",
};

export const mapGrid: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage: `
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
  `,
  backgroundSize: "44px 44px",
};

export const glowText = (color: string): React.CSSProperties => ({
  textShadow: `0 0 24px ${color}`,
});
