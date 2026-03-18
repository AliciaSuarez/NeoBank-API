/**
 * Extracts a readable error message from an Axios error or any thrown value.
 * Resolution order:
 *   1. error.response.data.error
 *   2. error.response.data.message
 *   3. error.message
 *   4. fallback string
 *
 * @param {unknown} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (!error) return 'An unexpected error occurred.';

  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;

  return 'An unexpected error occurred.';
}
