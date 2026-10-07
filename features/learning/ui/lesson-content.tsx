import type { ContentBlock } from "../schema";
export function LessonContent({ blocks }: { blocks: ContentBlock[] }) {
  return <div className="space-y-6 text-base leading-relaxed">{blocks.map((block, index) => {
    switch (block.type) {
      case "heading": return <h3 key={index} className="text-xl font-semibold">{block.text}</h3>;
      case "paragraph": return <p key={index}>{block.text}</p>;
      case "list": return <ul key={index} className="list-disc space-y-2 pl-5">{block.items.map((text, i) => <li key={i}>{text}</li>)}</ul>;
      case "callout": return <aside key={index} className="rounded-lg border bg-surface-muted p-4 text-sm"><h3 className="mb-2 font-semibold">{block.title}</h3><p>{block.text}</p></aside>;
      case "code": return <pre key={index} tabIndex={0} aria-label="Contoh kode" className="max-w-full overflow-x-auto rounded-lg border bg-surface-muted p-4 text-sm leading-relaxed focus-visible:outline-2 focus-visible:outline-ring"><code>{block.source}</code></pre>;
      case "diagram": return <figure key={index} className="space-y-3"><ol aria-label="Alur rangkaian" className="flex flex-wrap gap-2">{block.steps.map((step, i) => <li key={i} className="rounded-md border bg-surface px-3 py-2 text-sm"><span className="mr-2 text-primary">{i + 1}.</span>{step}</li>)}</ol><figcaption className="text-sm text-text-secondary">{block.caption}</figcaption></figure>;
    }
  })}</div>;
}
