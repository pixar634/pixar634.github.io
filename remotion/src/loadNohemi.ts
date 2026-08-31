import { continueRender, delayRender, staticFile } from "remotion";

const FACES: Array<[number, string]> = [
  [100, "Nohemi-Thin.woff2"],
  [200, "Nohemi-ExtraLight.woff2"],
  [300, "Nohemi-Light.woff2"],
  [400, "Nohemi-Regular.woff2"],
  [500, "Nohemi-Medium.woff2"],
  [600, "Nohemi-SemiBold.woff2"],
  [700, "Nohemi-Bold.woff2"],
  [800, "Nohemi-ExtraBold.woff2"],
];

let armed = false;

export function loadNohemi() {
  if (armed || typeof document === "undefined") return;
  armed = true;
  const handle = delayRender("Load Nohemi");
  const style = document.createElement("style");
  style.textContent = FACES.map(
    ([weight, file]) =>
      `@font-face{font-family:"Nohemi";src:url(${JSON.stringify(staticFile("fonts/" + file))}) format("woff2");font-weight:${weight};font-style:normal;font-display:block;}`
  ).join("");
  document.head.appendChild(style);
  const ready = document.fonts?.ready ?? Promise.resolve();
  ready.then(() => continueRender(handle)).catch(() => continueRender(handle));
}
