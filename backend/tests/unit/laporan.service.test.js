// ============================================
// Unit Test — Fitur Laporan Keuangan & Export
// ============================================
// Unit yang diuji: src/modules/laporan/laporan.service.js
// (GET /api/laporan/* boleh dibuka owner dan karyawan)
// Test double:
//   - Stub : prisma.transaksi.aggregate/count/findMany, prisma.pengeluaran.aggregate/findMany
//   - Fake : response Express diganti stream PassThrough supaya file PDF/Excel
//            benar-benar ditulis dan bisa dibaca kembali
//   - Spy  : res.setHeader & res.end untuk memastikan header download terkirim

jest.mock('../../src/config/db', () => ({
  transaksi: { aggregate: jest.fn(), count: jest.fn(), findMany: jest.fn() },
  pengeluaran: { aggregate: jest.fn(), findMany: jest.fn() },
}));

const { PassThrough } = require('stream');
const ExcelJS = require('exceljs');
const prisma = require('../../src/config/db');
const { getLaporanKeuangan, exportPDF, exportExcel } = require('../../src/modules/laporan/laporan.service');

const TANGGAL = '2026-11-25T10:00:00'; // Rabu, dibaca sebagai waktu lokal

const transaksiContoh = [
  {
    kodeTransaksi: '#T-0001', waktu: new Date(2026, 10, 25, 9), metode: 'TUNAI', status: 'SELESAI', total: '45000',
    kasir: { nama: 'Siti' },
    items: [
      { subtotal: '30000', menu: { nama: 'Nasi Goreng', kategori: 'MAKANAN' } },
      { subtotal: '15000', menu: { nama: 'Es Teh', kategori: 'MINUMAN' } },
    ],
  },
  {
    kodeTransaksi: '#T-0002', waktu: new Date(2026, 10, 25, 11), metode: 'QRIS', status: 'SELESAI', total: '15000',
    kasir: { nama: 'Siti' },
    items: [{ subtotal: '15000', menu: { nama: 'Mie Ayam', kategori: 'MAKANAN' } }],
  },
];
const pengeluaranContoh = [{ tanggal: new Date(2026, 10, 25), keterangan: 'Beli gas', kategori: 'OPERASIONAL', jumlah: '20000' }];

const siapkanData = ({ pendapatan = '60000', pengeluaran = '20000', transaksi = transaksiContoh } = {}) => {
  prisma.transaksi.aggregate.mockResolvedValue({ _sum: { total: pendapatan } });
  prisma.pengeluaran.aggregate.mockResolvedValue({ _sum: { jumlah: pengeluaran } });
  prisma.transaksi.count.mockResolvedValue(transaksi.length);
  prisma.transaksi.findMany.mockResolvedValue(transaksi);
  prisma.pengeluaran.findMany.mockResolvedValue(pengeluaranContoh);
};

// Fake response: stream yang menampung semua byte yang dikirim
const buatResStream = () => {
  const res = new PassThrough();
  const potongan = [];
  res.on('data', (c) => potongan.push(c));
  res.setHeader = jest.fn();
  jest.spyOn(res, 'end');
  res.selesai = new Promise((resolve) => res.on('finish', () => resolve(Buffer.concat(potongan))));
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  siapkanData();
});

