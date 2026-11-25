// ============================================
// Konfigurasi Autentikasi — FinStocks
// ============================================
// Semua angka terkait keamanan akun dikumpulkan di sini
// agar mudah ditinjau dan diubah tanpa mencari ke banyak file.

const MENIT = 60 * 1000;
const JAM = 60 * MENIT;

module.exports = {
  // Biaya hashing bcrypt (semakin besar semakin lambat & aman)
  BCRYPT_ROUNDS: 10,

  // Masa berlaku link verifikasi email pendaftaran
  VERIFIKASI_EMAIL_BERLAKU_MS: 24 * JAM,

  // Masa berlaku link reset password
  RESET_PASSWORD_BERLAKU_MS: 30 * MENIT,
};
