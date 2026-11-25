// ============================================
// Log Aktivitas Service — FinStocks
// ============================================

const prisma = require('../config/db');

/**
 * Catat aktivitas pengguna
 * @param {number} penggunaId
 * @param {string} aksi - deskripsi singkat, mis. "Login ke sistem"
 * @param {import('@prisma/client').Prisma.TransactionClient} [db] - isi saat di dalam transaksi
 */
const catatAktivitas = (penggunaId, aksi, db = prisma) =>
  db.logAktivitas.create({ data: { penggunaId, aksi } });

module.exports = { catatAktivitas };
