// ============================================
// Halaman Login — FinStocks
// ============================================
// Masuk dengan email/username + password, atau dengan akun Google.
// Akun Google yang belum terdaftar diarahkan ke halaman daftar.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { User } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import * as authApi from '../../api/authApi';
import { getErrorCode, getErrorMessage } from '../../utils/apiError';
import { isGoogleEnabled } from '../../utils/googleIdentity';
import AuthCard from '../../components/auth/AuthCard';
import AuthTextField from '../../components/auth/AuthTextField';
import PasswordField from '../../components/auth/PasswordField';
import AuthButton from '../../components/auth/AuthButton';
import AuthDivider from '../../components/auth/AuthDivider';
import AuthLink from '../../components/auth/AuthLink';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  /** Simpan sesi lalu masuk ke dashboard */
  const masuk = ({ token, user }) => {
    setAuth(token, user);
    toast.success('Login berhasil!');
    navigate('/', { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      masuk(await authApi.login(identifier, password));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Terjadi kesalahan saat login'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setIsLoading(true);
    try {
      masuk(await authApi.loginGoogle(credential));
    } catch (error) {
      if (getErrorCode(error) === 'GOOGLE_NOT_REGISTERED') {
        toast('Akun Google ini belum terdaftar. Lengkapi pendaftaran Anda.', { icon: 'ℹ️' });
        navigate('/daftar', { state: { googleCredential: credential } });
        return;
      }
      toast.error(getErrorMessage(error, 'Gagal masuk dengan Google'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Masuk ke Akun Anda"
      footer={<>Belum punya akun? <AuthLink to="/daftar">Daftar sekarang</AuthLink></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthTextField
          id="identifier"
          label="Email atau Username"
          icon={User}
          autoComplete="username"
          required
          disabled={isLoading}
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="nama@gmail.com atau username"
        />

        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          required
          disabled={isLoading}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Masukkan password Anda"
          labelAction={
            <AuthLink to="/lupa-password" className="text-[10px] font-semibold">Lupa password?</AuthLink>
          }
        />

        <div className="pt-2">
          <AuthButton isLoading={isLoading} loadingText="Sedang Masuk...">Masuk ke Sistem</AuthButton>
        </div>
      </form>

      {isGoogleEnabled && (
        <>
          <AuthDivider />
          <GoogleSignInButton onCredential={handleGoogle} />
        </>
      )}
    </AuthCard>
  );
};

export default Login;
