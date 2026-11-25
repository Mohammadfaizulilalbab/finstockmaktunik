// ============================================
// Unit Test — Pendaftaran Service (White-Box, Modul 4)
// ============================================
// Unit yang diuji: src/modules/pendaftaran/pendaftaran.service.js
// ID TC-01 s.d. TC-08 sama dengan analisis Statement & Branch Coverage
// manual di dokumen White-box (fungsi ajukanPendaftaran).
//
// Test double yang dipakai:
//   - Stub : prisma.*.findFirst/findUnique, verifyGoogleCredential, hashPassword
//            → mengembalikan nilai tetap agar setiap cabang bisa dipicu
//   - Mock : notifikasi.kirimVerifikasiEmail, notifikasi.beritahuOwnerPendaftaranBaru,
//            prisma.pendaftaranAkun.create/delete → diverifikasi dipanggil/tidak dipanggil
//   - Spy  : console.error → mengamati log saat email gagal terkirim

jest.mock('../../src/config/db', () => ({
  pengguna: { findFirst: jest.fn() },
  pendaftaranAkun: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));
jest.mock('../../src/services/googleAuth.service', () => ({ verifyGoogleCredential: jest.fn() }));
jest.mock('../../src/services/notifikasi.service', () => ({
  kirimVerifikasiEmail: jest.fn(),
  beritahuOwnerPendaftaranBaru: jest.fn(),
}));
jest.mock('../../src/utils/password', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

const prisma = require('../../src/config/db');
const { verifyGoogleCredential } = require('../../src/services/googleAuth.service');
const notifikasi = require('../../src/services/notifikasi.service');
const { hashPassword, verifyPassword } = require('../../src/utils/password');
const { hashToken } = require('../../src/utils/token');
const {
  ajukanPendaftaran,
  verifikasiEmail,
  tolakJikaPendaftaranDiproses,
} = require('../../src/modules/pendaftaran/pendaftaran.service');

const inputDaftar = (tambahan = {}) => ({
  nama: '  Mohammad Faiz  ',
  email: 'Faiz@Gmail.com ',
  username: ' faiz.uji ',
  password: 'Finstock2026',
  ...tambahan,
});

// Stub default: semua pengecekan lolos dan penyimpanan berhasil
const siapkanJalurNormal = () => {
  prisma.pengguna.findFirst.mockResolvedValue(null);
  prisma.pendaftaranAkun.findFirst.mockResolvedValue(null);
  prisma.pendaftaranAkun.deleteMany.mockResolvedValue({ count: 0 });
  prisma.pendaftaranAkun.create.mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));
  hashPassword.mockResolvedValue('hash-password');
  notifikasi.kirimVerifikasiEmail.mockResolvedValue();
  notifikasi.beritahuOwnerPendaftaranBaru.mockResolvedValue();
};

beforeEach(() => {
  jest.clearAllMocks();
  siapkanJalurNormal();
});

