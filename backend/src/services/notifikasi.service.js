// ============================================
// Notifikasi Service — FinStocks
// ============================================
// Menentukan SIAPA menerima email dan KAPAN dikirim.
// Modul lain cukup memanggil fungsi bernama sesuai kejadian,
// tanpa tahu detail template atau SMTP.
//
// - kirimVerifikasiEmail di-await: jika gagal, pendaftaran dibatalkan
// - notifikasi lain dikirim di latar belakang (tidak menggagalkan proses)

const prisma = require('../config/db');
const { sendMail, sendMailInBackground } = require('./email/mailer');
const templates = require('./email/templates');

/**
 * Kirim link verifikasi email ke pendaftar (wajib berhasil)
 * @param {{ nama: string, email: string }} pendaftar
 * @param {string} token - token verifikasi mentah
 */
const kirimVerifikasiEmail = (pendaftar, token) =>
  sendMail({ to: pendaftar.email, ...templates.verifikasiEmail({ nama: pendaftar.nama, token }) });

/**
 * Beri tahu semua owner aktif yang punya email bahwa ada pendaftaran baru
 * @param {{ nama: string, email: string, username: string }} pendaftar
 */
const beritahuOwnerPendaftaranBaru = async (pendaftar) => {
  const owners = await prisma.pengguna.findMany({
    where: { role: 'OWNER', status: 'AKTIF', email: { not: null } },
    select: { nama: true, email: true },
  });

  owners.forEach((owner) => {
    sendMailInBackground({ to: owner.email, ...templates.pendaftaranBaru({ namaOwner: owner.nama, pendaftar }) });
  });
};

/**
 * @param {{ nama: string, email: string, username: string }} pengguna
 */
const beritahuAkunDisetujui = (pengguna) =>
  sendMailInBackground({ to: pengguna.email, ...templates.akunDisetujui(pengguna) });

/**
 * @param {{ nama: string, email: string }} pendaftar
 * @param {string|null} alasan
 */
const beritahuPendaftaranDitolak = (pendaftar, alasan) =>
  sendMailInBackground({ to: pendaftar.email, ...templates.akunDitolak({ nama: pendaftar.nama, alasan }) });

/**
 * @param {{ nama: string, email: string }} pengguna
 * @param {string} token - token reset mentah
 */
const kirimLinkResetPassword = (pengguna, token) =>
  sendMailInBackground({ to: pengguna.email, ...templates.resetPassword({ nama: pengguna.nama, token }) });

/**
 * @param {{ nama: string, email: string|null }} pengguna
 */
const beritahuPasswordDiubah = (pengguna) => {
  if (!pengguna.email) return;
  sendMailInBackground({ to: pengguna.email, ...templates.passwordDiubah({ nama: pengguna.nama }) });
};

module.exports = {
  kirimVerifikasiEmail,
  beritahuOwnerPendaftaranBaru,
  beritahuAkunDisetujui,
  beritahuPendaftaranDitolak,
  kirimLinkResetPassword,
  beritahuPasswordDiubah,
};
