import { useNavigation } from '../src/renderer/hooks/useNavigation';
// @vitest-environment happy-dom
import { act, createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OverlayProvider, useOverlay } from '../src/renderer/components/OverlayProvider';
import { useIslandInteraction } from '../src/renderer/hooks/useIslandInteraction';
import { AppStateProvider } from '../src/renderer/components/AppStateProvider';
import { NotificationProvider } from '../src/renderer/components/NotificationProvider';
import { defaultAppState } from '../src/shared/appState';
let root: Root;
let host: HTMLDivElement;
let interaction: ReturnType<typeof useIslandInteraction>;
let overlay: ReturnType<typeof useOverlay>;
const setMode = vi.fn();
const ignoreMouse = vi.fn(async () => {});
function Harness() {
  const currentInteraction = useIslandInteraction({
    setMode,
    standby: false,
    largeStandby: false,
    leaveDelayMs: 400,
  });
  const currentOverlay = useOverlay();
  useEffect(() => {
    interaction = currentInteraction;
    overlay = currentOverlay;
  });
  return createElement('div', { id: 'Island' });
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  setMode.mockClear();
  ignoreMouse.mockClear();
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: { setIgnoreMouseEvents: ignoreMouse },
  });
  await act(async () => root.render(createElement(OverlayProvider, null, createElement(Harness))));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  Reflect.deleteProperty(window, 'electronAPI');
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('Island position and overlay lifecycle', () => {
  it('consumes a menu dismissal click once and clears it for the next pointer gesture', () => {
    overlay.beginPointerGesture();
    overlay.suppressShellClick();
    expect(overlay.consumeShellClick()).toBe(true);
    expect(overlay.consumeShellClick()).toBe(false);
    overlay.suppressShellClick();
    overlay.beginPointerGesture();
    expect(overlay.consumeShellClick()).toBe(false);
  });
  it('retains expansion through movement-generated leave/focus events and resumes normal leave after animation', async () => {
    await act(async () => {
      interaction.setIsHovered(true);
      interaction.beginPositionChange();
      interaction.geometryExited();
      interaction.leave();
      window.dispatchEvent(new FocusEvent('focusout'));
    });
    expect(setMode.mock.calls).toEqual([['large']]);
    expect(ignoreMouse).toHaveBeenCalledWith(true, true);
    await act(async () => interaction.finishPositionChange());
    expect(setMode.mock.calls).toEqual([['large']]);
    await act(async () => interaction.leave());
    expect(setMode.mock.calls).toEqual([['large']]);
    await act(async () => {
      interaction.setIsHovered(true);
      interaction.leave();
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(setMode).toHaveBeenLastCalledWith('still');
    setMode.mockClear();
    await act(async () => {
      interaction.setIsHovered(true);
      window.dispatchEvent(new FocusEvent('focusout'));
    });
    expect(setMode).not.toHaveBeenCalled();
    await act(async () => {
      interaction.setIsHovered(false);
      window.dispatchEvent(new FocusEvent('focusout'));
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(setMode).toHaveBeenLastCalledWith('still');
  });
  it('keeps an open menu expanded and allows subsequent collapse after closing it', async () => {
    await act(async () => {
      interaction.setIsHovered(true);
      overlay.setOpenId('menu');
    });
    await act(async () => {
      interaction.leave();
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(setMode).not.toHaveBeenCalled();
    expect(ignoreMouse).toHaveBeenCalledWith(true, true);
    await act(async () => overlay.setOpenId(null));
    const trigger = document.createElement('button');
    host.append(trigger);
    await act(async () => {
      trigger.focus();
      interaction.leave();
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(setMode).toHaveBeenLastCalledWith('still');
  });
  it('leaves keyboard events with form controls and open menus, then resumes tab shortcuts outside them', async () => {
    let navigation: ReturnType<typeof useNavigation>;
    function NavigationHarness() {
      const current = useNavigation({
        mode: 'large',
        isDragging: false,
        setMode,
        spotifyTrack: { name: 'Fixture', artist: 'Fixture', state: 'playing', source: 'fixture' },
      });
      useEffect(() => {
        navigation = current;
      });
      return createElement('input', { id: 'editor' });
    }
    const app = createElement(
      NotificationProvider,
      null,
      createElement(
        AppStateProvider,
        { initialState: defaultAppState },
        createElement(NavigationHarness),
      ),
    );
    await act(async () => root.render(app));
    const editor = document.getElementById('editor')!;
    await act(async () =>
      editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })),
    );
    expect(navigation!.currentTabId).toBe(2);
    await act(async () =>
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      ),
    );
    // Adjacent arrow keys spring the page rail first; the page commits only when the spring completes.
    expect(navigation!.currentTabId).toBe(2);
    await act(async () => navigation!.finishTrackAnimation());
    expect(navigation!.currentTabId).toBe(3);
    expect(navigation!.trackX.get()).toBe(0);
    const overlay = document.createElement('div');
    overlay.setAttribute('data-island-overlay', '');
    overlay.innerHTML = '<div role="menu"></div>';
    host.append(overlay);
    await act(async () =>
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: '8', ctrlKey: true, bubbles: true }),
      ),
    );
    expect(navigation!.currentTabId).toBe(3);
    overlay.remove();
    await act(async () =>
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: '8', ctrlKey: true, bubbles: true }),
      ),
    );
    // Ctrl+number jumps straight to a non-adjacent page without animating the rail.
    expect(navigation!.currentTabId).toBe(7);
    expect(navigation!.trackX.get()).toBe(0);
    expect(setMode).toHaveBeenLastCalledWith('large');
  });
});
describe('Page swipe gestures', () => {
  let navigation: ReturnType<typeof useNavigation>;
  function NavigationHarness() {
    const current = useNavigation({
      mode: 'large',
      isDragging: false,
      setMode,
      spotifyTrack: { name: 'Fixture', artist: 'Fixture', state: 'playing', source: 'fixture' },
    });
    useEffect(() => {
      navigation = current;
    });
    return createElement('div', { id: 'pages' });
  }
  async function renderNavigation() {
    await act(async () =>
      root.render(
        createElement(
          NotificationProvider,
          null,
          createElement(
            AppStateProvider,
            { initialState: defaultAppState },
            createElement(NavigationHarness),
          ),
        ),
      ),
    );
  }
  // Positive deltaX moves the content left, towards the following page.
  async function feed(frames: [number, number][], start: number, step = 16) {
    await act(async () => {
      frames.forEach(([deltaX, deltaY], index) =>
        navigation.handleWheelSwipe({
          deltaX,
          deltaY,
          deltaMode: 0,
          timeStamp: start + index * step,
        } as unknown as Parameters<typeof navigation.handleWheelSwipe>[0]),
      );
    });
  }
  const frames = (count: number, deltaX: number, deltaY: number): [number, number][] =>
    Array.from({ length: count }, () => [deltaX, deltaY]);
  const wheel = (deltas: number[], start: number, step = 16) =>
    feed(
      deltas.map((deltaX) => [deltaX, 0] as [number, number]),
      start,
      step,
    );
  const swipe = [40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40];
  const momentumTail = [40, 36, 30, 22, 15, 10, 6, 4, 2, 1, 1];
  it('turns one page for a wheel stream that ends in a momentum tail', async () => {
    await renderNavigation();
    expect(navigation.currentTabId).toBe(2);
    await wheel([...swipe, ...momentumTail], 1000);
    expect(navigation.currentTabId).toBe(3);
    expect(navigation.trackX.get()).toBe(0);
    await act(async () => vi.advanceTimersByTimeAsync(400));
    expect(navigation.currentTabId).toBe(3);
  });
  it('turns two pages for two independent gestures', async () => {
    await renderNavigation();
    await wheel([...swipe, ...momentumTail], 1000);
    expect(navigation.currentTabId).toBe(3);
    await wheel(swipe, 2000);
    expect(navigation.currentTabId).toBe(4);
  });
  it('turns back when the fingers reverse straight after a page turn', async () => {
    await renderNavigation();
    await wheel(swipe, 1000);
    expect(navigation.currentTabId).toBe(3);
    await wheel(
      swipe.map((delta) => -delta),
      1000 + swipe.length * 16,
    );
    expect(navigation.currentTabId).toBe(2);
  });
  it('snaps back when a short swipe is released below half a page', async () => {
    await renderNavigation();
    await wheel([4, 4, 4], 1000, 100);
    await act(async () => vi.advanceTimersByTimeAsync(200));
    expect(navigation.trackX.isAnimating() || navigation.trackX.get() === 0).toBe(true);
    await act(async () => navigation.finishTrackAnimation());
    expect(navigation.currentTabId).toBe(2);
  });
  it('turns one page per arrow key when pressed twice quickly', async () => {
    await renderNavigation();
    const press = () =>
      act(async () =>
        document.body.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
        ),
      );
    await press();
    expect(navigation.currentTabId).toBe(2);
    // The second press lands the first page at once and springs on from the rebased rail.
    await press();
    expect(navigation.currentTabId).toBe(3);
    await act(async () => navigation.finishTrackAnimation());
    expect(navigation.currentTabId).toBe(4);
    expect(navigation.trackX.get()).toBe(0);
  });
  it('keeps paging when the two-finger swipe drifts diagonally', async () => {
    await renderNavigation();
    // 30px across with 32px down is still a swipe on the rail.
    await feed(frames(12, 30, 32), 1000);
    expect(navigation.trackX.get()).toBeCloseTo(-360, 5);
    await act(async () => vi.advanceTimersByTimeAsync(200));
    await act(async () => navigation.finishTrackAnimation());
    expect(navigation.currentTabId).toBe(3);
  });
  it('leaves the rail alone for a two-finger vertical scroll', async () => {
    await renderNavigation();
    await feed(frames(12, 2, 32), 1000);
    await act(async () => vi.advanceTimersByTimeAsync(400));
    expect(navigation.trackX.get()).toBe(0);
    expect(navigation.currentTabId).toBe(2);
  });
  it('turns a second page when the fingers resume inside the gesture gap', async () => {
    await renderNavigation();
    const tail = [36, 30, 22, 15, 10, 6, 3];
    // A full swipe commits at the clamp; its tail decays before the fingers come back.
    await feed(
      [...frames(12, 40, 0), ...tail.map((deltaX) => [deltaX, 0] as [number, number])],
      1000,
    );
    expect(navigation.currentTabId).toBe(3);
    // 150ms later a ramping second swipe rises clearly above that decayed tail.
    const resumeStart = 1000 + (12 + tail.length) * 16 + 150;
    await feed(
      [6, 14, 24, 34, 40, 40, 40, 40].map((deltaX) => [deltaX, 0] as [number, number]),
      resumeStart,
    );
    await act(async () => vi.advanceTimersByTimeAsync(300));
    await act(async () => navigation.finishTrackAnimation());
    expect(navigation.currentTabId).toBe(4);
  });
  it('never turns a second page from a decaying momentum tail', async () => {
    await renderNavigation();
    const tail = [36, 32, 28, 24, 20, 16, 12, 8, 4, 2, 1];
    await feed(
      [...frames(12, 40, 0), ...tail.map((deltaX) => [deltaX, 0] as [number, number])],
      1000,
    );
    await act(async () => vi.advanceTimersByTimeAsync(400));
    await act(async () => navigation.finishTrackAnimation());
    expect(navigation.currentTabId).toBe(3);
  });
  it('turns one page for a long fast swipe with a long momentum tail', async () => {
    await renderNavigation();
    // A fast swipe ramps to a high peak, so its momentum tail stays large for a long time.
    const ramp = [8, 20, 34, 50, 70, 92, 110, 120];
    const tail = [120, 110, 100, 90, 80, 70, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10];
    await feed(
      [...ramp, ...tail].map((deltaX) => [deltaX, 0] as [number, number]),
      1000,
    );
    await act(async () => vi.advanceTimersByTimeAsync(400));
    await act(async () => navigation.finishTrackAnimation());
    expect(navigation.currentTabId).toBe(3);
    expect(navigation.trackX.get()).toBe(0);
  });
});
