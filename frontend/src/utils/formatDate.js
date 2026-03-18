/**
 * Formats an ISO date string into a human-readable locale string.
 * @param {string|null|undefined} isoString
 * @returns {string}  e.g. "Jan 15, 2024"
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats an ISO date string into month + year.
 * @param {string|null|undefined} isoString
 * @returns {string}  e.g. "January 2024"
 */
export function formatMonthYear(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}
