// ============================================
// Unit Test — Fitur Kasir (lihat menu & buat transaksi)
// ============================================
// Unit yang diuji:
//   - menu.service.js      → getAll, getById (yang boleh dipakai karyawan)
//   - transaksi.service.js → create
// Test double:
//   - Stub : prisma.menu.findMany/findUnique, prisma.transaksi.findFirst (transaksi terakhir)
//   - Mock : prisma.transaksi.create → isi data yang disimpan diperiksa

jest.mock('../../src/config/db', () => ({
  menu: { findMany: jest.fn(), findUnique: jest.fn() },
  transaksi: { findFirst: jest.fn(), create: jest.fn() },
}));

const prisma = require('../../src/config/db');
const menuService = require('../../src/modules/menu/menu.service');
const transaksiService = require('../../src/modules/transaksi/transaksi.service');

const keranjang = (tambahan = {}) => ({
  items: [
    { menuId: 1, qty: 2, hargaSatuan: 15000 },
    { menuId: 2, qty: 1, hargaSatuan: 5000 },
  ],
  metode: 'TUNAI',
  ...tambahan,
});
const dataTersimpan = () => prisma.transaksi.create.mock.calls[0][0].data;

beforeEach(() => {
  jest.clearAllMocks();
  prisma.transaksi.create.mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));
});

describe('Daftar menu di halaman kasir', () => {
  test('KS-01: menu ditampilkan urut abjad', async () => {
    // Arrange
    const daftar = [{ id: 2, nama: 'Es Teh' }, { id: 1, nama: 'Nasi Goreng' }];
    prisma.menu.findMany.mockResolvedValue(daftar);

    // Act
    const hasil = await menuService.getAll();

    // Assert
    expect(hasil).toBe(daftar);
    expect(prisma.menu.findMany).toHaveBeenCalledWith({ orderBy: { nama: 'asc' } });
  });

  test('KS-02: detail menu yang ada → dikembalikan (id dari URL diubah jadi angka)', async () => {
    // Arrange
    prisma.menu.findUnique.mockResolvedValue({ id: 7, nama: 'Mie Ayam' });

    // Act
    const menu = await menuService.getById('7');

    // Assert
    expect(menu.nama).toBe('Mie Ayam');
    expect(prisma.menu.findUnique).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  test('KS-03: menu tidak ada → MENU_NOT_FOUND', async () => {
    // Arrange
    prisma.menu.findUnique.mockResolvedValue(null);

    // Act
    const aksi = menuService.getById('99');

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 404, code: 'MENU_NOT_FOUND' });
  });
});

describe('Buat transaksi', () => {
  test('KS-04: transaksi pertama → kode #T-0001, total dihitung dari qty × harga', async () => {
    // Arrange
    prisma.transaksi.findFirst.mockResolvedValue(null);

    // Act
    await transaksiService.create(keranjang(), 5);

    // Assert
    const data = dataTersimpan();
    expect(data.kodeTransaksi).toBe('#T-0001');
    expect(data.total).toBe(35000);
    expect(data.kasirId).toBe(5);
    expect(data.items.create).toEqual([
      { menuId: 1, qty: 2, hargaSatuan: 15000, subtotal: 30000 },
      { menuId: 2, qty: 1, hargaSatuan: 5000, subtotal: 5000 },
    ]);
  });

  test('KS-05: sudah ada transaksi #T-0042 → transaksi baru #T-0043', async () => {
    // Arrange
    prisma.transaksi.findFirst.mockResolvedValue({ id: 42, kodeTransaksi: '#T-0042' });

    // Act
    await transaksiService.create(keranjang(), 5);

    // Assert
    expect(dataTersimpan().kodeTransaksi).toBe('#T-0043');
  });

  test('KS-06: transaksi lama tanpa kode → penomoran mulai dari #T-0001', async () => {
    // Arrange
    prisma.transaksi.findFirst.mockResolvedValue({ id: 3, kodeTransaksi: null });

    // Act
    await transaksiService.create(keranjang(), 5);

    // Assert
    expect(dataTersimpan().kodeTransaksi).toBe('#T-0001');
  });

  test('KS-07: status, catatan, nama pelanggan tidak diisi → SELESAI, null, null', async () => {
    // Arrange
    prisma.transaksi.findFirst.mockResolvedValue(null);

    // Act
    await transaksiService.create(keranjang(), 5);

    // Assert
    expect(dataTersimpan()).toMatchObject({ status: 'SELESAI', catatan: null, namaPelanggan: null, metode: 'TUNAI' });
  });

  test('KS-08: pesanan disimpan sebagai PENDING dengan catatan & nama pelanggan', async () => {
    // Arrange
    prisma.transaksi.findFirst.mockResolvedValue(null);
    const pesanan = keranjang({ metode: 'QRIS', status: 'PENDING', catatan: 'Tidak pedas', namaPelanggan: 'Budi' });

    // Act
    const hasil = await transaksiService.create(pesanan, 5);

    // Assert
    expect(hasil).toMatchObject({ status: 'PENDING', catatan: 'Tidak pedas', namaPelanggan: 'Budi', metode: 'QRIS' });
  });
});
