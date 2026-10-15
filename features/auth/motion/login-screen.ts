/** A transient, inert copy of the visible login screen; never stored or sent. */
export function captureLoginScreen(): HTMLElement | null {
  const source = document.querySelector<HTMLElement>(".auth-experience");
  if (!source) return null;
  const screen = source.cloneNode(true);
  if (!(screen instanceof HTMLElement)) return null;
  const bounds = source.getBoundingClientRect();
  Object.assign(screen.style, { position: "absolute", left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px`, minHeight: `${bounds.height}px`, margin: "0", pointerEvents: "none" });
  screen.inert = true;
  screen.setAttribute("aria-hidden", "true");
  screen.dataset.authScreenSnapshot = "true";
  screen.querySelectorAll("script").forEach((element) => element.remove());
  screen.querySelectorAll<HTMLElement | SVGElement>("*").forEach((element) => {
    element.style.animation = "none"; element.style.transition = "none";
    element.removeAttribute("autofocus");
  });
  screen.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
    const password = input.type === "password" || input.name === "password";
    // Preserve the filled appearance without retaining the actual password.
    if (password) { input.type = "password"; input.value = input.value ? "••••••••" : ""; }
    input.removeAttribute("value"); input.removeAttribute("name"); input.autocomplete = "off";
  });
  return screen;
}

export function loginScreenHalf(screen: HTMLElement, index: number): HTMLElement {
  const copy = screen.cloneNode(true);
  if (!(copy instanceof HTMLElement)) throw new Error("Invalid login screen");
  // Both halves contain a full screen, clipped at the viewport midpoint.
  copy.style.left = `${parseFloat(screen.style.left) - index * window.innerWidth / 2}px`;
  const ids = new Map<string, string>();
  copy.querySelectorAll<HTMLElement>("[id]").forEach((element) => {
    const id = `login-exit-${index}-${element.id}`; ids.set(element.id, id); element.id = id;
  });
  copy.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      let value = attribute.value;
      for (const [old, id] of ids) value = value.replaceAll(`url(#${old})`, `url(#${id})`);
      if (["for", "aria-labelledby", "aria-describedby"].includes(attribute.name)) value = value.split(" ").map((id) => ids.get(id) ?? id).join(" ");
      if (value !== attribute.value) element.setAttribute(attribute.name, value);
    }
  });
  return copy;
}
