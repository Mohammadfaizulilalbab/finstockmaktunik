// ============================================
// Helper Hash Password — FinStocks
// ============================================
// Bungkus bcrypt agar jumlah rounds hanya diatur di satu tempat.
// Aturan kekuatan password ada di passwordPolicy.js.

const bcrypt = require('bcryptjs');
const { BCRYPT_ROUNDS } = require('../config/auth.config');

// Hash dummy untuk menyamakan waktu respons saat akun tidak ditemukan
const DUMMY_HASH = bcrypt.hashSync('finstocks-dummy-password', BCRYPT_ROUNDS);

/**
 * Hash password mentah
 * @param {string} password
 * @returns {Promise<string>}
 */
const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

/**
 * Cocokkan password mentah dengan hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

/**
 * Jalankan bcrypt tanpa hasil, agar respons "akun tidak ada" dan
 * "password salah" memakan waktu yang sama (mencegah user enumeration)
 * @param {string} password
 */
const simulateVerifyPassword = (password) => bcrypt.compare(password, DUMMY_HASH);

module.exports = { hashPassword, verifyPassword, simulateVerifyPassword };
