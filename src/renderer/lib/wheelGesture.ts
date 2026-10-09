// Deltas are normalized to CSS pixels before classification. A sideways swipe carries a few pixels
// of drift per sample, so a sample stays on the rail while its vertical part is a small share of
// the horizontal movement.
const AXIS_FLOOR = 2;
const AXIS_SHARE = 0.25;
// A diagonal cancels a pending page instead of flipping the tab, and a stroke whose movement is
// dominated by the vertical axis keeps the content until the input stops.
const TAKEOVER_SHARE = 0.5;
const VERTICAL_DOMINANCE = 2;
const VERTICAL_DISTANCE = 12;
export function wheelEventAxis(deltaX: number, deltaY: number): 'horizontal' | 'vertical' | 'none' {
  if (!deltaX && !deltaY) return 'none';
  const tolerance = Math.max(AXIS_FLOOR, Math.abs(deltaX) * AXIS_SHARE);
  return Math.abs(deltaX) > 0 && Math.abs(deltaY) <= tolerance ? 'horizontal' : 'vertical';
}

/** Whether a sample is diagonal enough to cancel a pending page and hand the stroke to the content. */
export function isVerticalTakeover(deltaX: number, deltaY: number): boolean {
  return Math.abs(deltaY) > Math.max(AXIS_FLOOR, Math.abs(deltaX) * TAKEOVER_SHARE);
}

/** Whether the movement seen so far is dominated by the vertical axis, so the content owns it. */
export function isVerticalStroke(accumulatedX: number, accumulatedY: number): boolean {
  return accumulatedY >= VERTICAL_DISTANCE && accumulatedY >= accumulatedX * VERTICAL_DOMINANCE;
}

/** Whether a sample is clearly vertical, so the content owns the rest of the stroke. */
export function isClearVerticalSample(deltaX: number, deltaY: number): boolean {
  return wheelEventAxis(deltaX, deltaY) === 'vertical' && Math.abs(deltaY) >= VERTICAL_DISTANCE;
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
