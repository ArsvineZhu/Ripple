import { expect, it } from 'vitest';
import { updateClipboardHistory } from '../src/renderer/lib/clipboard';
it('filters empty/image-only reads while preserving meaningful text and history', () => {
  const history = ['https://example.com'];
  for (const empty of ['', ' \n\t', '\u200b\u200d']) {
    expect(updateClipboardHistory(history, empty)).toBe(history);
    expect(updateClipboardHistory([], empty)).toEqual([]);
  }
  expect(updateClipboardHistory(['', 'valid'], '')).toEqual(['valid']);
  expect(updateClipboardHistory(history, history[0]!)).toBe(history);
  expect(updateClipboardHistory(history, '  code\n')).toEqual(['  code\n', ...history]);
});
