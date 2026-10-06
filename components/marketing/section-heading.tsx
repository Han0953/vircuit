export function SectionHeading({ id, eyebrow, title, description }: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="mb-4 font-mono text-xs font-medium tracking-widest text-text-secondary uppercase">{eyebrow}</p>
      <h2 id={id} className="text-h2 font-semibold leading-(--leading-heading) tracking-tight text-balance">{title}</h2>
      <p className="mt-4 text-base leading-relaxed text-text-secondary">{description}</p>
    </div>
  );
}
