// ============================================
// Template Email — FinStocks
// ============================================
// Isi setiap jenis email. Tiap fungsi hanya menyusun konten
// dan mengembalikan { subject, text, html }.

const { buatEmail } = require('./layout');

/**
 * URL frontend tanpa garis miring di akhir
 * @returns {string}
 */
const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const verifikasiEmail = ({ nama, token }) =>
  buatEmail({
    subject: 'Verifikasi email pendaftaran akun FinStocks',
    sapaan: `Halo ${nama},`,
    paragraf: [
      'Terima kasih telah mendaftar di FinStocks. Konfirmasi bahwa email ini milik Anda dengan menekan tombol di bawah.',
      'Setelah email terverifikasi, permintaan akun Anda akan diteruskan ke owner untuk disetujui.',
    ],
    tombol: { label: 'Verifikasi Email', url: `${frontendUrl()}/verifikasi-email?token=${token}` },
    catatan: 'Link berlaku 24 jam. Abaikan email ini jika Anda tidak merasa mendaftar.',
  });

const pendaftaranBaru = ({ namaOwner, pendaftar }) =>
  buatEmail({
    subject: `Permintaan akun baru: ${pendaftar.nama}`,
    sapaan: `Halo ${namaOwner},`,
    paragraf: [
      `${pendaftar.nama} (${pendaftar.email}) meminta akun dengan username "${pendaftar.username}".`,
      'Tinjau dan setujui atau tolak permintaan ini di halaman Pengguna.',
    ],
    tombol: { label: 'Tinjau Permintaan', url: `${frontendUrl()}/pengguna` },
  });

const akunDisetujui = ({ nama, username }) =>
  buatEmail({
    subject: 'Akun FinStocks Anda telah disetujui',
    sapaan: `Halo ${nama},`,
    paragraf: [
      'Permintaan akun Anda telah disetujui oleh owner.',
      `Anda sekarang bisa masuk dengan username "${username}" atau email ini, memakai password yang Anda buat saat mendaftar atau tombol Masuk dengan Google.`,
    ],
    tombol: { label: 'Masuk ke FinStocks', url: `${frontendUrl()}/login` },
  });

const akunDitolak = ({ nama, alasan }) =>
  buatEmail({
    subject: 'Permintaan akun FinStocks ditolak',
    sapaan: `Halo ${nama},`,
    paragraf: [
      'Mohon maaf, permintaan akun Anda tidak disetujui oleh owner.',
      ...(alasan ? [`Alasan: ${alasan}`] : []),
    ],
    catatan: 'Hubungi owner jika menurut Anda ini sebuah kesalahan.',
  });

const resetPassword = ({ nama, token }) =>
  buatEmail({
    subject: 'Reset password akun FinStocks',
    sapaan: `Halo ${nama},`,
    paragraf: ['Kami menerima permintaan untuk mereset password akun Anda. Tekan tombol di bawah untuk membuat password baru.'],
    tombol: { label: 'Buat Password Baru', url: `${frontendUrl()}/reset-password?token=${token}` },
    catatan: 'Link berlaku 30 menit dan hanya bisa dipakai sekali. Abaikan email ini jika Anda tidak meminta reset password.',
  });

const passwordDiubah = ({ nama }) =>
  buatEmail({
    subject: 'Password akun FinStocks Anda telah diubah',
    sapaan: `Halo ${nama},`,
    paragraf: ['Password akun Anda baru saja diubah melalui fitur lupa password.'],
    catatan: 'Jika bukan Anda yang melakukannya, segera hubungi owner.',
  });

module.exports = {
  verifikasiEmail,
  pendaftaranBaru,
  akunDisetujui,
  akunDitolak,
  resetPassword,
  passwordDiubah,
};
