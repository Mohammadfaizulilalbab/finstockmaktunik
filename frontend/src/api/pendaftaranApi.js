// ============================================
// Pendaftaran API — FinStocks
// ============================================
// Endpoint /api/pendaftaran:
//   - publik : ajukan pendaftaran, verifikasi email
//   - owner  : lihat, setujui, tolak permintaan akun

import axiosInstance from './axiosInstance';

/**
 * Ajukan pendaftaran akun baru
 * @param {{ nama: string, email: string, username: string, password: string, googleCredential?: string }} data
 * @returns {Promise<{ status: 'BELUM_VERIFIKASI'|'MENUNGGU', email: string }>}
 */
export const ajukanPendaftaran = async (data) => {
  const response = await axiosInstance.post('/pendaftaran', data);
  return response.data.data;
};

/**
 * Verifikasi email pendaftar dari link di email
 * @param {string} token
 * @returns {Promise<{ nama: string, email: string }>}
 */
export const verifikasiEmail = async (token) => {
  const response = await axiosInstance.post('/pendaftaran/verifikasi-email', { token });
  return response.data.data;
};

/**
 * Ambil daftar permintaan akun (khusus owner)
 * @param {'MENUNGGU'|'DISETUJUI'|'DITOLAK'|'SEMUA'} status
 * @returns {Promise<object[]>}
 */
export const getPendaftaran = async (status = 'MENUNGGU') => {
  const response = await axiosInstance.get('/pendaftaran', { params: { status } });
  return response.data.data || [];
};

/**
 * Setujui permintaan akun (khusus owner)
 * @param {number} id
 * @param {{ role: 'OWNER'|'KARYAWAN', permissions: string[] }} akses
 * @returns {Promise<object>} akun yang dibuat
 */
export const setujuiPendaftaran = async (id, akses) => {
  const response = await axiosInstance.put(`/pendaftaran/${id}/setujui`, akses);
  return response.data.data;
};

/**
 * Tolak permintaan akun (khusus owner)
 * @param {number} id
 * @param {string} alasan
 */
export const tolakPendaftaran = async (id, alasan) => {
  await axiosInstance.put(`/pendaftaran/${id}/tolak`, { alasan });
};
