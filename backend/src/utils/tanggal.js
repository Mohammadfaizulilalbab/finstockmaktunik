// ============================================
// Helper Tanggal — FinStocks
// ============================================
// Database menyimpan waktu dalam UTC, sedangkan "hari" bagi toko
// mengikuti zona waktu server (WIB). Helper ini memastikan string
// "YYYY-MM-DD" dan label tanggal dibaca dalam zona waktu lokal,
// bukan UTC (selisih 7 jam bisa memindahkan transaksi ke hari lain).

/**
 * Baca string "YYYY-MM-DD" sebagai jam 00:00 waktu lokal.
 * `new Date('2026-10-07')` dibaca sebagai 00:00 UTC (= 07:00 WIB),
 * sehingga transaksi 00:00–06:59 WIB akan terlewat.
 * @param {string} tanggal
 * @returns {Date}
 */
const parseTanggalLokal = (tanggal) => {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(tanggal));
  if (!cocok) return new Date(tanggal);
  const [, tahun, bulan, hari] = cocok;
  return new Date(Number(tahun), Number(bulan) - 1, Number(hari));
};

/**
 * Format tanggal ke "YYYY-MM-DD" menurut waktu lokal (bukan UTC)
 * @param {Date} date
 * @returns {string}
 */
const formatTanggalLokal = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

module.exports = { parseTanggalLokal, formatTanggalLokal };
