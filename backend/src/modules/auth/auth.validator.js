// ============================================
// Auth Validator — FinStocks
// ============================================
// Aturan validasi input untuk endpoint autentikasi.

const { body } = require('express-validator');
const { passwordRule } = require('../../utils/passwordPolicy');

const loginRules = [
  body('identifier')
    .isString().withMessage('Email atau username wajib diisi')
    .trim()
    .notEmpty().withMessage('Email atau username wajib diisi'),
  // Saat login password tidak dicek kekuatannya agar akun lama tetap bisa masuk
  body('password')
    .isString().withMessage('Password wajib diisi')
    .notEmpty().withMessage('Password wajib diisi'),
];

const googleLoginRules = [
  body('credential').isString().notEmpty().withMessage('Credential Google wajib diisi'),
];

const forgotPasswordRules = [
  body('email')
    .isString().withMessage('Email wajib diisi')
    .trim()
    .isEmail().withMessage('Format email tidak valid'),
];

const resetPasswordRules = [
  body('token').isString().notEmpty().withMessage('Token reset wajib diisi'),
  passwordRule('password'),
];

module.exports = { loginRules, googleLoginRules, forgotPasswordRules, resetPasswordRules };
