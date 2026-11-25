// ============================================
// Peninjauan Pendaftaran Service — FinStocks
// ============================================
// Sisi OWNER (superadmin) dari siklus pendaftaran:
//   - getAll  → lihat antrean permintaan akun
//   - setujui → akun Pengguna dibuat dengan role & izin pilihan owner
//   - tolak   → pendaftar diberi tahu beserta alasannya

const prisma = require('../../config/db');
const AppError = require('../../utils/AppError');
const { tentukanIzinAkses } = require('../../config/permissions');
const { catatAktivitas } = require('../../services/logAktivitas.service');
const notifikasi = require('../../services/notifikasi.service');
const { pastikanAkunBelumAda } = require('./pendaftaran.service');

const STATUS_DITAMPILKAN = ['MENUNGGU', 'DISETUJUI', 'DITOLAK'];

const SELECT_PENDAFTARAN = {
  id: true, nama: true, email: true, username: true, status: true,
  alasanTolak: true, ditinjauPada: true, createdAt: true, googleId: true,
  peninjau: { select: { id: true, nama: true } },
};

const SELECT_AKUN_BARU = {
  id: true, nama: true, username: true, email: true, role: true, permissions: true, status: true,
};

/**
 * Ganti googleId dengan penanda boolean sebelum dikirim ke client
 */
const formatPendaftaran = ({ googleId, ...data }) => ({ ...data, viaGoogle: Boolean(googleId) });

/**
 * Ambil daftar pendaftaran
 * @param {'MENUNGGU'|'DISETUJUI'|'DITOLAK'|'SEMUA'} [status='MENUNGGU']
 */
const getAll = async (status = 'MENUNGGU') => {
  const where = status === 'SEMUA' ? { status: { in: STATUS_DITAMPILKAN } } : { status };
  const data = await prisma.pendaftaranAkun.findMany({
    where,
    select: SELECT_PENDAFTARAN,
    orderBy: { createdAt: 'desc' },
  });
  return data.map(formatPendaftaran);
};

/**
 * Ambil pendaftaran yang masih menunggu persetujuan
 * @param {number|string} id
 */
const ambilPendaftaranMenunggu = async (id) => {
  const pendaftaran = await prisma.pendaftaranAkun.findUnique({ where: { id: parseInt(id) } });
  if (!pendaftaran) {
    throw new AppError(404, 'Pendaftaran tidak ditemukan', 'REGISTRATION_NOT_FOUND');
  }
  if (pendaftaran.status !== 'MENUNGGU') {
    throw new AppError(400, 'Pendaftaran ini tidak sedang menunggu persetujuan', 'REGISTRATION_NOT_PENDING');
  }
  return pendaftaran;
};

/**
 * Ubah status hanya jika masih MENUNGGU.
 * Mencegah dua owner meninjau permintaan yang sama secara bersamaan.
 * @param {import('@prisma/client').Prisma.TransactionClient} db
 * @param {number} id
 * @param {object} data - field yang diubah
 */
const klaimPendaftaran = async (db, id, data) => {
  const { count } = await db.pendaftaranAkun.updateMany({
    where: { id, status: 'MENUNGGU' },
    data,
  });
  if (count === 0) {
    throw new AppError(409, 'Pendaftaran ini sudah ditinjau', 'REGISTRATION_NOT_PENDING');
  }
};

/**
 * Buat akun Pengguna dari data pendaftaran
 * @param {import('@prisma/client').Prisma.TransactionClient} db
 * @param {object} pendaftaran
 * @param {{ role: string, permissions: string[] }} akses
 */
const buatAkunDariPendaftaran = (db, pendaftaran, akses) =>
  db.pengguna.create({
    data: {
      nama: pendaftaran.nama,
      username: pendaftaran.username,
      email: pendaftaran.email,
      googleId: pendaftaran.googleId,
      password: pendaftaran.password, // sudah di-hash saat pendaftaran
      role: akses.role,
      permissions: akses.permissions,
      status: 'AKTIF',
    },
    select: SELECT_AKUN_BARU,
  });

/**
 * Simpan persetujuan secara atomik: status, akun baru, dan log aktivitas
 * @param {object} pendaftaran
 * @param {{ role: string, permissions: string[] }} akses
 * @param {number} peninjauId
 */
const simpanPersetujuan = async (pendaftaran, akses, peninjauId) => {
  try {
    return await prisma.$transaction(async (tx) => {
      await klaimPendaftaran(tx, pendaftaran.id, { status: 'DISETUJUI', peninjauId, ditinjauPada: new Date() });
      const akun = await buatAkunDariPendaftaran(tx, pendaftaran, akses);
      await catatAktivitas(peninjauId, `Menyetujui pendaftaran akun ${akun.username}`, tx);
      return akun;
    });
  } catch (error) {
    // P2002 = pelanggaran unique constraint (email/username terpakai di detik yang sama)
    if (error.code === 'P2002') {
      throw new AppError(409, 'Email atau username sudah dipakai akun lain', 'ACCOUNT_CONFLICT');
    }
    throw error;
  }
};

/**
 * Setujui pendaftaran dan buat akunnya
 * @param {number|string} id
 * @param {{ role?: 'OWNER'|'KARYAWAN', permissions?: string[] }} pilihan - dari owner
 * @param {number} peninjauId - ID owner
 */
const setujui = async (id, pilihan, peninjauId) => {
  const pendaftaran = await ambilPendaftaranMenunggu(id);
  await pastikanAkunBelumAda(pendaftaran);

  const role = pilihan.role === 'OWNER' ? 'OWNER' : 'KARYAWAN';
  const akses = { role, permissions: tentukanIzinAkses(role, pilihan.permissions) };

  const akun = await simpanPersetujuan(pendaftaran, akses, peninjauId);
  notifikasi.beritahuAkunDisetujui(akun);
  return akun;
};

/**
 * Tolak pendaftaran
 * @param {number|string} id
 * @param {string} [alasan]
 * @param {number} peninjauId - ID owner
 */
const tolak = async (id, alasan, peninjauId) => {
  const pendaftaran = await ambilPendaftaranMenunggu(id);
  const alasanTolak = alasan || null;

  await prisma.$transaction(async (tx) => {
    await klaimPendaftaran(tx, pendaftaran.id, { status: 'DITOLAK', alasanTolak, peninjauId, ditinjauPada: new Date() });
    await catatAktivitas(peninjauId, `Menolak pendaftaran akun ${pendaftaran.username}`, tx);
  });

  notifikasi.beritahuPendaftaranDitolak(pendaftaran, alasanTolak);
};

module.exports = { getAll, setujui, tolak };
