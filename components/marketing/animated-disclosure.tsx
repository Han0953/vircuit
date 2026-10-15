"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react";
import styles from "./animated-disclosure.module.css";

type Props = Omit<ComponentPropsWithoutRef<"details">, "onClick"> & { summary: ReactNode };

export function AnimatedDisclosure({ summary, children, className = "", name, onToggle, ...props }: Props) {
  const root = useRef<HTMLDetailsElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const heightAnimation = useRef<Animation | null>(null);
  const contentAnimation = useRef<Animation | null>(null);
  const expanded = useRef<boolean | null>(null);

  useEffect(() => {
    const element = root.current;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const settle = () => heightAnimation.current?.finish();
    const preference = () => { if (media.matches) settle(); };
    window.addEventListener("resize", settle);
    media.addEventListener("change", preference);
    return () => {
      window.removeEventListener("resize", settle);
      media.removeEventListener("change", preference);
      if (heightAnimation.current) heightAnimation.current.onfinish = null;
      heightAnimation.current?.cancel();
      contentAnimation.current?.cancel();
      heightAnimation.current = null;
      contentAnimation.current = null;
      if (element) {
        if (expanded.current !== null) element.open = expanded.current;
        element.style.removeProperty("height");
        element.style.removeProperty("overflow");
      }
    };
  }, []);

  function toggle(event: MouseEvent<HTMLDetailsElement>) {
    const element = root.current;
    const body = content.current;
    const trigger = element?.querySelector("summary");
    if (!element || !body || !trigger || !(event.target instanceof Element) || event.target.closest("summary") !== trigger || event.button !== 0) return;
    const animated = !matchMedia("(prefers-reduced-motion: reduce)").matches && typeof element.animate === "function";
    const opening = animated ? !(expanded.current ?? element.open) : !element.open;
    if (name) {
      // Native grouping is the no-JS fallback; enhanced peers close through
      // their existing activation path so their exit animation can finish.
      element.removeAttribute("name");
      if (opening) for (const peer of element.parentElement?.children ?? []) {
        if (!(peer instanceof HTMLDetailsElement) || peer === element || peer.dataset.disclosureGroup !== name) continue;
        const peerExpanded = animated ? peer.dataset.disclosureExpanded === "true" || (peer.dataset.disclosureExpanded === undefined && peer.open) : peer.open;
        if (peerExpanded) peer.querySelector<HTMLElement>("summary")?.click();
      }
    }
    if (!animated) return;
    event.preventDefault();

    const startHeight = element.getBoundingClientRect().height;
    const startOpacity = element.open ? getComputedStyle(body).opacity : "0";
    const startTransform = element.open ? getComputedStyle(body).transform : "translateY(-4px)";
    expanded.current = opening;
    element.dataset.disclosureExpanded = String(opening);
    element.style.height = `${startHeight}px`;
    element.style.overflow = "hidden";
    heightAnimation.current?.cancel();
    contentAnimation.current?.cancel();
    element.open = true;

    const css = getComputedStyle(element);
    const chrome = [css.paddingTop, css.paddingBottom, css.borderTopWidth, css.borderBottomWidth].reduce((sum, size) => sum + parseFloat(size), 0);
    const endHeight = trigger.getBoundingClientRect().height + chrome + (opening ? body.getBoundingClientRect().height : 0);
    const duration = opening ? 360 : 280;
    const options: KeyframeAnimationOptions = { duration, easing: "cubic-bezier(.22,.8,.25,1)", fill: "both" };
    contentAnimation.current = body.animate([
      { opacity: startOpacity, transform: startTransform },
      { opacity: opening ? 1 : 0, transform: opening ? "translateY(0)" : "translateY(-4px)" },
    ], options);
    const animation = element.animate([{ height: `${startHeight}px` }, { height: `${endHeight}px` }], options);
    heightAnimation.current = animation;
    animation.onfinish = () => {
      if (heightAnimation.current !== animation) return;
      element.open = opening;
      element.style.removeProperty("height");
      element.style.removeProperty("overflow");
      heightAnimation.current = null;
      animation.cancel();
      contentAnimation.current?.cancel();
      contentAnimation.current = null;
    };
  }

  return <details {...props} name={name} ref={root} className={`${styles.disclosure} ${className}`} data-animated-disclosure data-disclosure-group={name} onClick={toggle} onToggle={(event) => {
    if (!heightAnimation.current) {
      expanded.current = event.currentTarget.open;
      event.currentTarget.dataset.disclosureExpanded = String(event.currentTarget.open);
    }
    onToggle?.(event);
  }}>
    {summary}
    <div ref={content} className={styles.content} data-disclosure-content>{children}</div>
  </details>;
}
