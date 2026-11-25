// ============================================
// Layout Email — FinStocks
// ============================================
// Membangun versi teks & HTML dari satu struktur konten,
// sehingga template hanya perlu menulis isi, bukan markup.

/**
 * Escape karakter HTML agar data pengguna (mis. nama) aman disisipkan
 * @param {any} value
 * @returns {string}
 */
const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * @typedef {object} KontenEmail
 * @property {string} subject
 * @property {string} sapaan - mis. "Halo Budi,"
 * @property {string[]} paragraf
 * @property {{ label: string, url: string }} [tombol]
 * @property {string} [catatan] - teks kecil di bagian bawah
 */

/**
 * Susun versi teks biasa
 * @param {KontenEmail} konten
 * @returns {string}
 */
const renderText = ({ sapaan, paragraf, tombol, catatan }) =>
  [
    sapaan,
    '',
    ...paragraf,
    ...(tombol ? ['', `${tombol.label}: ${tombol.url}`] : []),
    ...(catatan ? ['', catatan] : []),
    '',
    '— FinStocks UMKM Mak Tunik',
  ].join('\n');

/**
 * Susun tombol aksi + link cadangan
 * @param {{ label: string, url: string }} tombol
 * @returns {string}
 */
const renderTombol = ({ label, url }) => `
      <p style="margin:24px 0">
        <a href="${escapeHtml(url)}" style="background:#1a3a5c;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;display:inline-block">${escapeHtml(label)}</a>
      </p>
      <p style="margin:0 0 12px;font-size:12px;color:#73777f">Jika tombol tidak berfungsi, salin link ini ke browser:<br><span style="word-break:break-all">${escapeHtml(url)}</span></p>`;

/**
 * Susun versi HTML
 * @param {KontenEmail} konten
 * @returns {string}
 */
const renderHtml = ({ sapaan, paragraf, tombol, catatan }) => `
<div style="background:#f8f9fb;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#191c1e">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e1e3e8;border-radius:12px;overflow:hidden">
    <div style="background:#1a3a5c;color:#ffffff;padding:18px 24px;font-weight:bold;font-size:16px">FinStock UMKM</div>
    <div style="padding:24px;font-size:14px;line-height:1.6">
      <p style="margin:0 0 12px">${escapeHtml(sapaan)}</p>
      ${paragraf.map((p) => `<p style="margin:0 0 12px">${escapeHtml(p)}</p>`).join('')}
      ${tombol ? renderTombol(tombol) : ''}
      ${catatan ? `<p style="margin:16px 0 0;font-size:12px;color:#73777f">${escapeHtml(catatan)}</p>` : ''}
    </div>
  </div>
</div>`;

/**
 * Bangun email lengkap siap kirim (tanpa penerima)
 * @param {KontenEmail} konten
 * @returns {{ subject: string, text: string, html: string }}
 */
const buatEmail = (konten) => ({
  subject: konten.subject,
  text: renderText(konten),
  html: renderHtml(konten),
});

module.exports = { buatEmail };
