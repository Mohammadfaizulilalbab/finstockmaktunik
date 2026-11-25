// ============================================
// Password Service — FinStocks
// ============================================
// Alur lupa password lewat email:
//   1. forgotPassword → simpan hash token, kirim link ke email
//   2. resetPassword  → cocokkan token, simpan password baru
// Token mentah hanya ada di email; database menyimpan hash-nya.

const prisma = require('../../config/db');
const AppError = require('../../utils/AppError');
const { generateToken, hashToken } = require('../../utils/token');
const { hashPassword } = require('../../utils/password');
const { normalisasiEmail } = require('../../utils/email');
const { RESET_PASSWORD_BERLAKU_MS } = require('../../config/auth.config');
const { catatAktivitas } = require('../../services/logAktivitas.service');
const notifikasi = require('../../services/notifikasi.service');

/**
 * Buat token reset baru untuk pengguna (token lama otomatis tidak berlaku)
 * @param {number} penggunaId
 * @returns {Promise<string>} token mentah untuk dikirim lewat email
 */
const simpanTokenReset = async (penggunaId) => {
  const { token, hash } = generateToken();
  await prisma.pengguna.update({
    where: { id: penggunaId },
    data: {
      resetTokenHash: hash,
      resetTokenExpires: new Date(Date.now() + RESET_PASSWORD_BERLAKU_MS),
    },
  });
  return token;
};

/**
 * Kirim link reset password bila email milik akun aktif.
 * Tidak pernah memberi tahu apakah email terdaftar (mencegah user enumeration).
 * @param {string} email
 */
const forgotPassword = async (email) => {
  const pengguna = await prisma.pengguna.findUnique({ where: { email: normalisasiEmail(email) } });
  if (!pengguna || pengguna.status !== 'AKTIF') return;

  const token = await simpanTokenReset(pengguna.id);
  notifikasi.kirimLinkResetPassword(pengguna, token);
};

/**
 * Cari pengguna pemilik token reset yang masih berlaku
 * @param {string} token
 */
const cariPenggunaDariTokenReset = async (token) => {
  const pengguna = await prisma.pengguna.findUnique({ where: { resetTokenHash: hashToken(token) } });
  if (!pengguna || !pengguna.resetTokenExpires || pengguna.resetTokenExpires < new Date()) {
    throw new AppError(400, 'Link reset password tidak valid atau sudah kedaluwarsa.', 'RESET_TOKEN_INVALID');
  }
  return pengguna;
};

/**
 * Simpan password baru dan hanguskan token reset
 * @param {number} penggunaId
 * @param {string} passwordBaru
 */
const gantiPassword = async (penggunaId, passwordBaru) => {
  const password = await hashPassword(passwordBaru);
  await prisma.pengguna.update({
    where: { id: penggunaId },
    data: { password, resetTokenHash: null, resetTokenExpires: null },
  });
};

/**
 * Reset password memakai token dari email
 * @param {string} token
 * @param {string} passwordBaru - sudah lolos passwordPolicy di validator
 */
const resetPassword = async (token, passwordBaru) => {
  const pengguna = await cariPenggunaDariTokenReset(token);
  await gantiPassword(pengguna.id, passwordBaru);
  await catatAktivitas(pengguna.id, 'Reset password melalui email');
  notifikasi.beritahuPasswordDiubah(pengguna);
};

module.exports = { forgotPassword, resetPassword };
