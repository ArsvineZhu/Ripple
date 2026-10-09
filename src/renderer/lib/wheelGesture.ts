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

// A single dip or rise is not a gesture boundary. A resumed push needs a rising run that clears
// the tail it follows, and that tail must itself have decayed against the stroke peak: neither a
// stroke's own ramp nor a decaying momentum tail satisfies both. Native boundaries stay the fast
// path.
const RESUME_FADE = 0.6;
const RESUME_RATIO = 1.5;
const RESUME_MARGIN = 8;
export function isResumedWheelPush(input: {
  magnitude: number;
  lastMagnitude: number;
  peakMagnitude: number;
  risingSamples: number;
}): boolean {
  return (
    input.risingSamples >= 2 &&
    input.lastMagnitude < input.peakMagnitude * RESUME_FADE &&
    input.magnitude >=
      Math.max(input.lastMagnitude * RESUME_RATIO, input.lastMagnitude + RESUME_MARGIN)
  );
}
