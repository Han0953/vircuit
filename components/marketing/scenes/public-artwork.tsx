import styles from "../public-pages.module.css";

export type ArtworkKind = "workspace" | "learning" | "access" | "traffic-light" | "smart-lamp" | "digital-thermometer" | "smart-plant-monitoring" | "smart-door" | "weather-station" | "smart-home" | "environmental-monitoring" | "iot-egg-incubator";
export function PublicArtwork({ kind, id, caption = "Diagram ilustratif · bukan hasil simulasi langsung", story = false }: { kind: ArtworkKind; id: string; caption?: string; story?: boolean }) {
  return <figure data-motion-group={id} data-motion="art" data-story={story || undefined} className={styles.heroArt}>
    <svg className={styles.art} viewBox="0 0 480 280" fill="none" aria-hidden="true">
      <path d="M24 40H456M24 240H456" stroke="var(--border)" />
      <text x="24" y="28" fontSize="11" fill="var(--text-secondary)" fontFamily="monospace">VIRCUIT / {kind.toUpperCase().replaceAll("-", " ")}</text>
      <path data-trace d="M110 140H170V100H240V140H350" stroke="currentColor" strokeWidth="2" />
      <path data-trace d="M110 170H180V205H330V170H350" stroke="var(--iot)" strokeWidth="2" />
      {kind === "workspace" ? <>
        <g data-part><rect x="38" y="70" width="105" height="142" rx="8" fill="var(--primary-soft)" stroke="currentColor" /><rect x="60" y="112" width="60" height="58" rx="4" fill="var(--surface)" stroke="currentColor" />{Array.from({ length: 7 }, (_, i) => <path key={i} d={`M45 ${84 + i * 16}h8M128 ${84 + i * 16}h8`} stroke="currentColor" />)}<text x="60" y="194" fontSize="11" fill="currentColor">UNO / I/O</text></g>
        <g data-part><rect x="195" y="62" width="220" height="64" rx="6" fill="var(--surface)" stroke="var(--border-strong)" /><text x="211" y="88" fill="currentColor" fontSize="12" fontFamily="monospace">digitalWrite(3, HIGH);</text><text x="211" y="109" fill="var(--text-secondary)" fontSize="11">kode → sinyal → output</text></g>
        <g data-output><circle cx="380" cy="174" r="24" fill="var(--primary-soft)" stroke="currentColor" /><circle cx="380" cy="174" r="10" fill="currentColor" /><path d="M205 174h20l6-8 12 16 12-16 12 16 6-8h24" stroke="currentColor" strokeWidth="2" /></g>
      </> : kind === "learning" ? <>
        {["Konsep", "Praktik", "Evaluasi"].map((label, i) => <g key={label} data-part><circle cx={80 + i * 160} cy={140} r="29" fill="var(--surface)" stroke="currentColor" /><text x={80 + i * 160} y="145" textAnchor="middle" fontSize="13" fill="currentColor">0{i + 1}</text><text x={80 + i * 160} y="197" textAnchor="middle" fontSize="12" fill="var(--text-secondary)">{label}</text></g>)}
        <path data-trace d="M109 140H211M269 140H371" stroke="currentColor" strokeWidth="3" />
      </> : kind === "access" ? <>
        {["Tamu", "Akun Free", "Premium / rencana"].map((label, i) => <g key={label} data-part><rect x={24 + i * 154} y={85 + i * 12} width="138" height="106" rx="6" stroke={i === 2 ? "var(--border-strong)" : "currentColor"} fill="var(--surface)" /><text x={93 + i * 154} y={130 + i * 12} textAnchor="middle" fontSize="12" fill="var(--foreground)">{label}</text><path data-output d={`M${74 + i * 154} ${152 + i * 12}h38`} stroke="currentColor" strokeWidth="2" /></g>)}
      </> : <>
        <g data-part><rect x="30" y="83" width="112" height="111" rx="6" fill="var(--surface)" stroke="var(--border-strong)" /><Sensor kind={kind} /></g>
        <g data-part><rect x="196" y="90" width="88" height="104" rx="6" fill="var(--primary-soft)" stroke="currentColor" /><rect x="215" y="111" width="50" height="47" rx="3" stroke="currentColor" /><text x="240" y="180" textAnchor="middle" fontSize="11" fill="currentColor">LOGIKA</text></g>
        <g data-output><Output kind={kind} /></g>
        <text x="86" y="223" textAnchor="middle" fontSize="11" fill="var(--text-secondary)">INPUT</text><text x="386" y="223" textAnchor="middle" fontSize="11" fill="var(--text-secondary)">OUTPUT</text>
      </>}
    </svg>
    <figcaption className={styles.caption}>{caption}</figcaption>
  </figure>;
}
function Sensor({ kind }: { kind: ArtworkKind }) {
  if (kind === "traffic-light") return <><text x="86" y="123" textAnchor="middle" fontSize="12" fill="currentColor">Timer</text><path data-trace d="M60 153h12v-14h18v14h20" stroke="currentColor" strokeWidth="2" /></>;
  if (kind === "smart-lamp") return <><circle cx="86" cy="125" r="16" stroke="currentColor" /><path d="M86 99v-10M86 151v10M60 125H50M112 125h10" stroke="currentColor" /><text x="86" y="180" textAnchor="middle" fontSize="11" fill="currentColor">Cahaya</text></>;
  if (kind === "smart-door") return <><rect x="64" y="107" width="44" height="49" rx="5" stroke="currentColor" /><circle cx="86" cy="132" r="9" stroke="currentColor" /><text x="86" y="180" textAnchor="middle" fontSize="11" fill="currentColor">Button</text></>;
  if (kind === "smart-home") return <path d="M52 132l34-27 34 27v44H52zM73 176v-27h26v27" stroke="currentColor" strokeWidth="2" />;
  if (kind === "smart-plant-monitoring") return <><path data-trace d="M86 176v-58c-32-6-36 30 0 30 36 0 35-30 0-20" stroke="currentColor" strokeWidth="2" /></>;
  return <><path d="M82 114v39a12 12 0 1 0 12 0v-39a6 6 0 0 0-12 0Z" stroke="currentColor" strokeWidth="2" /><path data-trace d="M88 126v36" stroke="var(--iot)" strokeWidth="3" /><text x="86" y="190" textAnchor="middle" fontSize="10" fill="currentColor">{kind === "digital-thermometer" ? "Suhu" : kind === "iot-egg-incubator" ? "DHT22" : "Data"}</text></>;
}
function Output({ kind }: { kind: ArtworkKind }) {
  if (kind === "traffic-light") return <><rect x="362" y="79" width="48" height="120" rx="8" stroke="currentColor" />{[105, 139, 173].map((y, i) => <circle key={y} data-part cx="386" cy={y} r="11" fill={["var(--danger)", "var(--warning)", "var(--success)"][i]} />)}</>;
  if (kind === "smart-lamp") return <><path d="M362 124a24 24 0 0 1 48 0c0 18-12 22-12 37h-24c0-15-12-19-12-37Z" fill="var(--primary-soft)" stroke="currentColor" /><path d="M373 170h26M378 180h16" stroke="currentColor" /></>;
  if (kind === "smart-door") return <><rect x="358" y="84" width="60" height="116" stroke="currentColor" /><path data-part d="M368 98h37v89h-37z" stroke="currentColor" /><circle cx="400" cy="149" r="4" fill="currentColor" /></>;
  if (kind === "smart-plant-monitoring") return <><path data-part d="M386 92c-34 48-32 76 0 76s34-28 0-76Z" fill="var(--primary-soft)" stroke="currentColor" /><path d="M361 189h50" stroke="currentColor" /></>;
  if (kind === "iot-egg-incubator") return <><rect x="355" y="90" width="66" height="100" rx="6" stroke="currentColor" /><path data-part d="M386 110c-23 33-21 55 0 55s23-22 0-55Z" stroke="currentColor" /><path data-trace d="M359 182h54" stroke="var(--iot)" /></>;
  if (kind === "smart-home") return <><circle cx="386" cy="130" r="23" stroke="currentColor" /><path data-trace d="M364 130h44M386 108v44" stroke="currentColor" /><rect x="361" y="165" width="50" height="20" rx="3" fill="var(--primary-soft)" stroke="currentColor" /></>;
  return <><rect x="343" y="90" width="86" height="92" rx="6" fill="var(--surface)" stroke="currentColor" />{kind === "digital-thermometer" ? <text x="386" y="143" textAnchor="middle" fontSize="20" fill="currentColor">°C</text> : <path data-trace d={kind === "weather-station" ? "M354 150l15-24 14 12 17-32 17 14" : "M354 159h8v-16h9v-25h9v32h9v-38h9v20h9v-9h10"} stroke="var(--iot)" strokeWidth="2" />}</>;
}
