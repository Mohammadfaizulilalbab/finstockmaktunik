// ============================================
// Middleware Validasi — FinStocks
// ============================================
// Menjalankan aturan express-validator lalu menghentikan
// request dengan 422 jika ada input yang tidak valid.
//
// Contoh:
//   router.post('/login', validate(loginRules), controller.login);

const { validationResult } = require('express-validator');
const { sendValidationError } = require('../utils/response');

/**
 * @param {import('express-validator').ValidationChain[]} rules
 * @returns {import('express').RequestHandler[]}
 */
const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }
    return next();
  },
];

module.exports = validate;
