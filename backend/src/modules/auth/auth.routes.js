// ============================================
// Auth Routes — FinStocks
// ============================================
// Login (password / Google), lupa & reset password, logout, me.
// Pendaftaran akun ada di modul pendaftaran (/api/pendaftaran).

const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const rules = require('./auth.validator');
const validate = require('../../middlewares/validate.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const { loginLimiter, lupaPasswordLimiter } = require('../../middlewares/rateLimit.middleware');

// ---------- Publik ----------

// POST /api/auth/login — Login dengan email atau username
router.post('/login', loginLimiter, validate(rules.loginRules), controller.login);

// POST /api/auth/google — Login dengan akun Google
router.post('/google', loginLimiter, validate(rules.googleLoginRules), controller.loginGoogle);

// POST /api/auth/forgot-password — Kirim link reset password
router.post('/forgot-password', lupaPasswordLimiter, validate(rules.forgotPasswordRules), controller.forgotPassword);

// POST /api/auth/reset-password — Simpan password baru
router.post('/reset-password', validate(rules.resetPasswordRules), controller.resetPassword);

// ---------- Perlu login ----------

// POST /api/auth/logout — Logout pengguna
router.post('/logout', authMiddleware, controller.logout);

// GET /api/auth/me — Data pengguna yang login
router.get('/me', authMiddleware, controller.getMe);

module.exports = router;
