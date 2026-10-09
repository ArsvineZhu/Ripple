export const BACKGROUND_IMAGE_SCHEME = 'ripple-background';

export function normalizeBackgroundImageInput(input: string): string {
  const value = input.trim();
  return /^(["']).*\1$/.test(value) ? value.slice(1, -1) : value;
}

export function backgroundImageUrl(input: string): string | null {
  const source = normalizeBackgroundImageInput(input);
  if (!source || source === 'none') return null;
  if (/^(?:file:|[a-z]:[\\/]|[\\/]|~[\\/])/i.test(source)) {
    return `${BACKGROUND_IMAGE_SCHEME}://image/?source=${encodeURIComponent(source)}`;
  }
  return source;
}
