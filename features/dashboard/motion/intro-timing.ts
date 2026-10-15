// Slower individual entrances, overlapping groups to avoid a long empty wait.
export const sidebarItemDuration = 0.72;
export const sidebarItemStagger = 0.085;
export const sidebarEntryDuration = 0.85;
export const sidebarItemsStart = sidebarEntryDuration;
export const headerDuration = 0.72;
export const headerItemStagger = 0.07;
export const contentDuration = 0.72;
export const contentStagger = 0.075;
export function dashboardIntroTiming(itemCount: number) {
  const sidebarDuration = Math.max(sidebarEntryDuration, sidebarItemsStart + sidebarItemDuration + Math.max(0, itemCount - 1) * sidebarItemStagger);
  const headerStart = sidebarEntryDuration * 0.5;
  return { sidebarDuration, headerStart, contentStart: headerStart + headerDuration * 0.5 };
}
