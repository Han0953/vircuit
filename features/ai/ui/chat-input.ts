export function desktopChatInput() {
  return window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches;
}
export function enterSubmits(input: { key: string; shift: boolean; composing: boolean; desktop: boolean; touch: boolean }) {
  return input.key === "Enter" && !input.shift && !input.composing && input.desktop && !input.touch;
}
