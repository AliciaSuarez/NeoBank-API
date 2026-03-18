import api from './api';

/**
 * List all transactions for an account.
 * @param {string} accountId
 * @returns {Promise<Transaction[]>}
 */
export async function getTransactions(accountId) {
  const response = await api.get(`/accounts/${accountId}/transactions`);
  return response.data;
}

/**
 * Create a transaction on an account.
 * @param {string} accountId
 * @param {{ type: string, amount: number, description: string }} data
 * @returns {Promise<Transaction>}
 */
export async function createTransaction(accountId, data) {
  const response = await api.post(`/accounts/${accountId}/transactions`, data);
  return response.data;
}
