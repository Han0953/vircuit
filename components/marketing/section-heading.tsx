/**
 * Standardized section heading component implementing typography rules from DESIGN.md (Section 10 & 13):
 * - Monospace eyebrow label for technical context (e.g., "01 / TITIK AWAL")
 * - Responsive H2 with text-balance to avoid awkward word wraps
 * - Subdued description paragraph with generous line height for scannability
 */
export function SectionHeading({ id, eyebrow, title, description }: {
  /** Heading identifier used for aria-labelledby associations on parent sections */
  id: string;
  /** Technical category or numerical step marker */
  eyebrow: string;
  /** Primary section title */
  title: string;
  /** Contextual explanation paragraph */
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="mb-4 font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">
        {eyebrow}
      </p>
      <h2 id={id} className="text-h2 font-semibold leading-(--leading-heading) tracking-tight text-balance">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-text-secondary">
        {description}
      </p>
    </div>
  );
}
