// ============================================
// Auth API — FinStocks
// ============================================
// Semua pemanggilan endpoint /api/auth dikumpulkan di sini
// agar halaman tidak perlu tahu URL dan bentuk respons.

import axiosInstance from './axiosInstance';

/**
 * Login dengan email atau username
 * @param {string} identifier
 * @param {string} password
 * @returns {Promise<{ token: string, user: object }>}
 */
export const login = async (identifier, password) => {
  const response = await axiosInstance.post('/auth/login', { identifier, password });
  return response.data.data;
};

/**
 * Login dengan credential dari Google Identity Services
 * @param {string} credential - ID token Google
 * @returns {Promise<{ token: string, user: object }>}
 */
export const loginGoogle = async (credential) => {
  const response = await axiosInstance.post('/auth/google', { credential });
  return response.data.data;
};

/**
 * Minta link reset password dikirim ke email
 * @param {string} email
 * @returns {Promise<string>} pesan dari server
 */
export const forgotPassword = async (email) => {
  const response = await axiosInstance.post('/auth/forgot-password', { email });
  return response.data.message;
};

/**
 * Simpan password baru memakai token dari email
 * @param {string} token
 * @param {string} password
 * @returns {Promise<string>} pesan dari server
 */
export const resetPassword = async (token, password) => {
  const response = await axiosInstance.post('/auth/reset-password', { token, password });
  return response.data.message;
};
