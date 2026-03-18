import api from './api';

/**
 * List all cards for an account.
 * @param {string} accountId
 * @returns {Promise<Card[]>}
 */
export async function getCards(accountId) {
  const response = await api.get(`/accounts/${accountId}/cards`);
  return response.data;
}

/**
 * Request a new credit card for an account.
 * @param {string} accountId
 * @returns {Promise<Card>}
 */
export async function requestCard(accountId) {
  const response = await api.post(`/accounts/${accountId}/cards`);
  return response.data;
}

/**
 * Block a card.
 * @param {string} cardId
 * @returns {Promise<Card>}
 */
export async function blockCard(cardId) {
  const response = await api.patch(`/cards/${cardId}/block`);
  return response.data;
}

/**
 * Unblock a card.
 * @param {string} cardId
 * @returns {Promise<Card>}
 */
export async function unblockCard(cardId) {
  const response = await api.patch(`/cards/${cardId}/unblock`);
  return response.data;
}

/**
 * Pay card balance from a linked account.
 * @param {string} cardId
 * @param {string} accountId  the account to debit
 * @param {number} amount
 * @returns {Promise<{ message: string }>}
 */
export async function payCard(cardId, accountId, amount) {
  const response = await api.post(`/cards/${cardId}/pay`, {
    account_id: accountId,
    amount,
  });
  return response.data;
}