describe('ajukanPendaftaran (Statement & Branch Coverage)', () => {
  test('TC-01: daftar manual dengan data valid → status BELUM_VERIFIKASI dan email verifikasi terkirim', async () => {
    // Arrange
    const input = inputDaftar();

    // Act
    const hasil = await ajukanPendaftaran(input);

    // Assert
    expect(hasil).toEqual({ status: 'BELUM_VERIFIKASI', email: 'faiz@gmail.com' });
    expect(verifyGoogleCredential).not.toHaveBeenCalled();
    expect(prisma.pendaftaranAkun.deleteMany).toHaveBeenCalledWith({
      where: { email: 'faiz@gmail.com', status: 'BELUM_VERIFIKASI' },
    });
    const dataDisimpan = prisma.pendaftaranAkun.create.mock.calls[0][0].data;
    expect(dataDisimpan).toMatchObject({
      nama: 'Mohammad Faiz',
      username: 'faiz.uji',
      password: 'hash-password',
      status: 'BELUM_VERIFIKASI',
    });
    expect(notifikasi.kirimVerifikasiEmail).toHaveBeenCalledTimes(1);
    expect(notifikasi.beritahuOwnerPendaftaranBaru).not.toHaveBeenCalled();
  });

  test('TC-02: daftar dengan Google dan email cocok → langsung MENUNGGU dan owner diberi tahu', async () => {
    // Arrange
    verifyGoogleCredential.mockResolvedValue({ email: 'faiz@gmail.com', googleId: 'google-123' });
    const input = inputDaftar({ googleCredential: 'kredensial-google' });

    // Act
    const hasil = await ajukanPendaftaran(input);

    // Assert
    expect(hasil).toEqual({ status: 'MENUNGGU', email: 'faiz@gmail.com' });
    expect(prisma.pendaftaranAkun.create.mock.calls[0][0].data).toMatchObject({
      googleId: 'google-123',
      status: 'MENUNGGU',
    });
    expect(notifikasi.beritahuOwnerPendaftaranBaru).toHaveBeenCalledTimes(1);
    expect(notifikasi.kirimVerifikasiEmail).not.toHaveBeenCalled();
  });

  test('TC-03: email form berbeda dengan email akun Google → ditolak GOOGLE_EMAIL_MISMATCH', async () => {
    // Arrange
    verifyGoogleCredential.mockResolvedValue({ email: 'orang.lain@gmail.com', googleId: 'google-999' });
    const input = inputDaftar({ googleCredential: 'kredensial-google' });

    // Act
    const aksi = ajukanPendaftaran(input);

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 400, code: 'GOOGLE_EMAIL_MISMATCH' });
    expect(prisma.pendaftaranAkun.create).not.toHaveBeenCalled();
  });

  test('TC-04: email sudah dipakai akun lain → ditolak EMAIL_EXISTS', async () => {
    // Arrange
    prisma.pengguna.findFirst.mockResolvedValue({ email: 'faiz@gmail.com' });

    // Act
    const aksi = ajukanPendaftaran(inputDaftar());

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 409, code: 'EMAIL_EXISTS' });
    expect(prisma.pendaftaranAkun.create).not.toHaveBeenCalled();
  });

  test('TC-05: username sudah dipakai akun lain → ditolak USERNAME_EXISTS', async () => {
    // Arrange
    prisma.pengguna.findFirst.mockResolvedValue({ email: 'akun.lain@gmail.com' });

    // Act
    const aksi = ajukanPendaftaran(inputDaftar());

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 409, code: 'USERNAME_EXISTS' });
    expect(prisma.pendaftaranAkun.create).not.toHaveBeenCalled();
  });

  test('TC-06: email masih punya pendaftaran aktif → ditolak REGISTRATION_PENDING', async () => {
    // Arrange
    prisma.pendaftaranAkun.findFirst.mockResolvedValue({ email: 'faiz@gmail.com' });

    // Act
    const aksi = ajukanPendaftaran(inputDaftar());

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 409, code: 'REGISTRATION_PENDING' });
    expect(prisma.pendaftaranAkun.create).not.toHaveBeenCalled();
  });

  test('TC-07: username dipakai pendaftaran aktif orang lain → ditolak USERNAME_EXISTS', async () => {
    // Arrange
    prisma.pendaftaranAkun.findFirst.mockResolvedValue({ email: 'pendaftar.lain@gmail.com' });

    // Act
    const aksi = ajukanPendaftaran(inputDaftar());

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 409, code: 'USERNAME_EXISTS' });
    expect(prisma.pendaftaranAkun.create).not.toHaveBeenCalled();
  });

  test('TC-08: email verifikasi gagal terkirim → pendaftaran dihapus dan ditolak EMAIL_SEND_FAILED', async () => {
    // Arrange
    notifikasi.kirimVerifikasiEmail.mockRejectedValue(new Error('SMTP tidak bisa dihubungi'));
    const spyConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const aksi = ajukanPendaftaran(inputDaftar());

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 502, code: 'EMAIL_SEND_FAILED' });
    expect(prisma.pendaftaranAkun.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(spyConsoleError).toHaveBeenCalledWith('Gagal mengirim email verifikasi:', 'SMTP tidak bisa dihubungi');
    spyConsoleError.mockRestore();
  });
});

