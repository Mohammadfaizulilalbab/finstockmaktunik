// ============================================
// Unit Test — Fitur Riwayat Transaksi
// ============================================
// Unit yang diuji: getAll() di src/modules/transaksi/transaksi.service.js
// (endpoint GET /api/transaksi yang boleh dibuka karyawan)
// Test double:
//   - Stub : prisma.transaksi.findMany & count → data dan jumlah transaksi
//   - Mock : filter (where), skip, take yang dikirim ke Prisma diperiksa

jest.mock('../../src/config/db', () => ({ transaksi: { findMany: jest.fn(), count: jest.fn() } }));

const prisma = require('../../src/config/db');
const { getAll } = require('../../src/modules/transaksi/transaksi.service');

const argumenFindMany = () => prisma.transaksi.findMany.mock.calls[0][0];

beforeEach(() => {
  jest.clearAllMocks();
  prisma.transaksi.findMany.mockResolvedValue([{ id: 1 }]);
  prisma.transaksi.count.mockResolvedValue(1);
});

describe('Riwayat transaksi', () => {
  test('RT-01: tanpa filter → halaman 1, 10 data, urut terbaru', async () => {
    // Act
    const hasil = await getAll({});

    // Assert
    expect(argumenFindMany()).toMatchObject({ where: {}, skip: 0, take: 10, orderBy: { waktu: 'desc' } });
    expect(hasil).toEqual({ data: [{ id: 1 }], pagination: { page: 1, limit: 10, total: 1, totalPage: 1 } });
  });

  test('RT-02: halaman 3 isi 5 → lewati 10 data, total halaman dibulatkan ke atas', async () => {
    // Arrange
    prisma.transaksi.count.mockResolvedValue(23);

    // Act
    const hasil = await getAll({ page: '3', limit: '5' });

    // Assert
    expect(argumenFindMany()).toMatchObject({ skip: 10, take: 5 });
    expect(hasil.pagination).toEqual({ page: 3, limit: 5, total: 23, totalPage: 5 });
  });

  test('RT-03: filter status, kasir, metode → masuk ke kondisi pencarian', async () => {
    // Act
    await getAll({ status: 'SELESAI', kasirId: '5', metode: 'QRIS' });

    // Assert
    expect(argumenFindMany().where).toEqual({ status: 'SELESAI', kasirId: 5, metode: 'QRIS' });
    expect(prisma.transaksi.count).toHaveBeenCalledWith({ where: { status: 'SELESAI', kasirId: 5, metode: 'QRIS' } });
  });

  test('RT-04: rentang tanggal → mulai 00:00 dan berakhir 23:59:59 waktu lokal', async () => {
    // Act
    await getAll({ tanggalMulai: '2026-11-01', tanggalSelesai: '2026-11-25' });

    // Assert
    expect(argumenFindMany().where.waktu).toEqual({
      gte: new Date(2026, 10, 1, 0, 0, 0, 0),
      lte: new Date(2026, 10, 25, 23, 59, 59, 999),
    });
  });

  test('RT-05: hanya tanggal mulai → tidak ada batas akhir', async () => {
    // Act
    await getAll({ tanggalMulai: '2026-11-20' });

    // Assert
    expect(argumenFindMany().where.waktu).toEqual({ gte: new Date(2026, 10, 20) });
  });

  test('RT-06: hanya tanggal selesai → tidak ada batas awal', async () => {
    // Act
    await getAll({ tanggalSelesai: '2026-11-20' });

    // Assert
    expect(argumenFindMany().where.waktu).toEqual({ lte: new Date(2026, 10, 20, 23, 59, 59, 999) });
  });

  test('RT-07: belum ada transaksi → data kosong, total halaman 0', async () => {
    // Arrange
    prisma.transaksi.findMany.mockResolvedValue([]);
    prisma.transaksi.count.mockResolvedValue(0);

    // Act
    const hasil = await getAll({});

    // Assert
    expect(hasil).toEqual({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPage: 0 } });
  });
});
