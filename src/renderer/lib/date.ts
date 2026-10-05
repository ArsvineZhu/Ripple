export function formatDateShort(
  locale: string,
  input?: string | number | Date,
  timeZone = 'system',
) {
  const date = input === undefined ? new Date() : new Date(input);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(timeZone === 'system' ? {} : { timeZone }),
  }).format(date);
}
export const supportedTimeZones = [
  'UTC',
  ...(typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []),
].filter((timeZone, index, values) => values.indexOf(timeZone) === index);

export function formatTime(locale: string, hour12: boolean, input: Date, timeZone = 'system') {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: hour12 ? 'h12' : 'h23',
    ...(timeZone === 'system' ? {} : { timeZone }),
  };
  const parts = new Intl.DateTimeFormat(locale, options).formatToParts(input);
  return parts
    .filter((part) => part.type !== 'dayPeriod')
    .map((part) => part.value)
    .join('')
    .trim();
}
