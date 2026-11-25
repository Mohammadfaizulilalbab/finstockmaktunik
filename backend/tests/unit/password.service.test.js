// ============================================
// Unit Test — Fitur Lupa & Reset Password
// ============================================
// Unit yang diuji: src/modules/auth/password.service.js
// Test double:
//   - Stub : prisma.pengguna.findUnique (pemilik email / token), hashPassword
//   - Mock : prisma.pengguna.update, notifikasi.kirimLinkResetPassword,
//            notifikasi.beritahuPasswordDiubah, catatAktivitas

jest.mock('../../src/config/db', () => ({ pengguna: { findUnique: jest.fn(), update: jest.fn() } }));
jest.mock('../../src/utils/password', () => ({ hashPassword: jest.fn() }));
jest.mock('../../src/services/logAktivitas.service', () => ({ catatAktivitas: jest.fn() }));
jest.mock('../../src/services/notifikasi.service', () => ({
  kirimLinkResetPassword: jest.fn(),
  beritahuPasswordDiubah: jest.fn(),
}));

const prisma = require('../../src/config/db');
const { hashPassword } = require('../../src/utils/password');
const { catatAktivitas } = require('../../src/services/logAktivitas.service');
const notifikasi = require('../../src/services/notifikasi.service');
const { hashToken } = require('../../src/utils/token');
const { forgotPassword, resetPassword } = require('../../src/modules/auth/password.service');

const karyawan = (tambahan = {}) => ({ id: 5, email: 'siti@finstocks.id', status: 'AKTIF', ...tambahan });
const satuJamLagi = () => new Date(Date.now() + 60 * 60 * 1000);

beforeEach(() => {
  jest.clearAllMocks();
  prisma.pengguna.update.mockResolvedValue({});
  hashPassword.mockResolvedValue('hash-baru');
  catatAktivitas.mockResolvedValue({});
});

describe('Lupa password', () => {
  test('PW-01: email karyawan aktif → token reset disimpan (hash) dan link dikirim', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(karyawan());

    // Act
    await forgotPassword(' Siti@FinStocks.id ');

    // Assert
    expect(prisma.pengguna.findUnique).toHaveBeenCalledWith({ where: { email: 'siti@finstocks.id' } });
    const { data } = prisma.pengguna.update.mock.calls[0][0];
    const tokenDiEmail = notifikasi.kirimLinkResetPassword.mock.calls[0][1];
    expect(data.resetTokenHash).toBe(hashToken(tokenDiEmail));
    expect(data.resetTokenExpires.getTime()).toBeGreaterThan(Date.now());
  });

  test('PW-02: email tidak terdaftar → diam saja, tidak ada email terkirim', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(null);

    // Act
    const hasil = await forgotPassword('orang@lain.com');

    // Assert
    expect(hasil).toBeUndefined();
    expect(notifikasi.kirimLinkResetPassword).not.toHaveBeenCalled();
  });

  test('PW-03: akun nonaktif → link reset tidak dikirim', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(karyawan({ status: 'NONAKTIF' }));

    // Act
    await forgotPassword('siti@finstocks.id');

    // Assert
    expect(prisma.pengguna.update).not.toHaveBeenCalled();
    expect(notifikasi.kirimLinkResetPassword).not.toHaveBeenCalled();
  });
});

describe('Reset password', () => {
  test('PW-04: token valid → password baru di-hash, token dihanguskan, karyawan diberi tahu', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(karyawan({ resetTokenExpires: satuJamLagi() }));

    // Act
    await resetPassword('token-dari-email', 'PasswordBaru1');

    // Assert
    expect(prisma.pengguna.findUnique).toHaveBeenCalledWith({ where: { resetTokenHash: hashToken('token-dari-email') } });
    expect(hashPassword).toHaveBeenCalledWith('PasswordBaru1');
    expect(prisma.pengguna.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { password: 'hash-baru', resetTokenHash: null, resetTokenExpires: null },
    });
    expect(catatAktivitas).toHaveBeenCalledWith(5, 'Reset password melalui email');
    expect(notifikasi.beritahuPasswordDiubah).toHaveBeenCalledTimes(1);
  });

  test('PW-05: token tidak dikenal → RESET_TOKEN_INVALID', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(null);

    // Act
    const aksi = resetPassword('token-palsu', 'PasswordBaru1');

    // Assert
    await expect(aksi).rejects.toMatchObject({ status: 400, code: 'RESET_TOKEN_INVALID' });
    expect(prisma.pengguna.update).not.toHaveBeenCalled();
  });

  test('PW-06: token sudah kedaluwarsa → RESET_TOKEN_INVALID', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(karyawan({ resetTokenExpires: new Date(Date.now() - 1000) }));

    // Act
    const aksi = resetPassword('token-lama', 'PasswordBaru1');

    // Assert
    await expect(aksi).rejects.toMatchObject({ code: 'RESET_TOKEN_INVALID' });
    expect(hashPassword).not.toHaveBeenCalled();
  });

  test('PW-07: token ada tapi tanggal kedaluwarsanya kosong → RESET_TOKEN_INVALID', async () => {
    // Arrange
    prisma.pengguna.findUnique.mockResolvedValue(karyawan({ resetTokenExpires: null }));

    // Act
    const aksi = resetPassword('token-rusak', 'PasswordBaru1');

    // Assert
    await expect(aksi).rejects.toMatchObject({ code: 'RESET_TOKEN_INVALID' });
  });
});
