// ============================================
// Pendaftaran Service — FinStocks
// ============================================
// Sisi PENDAFTAR dari siklus pendaftaran akun:
//   1. ajukanPendaftaran  → simpan permintaan (+ kirim link verifikasi)
//   2. verifikasiEmail    → email valid, permintaan masuk antrean owner
// Sisi OWNER (setujui/tolak) ada di peninjauan.service.js.
//
// Status: BELUM_VERIFIKASI → MENUNGGU → DISETUJUI | DITOLAK
// (pendaftaran lewat Google langsung MENUNGGU karena email sudah diverifikasi Google)

const prisma = require('../../config/db');
const AppError = require('../../utils/AppError');
const { generateToken, hashToken } = require('../../utils/token');
const { hashPassword, verifyPassword } = require('../../utils/password');
const { normalisasiEmail } = require('../../utils/email');
const { VERIFIKASI_EMAIL_BERLAKU_MS } = require('../../config/auth.config');
const { verifyGoogleCredential } = require('../../services/googleAuth.service');
const notifikasi = require('../../services/notifikasi.service');

const STATUS_SEDANG_DIPROSES = ['BELUM_VERIFIKASI', 'MENUNGGU'];

// ============================================
// Pengecekan ketersediaan (dipakai juga oleh peninjauan.service)
// ============================================

/**
 * Pastikan email & username belum dipakai akun yang sudah ada
 * @param {{ email: string, username: string }} identitas
 */
const pastikanAkunBelumAda = async ({ email, username }) => {
  const akun = await prisma.pengguna.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true },
  });
  if (!akun) return;
  if (akun.email === email) {
    throw new AppError(409, 'Email sudah terdaftar pada akun lain', 'EMAIL_EXISTS');
  }
  throw new AppError(409, 'Username sudah digunakan', 'USERNAME_EXISTS');
};

/**
 * Pastikan tidak ada pendaftaran lain yang masih berjalan
 * dengan email/username yang sama
 * @param {{ email: string, username: string }} identitas
 */
const pastikanTidakAdaPendaftaranAktif = async ({ email, username }) => {
  const pendaftaran = await prisma.pendaftaranAkun.findFirst({
    where: {
      OR: [{ email }, { username }],
      AND: [{
        OR: [
          { status: 'MENUNGGU' },
          { status: 'BELUM_VERIFIKASI', verifikasiExpires: { gt: new Date() } },
        ],
      }],
    },
    select: { email: true },
  });
  if (!pendaftaran) return;
  if (pendaftaran.email === email) {
    throw new AppError(409, 'Email ini sudah mengajukan pendaftaran dan sedang menunggu persetujuan owner.', 'REGISTRATION_PENDING');
  }
  throw new AppError(409, 'Username sudah digunakan', 'USERNAME_EXISTS');
};

// ============================================
// Status pendaftaran (dipakai modul auth saat login)
// ============================================

/**
 * Cari pendaftaran terbaru yang belum selesai diproses
 * @param {{ email?: string, username?: string }} kriteria
 */
const cariPendaftaranSedangDiproses = (kriteria) =>
  prisma.pendaftaranAkun.findFirst({
    where: { ...kriteria, status: { in: STATUS_SEDANG_DIPROSES } },
    orderBy: { createdAt: 'desc' },
  });

/**
 * Buat error yang menjelaskan status pendaftaran ke pendaftar
 * @param {'BELUM_VERIFIKASI'|'MENUNGGU'} status
 * @returns {AppError}
 */
const errorStatusPendaftaran = (status) =>
  status === 'MENUNGGU'
    ? new AppError(403, 'Akun Anda masih menunggu persetujuan owner.', 'REGISTRATION_PENDING')
    : new AppError(403, 'Email Anda belum diverifikasi. Cek kotak masuk email Anda.', 'EMAIL_NOT_VERIFIED');

/**
 * Lempar error penjelasan jika identitas ini masih dalam proses pendaftaran.
 * Bila password diberikan, error hanya dilempar jika password cocok
 * (agar orang lain tidak bisa mengintip status pendaftaran seseorang).
 * @param {{ email?: string, username?: string }} kriteria
 * @param {string} [password]
 */
const tolakJikaPendaftaranDiproses = async (kriteria, password) => {
  const pendaftaran = await cariPendaftaranSedangDiproses(kriteria);
  if (!pendaftaran) return;
  if (password !== undefined && !(await verifyPassword(password, pendaftaran.password))) return;
  throw errorStatusPendaftaran(pendaftaran.status);
};

// ============================================
// Pengajuan pendaftaran
// ============================================

/**
 * Rapikan input identitas pendaftar
 * @param {{ nama: string, email: string, username: string }} input
 */
const normalisasiIdentitas = ({ nama, email, username }) => ({
  nama: nama.trim(),
  email: normalisasiEmail(email),
  username: username.trim(),
});

/**
 * Jika pendaftar memakai Google, pastikan email form = email akun Google
 * @param {string|undefined} credential
 * @param {string} email
 * @returns {Promise<string|null>} googleId, atau null jika tanpa Google
 */
const verifikasiKepemilikanGoogle = async (credential, email) => {
  if (!credential) return null;
  const profil = await verifyGoogleCredential(credential);
  if (profil.email !== email) {
    throw new AppError(400, 'Email harus sama dengan email akun Google Anda.', 'GOOGLE_EMAIL_MISMATCH');
  }
  return profil.googleId;
};

