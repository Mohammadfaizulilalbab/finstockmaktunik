// ============================================
// Aturan Password — FinStocks
// ============================================
// Cermin dari backend/src/utils/passwordPolicy.js.
// Server tetap memvalidasi ulang; aturan di sini hanya untuk
// memberi umpan balik langsung saat pengguna mengetik.

export const PASSWORD_MAX_LENGTH = 16;

export const PASSWORD_RULES = [
  { id: 'panjang', label: 'Minimal 8 karakter', test: (password) => password.length >= 8 },
  { id: 'hurufBesar', label: 'Minimal 1 huruf besar (A-Z)', test: (password) => /[A-Z]/.test(password) },
  { id: 'angka', label: 'Minimal 1 angka (0-9)', test: (password) => /[0-9]/.test(password) },
];

/**
 * Apakah password memenuhi semua aturan
 * @param {string} password
 * @returns {boolean}
 */
export const isPasswordValid = (password) =>
  password.length <= PASSWORD_MAX_LENGTH && PASSWORD_RULES.every((rule) => rule.test(password));
