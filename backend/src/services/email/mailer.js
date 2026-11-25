// ============================================
// Mailer (SMTP) — FinStocks
// ============================================
// Satu-satunya tempat yang berbicara dengan server SMTP.
// Default: Gmail SMTP + App Password (lihat docs/AUTH.md).
// Jika SMTP belum diatur saat development, isi email
// dicetak ke console agar alur tetap bisa diuji.

const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Apakah kredensial SMTP sudah diisi
 * @returns {boolean}
 */
const isMailerConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

/**
 * Buat (sekali) dan kembalikan transporter nodemailer
 */
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

/**
 * Cetak email ke console (mode development tanpa SMTP)
 * @param {{ to: string, subject: string, text: string }} mail
 */
const printMailToConsole = ({ to, subject, text }) => {
  console.log(`\n📧 [DEV] SMTP belum diatur — email tidak dikirim\n   Ke     : ${to}\n   Subjek : ${subject}\n\n${text}\n`);
};

/**
 * Kirim email. Melempar error jika gagal.
 * @param {{ to: string, subject: string, text: string, html: string }} mail
 */
const sendMail = async (mail) => {
  if (!isMailerConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP belum dikonfigurasi (SMTP_USER / SMTP_PASS)');
    }
    printMailToConsole(mail);
    return;
  }

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || `FinStocks <${process.env.SMTP_USER}>`,
    ...mail,
  });
};

/**
 * Kirim email di latar belakang; kegagalan hanya dicatat di log.
 * Dipakai untuk notifikasi yang tidak boleh menggagalkan proses utama.
 * @param {{ to: string, subject: string, text: string, html: string }} mail
 */
const sendMailInBackground = (mail) => {
  sendMail(mail).catch((error) => {
    console.error(`Gagal mengirim email "${mail.subject}" ke ${mail.to}:`, error.message);
  });
};

module.exports = { sendMail, sendMailInBackground };
