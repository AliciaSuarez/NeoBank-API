import api from './api';

/**
 * List all statements for an account.
 * @param {string} accountId
 * @returns {Promise<Statement[]>}
 */
export async function getStatements(accountId) {
  const response = await api.get(`/accounts/${accountId}/statements`);
  return response.data;
}

/**
 * Get a specific monthly statement.
 * @param {string} accountId
 * @param {number|string} year   e.g. 2024
 * @param {number|string} month  e.g. 1
 * @returns {Promise<Statement>}
 */
export async function getStatement(accountId, year, month) {
  const response = await api.get(
    `/accounts/${accountId}/statements/${year}/${month}`
  );
  return response.data;
}
