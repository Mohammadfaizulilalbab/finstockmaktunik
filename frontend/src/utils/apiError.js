// ============================================
// Helper Error API — FinStocks
// ============================================
// Backend selalu membalas { success, message, error } saat gagal.

/**
 * Ambil pesan error yang bisa ditampilkan ke pengguna
 * @param {unknown} error - error dari axios
 * @param {string} [fallback]
 * @returns {string}
 */
export const getErrorMessage = (error, fallback = 'Terjadi kesalahan. Silakan coba lagi.') =>
  error?.response?.data?.message || fallback;

/**
 * Ambil kode error dari server (mis. 'GOOGLE_NOT_REGISTERED')
 * @param {unknown} error - error dari axios
 * @returns {string|undefined}
 */
export const getErrorCode = (error) => error?.response?.data?.error;
