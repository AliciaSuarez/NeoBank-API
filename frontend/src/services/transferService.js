import api from './api';

/**
 * Transfer money between two accounts belonging to the authenticated user.
 * @param {string} fromAccountId
 * @param {string} toAccountId
 * @param {number} amount
 * @returns {Promise<{ message: string }>}
 */
export async function transfer(fromAccountId, toAccountId, amount) {
  const response = await api.post('/transfers', {
    from_account_id: fromAccountId,
    to_account_id: toAccountId,
    amount,
  });
  return response.data;
}
