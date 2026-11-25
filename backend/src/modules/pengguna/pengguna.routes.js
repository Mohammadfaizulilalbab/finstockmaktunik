// ============================================
// Pengguna Routes — FinStocks
// ============================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const penggunaController = require('./pengguna.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { passwordRule } = require('../../utils/passwordPolicy');

// Semua route pengguna membutuhkan auth + role OWNER
router.use(authMiddleware);
router.use(requireRole('OWNER'));

// GET /api/pengguna — List semua pengguna
router.get('/', penggunaController.getAll);

// GET /api/pengguna/:id — Detail pengguna
router.get('/:id', penggunaController.getById);

// POST /api/pengguna — Tambah pengguna baru
router.post('/', [
  body('nama').notEmpty().withMessage('Nama wajib diisi'),
  body('username').notEmpty().withMessage('Username wajib diisi')
    .isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Format email tidak valid'),
  passwordRule('password'),
  body('role').optional().isIn(['OWNER', 'KARYAWAN']).withMessage('Role harus OWNER atau KARYAWAN'),
], penggunaController.create);

// PUT /api/pengguna/:id — Edit pengguna
router.put('/:id', [
  body('nama').optional().notEmpty().withMessage('Nama tidak boleh kosong'),
  body('username').optional().isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Format email tidak valid'),
  body('role').optional().isIn(['OWNER', 'KARYAWAN']).withMessage('Role harus OWNER atau KARYAWAN'),
  body('status').optional().isIn(['AKTIF', 'NONAKTIF']).withMessage('Status harus AKTIF atau NONAKTIF'),
], penggunaController.update);

// DELETE /api/pengguna/:id — Hapus pengguna
router.delete('/:id', penggunaController.remove);

// PUT /api/pengguna/:id/reset-password — Reset password
router.put('/:id/reset-password', [
  passwordRule('newPassword'),
], penggunaController.resetPassword);

module.exports = router;
