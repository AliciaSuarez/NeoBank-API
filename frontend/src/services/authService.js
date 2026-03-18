import api from './api';

/**
 * Register a new user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ id: string, email: string, created_at: string }>}
 */
export async function signup(email, password) {
  const response = await api.post('/auth/signup', { email, password });
  return response.data;
}

/**
 * Log in and receive a JWT token.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, userId: string }>}
 */
export async function login(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}
