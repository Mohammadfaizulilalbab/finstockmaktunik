// ============================================
// Auth Controller — FinStocks
// ============================================
// Lapisan tipis: ambil input dari request → panggil service → kirim respons.
// Validasi dijalankan di routes, error ditangani asyncHandler.

const authService = require('./auth.service');
const passwordService = require('./password.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

/** POST /api/auth/login — Login dengan email/username + password */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.identifier, req.body.password);
  return sendSuccess(res, 'Login berhasil', result);
});

/** POST /api/auth/google — Login dengan akun Google */
const loginGoogle = asyncHandler(async (req, res) => {
  const result = await authService.loginGoogle(req.body.credential);
  return sendSuccess(res, 'Login berhasil', result);
});

/** POST /api/auth/forgot-password — Kirim link reset password */
const forgotPassword = asyncHandler(async (req, res) => {
  await passwordService.forgotPassword(req.body.email);
  return sendSuccess(res, 'Jika email terdaftar, link reset password telah dikirim. Cek kotak masuk email Anda.');
});

/** POST /api/auth/reset-password — Simpan password baru dari link email */
const resetPassword = asyncHandler(async (req, res) => {
  await passwordService.resetPassword(req.body.token, req.body.password);
  return sendSuccess(res, 'Password berhasil diubah. Silakan login dengan password baru.');
});

/** GET /api/auth/me — Data pengguna yang sedang login */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return sendSuccess(res, 'Data pengguna berhasil diambil', user);
});

/** POST /api/auth/logout — Logout (token dihapus di sisi client) */
const logout = asyncHandler(async (req, res) => sendSuccess(res, 'Logout berhasil'));

module.exports = { login, loginGoogle, forgotPassword, resetPassword, getMe, logout };
