export const TRACK_SPRING = { type: 'spring' as const, stiffness: 520, damping: 42, mass: 1 };
/** The shell's own size spring for non-paging changes (mode, assistant answer, settings width). */
export const SHELL_SPRING = { type: 'spring' as const, stiffness: 400, damping: 40, mass: 2.5 };
/** A horizontal wheel stream is settled after this long without events. */
export const WHEEL_SETTLE_MS = 120;
/** A gap this long between wheel events always starts a new gesture. */
const WHEEL_GAP_MS = 180;
const FLING_VELOCITY = 800;
const PROJECT_SECONDS = 0.18;

export type PageSize = { width: number; height: number };
/** Rail offsets that land the previous (positive) or following (negative) page in place. */
export type PageTargets = { previous: number; following: number };

/** The previous page sits its own width to the left; the following page starts at the current page's right edge. */
export function pageTargets(widths: {
  previous: number | null;
  current: number;
  following: number | null;
}): PageTargets {
  const { previous, current, following } = widths;
  return { previous: previous ?? 0, following: following === null ? 0 : current };
}

/** Wheel deltaX is opposite a rightward finger; positive means content moves right (previous page). */
export function wheelContentDelta(deltaX: number, deltaMode: number): number {
  let delta = deltaX;
  if (deltaMode === 1) delta *= 40;
  if (deltaMode === 2) delta *= 800;
  return -delta;
}

/** Hard limit: one gesture can never move the rail past the adjacent page. */
export function clampTrack(x: number, targets: PageTargets): number {
  return Math.min(targets.previous, Math.max(-targets.following, x));
}

function pageProgress(x: number, targets: PageTargets): { side: -1 | 0 | 1; p: number } {
  if (x > 0 && targets.previous > 0) return { side: -1, p: Math.min(1, x / targets.previous) };
  if (x < 0 && targets.following > 0) return { side: 1, p: Math.min(1, -x / targets.following) };
  return { side: 0, p: 0 };
}

/** Shell size while paging: base plus the share of the neighbour's size difference. */
export function interpolatePageSize(input: {
  x: number;
  targets: PageTargets;
  base: PageSize;
  current: PageSize;
  previous: PageSize | null;
  following: PageSize | null;
}): PageSize {
  const { x, targets, base, current, previous, following } = input;
  const { side, p } = pageProgress(x, targets);
  const neighbour = side < 0 ? previous : side > 0 ? following : null;
  if (!neighbour || p === 0) return base;
  return {
    width: base.width + p * (neighbour.width - current.width),
    height: base.height + p * (neighbour.height - current.height),
  };
}

export function settleTrack(input: { x: number; velocity: number; targets: PageTargets }): {
  target: number;
  direction: -1 | 0 | 1;
} {
  const { x, velocity, targets } = input;
  const projected = x + velocity * PROJECT_SECONDS;
  const fling = Math.abs(velocity) > FLING_VELOCITY;
  const toPrevious = fling ? velocity > 0 : projected > 0;
  const distance = toPrevious ? targets.previous : targets.following;
  if (!(distance > 0)) return { target: 0, direction: 0 };
  if (!fling && Math.abs(projected) <= distance / 2) return { target: 0, direction: 0 };
  return toPrevious ? { target: distance, direction: -1 } : { target: -distance, direction: 1 };
}

/**
 * One wheel stream is the finger movement plus its momentum tail. It moves the rail until it is
 * settled (page commit or quiet timeout); after that its remaining events are ignored.
 */
export type WheelStream = {
  lastTime: number;
  lastAbs: number;
  peakAbs: number;
  sign: number;
  settled: boolean;
};

export function classifyWheel(
  stream: WheelStream | null,
  time: number,
  delta: number,
): 'new' | 'continue' | 'ignore' {
  if (!stream || time - stream.lastTime > WHEEL_GAP_MS) return 'new';
  if (!stream.settled) return 'continue';
  const abs = Math.abs(delta);
  const sign = Math.sign(delta);
  // Momentum never reverses, so a reversal is a new finger movement.
  if (sign !== 0 && sign !== stream.sign && abs >= 1) return 'new';
  // Momentum only decays; a sharp rise after the tail has faded is a new swipe.
  const faded = stream.lastAbs < stream.peakAbs * 0.6;
  if (faded && abs > Math.max(stream.lastAbs * 2, stream.lastAbs + 6)) return 'new';
  return 'ignore';
}

export function advanceWheelStream(
  stream: WheelStream | null,
  kind: 'new' | 'continue' | 'ignore',
  time: number,
  delta: number,
): WheelStream {
  const abs = Math.abs(delta);
  const sign = Math.sign(delta);
  if (kind === 'new' || !stream) {
    return { lastTime: time, lastAbs: abs, peakAbs: abs, sign, settled: false };
  }
  return {
    lastTime: time,
    lastAbs: abs,
    peakAbs: Math.max(stream.peakAbs, abs),
    sign: kind === 'continue' && sign !== 0 ? sign : stream.sign,
    settled: stream.settled,
  };
}
