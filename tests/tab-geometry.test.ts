import { describe, expect, it } from 'vitest';
import { expandedTabSize } from '../src/renderer/lib/tabGeometry';
import { SETTINGS_TAB_ID } from '../src/shared/appState';

describe('expandedTabSize', () => {
  it('uses the search page size for empty feature pages and restores populated workflow size', () => {
    expect(expandedTabSize(1, true)).toEqual(expandedTabSize(0));
    expect(expandedTabSize(6, true)).toEqual(expandedTabSize(0));
    expect(expandedTabSize(1, false)).toEqual({ width: 480, height: 210 });
  });
  it('keeps the settings entry compact after the full settings page moved out', () => {
    expect(expandedTabSize(SETTINGS_TAB_ID)).toEqual({ width: 260, height: 100 });
    expect(expandedTabSize(0).width).toBeGreaterThan(expandedTabSize(SETTINGS_TAB_ID).width);
    expect(expandedTabSize(7).height).toBeLessThan(200);
  });
});