/**
 * Hapus pengajuan lama yang belum diverifikasi agar pendaftar bisa mengulang
 * @param {string} email
 */
const hapusPendaftaranBelumTerverifikasi = (email) =>
  prisma.pendaftaranAkun.deleteMany({ where: { email, status: 'BELUM_VERIFIKASI' } });

/**
 * Simpan pendaftaran yang emailnya sudah terverifikasi (via Google)
 * lalu beri tahu owner
 * @param {object} data - identitas + password hash + googleId
 */
const simpanPendaftaranTerverifikasi = async (data) => {
  const pendaftaran = await prisma.pendaftaranAkun.create({
    data: { ...data, status: 'MENUNGGU' },
  });
  await notifikasi.beritahuOwnerPendaftaranBaru(pendaftaran);
  return pendaftaran;
};

/**
 * Simpan pendaftaran yang masih perlu verifikasi email
 * @param {object} data - identitas + password hash
 * @returns {Promise<{ pendaftaran: object, token: string }>}
 */
const simpanPendaftaranBelumTerverifikasi = async (data) => {
  const { token, hash } = generateToken();
  const pendaftaran = await prisma.pendaftaranAkun.create({
    data: {
      ...data,
      status: 'BELUM_VERIFIKASI',
      verifikasiHash: hash,
      verifikasiExpires: new Date(Date.now() + VERIFIKASI_EMAIL_BERLAKU_MS),
    },
  });
  return { pendaftaran, token };
};

/**
 * Kirim email verifikasi; jika gagal, hapus pendaftaran agar bisa diulang
 * @param {object} pendaftaran
 * @param {string} token
 */
const kirimVerifikasiAtauBatalkan = async (pendaftaran, token) => {
  try {
    await notifikasi.kirimVerifikasiEmail(pendaftaran, token);
  } catch (error) {
    console.error('Gagal mengirim email verifikasi:', error.message);
    await prisma.pendaftaranAkun.delete({ where: { id: pendaftaran.id } });
    throw new AppError(502, 'Gagal mengirim email verifikasi. Periksa alamat email atau coba lagi nanti.', 'EMAIL_SEND_FAILED');
  }
};

/**
 * Ajukan pendaftaran akun baru
 * @param {{ nama: string, email: string, username: string, password: string, googleCredential?: string }} input
 * @returns {Promise<{ status: 'BELUM_VERIFIKASI'|'MENUNGGU', email: string }>}
 */
const ajukanPendaftaran = async (input) => {
  const identitas = normalisasiIdentitas(input);
  const googleId = await verifikasiKepemilikanGoogle(input.googleCredential, identitas.email);

  await pastikanAkunBelumAda(identitas);
  await hapusPendaftaranBelumTerverifikasi(identitas.email);
  await pastikanTidakAdaPendaftaranAktif(identitas);

  const password = await hashPassword(input.password);

  if (googleId) {
    const pendaftaran = await simpanPendaftaranTerverifikasi({ ...identitas, password, googleId });
    return { status: pendaftaran.status, email: pendaftaran.email };
  }

  const { pendaftaran, token } = await simpanPendaftaranBelumTerverifikasi({ ...identitas, password });
  await kirimVerifikasiAtauBatalkan(pendaftaran, token);
  return { status: pendaftaran.status, email: pendaftaran.email };
};

// ============================================
// Verifikasi email
// ============================================

/**
 * Cari pendaftaran dari token verifikasi dan pastikan masih berlaku
 * @param {string} token
 */
const cariPendaftaranDariToken = async (token) => {
  const pendaftaran = await prisma.pendaftaranAkun.findUnique({
    where: { verifikasiHash: hashToken(token) },
  });
  if (!pendaftaran || pendaftaran.status !== 'BELUM_VERIFIKASI') {
    throw new AppError(400, 'Link verifikasi tidak valid atau sudah digunakan.', 'VERIFICATION_INVALID');
  }
  if (!pendaftaran.verifikasiExpires || pendaftaran.verifikasiExpires < new Date()) {
    throw new AppError(400, 'Link verifikasi sudah kedaluwarsa. Silakan daftar ulang.', 'VERIFICATION_EXPIRED');
  }
  return pendaftaran;
};

/**
 * Ubah status menjadi MENUNGGU dan hapus token verifikasi
 * @param {number} id
 */
const tandaiEmailTerverifikasi = (id) =>
  prisma.pendaftaranAkun.update({
    where: { id },
    data: { status: 'MENUNGGU', verifikasiHash: null, verifikasiExpires: null },
  });

/**
 * Verifikasi email pendaftar dari link di email
 * @param {string} token
 * @returns {Promise<{ nama: string, email: string }>}
 */
const verifikasiEmail = async (token) => {
  const pendaftaran = await cariPendaftaranDariToken(token);
  const terverifikasi = await tandaiEmailTerverifikasi(pendaftaran.id);
  await notifikasi.beritahuOwnerPendaftaranBaru(terverifikasi);
  return { nama: terverifikasi.nama, email: terverifikasi.email };
};

module.exports = {
  ajukanPendaftaran,
  verifikasiEmail,
  tolakJikaPendaftaranDiproses,
  pastikanAkunBelumAda,
};