describe('Laporan keuangan per periode', () => {
  test('LP-01: harian → ringkasan pendapatan, pengeluaran, laba, jumlah transaksi', async () => {
    // Act
    const laporan = await getLaporanKeuangan({ periode: 'harian', tanggal: TANGGAL });

    // Assert
    expect(laporan.summary).toEqual({ totalPendapatan: 60000, totalPengeluaran: 20000, labaBersih: 40000, totalTransaksi: 2 });
    expect(laporan.startDate).toBe(new Date(2026, 10, 25).toISOString());
    expect(laporan.endDate).toBe(new Date(2026, 10, 26).toISOString());
    expect(prisma.transaksi.aggregate.mock.calls[0][0].where.status).toBe('SELESAI');
  });

  test('LP-02: komposisi pendapatan per kategori beserta persentasenya', async () => {
    // Act
    const { komposisi } = await getLaporanKeuangan({ periode: 'harian', tanggal: TANGGAL });

    // Assert
    expect(komposisi).toEqual([
      { kategori: 'MAKANAN', total: 45000, persentase: '75.0' },
      { kategori: 'MINUMAN', total: 15000, persentase: '25.0' },
    ]);
  });

  test('LP-03: mingguan → Minggu s.d. Minggu berikutnya', async () => {
    // Act
    const laporan = await getLaporanKeuangan({ periode: 'mingguan', tanggal: TANGGAL });

    // Assert
    expect(laporan.startDate).toBe(new Date(2026, 10, 22).toISOString());
    expect(laporan.endDate).toBe(new Date(2026, 10, 29).toISOString());
  });

  test('LP-04: bulanan → tanggal 1 s.d. tanggal 1 bulan berikutnya', async () => {
    // Act
    const laporan = await getLaporanKeuangan({ periode: 'bulanan', tanggal: TANGGAL });

    // Assert
    expect(laporan.startDate).toBe(new Date(2026, 10, 1).toISOString());
    expect(laporan.endDate).toBe(new Date(2026, 11, 1).toISOString());
  });

  test('LP-05: tahunan → 1 Januari s.d. 1 Januari tahun berikutnya', async () => {
    // Act
    const laporan = await getLaporanKeuangan({ periode: 'tahunan', tanggal: TANGGAL });

    // Assert
    expect(laporan.startDate).toBe(new Date(2026, 0, 1).toISOString());
    expect(laporan.endDate).toBe(new Date(2027, 0, 1).toISOString());
  });

  test('LP-06: periode tidak dikenal → diperlakukan seperti harian', async () => {
    // Act
    const laporan = await getLaporanKeuangan({ periode: 'kuartal', tanggal: TANGGAL });

    // Assert
    expect(laporan.startDate).toBe(new Date(2026, 10, 25).toISOString());
    expect(laporan.endDate).toBe(new Date(2026, 10, 26).toISOString());
  });

  test('LP-07: tanpa parameter → harian untuk hari ini', async () => {
    // Arrange
    jest.useFakeTimers({ now: new Date(2026, 10, 25, 14) });

    // Act
    const laporan = await getLaporanKeuangan({});
    jest.useRealTimers();

    // Assert
    expect(laporan.periode).toBe('harian');
    expect(laporan.startDate).toBe(new Date(2026, 10, 25).toISOString());
  });

  test('LP-08: tidak ada penjualan → semua 0 dan persentase 0 (tidak dibagi nol)', async () => {
    // Arrange
    const transaksiGratis = [{ ...transaksiContoh[1], items: [{ subtotal: '0', menu: { kategori: 'PROMO' } }] }];
    siapkanData({ pendapatan: null, pengeluaran: null, transaksi: transaksiGratis });

    // Act
    const laporan = await getLaporanKeuangan({ tanggal: TANGGAL });

    // Assert
    expect(laporan.summary).toMatchObject({ totalPendapatan: 0, totalPengeluaran: 0, labaBersih: 0 });
    expect(laporan.komposisi).toEqual([{ kategori: 'PROMO', total: 0, persentase: 0 }]);
  });
});

describe('Export laporan', () => {
  test('LP-09: export PDF → header unduhan benar dan isi berupa file PDF', async () => {
    // Arrange
    const res = buatResStream();

    // Act
    await exportPDF({ periode: 'bulanan', tanggal: TANGGAL }, res);
    const isiFile = await res.selesai;

    // Assert
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=Laporan_FinStocks_bulanan.pdf');
    expect(isiFile.subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('LP-10: export PDF dengan 60 transaksi → file tetap utuh (tabel dibatasi 50 baris)', async () => {
    // Arrange
    const banyak = Array.from({ length: 60 }, (_, i) => ({ ...transaksiContoh[0], kodeTransaksi: `#T-${i}` }));
    siapkanData({ transaksi: banyak });
    const res = buatResStream();

    // Act
    await exportPDF({ tanggal: TANGGAL }, res);
    const isiFile = await res.selesai;

    // Assert
    expect(isiFile.subarray(0, 5).toString()).toBe('%PDF-');
    expect(isiFile.toString('latin1').trimEnd().endsWith('%%EOF')).toBe(true);
  });

  test('LP-11: export Excel → 3 sheet (Ringkasan, Transaksi, Pengeluaran) berisi data laporan', async () => {
    // Arrange
    const res = buatResStream();

    // Act
    await exportExcel({ periode: 'harian', tanggal: TANGGAL }, res);
    const isiFile = await res.selesai;

    // Assert
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=Laporan_FinStocks_harian.xlsx');
    expect(res.end).toHaveBeenCalled();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(isiFile);
    expect(workbook.worksheets.map((s) => s.name)).toEqual(['Ringkasan', 'Transaksi', 'Pengeluaran']);
    expect(workbook.getWorksheet('Ringkasan').getRow(5).values).toEqual([, 'Laba Bersih', 40000]);
    expect(workbook.getWorksheet('Transaksi').rowCount).toBe(3); // header + 2 transaksi
    expect(workbook.getWorksheet('Pengeluaran').getRow(2).getCell(4).value).toBe(20000); // kolom 4 = Jumlah
  });
});
