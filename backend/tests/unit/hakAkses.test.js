// ============================================
// Unit Test — Fitur Hak Akses Karyawan
// ============================================
// Unit yang diuji:
//   - authMiddleware      (src/middlewares/auth.middleware.js)  → wajib login
//   - requireRole         (src/middlewares/role.middleware.js)  → batas role
//   - tentukanIzinAkses   (src/config/permissions.js)           → menu yang boleh dibuka
// Test double:
//   - Fake : objek req/res buatan pengganti Express
//   - Spy  : next() untuk melihat apakah request diteruskan
// Token dibuat dengan jsonwebtoken asli supaya kasus kedaluwarsa benar-benar terjadi.

const jwt = require('jsonwebtoken');
const { signToken } = require('../../src/utils/jwt');
const authMiddleware = require('../../src/middlewares/auth.middleware');
const { requireRole } = require('../../src/middlewares/role.middleware');
const { tentukanIzinAkses, SEMUA_FITUR, FITUR_DEFAULT_KARYAWAN } = require('../../src/config/permissions');

const JWT_SECRET = process.env.JWT_SECRET || 'finstocks_jwt_secret_key_default';

const buatResPalsu = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};
const reqDenganToken = (token) => ({ headers: { authorization: `Bearer ${token}` } });

describe('Wajib login (authMiddleware)', () => {
  test('HA-01: token karyawan valid → req.user terisi dan request diteruskan', () => {
    // Arrange
    const req = reqDenganToken(signToken({ id: 5, username: 'siti', role: 'KARYAWAN', permissions: ['/kasir'] }));
    const res = buatResPalsu();
    const next = jest.fn();

    // Act
    authMiddleware(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 5, username: 'siti', role: 'KARYAWAN', permissions: ['/kasir'] });
  });

  test('HA-02: token lama tanpa daftar izin → permissions jadi array kosong', () => {
    // Arrange
    const req = reqDenganToken(signToken({ id: 5, username: 'siti', role: 'KARYAWAN' }));
    const next = jest.fn();

    // Act
    authMiddleware(req, buatResPalsu(), next);

    // Assert
    expect(req.user.permissions).toEqual([]);
  });

  test('HA-03: tanpa header Authorization → 401 TOKEN_MISSING', () => {
    // Arrange
    const res = buatResPalsu();
    const next = jest.fn();

    // Act
    authMiddleware({ headers: {} }, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'TOKEN_MISSING' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('HA-04: sesi sudah habis → 401 TOKEN_EXPIRED', () => {
    // Arrange
    const tokenKedaluwarsa = jwt.sign({ id: 5, role: 'KARYAWAN', exp: Math.floor(Date.now() / 1000) - 60 }, JWT_SECRET);
    const res = buatResPalsu();

    // Act
    authMiddleware(reqDenganToken(tokenKedaluwarsa), res, jest.fn());

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'TOKEN_EXPIRED' }));
  });

  test('HA-05: token dipalsukan (secret berbeda) → 401 TOKEN_INVALID', () => {
    // Arrange
    const tokenPalsu = jwt.sign({ id: 1, role: 'OWNER' }, 'secret-penyerang');
    const res = buatResPalsu();

    // Act
    authMiddleware(reqDenganToken(tokenPalsu), res, jest.fn());

    // Assert
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'TOKEN_INVALID' }));
  });

  test('HA-06: error tak terduga saat verifikasi → 500 AUTH_ERROR', () => {
    // Arrange: header berbentuk aneh sehingga split() gagal di luar pengecekan JWT
    const req = { headers: { authorization: { startsWith: () => true, split: () => { throw new Error('rusak'); } } } };
    const res = buatResPalsu();

    // Act
    authMiddleware(req, res, jest.fn());

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'AUTH_ERROR' }));
  });
});

describe('Batas role (requireRole)', () => {
  test('HA-07: karyawan membuka route OWNER & KARYAWAN (mis. kasir) → diizinkan', () => {
    // Arrange
    const next = jest.fn();

    // Act
    requireRole('OWNER', 'KARYAWAN')({ user: { role: 'KARYAWAN' } }, buatResPalsu(), next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('HA-08: karyawan membuka route khusus OWNER (mis. hapus transaksi) → 403 FORBIDDEN', () => {
    // Arrange
    const res = buatResPalsu();
    const next = jest.fn();

    // Act
    requireRole('OWNER')({ user: { role: 'KARYAWAN' } }, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'FORBIDDEN' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('HA-09: requireRole dipanggil tanpa login → 401 NOT_AUTHENTICATED', () => {
    // Arrange
    const res = buatResPalsu();

    // Act
    requireRole('KARYAWAN')({}, res, jest.fn());

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'NOT_AUTHENTICATED' }));
  });
});

describe('Izin menu karyawan (tentukanIzinAkses)', () => {
  test('HA-10: karyawan tanpa izin khusus → dapat menu default (Dashboard, Kasir, Transaksi, Pengaturan)', () => {
    // Act
    const izin = tentukanIzinAkses('KARYAWAN');

    // Assert
    expect(izin).toEqual(FITUR_DEFAULT_KARYAWAN);
    expect(izin).toEqual(['/', '/kasir', '/transaksi', '/pengaturan']);
  });

  test('HA-11: izin berisi menu khusus owner & menu tak dikenal → keduanya dibuang', () => {
    // Arrange
    const permintaan = ['/kasir', '/pengguna', '/hacker', '/laporan'];

    // Act
    const izin = tentukanIzinAkses('KARYAWAN', permintaan);

    // Assert
    expect(izin).toEqual(['/kasir', '/laporan']);
  });

  test('HA-12: owner → selalu mendapat semua menu', () => {
    // Act
    const izin = tentukanIzinAkses('OWNER', ['/kasir']);

    // Assert
    expect(izin).toEqual(SEMUA_FITUR);
  });
});
