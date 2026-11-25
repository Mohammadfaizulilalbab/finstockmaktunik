// ============================================
// Unit Test — Fitur Login dengan Google
// ============================================
// Unit yang diuji: loginGoogle() di src/modules/auth/auth.service.js
// Test double:
//   - Stub : verifyGoogleCredential (profil Google), prisma.pengguna.findUnique (akun)
//   - Mock : prisma.pengguna.update (penautan akun), catatAktivitas, tolakJikaPendaftaranDiproses

jest.mock('../../src/config/db', () => ({ pengguna: { findUnique: jest.fn(), update: jest.fn() } }));
jest.mock('../../src/utils/password', () => ({ verifyPassword: jest.fn(), simulateVerifyPassword: jest.fn() }));
jest.mock('../../src/services/logAktivitas.service', () => ({ catatAktivitas: jest.fn() }));
jest.mock('../../src/services/googleAuth.service', () => ({ verifyGoogleCredential: jest.fn() }));
jest.mock('../../src/modules/pendaftaran/pendaftaran.service', () => ({ tolakJikaPendaftaranDiproses: jest.fn() }));

const prisma = require('../../src/config/db');
const { catatAktivitas } = require('../../src/services/logAktivitas.service');
const { verifyGoogleCredential } = require('../../src/services/googleAuth.service');
const { tolakJikaPendaftaranDiproses } = require('../../src/modules/pendaftaran/pendaftaran.service');
const AppError = require('../../src/utils/AppError');
const { loginGoogle } = require('../../src/modules/auth/auth.service');

const PROFIL = { googleId: 'g-123', email: 'siti@gmail.com' };
const karyawan = (tambahan = {}) => ({
  id: 5, username: 'siti', email: 'siti@gmail.com', password: 'hash', role: 'KARYAWAN',
  status: 'AKTIF', permissions: ['/', '/kasir'], googleId: 'g-123', ...tambahan,
});

// Stub pencarian akun: jawaban pertama untuk googleId, kedua untuk email
const stubCariAkun = (berdasarkanGoogleId, berdasarkanEmail = null) => {
  prisma.pengguna.findUnique
    .mockResolvedValueOnce(berdasarkanGoogleId)
    .mockResolvedValueOnce(berdasarkanEmail);
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.pengguna.findUnique.mockReset(); // buang sisa jawaban "Once" dari tes sebelumnya
  verifyGoogleCredential.mockResolvedValue(PROFIL);
  catatAktivitas.mockResolvedValue({});
  tolakJikaPendaftaranDiproses.mockResolvedValue();
});

describe('Login karyawan dengan Google', () => {
  test('GG-01: akun sudah tertaut Google → langsung login tanpa update data', async () => {
    // Arrange
    stubCariAkun(karyawan());

    // Act
    const hasil = await loginGoogle('credential-valid');

    // Assert
    expect(hasil.user).toMatchObject({ id: 5, googleTerhubung: true });
    expect(prisma.pengguna.update).not.toHaveBeenCalled();
    expect(catatAktivitas).toHaveBeenCalledWith(5, 'Login ke sistem (Google)');
  });

  test('GG-02: login Google pertama kali (ketemu lewat email) → akun ditautkan ke googleId', async () => {
    // Arrange
    stubCariAkun(null, karyawan({ googleId: null }));
    prisma.pengguna.update.mockResolvedValue(karyawan());

    // Act
    const hasil = await loginGoogle('credential-valid');

    // Assert
    expect(prisma.pengguna.update).toHaveBeenCalledWith({ where: { id: 5 }, data: { googleId: 'g-123' } });
    expect(hasil.user.googleTerhubung).toBe(true);
  });

  test('GG-03: akun Google belum terdaftar → GOOGLE_NOT_REGISTERED', async () => {
    // Arrange
    stubCariAkun(null, null);

    // Act
    const aksi = loginGoogle('credential-valid');

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 404, code: 'GOOGLE_NOT_REGISTERED' });
    expect(tolakJikaPendaftaranDiproses).toHaveBeenCalledWith({ email: 'siti@gmail.com' });
  });

  test('GG-04: belum terdaftar tapi pendaftaran masih diproses → pesan status pendaftaran', async () => {
    // Arrange
    stubCariAkun(null, null);
    tolakJikaPendaftaranDiproses.mockRejectedValue(new AppError(403, 'Menunggu owner', 'REGISTRATION_PENDING'));

    // Act
    const aksi = loginGoogle('credential-valid');

    // Assert
    await expect(aksi).rejects.toMatchObject({ code: 'REGISTRATION_PENDING' });
  });

  test('GG-05: email sama tapi akun Google lain → GOOGLE_ACCOUNT_MISMATCH', async () => {
    // Arrange
    stubCariAkun(null, karyawan({ googleId: 'g-lama' }));

    // Act
    const aksi = loginGoogle('credential-valid');

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 401, code: 'GOOGLE_ACCOUNT_MISMATCH' });
    expect(prisma.pengguna.update).not.toHaveBeenCalled();
  });

  test('GG-06: akun karyawan nonaktif → ACCOUNT_DISABLED', async () => {
    // Arrange
    stubCariAkun(karyawan({ status: 'NONAKTIF' }));

    // Act
    const aksi = loginGoogle('credential-valid');

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 403, code: 'ACCOUNT_DISABLED' });
    expect(catatAktivitas).not.toHaveBeenCalled();
  });
});
