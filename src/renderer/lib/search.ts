const URL_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;

export function isValidSearchUrlTemplate(template: string) {
  const trimmed = template.trim();
  if (!trimmed.includes('{query}')) return false;

  try {
    const url = new URL(trimmed.replaceAll('{query}', 'search'));
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function createSearchUrl(input: string, template: string): string | null {
  const query = input.trim();
  if (!query) return null;

  if (URL_SCHEME.test(query) || (query.includes('.') && !/\s/.test(query))) {
    try {
      const url = new URL(URL_SCHEME.test(query) ? query : `https://${query}`);
      return ['http:', 'https:'].includes(url.protocol) && url.hostname ? url.href : null;
    } catch {
      return null;
    }
  }

  if (!isValidSearchUrlTemplate(template)) return null;
  try {
    return new URL(template.trim().replaceAll('{query}', encodeURIComponent(query))).href;
  } catch {
    return null;
  }
}
