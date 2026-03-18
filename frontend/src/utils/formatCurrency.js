/**
 * Formats a number as a USD currency string.
 * @param {number} amount
 * @returns {string}  e.g. "$1,234.56"
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
