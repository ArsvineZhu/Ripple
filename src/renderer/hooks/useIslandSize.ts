import { animate, useMotionValue, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { interpolatePageSize, SHELL_SPRING } from '../lib/pageSwipe';
import type { PageSize, PageTargets } from '../lib/pageSwipe';

/**
 * Owns the Island shell size. A base value springs to the resting size for non-paging changes
 * (mode, assistant answer, settings width). While paging, the displayed size is derived from the
 * rail offset, interpolating towards the neighbour, so it follows the finger without re-rendering.
 */
export function useIslandSize({
  resting,
  currentTabId,
  pagingCommitRef,
  trackX,
  pageTargets,
  previous,
  following,
  onSettled,
}: {
  resting: PageSize;
  currentTabId: number;
  pagingCommitRef: RefObject<number | null>;
  trackX: MotionValue<number>;
  pageTargets: PageTargets;
  previous: PageSize | null;
  following: PageSize | null;
  onSettled: () => void;
}) {
  const baseWidth = useMotionValue(resting.width);
  const baseHeight = useMotionValue(resting.height);
  const lastResting = useRef(resting);
  const lastTabId = useRef(currentTabId);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useLayoutEffect(() => {
    const before = lastResting.current;
    const pagingCommit =
      lastTabId.current !== currentTabId && pagingCommitRef.current === currentTabId;
    lastResting.current = resting;
    lastTabId.current = currentTabId;
    if (pagingCommit) pagingCommitRef.current = null;
    const follow = (value: MotionValue<number>, from: number, to: number) => {
      // A paging commit moves the rail's zero to the new page; shifting the base by the page size
      // difference keeps the displayed size continuous, then any unfinished spring carries on.
      if (pagingCommit) value.jump(value.get() + (to - from));
      else if (from === to) return;
      if (value.get() === to) return;
      animate(value, to, { ...SHELL_SPRING, onComplete: () => onSettledRef.current() });
    };
    follow(baseWidth, before.width, resting.width);
    follow(baseHeight, before.height, resting.height);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [resting.width, resting.height, currentTabId]);

  const sizeAt = (x: number, width: number, height: number) =>
    interpolatePageSize({
      x,
      targets: pageTargets,
      base: { width, height },
      current: resting,
      previous,
      following,
    });
  const width = useTransform(
    [trackX, baseWidth, baseHeight],
    ([x, w, h]: number[]) => sizeAt(x, w, h).width,
  );
  const height = useTransform(
    [trackX, baseWidth, baseHeight],
    ([x, w, h]: number[]) => sizeAt(x, w, h).height,
  );
  return { width, height };
}
