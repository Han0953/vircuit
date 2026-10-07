import type { LucideIcon } from "lucide-react";

type PanelEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function PanelEmptyState({ icon: Icon, title, description }: PanelEmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <Icon aria-hidden="true" className="mb-4 size-6 text-text-secondary" strokeWidth={1.5} />
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">{description}</p>
    </div>
  );
}
