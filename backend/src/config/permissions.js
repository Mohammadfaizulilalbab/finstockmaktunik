// ============================================
// Daftar Izin Akses Halaman — FinStocks
// ============================================
// Satu sumber kebenaran untuk izin akses fitur.
// Dipakai saat menyetujui pendaftaran dan oleh seed data.

const SEMUA_FITUR = ['/', '/transaksi', '/kasir', '/pengeluaran', '/menu', '/persediaan', '/laporan', '/vendor', '/pengguna', '/pengaturan'];

// Fitur yang tidak boleh diberikan ke KARYAWAN
const FITUR_KHUSUS_OWNER = ['/pengguna'];

const FITUR_DEFAULT_KARYAWAN = ['/', '/kasir', '/transaksi', '/pengaturan'];

/**
 * Tentukan izin akses akhir berdasarkan role
 * - OWNER selalu mendapat semua fitur
 * - KARYAWAN hanya fitur yang dikenal & bukan khusus owner,
 *   atau izin default jika tidak ditentukan
 * @param {'OWNER'|'KARYAWAN'} role
 * @param {string[]} [permissions]
 * @returns {string[]}
 */
const tentukanIzinAkses = (role, permissions) => {
  if (role === 'OWNER') return SEMUA_FITUR;
  if (!Array.isArray(permissions)) return FITUR_DEFAULT_KARYAWAN;
  return permissions.filter((fitur) => SEMUA_FITUR.includes(fitur) && !FITUR_KHUSUS_OWNER.includes(fitur));
};

module.exports = { SEMUA_FITUR, FITUR_DEFAULT_KARYAWAN, tentukanIzinAkses };
