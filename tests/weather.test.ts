import { describe, expect, it, vi } from 'vitest';
import { fetchCurrentWeather } from '../src/renderer/lib/weather';

describe('current weather', () => {
  it('skips the request when no location is configured', async () => {
    const fetcher = vi.fn(async (_url: URL) => {
      throw new Error('Fetch should not run without a location');
    });

    await expect(fetchCurrentWeather('  ', 'c', fetcher)).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('ignores provider error payloads instead of returning a non-finite temperature', async () => {
    const fetcher = vi.fn(async (url: URL) => {
      expect(url.searchParams.get('q')).toBe('London');
      return {
        ok: false,
        json: async () => ({ error: { code: 1003 } }),
      };
    });

    await expect(fetchCurrentWeather('London', 'c', fetcher)).resolves.toBeNull();
  });

  it('returns a rounded temperature and condition for a valid response', async () => {
    const fetcher = vi.fn(async (url: URL) => {
      expect(url.searchParams.get('q')).toBe('London');
      return {
        ok: true,
        json: async () => ({
          current: {
            temp_c: 18.6,
            temp_f: 65.5,
            condition: { text: 'Partly cloudy' },
          },
        }),
      };
    });

    await expect(fetchCurrentWeather('London', 'c', fetcher)).resolves.toEqual({
      temp: 19,
      status: 'Partly cloudy',
    });
  });
});
