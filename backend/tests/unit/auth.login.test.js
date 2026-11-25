// ============================================
// Unit Test — Fitur Login (email/username + password)
// ============================================
// Unit yang diuji: login() di src/modules/auth/auth.service.js
// Test double:
//   - Stub : prisma.pengguna.findUnique, verifyPassword → atur akun & hasil cek password
//   - Mock : logAktivitas.catatAktivitas, tolakJikaPendaftaranDiproses, simulateVerifyPassword
//            → diverifikasi dipanggil / tidak dipanggil
// JWT memakai modul asli agar isi token bisa diperiksa.

jest.mock('../../src/config/db', () => ({ pengguna: { findUnique: jest.fn() } }));
jest.mock('../../src/utils/password', () => ({
  verifyPassword: jest.fn(),
  simulateVerifyPassword: jest.fn(),
}));
jest.mock('../../src/services/logAktivitas.service', () => ({ catatAktivitas: jest.fn() }));
jest.mock('../../src/services/googleAuth.service', () => ({ verifyGoogleCredential: jest.fn() }));
jest.mock('../../src/modules/pendaftaran/pendaftaran.service', () => ({ tolakJikaPendaftaranDiproses: jest.fn() }));

const prisma = require('../../src/config/db');
const { verifyPassword, simulateVerifyPassword } = require('../../src/utils/password');
const { catatAktivitas } = require('../../src/services/logAktivitas.service');
const { tolakJikaPendaftaranDiproses } = require('../../src/modules/pendaftaran/pendaftaran.service');
const { verifyToken } = require('../../src/utils/jwt');
const AppError = require('../../src/utils/AppError');
const { login } = require('../../src/modules/auth/auth.service');

const karyawan = (tambahan = {}) => ({
  id: 5,
  nama: 'Siti Kasir',
  username: 'siti',
  email: 'siti@finstocks.id',
  password: 'hash-asli',
  role: 'KARYAWAN',
  status: 'AKTIF',
  permissions: ['/', '/kasir', '/transaksi'],
  googleId: null,
  resetTokenHash: null,
  resetTokenExpires: null,
  ...tambahan,
});

beforeEach(() => {
  jest.clearAllMocks();
  catatAktivitas.mockResolvedValue({});
  simulateVerifyPassword.mockResolvedValue(false);
  tolakJikaPendaftaranDiproses.mockResolvedValue();
});

describe('Login karyawan', () => {
  test('LG-01: username & password benar → dapat token JWT dan data publik', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(karyawan());
    verifyPassword.mockResolvedValue(true);

    // Act
    const hasil = await login(' siti ', 'Rahasia123');

    // Assert
    expect(prisma.pengguna.findUnique).toHaveBeenCalledWith({ where: { username: 'siti' } });
    expect(verifyToken(hasil.token)).toMatchObject({ id: 5, role: 'KARYAWAN', permissions: ['/', '/kasir', '/transaksi'] });
    expect(hasil.user).not.toHaveProperty('password');
    expect(hasil.user.googleTerhubung).toBe(false);
    expect(catatAktivitas).toHaveBeenCalledWith(5, 'Login ke sistem');
  });

  test('LG-02: login memakai email huruf besar → dicari sebagai email huruf kecil', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(karyawan());
    verifyPassword.mockResolvedValue(true);

    // Act
    await login('Siti@FinStocks.ID', 'Rahasia123');

    // Assert
    expect(prisma.pengguna.findUnique).toHaveBeenCalledWith({ where: { email: 'siti@finstocks.id' } });
  });

  test('LG-03: akun tidak ditemukan → INVALID_CREDENTIALS, waktu respons disamakan', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(null);

    // Act
    const aksi = login('tidakada', 'Rahasia123');

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    expect(simulateVerifyPassword).toHaveBeenCalledWith('Rahasia123');
    expect(tolakJikaPendaftaranDiproses).toHaveBeenCalledWith({ username: 'tidakada' }, 'Rahasia123');
    expect(catatAktivitas).not.toHaveBeenCalled();
  });

  test('LG-04: akun belum ada tapi pendaftarannya masih menunggu owner → REGISTRATION_PENDING', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(null);
    tolakJikaPendaftaranDiproses.mockRejectedValue(
      new AppError(403, 'Akun Anda masih menunggu persetujuan owner.', 'REGISTRATION_PENDING'),
    );

    // Act
    const aksi = login('calon@finstocks.id', 'Rahasia123');

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 403, code: 'REGISTRATION_PENDING' });
  });

  test('LG-05: password salah → INVALID_CREDENTIALS dan tidak ada log login', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(karyawan());
    verifyPassword.mockResolvedValue(false);

    // Act
    const aksi = login('siti', 'SalahPassword1');

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    expect(catatAktivitas).not.toHaveBeenCalled();
  });

  test('LG-06: akun lama tanpa daftar izin (permissions null) → token berisi izin kosong', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(karyawan({ permissions: null }));
    verifyPassword.mockResolvedValue(true);

    // Act
    const hasil = await login('siti', 'Rahasia123');

    // Assert
    expect(verifyToken(hasil.token).permissions).toEqual([]);
  });

  test('LG-07: akun karyawan dinonaktifkan owner → ACCOUNT_DISABLED', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(karyawan({ status: 'NONAKTIF' }));
    verifyPassword.mockResolvedValue(true);

    // Act
    const aksi = login('siti', 'Rahasia123');

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 403, code: 'ACCOUNT_DISABLED' });
    expect(catatAktivitas).not.toHaveBeenCalled();
  });
});
