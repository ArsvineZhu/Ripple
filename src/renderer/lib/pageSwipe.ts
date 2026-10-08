export const TRACK_SPRING = { type: 'spring' as const, stiffness: 520, damping: 42, mass: 1 };
/** The shell's own size spring for non-paging changes (mode, assistant answer, settings width). */
export const SHELL_SPRING = { type: 'spring' as const, stiffness: 400, damping: 40, mass: 2.5 };
/** A horizontal wheel stream is settled after this long without events. */
export const WHEEL_SETTLE_MS = 120;
/** A gap this long between wheel events always starts a new gesture. */
const WHEEL_GAP_MS = 180;
/** Movement needed before a wheel gesture commits to the rail or to vertical scrolling. */
const AXIS_LOCK_DISTANCE = 10;
/** 30px across with 32px down is still a swipe on the rail, not a scroll. */
const AXIS_HORIZONTAL_RATIO = 0.6;
/** Same-direction distance after a settled stream that can qualify as a new swipe. */
const RESUME_DISTANCE = 16;
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
  /** Decided once from the first movement so a drifting swipe stays on a single axis. */
  axis: 'horizontal' | 'vertical' | null;
  /** Signed movement accumulated before the axis was decided. */
  axisX: number;
  axisY: number;
  /** Same-direction distance accumulated after the stream settled. */
  resume: number;
  /** Smallest magnitude seen since the stream settled; a resume must rise clearly above it. */
  tailAbs: number;
  /** Set once the tail decays below 60% of its peak; a later re-acceleration is a new gesture. */
  faded: boolean;
};

/** Decides the gesture axis as soon as there is enough movement to tell the axes apart. */
function lockWheelAxis(stream: WheelStream): WheelStream {
  if (stream.axis !== null) return stream;
  if (Math.abs(stream.axisX) + Math.abs(stream.axisY) < AXIS_LOCK_DISTANCE) return stream;
  const horizontal = Math.abs(stream.axisX) >= Math.abs(stream.axisY) * AXIS_HORIZONTAL_RATIO;
  return { ...stream, axis: horizontal ? 'horizontal' : 'vertical' };
}

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
  // A settled stream only resumes once its tail has decayed and the fingers re-accelerate clearly
  // above that tail, so a decaying momentum tail can never turn a second page.
  const faded = stream.faded || stream.lastAbs < stream.peakAbs * 0.6;
  const rising = abs >= Math.max(stream.tailAbs * 1.5, stream.tailAbs + 8);
  if (faded && rising && stream.resume + abs >= RESUME_DISTANCE) return 'new';
  return 'ignore';
}

export function advanceWheelStream(
  stream: WheelStream | null,
  kind: 'new' | 'continue' | 'ignore',
  time: number,
  delta: number,
  verticalDelta = 0,
): WheelStream {
  const abs = Math.abs(delta);
  const sign = Math.sign(delta);
  if (kind === 'new' || !stream) {
    return lockWheelAxis({
      lastTime: time,
      lastAbs: abs,
      peakAbs: abs,
      sign,
      settled: false,
      axis: null,
      axisX: delta,
      axisY: verticalDelta,
      resume: 0,
      tailAbs: abs,
      faded: false,
    });
  }
  const axisLocked = stream.axis !== null;
  const sameSign = sign === 0 || sign === stream.sign;
  return lockWheelAxis({
    lastTime: time,
    lastAbs: abs,
    peakAbs: Math.max(stream.peakAbs, abs),
    sign: kind === 'continue' && sign !== 0 ? sign : stream.sign,
    settled: stream.settled,
    axis: stream.axis,
    axisX: axisLocked ? stream.axisX : stream.axisX + delta,
    axisY: axisLocked ? stream.axisY : stream.axisY + verticalDelta,
    resume: stream.settled && kind === 'ignore' && sameSign ? stream.resume + abs : stream.resume,
    tailAbs: stream.settled ? Math.min(stream.tailAbs, abs) : stream.tailAbs,
    faded: stream.faded || stream.lastAbs < stream.peakAbs * 0.6,
  });
}

export type WheelGestureUpdate = {
  stream: WheelStream;
  kind: 'new' | 'continue' | 'ignore';
  /** Rail movement for this event; the pre-lock accumulation lands on the deciding event. */
  movement: number;
  /** Whether a new horizontal gesture must take the rail over from any running spring. */
  startsGesture: boolean;
};

/** Classifies one wheel event, decides the gesture axis and reports the movement it carries. */
export function updateWheelGesture(
  stream: WheelStream | null,
  time: number,
  deltaX: number,
  deltaY: number,
): WheelGestureUpdate {
  const kind = classifyWheel(stream, time, deltaX);
  const next = advanceWheelStream(stream, kind, time, deltaX, deltaY);
  const horizontal = next.axis === 'horizontal';
  const decidedNow = horizontal && stream?.axis !== 'horizontal';
  return {
    stream: next,
    kind,
    movement: horizontal && kind !== 'ignore' ? (decidedNow ? next.axisX : deltaX) : 0,
    startsGesture: horizontal && kind === 'new',
  };
}
