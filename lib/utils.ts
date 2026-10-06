import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to conditionally construct class names and resolve Tailwind CSS conflicts.
 *
 * Combines:
 * - `clsx`: Conditionally toggles CSS classes (objects, arrays, falsy filters)
 * - `twMerge`: Deduplicates and resolves conflicting Tailwind utility classes
 *   (e.g., ensuring `px-4` overrides `px-2` when both are passed).
 *
 * Standard helper across all shadcn/ui and custom Vircuit components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
