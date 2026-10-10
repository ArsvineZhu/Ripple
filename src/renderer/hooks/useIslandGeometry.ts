import { useCallback, useLayoutEffect, useRef } from 'react';
import { animate, useMotionValue } from 'motion/react';
import { expandedTabSize } from '../lib/tabGeometry';
import { useReducedMotionPreference } from './useReducedMotionPreference';

interface Size {
  width: number;
  height: number;
}
interface Options extends Size {
  expanded: boolean;
  tab: number;
  getTabSize?: (id: number) => Size;
}
interface Geometry extends Size {
  expansion: number;
  fallbackRadius: number;
}

const SPRING = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 40,
  mass: 2.5,
  restDelta: 0.001,
  restSpeed: 0.001,
};
const expandedRadius = (tab: number) => (tab === 0 ? 28 : 30);
const expansionAmount = (value: number) => Math.max(0, Math.min(1, value));
function cornerRadius(width: number, height: number, expansion: number) {
  const halfSize = Math.max(0, Math.min(width, height) / 2);
  return halfSize + (Math.min(30, halfSize / 2) - halfSize) * expansionAmount(expansion);
}

/** One live geometry: mode changes and navigation both continue from its visible values. */
export function useIslandGeometry(options: Options) {
  const width = useMotionValue(options.width);
  const height = useMotionValue(options.height);
  const expansion = useMotionValue(options.expanded ? 1 : 0);
  const radius = useMotionValue(
    cornerRadius(options.width, options.height, options.expanded ? 1 : 0),
  );
  const cornerK = useMotionValue(options.expanded ? 1.62 : 1.3);
  const fallbackRadius = useMotionValue(options.expanded ? expandedRadius(options.tab) : 14);
  const progress = useMotionValue(1);
  const reducedMotion = useReducedMotionPreference();
  const optionsRef = useRef(options);
  const tabMoving = useRef(false);
  const animation = useRef<ReturnType<typeof animate> | null>(null);
  const generation = useRef(0);
  const transition = useRef<{
    source: Geometry;
    target: Geometry;
    handoff: boolean;
  } | null>(null);
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  const paint = useCallback(
    (value: number) => {
      const current = transition.current;
      if (!current) return;
      const { source, target, handoff } = current;
      const interpolate = (key: keyof Geometry) =>
        handoff
          ? target[key] + source[key] * (1 - value)
          : source[key] + (target[key] - source[key]) * value;
      width.set(interpolate('width'));
      height.set(interpolate('height'));
      expansion.set(interpolate('expansion'));
      fallbackRadius.set(interpolate('fallbackRadius'));
      // Publish corners in the same update as dimensions, including zero-duration changes.
      radius.set(cornerRadius(width.get(), height.get(), expansion.get()));
      cornerK.set(1.3 + 0.32 * expansionAmount(expansion.get()));
    },
    [width, height, expansion, fallbackRadius, radius, cornerK],
  );
  useLayoutEffect(() => progress.on('change', paint), [progress, paint]);

  const retarget = useCallback(
    (target: Geometry, handoff = false) => {
      animation.current?.stop();
      animation.current = null;
      const token = ++generation.current;
      const source = {
        width: width.get(),
        height: height.get(),
        expansion: expansion.get(),
        fallbackRadius: fallbackRadius.get(),
      };
      if (handoff) {
        for (const key of Object.keys(source) as (keyof Geometry)[]) source[key] -= target[key];
      }
      transition.current = { source, target, handoff };
      // Reset only the interpolation clock; the first paint is exactly the live geometry.
      progress.jump(0);
      paint(0);
      const unchanged = (Object.keys(source) as (keyof Geometry)[]).every((key) =>
        handoff ? source[key] === 0 : source[key] === target[key],
      );
      if (reducedMotion || unchanged) {
        progress.jump(1);
        paint(1);
        return;
      }
      animation.current = animate(progress, 1, {
        ...SPRING,
        onComplete: () => {
          if (token !== generation.current) return;
          paint(1);
          animation.current = null;
        },
      });
    },
    [width, height, expansion, fallbackRadius, progress, paint, reducedMotion],
  );

  useLayoutEffect(() => {
    if (!options.expanded) tabMoving.current = false;
    if (options.expanded && tabMoving.current && !reducedMotion) return;
    retarget({
      width: options.width,
      height: options.height,
      expansion: options.expanded ? 1 : 0,
      fallbackRadius: options.expanded ? expandedRadius(options.tab) : 14,
    });
  }, [options.width, options.height, options.expanded, options.tab, reducedMotion, retarget]);

  const followTabs = useCallback(
    (from: number, to: number, fraction: number, moving: boolean) => {
      const getSize = optionsRef.current.getTabSize ?? expandedTabSize;
      const source = getSize(from);
      const destination = getSize(to);
      const target: Geometry = {
        width: source.width + (destination.width - source.width) * fraction,
        height: source.height + (destination.height - source.height) * fraction,
        expansion: 1,
        fallbackRadius:
          expandedRadius(from) + (expandedRadius(to) - expandedRadius(from)) * fraction,
      };
      if (!tabMoving.current) retarget(target, true);
      else {
        transition.current!.target = target;
        paint(progress.get());
      }
      // During takeover, the opening residual decays on the same clock for every value.
      // Page position keeps driving the target even through reversals or multiple pages.
      tabMoving.current = moving;
    },
    [retarget, paint, progress],
  );
  useLayoutEffect(
    () => () => {
      generation.current++;
      animation.current?.stop();
    },
    [],
  );

  return { width, height, radius, cornerK, fallbackRadius, followTabs };
}
