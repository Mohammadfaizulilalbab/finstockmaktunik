// ============================================
// Middleware Rate Limit — FinStocks
// ============================================
// Membatasi percobaan login dan permintaan yang mengirim email
// agar tidak bisa di-brute force atau dipakai untuk spam.

const { rateLimit } = require('express-rate-limit');
const { sendError } = require('../utils/response');

/**
 * Buat middleware rate limit dengan respons format standar FinStocks
 * @param {{ menit: number, maks: number, pesan: string, hanyaGagal?: boolean }} opsi
 */
const buatLimiter = ({ menit, maks, pesan, hanyaGagal = false }) =>
  rateLimit({
    windowMs: menit * 60 * 1000,
    limit: maks,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Satu toko biasanya memakai satu IP, jadi login yang berhasil tidak ikut dihitung
    skipSuccessfulRequests: hanyaGagal,
    handler: (req, res) => sendError(res, pesan, 429, 'TOO_MANY_REQUESTS'),
  });

// Maks. 10 login gagal per 15 menit per IP
const loginLimiter = buatLimiter({
  menit: 15,
  maks: 10,
  hanyaGagal: true,
  pesan: 'Terlalu banyak percobaan login gagal. Coba lagi dalam 15 menit.',
});

// Maks. 5 pengajuan pendaftaran per 15 menit per IP (tiap pengajuan mengirim email)
const pendaftaranLimiter = buatLimiter({
  menit: 15,
  maks: 5,
  pesan: 'Terlalu banyak pengajuan pendaftaran. Coba lagi dalam 15 menit.',
});

// Maks. 5 permintaan lupa password per 15 menit per IP
const lupaPasswordLimiter = buatLimiter({
  menit: 15,
  maks: 5,
  pesan: 'Terlalu banyak permintaan reset password. Coba lagi dalam 15 menit.',
});

module.exports = { loginLimiter, pendaftaranLimiter, lupaPasswordLimiter };
