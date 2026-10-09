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
// A single sample needs far more vertical movement than drift before it hands the stroke over.
const VERTICAL_SAMPLE_DISTANCE = 32;
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
  return (
    wheelEventAxis(deltaX, deltaY) === 'vertical' && Math.abs(deltaY) >= VERTICAL_SAMPLE_DISTANCE
  );
}

// A single dip or rise is not a gesture boundary. A resumed push needs the tail to have decayed
// against the stroke peak and two rising samples that clear that tail, so neither a stroke's own
// ramp nor a decaying momentum tail can page twice. Native boundaries stay the fast path.
const TAIL_DECAY = 0.6;
const RESUME_RATIO = 1.5;
const RESUME_MARGIN = 8;
/** Whether a sample has dropped far enough below the stroke peak to mark a momentum tail. */
export function isTailDecay(magnitude: number, peakMagnitude: number): boolean {
  return magnitude <= peakMagnitude * TAIL_DECAY;
}

export function isResumedWheelPush(input: {
  magnitude: number;
  tailMagnitude: number;
  risingSamples: number;
  decayed: boolean;
}): boolean {
  return (
    input.decayed &&
    input.risingSamples >= 2 &&
    input.magnitude >=
      Math.max(input.tailMagnitude * RESUME_RATIO, input.tailMagnitude + RESUME_MARGIN)
  );
}
