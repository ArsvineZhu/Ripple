export function formatDateShort(locale: string, input?: string | number | Date) {
  const date = input === undefined ? new Date() : new Date(input);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
export function formatTime(locale: string, hour12: boolean, input: Date) {
  const parts = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: hour12 ? 'h12' : 'h23',
  }).formatToParts(input);
  return parts
    .filter((part) => part.type !== 'dayPeriod')
    .map((part) => part.value)
    .join('')
    .trim();
}
