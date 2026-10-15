// Slower individual entrances, overlapping groups to avoid a long empty wait.
export const sidebarItemDuration = 0.82;
export const sidebarItemStagger = 0.075;
export const sidebarEntryDuration = 0.9;
export const sidebarItemsStart = sidebarEntryDuration;
export const headerDuration = 0.82;
export const headerItemStagger = 0.07;
export const contentDuration = 0.82;
export const contentStagger = 0.065;
export const mobileHeaderDuration = 0.42;
export const mobileContentDuration = 0.48;
export const mobileContentStagger = 0.065;
export function dashboardIntroTiming(itemCount: number, mobile = false) {
  if (mobile) return { sidebarDuration: 0, headerStart: 0, contentStart: 0.36 };
  const sidebarDuration = Math.max(sidebarEntryDuration, sidebarItemsStart + sidebarItemDuration + Math.max(0, itemCount - 1) * sidebarItemStagger);
  const headerStart = sidebarEntryDuration * 0.5;
  return { sidebarDuration, headerStart, contentStart: headerStart + headerDuration * 0.5 };
}
