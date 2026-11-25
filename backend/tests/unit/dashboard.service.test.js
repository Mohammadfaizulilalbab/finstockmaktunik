// ============================================
// Unit Test — Fitur Dashboard
// ============================================
// Unit yang diuji: src/modules/dashboard/dashboard.service.js
// Test double:
//   - Stub : prisma.transaksi.aggregate/count, prisma.pengeluaran.aggregate,
//            prisma.itemTransaksi.groupBy, prisma.menu.findMany, prisma.persediaan.findMany
//   - Fake : jam sistem dipalsukan (jest.useFakeTimers) agar "hari ini" selalu sama

jest.mock('../../src/config/db', () => ({
  transaksi: { aggregate: jest.fn(), count: jest.fn() },
  pengeluaran: { aggregate: jest.fn() },
  itemTransaksi: { groupBy: jest.fn() },
  menu: { findMany: jest.fn() },
  persediaan: { findMany: jest.fn() },
}));

const prisma = require('../../src/config/db');
const { getSummary, getGrafik, getMenuTerlaris, getStokKritis } = require('../../src/modules/dashboard/dashboard.service');

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: new Date(2026, 10, 25, 14, 30) }); // Rabu, 25 Nov 2026 14:30 WIB
});
afterEach(() => jest.useRealTimers());

describe('Ringkasan hari ini', () => {
  test('DB-01: ada penjualan → total pendapatan, jumlah transaksi, tunai & QRIS', async () => {
    // Arrange
    prisma.transaksi.aggregate.mockResolvedValue({ _sum: { total: 250000 } });
    prisma.transaksi.count
      .mockResolvedValueOnce(10) // semua
      .mockResolvedValueOnce(6) // tunai
      .mockResolvedValueOnce(4); // QRIS

    // Act
    const hasil = await getSummary();

    // Assert
    expect(hasil).toEqual({ totalPendapatan: 250000, totalTransaksi: 10, transaksiTunai: 6, transaksiQris: 4 });
    const { where } = prisma.transaksi.aggregate.mock.calls[0][0];
    expect(where.status).toBe('SELESAI');
    expect(where.waktu.gte).toEqual(new Date(2026, 10, 25));
    expect(where.waktu.lt).toEqual(new Date(2026, 10, 26));
  });

  test('DB-02: belum ada penjualan hari ini → pendapatan 0 (bukan null)', async () => {
    // Arrange
    prisma.transaksi.aggregate.mockResolvedValue({ _sum: { total: null } });
    prisma.transaksi.count.mockResolvedValue(0);

    // Act
    const hasil = await getSummary();

    // Assert
    expect(hasil.totalPendapatan).toBe(0);
  });
});

describe('Grafik 7 hari', () => {
  test('DB-03: grafik berisi 7 hari berurutan dan nilai kosong menjadi 0', async () => {
    // Arrange
    prisma.transaksi.aggregate.mockResolvedValue({ _sum: { total: null } });
    prisma.transaksi.aggregate.mockResolvedValueOnce({ _sum: { total: '150000' } });
    prisma.pengeluaran.aggregate.mockResolvedValue({ _sum: { jumlah: null } });
    prisma.pengeluaran.aggregate.mockResolvedValueOnce({ _sum: { jumlah: '40000' } });

    // Act
    const grafik = await getGrafik();

    // Assert
    expect(grafik).toHaveLength(7);
    expect(grafik[0]).toMatchObject({ tanggal: '2026-11-19', pendapatan: 150000, pengeluaran: 40000 });
    expect(grafik[6]).toMatchObject({ tanggal: '2026-11-25', pendapatan: 0, pengeluaran: 0 });
  });
});

describe('Menu terlaris', () => {
  test('DB-04: lima menu terlaris dilengkapi nama & kategori', async () => {
    // Arrange
    prisma.itemTransaksi.groupBy.mockResolvedValue([
      { menuId: 2, _sum: { qty: 30 } },
      { menuId: 1, _sum: { qty: 12 } },
    ]);
    prisma.menu.findMany.mockResolvedValue([
      { id: 1, nama: 'Es Teh', kategori: 'MINUMAN' },
      { id: 2, nama: 'Nasi Goreng', kategori: 'MAKANAN' },
    ]);

    // Act
    const hasil = await getMenuTerlaris();

    // Assert
    expect(prisma.itemTransaksi.groupBy).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
    expect(hasil).toEqual([
      { menuId: 2, nama: 'Nasi Goreng', kategori: 'MAKANAN', totalTerjual: 30 },
      { menuId: 1, nama: 'Es Teh', kategori: 'MINUMAN', totalTerjual: 12 },
    ]);
  });

  test('DB-05: menu sudah dihapus dari daftar → ditampilkan "Unknown"', async () => {
    // Arrange
    prisma.itemTransaksi.groupBy.mockResolvedValue([{ menuId: 9, _sum: { qty: 3 } }]);
    prisma.menu.findMany.mockResolvedValue([]);

    // Act
    const hasil = await getMenuTerlaris();

    // Assert
    expect(hasil[0]).toEqual({ menuId: 9, nama: 'Unknown', kategori: 'Unknown', totalTerjual: 3 });
  });
});

describe('Stok kritis', () => {
  test('DB-06: hanya bahan berstatus KRITIS/HABIS, urut dari stok paling sedikit', async () => {
    // Arrange
    const bahan = [{ id: 3, nama: 'Gula', stok: 0, status: 'HABIS' }];
    prisma.persediaan.findMany.mockResolvedValue(bahan);

    // Act
    const hasil = await getStokKritis();

    // Assert
    expect(hasil).toBe(bahan);
    expect(prisma.persediaan.findMany).toHaveBeenCalledWith({
      where: { status: { in: ['KRITIS', 'HABIS'] } },
      orderBy: { stok: 'asc' },
    });
  });
});
