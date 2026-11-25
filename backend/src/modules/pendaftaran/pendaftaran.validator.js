// ============================================
// Pendaftaran Validator — FinStocks
// ============================================
// Aturan validasi input untuk endpoint pendaftaran.

const { body, param, query } = require('express-validator');
const { passwordRule } = require('../../utils/passwordPolicy');

const ajukanRules = [
  body('nama')
    .isString().withMessage('Nama wajib diisi')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Nama harus 2–50 karakter'),
  body('email')
    .isString().withMessage('Email wajib diisi')
    .trim()
    .isEmail().withMessage('Format email tidak valid'),
  body('username')
    .isString().withMessage('Username wajib diisi')
    .trim()
    .isLength({ min: 3, max: 15 }).withMessage('Username harus 3–15 karakter')
    .matches(/^[a-zA-Z0-9._]+$/).withMessage('Username hanya boleh huruf, angka, titik, dan garis bawah'),
  passwordRule('password'),
  body('googleCredential').optional().isString().withMessage('Credential Google tidak valid'),
];

const verifikasiEmailRules = [
  body('token').isString().notEmpty().withMessage('Token verifikasi wajib diisi'),
];

const listRules = [
  query('status').optional().isIn(['MENUNGGU', 'DISETUJUI', 'DITOLAK', 'SEMUA']).withMessage('Status tidak valid'),
];

const setujuiRules = [
  param('id').isInt().withMessage('ID tidak valid'),
  body('role').optional().isIn(['OWNER', 'KARYAWAN']).withMessage('Role harus OWNER atau KARYAWAN'),
  body('permissions').optional().isArray().withMessage('Izin akses harus berupa array'),
];

const tolakRules = [
  param('id').isInt().withMessage('ID tidak valid'),
  body('alasan').optional({ values: 'falsy' }).isString().trim()
    .isLength({ max: 500 }).withMessage('Alasan maksimal 500 karakter'),
];

module.exports = { ajukanRules, verifikasiEmailRules, listRules, setujuiRules, tolakRules };
