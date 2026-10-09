// Deltas are normalized to CSS pixels before classification. Only tiny
// cross-axis noise belongs to a horizontal gesture; diagonals remain vertical.
export function wheelEventAxis(deltaX: number, deltaY: number): 'horizontal' | 'vertical' | 'none' {
  if (!deltaX && !deltaY) return 'none';
  return Math.abs(deltaY) <= Math.min(2, Math.abs(deltaX) * 0.08) ? 'horizontal' : 'vertical';
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
