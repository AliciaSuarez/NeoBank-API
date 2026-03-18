import api from './api';

/**
 * Get the authenticated user's account holder profile.
 * @returns {Promise<AccountHolder>}
 */
export async function getProfile() {
  const response = await api.get('/account-holders/me');
  return response.data;
}

/**
 * Create the account holder profile (required once before using accounts).
 * @param {{ full_name: string, national_id: string, phone: string, address: string }} data
 * @returns {Promise<AccountHolder>}
 */
export async function createProfile(data) {
  const response = await api.post('/account-holders', data);
  return response.data;
}
