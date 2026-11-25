// Tampilan setelah form pendaftaran berhasil dikirim

import AuthCard from './AuthCard';
import AuthStatus from './AuthStatus';
import AuthLink from './AuthLink';

const KONTEN = {
  BELUM_VERIFIKASI: {
    variant: 'email',
    title: 'Cek Email Anda',
    message: (email) =>
      `Kami mengirim link verifikasi ke ${email}. Buka link tersebut dalam 24 jam. Setelah itu, permintaan akun Anda diteruskan ke owner untuk disetujui.`,
  },
  MENUNGGU: {
    variant: 'success',
    title: 'Pendaftaran Terkirim',
    message: (email) =>
      `Permintaan akun Anda sedang menunggu persetujuan owner. Kabar selanjutnya akan dikirim ke ${email}.`,
  },
};

/**
 * @param {{ hasil: { status: 'BELUM_VERIFIKASI'|'MENUNGGU', email: string } }} props
 */
const HasilPendaftaran = ({ hasil }) => {
  const konten = KONTEN[hasil.status];

  return (
    <AuthCard>
      <AuthStatus variant={konten.variant} title={konten.title} message={konten.message(hasil.email)}>
        <p className="text-xs text-center">
          <AuthLink to="/login">Kembali ke halaman masuk</AuthLink>
        </p>
      </AuthStatus>
    </AuthCard>
  );
};

export default HasilPendaftaran;
