// ============================================
// Auth Service — FinStocks
// ============================================
// Autentikasi pengguna:
//   - login       → email ATAU username + password
//   - loginGoogle → ID token dari tombol "Masuk dengan Google"
//   - getMe       → profil pengguna yang sedang login
// Lupa/reset password ada di password.service.js.

const prisma = require('../../config/db');
const AppError = require('../../utils/AppError');
const { verifyPassword, simulateVerifyPassword } = require('../../utils/password');
const { normalisasiEmail } = require('../../utils/email');
const { verifyGoogleCredential } = require('../../services/googleAuth.service');
const { tolakJikaPendaftaranDiproses } = require('../pendaftaran/pendaftaran.service');
const { buatSesi, toPublicUser } = require('./auth.session');

/**
 * Error kredensial salah (pesan sama untuk akun tidak ada & password salah)
 * @returns {AppError}
 */
const errorKredensialSalah = () =>
  new AppError(401, 'Email/username atau password salah', 'INVALID_CREDENTIALS');

/**
 * Ubah input login menjadi kriteria pencarian Prisma
 * @param {string} identifier - email atau username
 * @returns {{ email: string } | { username: string }}
 */
const kriteriaDariIdentifier = (identifier) => {
  const nilai = identifier.trim();
  return nilai.includes('@') ? { email: normalisasiEmail(nilai) } : { username: nilai };
};

/**
 * Tolak login jika akun dinonaktifkan owner
 * @param {{ status: string }} pengguna
 */
const pastikanAkunAktif = (pengguna) => {
  if (pengguna.status === 'NONAKTIF') {
    throw new AppError(403, 'Akun Anda telah dinonaktifkan. Hubungi owner.', 'ACCOUNT_DISABLED');
  }
};

/**
 * Login dengan email/username + password
 * @param {string} identifier
 * @param {string} password
 * @returns {Promise<{ token: string, user: object }>}
 */
const login = async (identifier, password) => {
  const kriteria = kriteriaDariIdentifier(identifier);
  const pengguna = await prisma.pengguna.findUnique({ where: kriteria });

  if (!pengguna) {
    await simulateVerifyPassword(password);
    await tolakJikaPendaftaranDiproses(kriteria, password);
    throw errorKredensialSalah();
  }

  if (!(await verifyPassword(password, pengguna.password))) {
    throw errorKredensialSalah();
  }

  pastikanAkunAktif(pengguna);
  return buatSesi(pengguna, 'Login ke sistem');
};

/**
 * Cari pengguna dari profil Google: utamakan googleId, lalu email
 * @param {{ googleId: string, email: string }} profil
 */
const cariPenggunaGoogle = async ({ googleId, email }) =>
  (await prisma.pengguna.findUnique({ where: { googleId } })) ||
  prisma.pengguna.findUnique({ where: { email } });

/**
 * Tolak jika email cocok tetapi akun Google yang dipakai berbeda
 * (mis. alamat email yang didaur ulang)
 * @param {{ googleId: string|null }} pengguna
 * @param {string} googleId
 */
const pastikanAkunGoogleCocok = (pengguna, googleId) => {
  if (pengguna.googleId && pengguna.googleId !== googleId) {
    throw new AppError(401, 'Akun Google ini tidak cocok dengan akun yang terdaftar.', 'GOOGLE_ACCOUNT_MISMATCH');
  }
};

/**
 * Tautkan akun Google saat pertama kali dipakai login
 * @param {object} pengguna
 * @param {string} googleId
 * @returns {Promise<object>} pengguna terbaru
 */
const tautkanAkunGoogle = (pengguna, googleId) => {
  if (pengguna.googleId) return pengguna;
  return prisma.pengguna.update({ where: { id: pengguna.id }, data: { googleId } });
};

/**
 * Login dengan akun Google
 * @param {string} credential - ID token dari Google Identity Services
 * @returns {Promise<{ token: string, user: object }>}
 */
const loginGoogle = async (credential) => {
  const profil = await verifyGoogleCredential(credential);
  const pengguna = await cariPenggunaGoogle(profil);

  if (!pengguna) {
    await tolakJikaPendaftaranDiproses({ email: profil.email });
    throw new AppError(404, 'Akun Google ini belum terdaftar. Silakan daftar terlebih dahulu.', 'GOOGLE_NOT_REGISTERED');
  }

  pastikanAkunGoogleCocok(pengguna, profil.googleId);
  pastikanAkunAktif(pengguna);

  const akun = await tautkanAkunGoogle(pengguna, profil.googleId);
  return buatSesi(akun, 'Login ke sistem (Google)');
};

/**
 * Ambil data pengguna yang sedang login
 * @param {number} userId - ID pengguna dari token
 * @returns {Promise<object>} data pengguna tanpa field sensitif
 */
const getMe = async (userId) => {
  const pengguna = await prisma.pengguna.findUnique({ where: { id: userId } });
  if (!pengguna) {
    throw new AppError(404, 'Pengguna tidak ditemukan', 'USER_NOT_FOUND');
  }
  return toPublicUser(pengguna);
};

module.exports = { login, loginGoogle, getMe };
