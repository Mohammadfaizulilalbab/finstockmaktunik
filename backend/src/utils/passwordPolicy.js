// ============================================
// Aturan Password — FinStocks
// ============================================
// Password wajib: 8–16 karakter, 1 huruf besar, dan 1 angka.
// Dipakai di pendaftaran, reset password, dan manajemen pengguna.

const { body } = require('express-validator');

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, message: 'minimal 8 karakter' },
  { test: (p) => /[A-Z]/.test(p), message: 'minimal 1 huruf besar (A-Z)' },
  { test: (p) => /[0-9]/.test(p), message: 'minimal 1 angka (0-9)' },
  // 16 karakter tetap di bawah batas 72 byte yang diproses bcrypt
  { test: (p) => p.length <= 16, message: 'maksimal 16 karakter' },
];

/**
 * Daftar aturan yang belum terpenuhi
 * @param {string} password
 * @returns {string[]} pesan aturan yang gagal
 */
const getPasswordErrors = (password) => {
  const value = typeof password === 'string' ? password : '';
  return PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.message);
};

/**
 * Validator express-validator untuk field password
 * @param {string} field - nama field di body request
 */
const passwordRule = (field = 'password') =>
  body(field)
    .isString().withMessage('Password wajib diisi')
    .custom((value) => {
      const errors = getPasswordErrors(value);
      if (errors.length > 0) {
        throw new Error(`Password harus ${errors.join(', ')}`);
      }
      return true;
    });

module.exports = { getPasswordErrors, passwordRule };
