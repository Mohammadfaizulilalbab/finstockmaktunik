// ============================================
// Daftar Izin Akses Fitur — FinStocks
// ============================================
// Harus sinkron dengan backend/src/config/permissions.js

export const DAFTAR_FITUR = [
  { id: '/', label: 'Dashboard' },
  { id: '/kasir', label: 'Kasir' },
  { id: '/transaksi', label: 'Riwayat Transaksi' },
  { id: '/pengeluaran', label: 'Pengeluaran' },
  { id: '/menu', label: 'Menu Makanan' },
  { id: '/persediaan', label: 'Stok Persediaan' },
  { id: '/laporan', label: 'Laporan Keuangan' },
  { id: '/vendor', label: 'Kelola Vendor' },
  { id: '/pengaturan', label: 'Pengaturan' },
];

export const FITUR_DEFAULT_KARYAWAN = ['/', '/kasir', '/transaksi', '/pengaturan'];
