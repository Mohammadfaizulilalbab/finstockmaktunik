// ============================================
// Pengguna Service — FinStocks
// ============================================
// Logika bisnis untuk manajemen pengguna (CRUD + reset password)

const prisma = require('../../config/db');
const { hashPassword } = require('../../utils/password');
const { normalisasiEmail } = require('../../utils/email');

const SELECT_PENGGUNA = {
  id: true, nama: true, username: true, email: true, googleId: true, role: true,
  permissions: true, status: true, createdAt: true, updatedAt: true,
};

// Jangan kirim Google ID ke client, cukup status tertaut atau tidak
const formatPengguna = ({ googleId, ...data }) => ({ ...data, googleTerhubung: Boolean(googleId) });

/**
 * Pastikan email belum dipakai pengguna lain
 */
const pastikanEmailUnik = async (email, kecualiId = null) => {
  if (!email) return;
  const existing = await prisma.pengguna.findFirst({
    where: { email, ...(kecualiId ? { NOT: { id: kecualiId } } : {}) },
  });
  if (existing) {
    throw { status: 400, message: 'Email sudah digunakan', code: 'EMAIL_EXISTS' };
  }
};

/**
 * Ambil semua pengguna (tanpa password)
 */
const getAll = async () => {
  const pengguna = await prisma.pengguna.findMany({
    select: SELECT_PENGGUNA,
    orderBy: { createdAt: 'desc' },
  });
  return pengguna.map(formatPengguna);
};

/**
 * Ambil pengguna berdasarkan ID
 */
const getById = async (id) => {
  const pengguna = await prisma.pengguna.findUnique({
    where: { id: parseInt(id) },
    select: SELECT_PENGGUNA,
  });
  if (!pengguna) {
    throw { status: 404, message: 'Pengguna tidak ditemukan', code: 'USER_NOT_FOUND' };
  }
  return formatPengguna(pengguna);
};

/**
 * Tambah pengguna baru
 */
const create = async (data) => {
  // Cek apakah username sudah ada
  const existing = await prisma.pengguna.findUnique({
    where: { username: data.username },
  });
  if (existing) {
    throw { status: 400, message: 'Username sudah digunakan', code: 'USERNAME_EXISTS' };
  }

  const email = normalisasiEmail(data.email);
  await pastikanEmailUnik(email);

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  const pengguna = await prisma.pengguna.create({
    data: {
      nama: data.nama,
      username: data.username,
      email,
      password: hashedPassword,
      role: data.role || 'KARYAWAN',
      permissions: data.permissions || [],
      status: data.status || 'AKTIF',
    },
  });

  return getById(pengguna.id);
};

/**
 * Update data pengguna
 */
const update = async (id, data) => {
  // Cek pengguna ada
  const lama = await getById(id);

  // Jika username diubah, cek unik
  if (data.username) {
    const existing = await prisma.pengguna.findFirst({
      where: { username: data.username, NOT: { id: parseInt(id) } },
    });
    if (existing) {
      throw { status: 400, message: 'Username sudah digunakan', code: 'USERNAME_EXISTS' };
    }
  }

  const updateData = {};
  // Email kosong ("") berarti email dihapus
  if (data.email !== undefined) {
    updateData.email = normalisasiEmail(data.email);
    await pastikanEmailUnik(updateData.email, parseInt(id));
    // Email berganti → lepas tautan akun Google lama
    if (updateData.email !== lama.email) updateData.googleId = null;
  }
  if (data.nama) updateData.nama = data.nama;
  if (data.username) updateData.username = data.username;
  if (data.role) updateData.role = data.role;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;
  if (data.status) updateData.status = data.status;

  await prisma.pengguna.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  return getById(id);
};

/**
 * Hapus pengguna
 */
const remove = async (id) => {
  await getById(id);

  // Hapus log aktivitas terkait terlebih dahulu
  await prisma.logAktivitas.deleteMany({ where: { penggunaId: parseInt(id) } });

  await prisma.pengguna.delete({ where: { id: parseInt(id) } });
  return true;
};

/**
 * Reset password pengguna
 */
const resetPassword = async (id, newPassword) => {
  await getById(id);

  const hashedPassword = await hashPassword(newPassword);
  await prisma.pengguna.update({
    where: { id: parseInt(id) },
    data: { password: hashedPassword },
  });

  return true;
};

module.exports = { getAll, getById, create, update, remove, resetPassword };
