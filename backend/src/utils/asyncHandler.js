// ============================================
// Async Handler — FinStocks
// ============================================
// Membungkus controller async agar tidak perlu menulis
// try/catch berulang. Error terkontrol (punya status) dikirim
// apa adanya; error tak terduga disembunyikan dari client.

const { sendError } = require('./response');

/**
 * @param {(req, res, next) => Promise<any>} handler
 * @returns {import('express').RequestHandler}
 */
const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    if (error.status) {
      return sendError(res, error.message, error.status, error.code);
    }
    console.error('Unhandled error:', error);
    return sendError(res, 'Terjadi kesalahan pada server', 500, 'INTERNAL_SERVER_ERROR');
  }
};

module.exports = asyncHandler;
