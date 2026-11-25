// ============================================
// Helper Email — FinStocks
// ============================================

/**
 * Normalisasi alamat email agar pencarian tidak peka huruf besar/kecil
 * @param {string|null|undefined} email
 * @returns {string|null} email huruf kecil tanpa spasi, atau null jika kosong
 */
const normalisasiEmail = (email) => {
  const nilai = String(email ?? '').trim().toLowerCase();
  return nilai || null;
};

module.exports = { normalisasiEmail };
