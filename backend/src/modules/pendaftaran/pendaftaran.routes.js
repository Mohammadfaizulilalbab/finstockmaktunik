// ============================================
// Pendaftaran Routes — FinStocks
// ============================================
// Publik : ajukan pendaftaran & verifikasi email
// Owner  : lihat, setujui, dan tolak permintaan akun

const express = require('express');
const router = express.Router();
const controller = require('./pendaftaran.controller');
const rules = require('./pendaftaran.validator');
const validate = require('../../middlewares/validate.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { pendaftaranLimiter } = require('../../middlewares/rateLimit.middleware');

const hanyaOwner = [authMiddleware, requireRole('OWNER')];

// ---------- Publik ----------

// POST /api/pendaftaran — Ajukan pendaftaran akun
router.post('/', pendaftaranLimiter, validate(rules.ajukanRules), controller.ajukan);

// POST /api/pendaftaran/verifikasi-email — Konfirmasi email dari link
router.post('/verifikasi-email', validate(rules.verifikasiEmailRules), controller.verifikasiEmail);

// ---------- Owner (superadmin) ----------

// GET /api/pendaftaran?status=MENUNGGU — List permintaan akun
router.get('/', hanyaOwner, validate(rules.listRules), controller.getAll);

// PUT /api/pendaftaran/:id/setujui — Setujui & buat akun
router.put('/:id/setujui', hanyaOwner, validate(rules.setujuiRules), controller.setujui);

// PUT /api/pendaftaran/:id/tolak — Tolak permintaan
router.put('/:id/tolak', hanyaOwner, validate(rules.tolakRules), controller.tolak);

module.exports = router;
