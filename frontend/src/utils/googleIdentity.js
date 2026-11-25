// ============================================
// Google Identity Services — FinStocks
// ============================================
// Helper untuk tombol "Masuk dengan Google".
// Tombol hanya muncul jika VITE_GOOGLE_CLIENT_ID diisi di .env.

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const isGoogleEnabled = Boolean(GOOGLE_CLIENT_ID);

let scriptPromise = null;

/**
 * Muat script Google Identity Services (hanya sekali per halaman)
 * @returns {Promise<void>}
 */
export const loadGoogleIdentityScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null; // izinkan percobaan ulang
        reject(new Error('Gagal memuat Google Identity Services'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
};

/**
 * Baca nama & email dari credential Google untuk mengisi form.
 * Hanya untuk tampilan — keaslian token tetap diverifikasi di server.
 * @param {string} credential - ID token (JWT)
 * @returns {{ nama: string, email: string } | null}
 */
export const readGoogleProfile = (credential) => {
  try {
    const payload = credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    const { name, email } = JSON.parse(json);
    return { nama: name || '', email: email || '' };
  } catch {
    return null;
  }
};
