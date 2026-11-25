// ============================================
// Halaman Lupa Password — FinStocks
// ============================================
// Pengguna memasukkan email; jika terdaftar, link reset dikirim.
// Pesan sukses selalu sama agar tidak membocorkan email terdaftar.

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { forgotPassword } from '../../api/authApi';
import { getErrorMessage } from '../../utils/apiError';
import AuthCard from '../../components/auth/AuthCard';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthButton from '../../components/auth/AuthButton';
import AuthStatus from '../../components/auth/AuthStatus';
import AuthLink from '../../components/auth/AuthLink';

const LupaPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pesanTerkirim, setPesanTerkirim] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      setPesanTerkirim(await forgotPassword(email));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal mengirim permintaan reset password'));
    } finally {
      setIsLoading(false);
    }
  };

  if (pesanTerkirim) {
    return (
      <AuthCard>
        <AuthStatus variant="email" title="Cek Email Anda" message={`${pesanTerkirim} Link berlaku 30 menit.`}>
          <p className="text-xs text-center">
            <AuthLink to="/login">Kembali ke halaman masuk</AuthLink>
          </p>
        </AuthStatus>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Lupa Password"
      subtitle="Masukkan email akun Anda. Kami akan mengirim link untuk membuat password baru."
      footer={<>Ingat password? <AuthLink to="/login">Masuk</AuthLink></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthTextField
          id="email" label="Email" type="email" icon={Mail} autoComplete="email"
          required disabled={isLoading}
          value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@gmail.com"
        />
        <div className="pt-2">
          <AuthButton isLoading={isLoading} loadingText="Mengirim...">Kirim Link Reset</AuthButton>
        </div>
      </form>
    </AuthCard>
  );
};

export default LupaPassword;
