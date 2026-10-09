"use client";
import { useState } from "react";
import styles from "../public-pages.module.css";
export type AccessRow = { item: string; free: string; premium: string; category: string };
export function AccessComparison({ rows }: { rows: AccessRow[] }) {
  const [active, setActive] = useState("Semua");
  return <>
    <div className={styles.filters} data-motion-group="access.filters" data-motion="control" aria-label="Sorot kategori akses">{["Semua", "Lab", "Akun", "Belajar", "AI"].map((category) => <button key={category} aria-pressed={active === category} onClick={() => setActive(category)}>{category}</button>)}</div>
    <p className="text-sm text-text-secondary" data-motion-group="access.legend" data-motion="identity">Free · tersedia / Premium · rencana, belum dapat dibeli</p>
    <dl className={`${styles.comparison} mt-6`}>{rows.map((row) => <div data-motion-card data-active={active !== "Semua" && active === row.category} key={row.item} className={styles.comparisonRow}><div data-motion-group={`comparison.${row.item}`} data-motion="details"><dt>{row.item}</dt><dd><span>Free<br />{row.free}</span><span>Premium (Rencana)<br />{row.premium}</span></dd></div></div>)}</dl>
  </>;
}
