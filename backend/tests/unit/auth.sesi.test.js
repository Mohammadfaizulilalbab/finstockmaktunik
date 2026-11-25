// ============================================
// Unit Test — Fitur Sesi: Profil (/me) & Logout
// ============================================
// Unit yang diuji: getMe() di auth.service.js, toPublicUser() di auth.session.js,
// dan logout() di auth.controller.js
// Test double:
//   - Stub : prisma.pengguna.findUnique
//   - Fake : objek res buatan (status/json) pengganti response Express
//   - Spy  : next() untuk memastikan tidak ada error yang diteruskan

jest.mock('../../src/config/db', () => ({ pengguna: { findUnique: jest.fn() } }));
jest.mock('../../src/utils/password', () => ({ verifyPassword: jest.fn(), simulateVerifyPassword: jest.fn() }));
jest.mock('../../src/services/logAktivitas.service', () => ({ catatAktivitas: jest.fn() }));
jest.mock('../../src/services/googleAuth.service', () => ({ verifyGoogleCredential: jest.fn() }));
jest.mock('../../src/modules/pendaftaran/pendaftaran.service', () => ({ tolakJikaPendaftaranDiproses: jest.fn() }));

const prisma = require('../../src/config/db');
const { getMe } = require('../../src/modules/auth/auth.service');
const { toPublicUser } = require('../../src/modules/auth/auth.session');
const { logout } = require('../../src/modules/auth/auth.controller');

// Fake response Express: menyimpan status & body yang dikirim
const buatResPalsu = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const recordKaryawan = {
  id: 5, nama: 'Siti Kasir', username: 'siti', role: 'KARYAWAN',
  password: 'hash', resetTokenHash: 'abc', resetTokenExpires: new Date(), googleId: 'g-123',
};

beforeEach(() => jest.clearAllMocks());

describe('Profil karyawan yang sedang login', () => {
  test('SS-01: karyawan ditemukan → data dikirim tanpa field sensitif', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(recordKaryawan);

    // Act
    const profil = await getMe(5);

    // Assert
    expect(prisma.pengguna.findUnique).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(profil).toEqual({ id: 5, nama: 'Siti Kasir', username: 'siti', role: 'KARYAWAN', googleTerhubung: true });
  });

  test('SS-02: akun sudah dihapus owner → USER_NOT_FOUND', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(null);

    // Act
    const aksi = getMe(99);

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 404, code: 'USER_NOT_FOUND' });
  });

  test('SS-03: akun tanpa Google → googleTerhubung false', () => {
    // Arrange
    const record = { ...recordKaryawan, googleId: null };

    // Act
    const publik = toPublicUser(record);

    // Assert
    expect(publik.googleTerhubung).toBe(false);
    expect(publik).not.toHaveProperty('googleId');
  });
});

describe('Logout', () => {
  test('SS-04: logout → respons 200 "Logout berhasil"', async () => {
    // Arrange
    const res = buatResPalsu();
    const next = jest.fn();

    // Act
    await logout({ user: { id: 5 } }, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Logout berhasil' });
    expect(next).not.toHaveBeenCalled();
  });
});
