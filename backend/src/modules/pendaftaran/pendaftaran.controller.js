// ============================================
// Pendaftaran Controller — FinStocks
// ============================================
// Lapisan tipis: ambil input dari request → panggil service → kirim respons.
// Validasi dijalankan di routes, error ditangani asyncHandler.

const pendaftaranService = require('./pendaftaran.service');
const peninjauanService = require('./peninjauan.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const PESAN_PENGAJUAN = {
  BELUM_VERIFIKASI: 'Pendaftaran berhasil. Cek email Anda untuk verifikasi.',
  MENUNGGU: 'Pendaftaran berhasil dikirim dan menunggu persetujuan owner.',
};

/** POST /api/pendaftaran — Ajukan pendaftaran akun (publik) */
const ajukan = asyncHandler(async (req, res) => {
  const result = await pendaftaranService.ajukanPendaftaran(req.body);
  return sendSuccess(res, PESAN_PENGAJUAN[result.status], result, 201);
});

/** POST /api/pendaftaran/verifikasi-email — Verifikasi email pendaftar (publik) */
const verifikasiEmail = asyncHandler(async (req, res) => {
  const result = await pendaftaranService.verifikasiEmail(req.body.token);
  return sendSuccess(res, 'Email berhasil diverifikasi. Pendaftaran menunggu persetujuan owner.', result);
});

/** GET /api/pendaftaran — Daftar permintaan akun (owner) */
const getAll = asyncHandler(async (req, res) => {
  const data = await peninjauanService.getAll(req.query.status);
  return sendSuccess(res, 'Berhasil mengambil data pendaftaran', data);
});

/** PUT /api/pendaftaran/:id/setujui — Setujui & buat akun (owner) */
const setujui = asyncHandler(async (req, res) => {
  const akun = await peninjauanService.setujui(req.params.id, req.body, req.user.id);
  return sendSuccess(res, `Akun ${akun.username} berhasil dibuat`, akun, 201);
});

/** PUT /api/pendaftaran/:id/tolak — Tolak permintaan (owner) */
const tolak = asyncHandler(async (req, res) => {
  await peninjauanService.tolak(req.params.id, req.body.alasan, req.user.id);
  return sendSuccess(res, 'Pendaftaran berhasil ditolak');
});

module.exports = { ajukan, verifikasiEmail, getAll, setujui, tolak };
