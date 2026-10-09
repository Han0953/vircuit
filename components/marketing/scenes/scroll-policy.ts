export function smoothScrollEligible(policy: { desktop: boolean; fine: boolean; coarse: boolean; reduced: boolean; touch: boolean; locked: boolean }) {
  return policy.desktop && policy.fine && !policy.coarse && !policy.reduced && !policy.touch && !policy.locked;
}

export function scrolledHeader(previous: boolean, y: number) {
  return previous ? y > 48 : y > 96;
}

export function showBackToTop(previous: boolean, y: number, height: number) {
  return previous ? y > height - 80 : y > height;
}
