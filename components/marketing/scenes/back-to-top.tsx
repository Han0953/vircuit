"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { marketingScrollRoute } from "./public-motion-config";
import { ArrowUp } from "lucide-react";
import { scrollHomeTo } from "./home-scroll";
import { showBackToTop } from "./scroll-policy";
import styles from "../home-controls.module.css";

export function BackToTop() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const update = () => setVisible((previous) => showBackToTop(previous, scrollY, innerHeight));
    const frame = requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [pathname]);
  if (!marketingScrollRoute(pathname)) return null;
  return <button data-motion-group="shared.back-top" data-motion="control" type="button" className={styles.backToTop} data-visible={visible || focused} tabIndex={visible || focused ? 0 : -1} aria-hidden={!visible && !focused} aria-label="Kembali ke atas halaman" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onClick={() => scrollHomeTo(0, document.getElementById("main-content") ?? undefined)}>
    <ArrowUp size={20} aria-hidden="true" />
  </button>;
}
