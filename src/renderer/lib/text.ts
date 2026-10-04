const textMeasureCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
export function measureTextWidth(
  text: string,
  font: string | number = '600 13px OpenRunde, Arial, sans-serif',
) {
  if (!textMeasureCanvas || !textMeasureCanvas.getContext) return 0;
  const ctx = textMeasureCanvas.getContext('2d');
  if (!ctx) return 0;
  ctx.font = typeof font === 'number' ? `600 ${font}px OpenRunde, Arial, sans-serif` : font;
  return ctx.measureText(text).width;
}
