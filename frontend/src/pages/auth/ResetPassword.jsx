// ============================================
// Halaman Reset Password — FinStocks
// ============================================
// Dibuka dari link di email: /reset-password?token=...

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { resetPassword } from '../../api/authApi';
import { getErrorCode, getErrorMessage } from '../../utils/apiError';
import { isPasswordValid } from '../../utils/passwordPolicy';
import AuthCard from '../../components/auth/AuthCard';
import PasswordField from '../../components/auth/PasswordField';
import PasswordChecklist from '../../components/auth/PasswordChecklist';
import AuthButton from '../../components/auth/AuthButton';
import AuthStatus from '../../components/auth/AuthStatus';
import AuthLink from '../../components/auth/AuthLink';

/**
 * Status saat link tidak lengkap atau sudah tidak berlaku
 * @param {{ message: string }} props
 */
const LinkTidakValid = ({ message }) => (
  <AuthCard>
    <AuthStatus variant="error" title="Link Tidak Berlaku" message={message}>
      <p className="text-xs text-center">
        <AuthLink to="/lupa-password">Minta link reset baru</AuthLink>
      </p>
    </AuthStatus>
  </AuthCard>
);

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [berhasil, setBerhasil] = useState(false);
  const [errorLink, setErrorLink] = useState(token ? null : 'Link reset password tidak lengkap.');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isPasswordValid(password)) {
      toast.error('Password belum memenuhi semua syarat');
      return;
    }
    if (password !== konfirmasi) {
      toast.error('Konfirmasi password tidak sama');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setBerhasil(true);
    } catch (error) {
      if (getErrorCode(error) === 'RESET_TOKEN_INVALID') {
        setErrorLink(getErrorMessage(error));
      } else {
        toast.error(getErrorMessage(error, 'Gagal mengubah password'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (errorLink) return <LinkTidakValid message={errorLink} />;

  if (berhasil) {
    return (
      <AuthCard>
        <AuthStatus variant="success" title="Password Berhasil Diubah" message="Silakan masuk dengan password baru Anda.">
          <p className="text-xs text-center">
            <AuthLink to="/login">Masuk sekarang</AuthLink>
          </p>
        </AuthStatus>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Buat Password Baru" subtitle="Password baru akan menggantikan password lama Anda.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <PasswordField
            id="password" label="Password Baru" autoComplete="new-password"
            required disabled={isLoading}
            value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Buat password baru"
          />
          <PasswordChecklist password={password} />
        </div>
        <PasswordField
          id="konfirmasi" label="Konfirmasi Password" autoComplete="new-password"
          required disabled={isLoading}
          value={konfirmasi} onChange={(event) => setKonfirmasi(event.target.value)} placeholder="Ulangi password baru"
        />
        <div className="pt-2">
          <AuthButton isLoading={isLoading} loadingText="Menyimpan...">Simpan Password</AuthButton>
        </div>
      </form>
    </AuthCard>
  );
};

export default ResetPassword;
