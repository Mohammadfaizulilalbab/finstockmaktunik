// ============================================
// AppError — FinStocks
// ============================================
// Error terkontrol yang membawa HTTP status & kode error.
// Kompatibel dengan pola lama { status, message, code }
// sehingga bisa dibaca oleh controller mana pun.

class AppError extends Error {
  /**
   * @param {number} status - HTTP status code
   * @param {string} message - Pesan untuk pengguna
   * @param {string} code - Kode error internal (mis. 'INVALID_CREDENTIALS')
   */
  constructor(status, message, code) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

module.exports = AppError;
