// ============================================
// Helper Token Sekali Pakai — FinStocks
// ============================================
// Token dikirim ke email dalam bentuk asli, tetapi yang disimpan
// di database hanya hash SHA-256-nya. Jika database bocor,
// token yang tersimpan tidak bisa dipakai.

const crypto = require('crypto');

/**
 * Hash token dengan SHA-256
 * @param {string} token
 * @returns {string} hash heksadesimal
 */
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

/**
 * Buat token acak baru
 * @returns {{ token: string, hash: string }}
 */
const generateToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
};

module.exports = { hashToken, generateToken };
