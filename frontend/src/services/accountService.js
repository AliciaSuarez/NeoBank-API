import api from './api';

/**
 * List all accounts for the authenticated user.
 * @returns {Promise<Account[]>}
 */
export async function getAccounts() {
  const response = await api.get('/accounts');
  return response.data;
}

/**
 * Get details for a single account.
 * @param {string} id
 * @returns {Promise<Account>}
 */
export async function getAccount(id) {
  const response = await api.get(`/accounts/${id}`);
  return response.data;
}

/**
 * Open a new account.
 * @param {string} type  "checking" | "savings"
 * @returns {Promise<Account>}
 */
export async function createAccount(type) {
  const response = await api.post('/accounts', { type });
  return response.data;
}

/**
 * Close an account.
 * @param {string} id
 * @returns {Promise<{ message: string }>}
 */
export async function closeAccount(id) {
  const response = await api.patch(`/accounts/${id}/close`);
  return response.data;
}
