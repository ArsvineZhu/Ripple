// Deltas are normalized to CSS pixels before classification. Cross-axis noise is tolerated as a
// share of the horizontal movement, never less than a couple of pixels, so a long sideways swipe
// keeps its axis while a diagonal still belongs to vertical scrolling.
const NOISE_FLOOR = 2;
const NOISE_SHARE = 0.08;
// A horizontal stroke only hands over to vertical movement on a real diagonal, not on the few
// pixels of drift every sideways swipe carries.
const TAKEOVER_SHARE = 0.5;
export function wheelEventAxis(deltaX: number, deltaY: number): 'horizontal' | 'vertical' | 'none' {
  if (!deltaX && !deltaY) return 'none';
  const noise = Math.max(NOISE_FLOOR, Math.abs(deltaX) * NOISE_SHARE);
  return Math.abs(deltaX) > 0 && Math.abs(deltaY) <= noise ? 'horizontal' : 'vertical';
}

/** Whether a sample carries enough vertical movement to take a horizontal stroke over. */
export function isVerticalTakeover(deltaX: number, deltaY: number): boolean {
  return Math.abs(deltaY) > Math.max(NOISE_FLOOR, Math.abs(deltaX) * TAKEOVER_SHARE);
}

// A single dip/rise is not a gesture boundary. The fallback needs a sustained
// low-energy tail and a new rising run. Native boundaries remain the fast path.
export function isResumedWheelPush(input: {
  magnitude: number;
  lastMagnitude: number;
  quietForMs: number;
  risingSamples: number;
}): boolean {
  return (
    input.quietForMs >= 64 &&
    input.risingSamples >= 2 &&
    input.magnitude >= Math.max(input.lastMagnitude * 1.5, input.lastMagnitude + 8)
  );
}
