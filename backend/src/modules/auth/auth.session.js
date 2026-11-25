// ============================================
// Sesi Login — FinStocks
// ============================================
// Membuat JWT untuk pengguna yang sudah lolos autentikasi
// dan menyiapkan data pengguna yang aman dikirim ke client.

const { signToken } = require('../../utils/jwt');
const { catatAktivitas } = require('../../services/logAktivitas.service');

/**
 * Hapus field sensitif dari data pengguna
 * @param {object} pengguna - record Pengguna dari Prisma
 * @returns {object} data publik + penanda googleTerhubung
 */
const toPublicUser = (pengguna) => {
  const { password, resetTokenHash, resetTokenExpires, googleId, ...data } = pengguna;
  return { ...data, googleTerhubung: Boolean(googleId) };
};

/**
 * Terbitkan JWT, catat log login, dan kembalikan data sesi
 * @param {object} pengguna - record Pengguna dari Prisma
 * @param {string} aksi - teks log, mis. "Login ke sistem (Google)"
 * @returns {Promise<{ token: string, user: object }>}
 */
const buatSesi = async (pengguna, aksi) => {
  const token = signToken({
    id: pengguna.id,
    username: pengguna.username,
    role: pengguna.role,
    permissions: pengguna.permissions || [],
  });

  await catatAktivitas(pengguna.id, aksi);

  return { token, user: toPublicUser(pengguna) };
};

module.exports = { buatSesi, toPublicUser };