describe('verifikasiEmail', () => {
  const besok = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

  test('TC-09: token valid → status menjadi MENUNGGU dan owner diberi tahu', async () => {
    // Arrange
    prisma.pendaftaranAkun.findUnique.mockResolvedValue({ id: 7, status: 'BELUM_VERIFIKASI', verifikasiExpires: besok() });
    prisma.pendaftaranAkun.update.mockResolvedValue({ id: 7, nama: 'Mohammad Faiz', email: 'faiz@gmail.com', status: 'MENUNGGU' });

    // Act
    const hasil = await verifikasiEmail('token-asli');

    // Assert
    expect(hasil).toEqual({ nama: 'Mohammad Faiz', email: 'faiz@gmail.com' });
    expect(prisma.pendaftaranAkun.findUnique).toHaveBeenCalledWith({ where: { verifikasiHash: hashToken('token-asli') } });
    expect(prisma.pendaftaranAkun.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { status: 'MENUNGGU', verifikasiHash: null, verifikasiExpires: null },
    });
    expect(notifikasi.beritahuOwnerPendaftaranBaru).toHaveBeenCalledTimes(1);
  });

  test('TC-10: token tidak ditemukan / sudah dipakai → ditolak VERIFICATION_INVALID', async () => {
    // Arrange
    prisma.pendaftaranAkun.findUnique.mockResolvedValue(null);

    // Act
    const aksi = verifikasiEmail('token-salah');

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 400, code: 'VERIFICATION_INVALID' });
    expect(prisma.pendaftaranAkun.update).not.toHaveBeenCalled();
  });

  test('TC-11: token lewat 24 jam → ditolak VERIFICATION_EXPIRED', async () => {
    // Arrange
    prisma.pendaftaranAkun.findUnique.mockResolvedValue({
      id: 7,
      status: 'BELUM_VERIFIKASI',
      verifikasiExpires: new Date(Date.now() - 1000),
    });

    // Act
    const aksi = verifikasiEmail('token-kedaluwarsa');

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 400, code: 'VERIFICATION_EXPIRED' });
    expect(prisma.pendaftaranAkun.update).not.toHaveBeenCalled();
  });
});

describe('tolakJikaPendaftaranDiproses (dipakai saat login)', () => {
  test('TC-12: tidak ada pendaftaran yang sedang diproses → tidak melempar error', async () => {
    // Arrange
    prisma.pendaftaranAkun.findFirst.mockResolvedValue(null);

    // Act
    const aksi = tolakJikaPendaftaranDiproses({ username: 'faiz.uji' });

    // Assert
    await expect(aksi).resolves.toBeUndefined();
  });

  test('TC-13: pendaftaran ada tapi password salah → status tidak dibocorkan', async () => {
    // Arrange
    prisma.pendaftaranAkun.findFirst.mockResolvedValue({ status: 'MENUNGGU', password: 'hash' });
    verifyPassword.mockResolvedValue(false);

    // Act
    const aksi = tolakJikaPendaftaranDiproses({ username: 'faiz.uji' }, 'PasswordSalah1');

    // Assert
    await expect(aksi).resolves.toBeUndefined();
    expect(verifyPassword).toHaveBeenCalledWith('PasswordSalah1', 'hash');
  });

  test('TC-14: pendaftaran MENUNGGU dan password benar → ditolak REGISTRATION_PENDING', async () => {
    // Arrange
    prisma.pendaftaranAkun.findFirst.mockResolvedValue({ status: 'MENUNGGU', password: 'hash' });
    verifyPassword.mockResolvedValue(true);

    // Act
    const aksi = tolakJikaPendaftaranDiproses({ username: 'faiz.uji' }, 'Finstock2026');

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 403, code: 'REGISTRATION_PENDING' });
  });

  test('TC-15: pendaftaran BELUM_VERIFIKASI (tanpa cek password) → ditolak EMAIL_NOT_VERIFIED', async () => {
    // Arrange
    prisma.pendaftaranAkun.findFirst.mockResolvedValue({ status: 'BELUM_VERIFIKASI', password: 'hash' });

    // Act
    const aksi = tolakJikaPendaftaranDiproses({ email: 'faiz@gmail.com' });

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 403, code: 'EMAIL_NOT_VERIFIED' });
    expect(verifyPassword).not.toHaveBeenCalled();
  });
});
