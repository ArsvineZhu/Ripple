export function formatDateShort(input?: string | number | Date) {
  const date = input ? new Date(input) : new Date();
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date provided to formatDateShort');
  }
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  const day = date.getDate();
  return `${weekday}, ${month} ${day}`;
}
