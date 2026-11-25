// ============================================
// Google Auth Service — FinStocks
// ============================================
// Frontend mengirim ID token (credential) dari Google Identity Services.
// Di sini token diverifikasi: tanda tangan Google, audience (Client ID),
// masa berlaku, dan status verifikasi email.

const { OAuth2Client } = require('google-auth-library');
const AppError = require('../utils/AppError');

const client = new OAuth2Client();

/**
 * Ambil Client ID dari env atau lempar error jika belum diatur
 * @returns {string}
 */
const getClientId = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new AppError(503, 'Login dengan Google belum dikonfigurasi di server.', 'GOOGLE_NOT_CONFIGURED');
  }
  return clientId;
};

/**
 * Verifikasi tanda tangan & audience ID token
 * @param {string} credential
 * @returns {Promise<import('google-auth-library').TokenPayload>}
 */
const decodeVerifiedToken = async (credential) => {
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: getClientId() });
    return ticket.getPayload();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'Token Google tidak valid atau sudah kedaluwarsa.', 'GOOGLE_TOKEN_INVALID');
  }
};

/**
 * Verifikasi credential Google dan kembalikan profil ringkas
 * @param {string} credential
 * @returns {Promise<{ googleId: string, email: string, nama: string }>}
 */
const verifyGoogleCredential = async (credential) => {
  const payload = await decodeVerifiedToken(credential);

  if (!payload?.email || !payload.email_verified) {
    throw new AppError(401, 'Email akun Google belum terverifikasi.', 'GOOGLE_EMAIL_UNVERIFIED');
  }

  const email = payload.email.toLowerCase();
  return { googleId: payload.sub, email, nama: payload.name || email.split('@')[0] };
};

module.exports = { verifyGoogleCredential };
