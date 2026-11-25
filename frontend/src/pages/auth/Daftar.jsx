// ============================================
// Halaman Daftar Akun — FinStocks
// ============================================
// Pendaftar mengisi data diri; akun baru dibuat setelah owner menyetujui.
//   - Tanpa Google : email diverifikasi lewat link yang dikirim ke email
//   - Dengan Google: email sudah terverifikasi, langsung menunggu owner

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AtSign, Mail, User } from 'lucide-react';
import { ajukanPendaftaran } from '../../api/pendaftaranApi';
import { getErrorCode, getErrorMessage } from '../../utils/apiError';
import { isPasswordValid } from '../../utils/passwordPolicy';
import { isGoogleEnabled, readGoogleProfile } from '../../utils/googleIdentity';
import AuthCard from '../../components/auth/AuthCard';
import AuthTextField from '../../components/auth/AuthTextField';
import PasswordField from '../../components/auth/PasswordField';
import PasswordChecklist from '../../components/auth/PasswordChecklist';
import AuthButton from '../../components/auth/AuthButton';
import AuthDivider from '../../components/auth/AuthDivider';
import AuthLink from '../../components/auth/AuthLink';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import GoogleTerhubungBanner from '../../components/auth/GoogleTerhubungBanner';
import HasilPendaftaran from '../../components/auth/HasilPendaftaran';

const POLA_USERNAME = /^[a-zA-Z0-9._]+$/;

/**
 * Usulkan username dari bagian depan email
 * @param {string} email
 * @returns {string}
 */
const usulkanUsername = (email) => email.split('@')[0].replace(/[^a-zA-Z0-9._]/g, '').slice(0, 15);

/**
 * Isi awal form, memakai profil Google bila tersedia
 * @param {string|null} googleCredential
 */
const buatFormAwal = (googleCredential) => {
  const profil = googleCredential ? readGoogleProfile(googleCredential) : null;
  return {
    nama: profil?.nama || '',
    email: profil?.email || '',
    username: profil ? usulkanUsername(profil.email) : '',
    password: '',
    konfirmasi: '',
  };
};

/**
 * Validasi sisi client sebelum dikirim
 * @returns {string|null} pesan error pertama, atau null jika valid
 */
const validasiForm = (form) => {
  if (!POLA_USERNAME.test(form.username)) return 'Username hanya boleh huruf, angka, titik, dan garis bawah';
  if (!isPasswordValid(form.password)) return 'Password belum memenuhi semua syarat';
  if (form.password !== form.konfirmasi) return 'Konfirmasi password tidak sama';
  return null;
};

const Daftar = () => {
  const location = useLocation();
  const credentialAwal = location.state?.googleCredential || null;

  const [googleCredential, setGoogleCredential] = useState(credentialAwal);
  const [form, setForm] = useState(() => buatFormAwal(credentialAwal));
  const [isLoading, setIsLoading] = useState(false);
  const [hasil, setHasil] = useState(null);

  const ubahField = (field) => (event) => setForm((lama) => ({ ...lama, [field]: event.target.value }));

  /** Isi nama & email dari akun Google yang dipilih */
  const pakaiGoogle = (credential) => {
    const profil = readGoogleProfile(credential);
    if (!profil) {
      toast.error('Gagal membaca akun Google');
      return;
    }
    setGoogleCredential(credential);
    setForm((lama) => ({
      ...lama,
      nama: lama.nama || profil.nama,
      email: profil.email,
      username: lama.username || usulkanUsername(profil.email),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const pesanError = validasiForm(form);
    if (pesanError) {
      toast.error(pesanError);
      return;
    }

    setIsLoading(true);
    try {
      const { nama, email, username, password } = form;
      setHasil(await ajukanPendaftaran({ nama, email, username, password, ...(googleCredential && { googleCredential }) }));
    } catch (error) {
      if (getErrorCode(error) === 'GOOGLE_TOKEN_INVALID') setGoogleCredential(null);
      toast.error(getErrorMessage(error, 'Gagal mengirim pendaftaran'));
    } finally {
      setIsLoading(false);
    }
  };

  if (hasil) return <HasilPendaftaran hasil={hasil} />;

  return (
    <AuthCard
      title="Buat Akun Baru"
      subtitle="Akun dapat dipakai setelah disetujui oleh owner."
      footer={<>Sudah punya akun? <AuthLink to="/login">Masuk</AuthLink></>}
    >
      {googleCredential ? (
        <GoogleTerhubungBanner email={form.email} onLepas={() => setGoogleCredential(null)} />
      ) : (
        isGoogleEnabled && (
          <>
            <GoogleSignInButton text="signup_with" onCredential={pakaiGoogle} />
            <AuthDivider label="atau isi manual" />
          </>
        )
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthTextField
          id="nama" label="Nama Lengkap" icon={User} autoComplete="name"
          required minLength={2} maxLength={50} disabled={isLoading}
          value={form.nama} onChange={ubahField('nama')} placeholder="Nama sesuai identitas"
        />
        <AuthTextField
          id="email" label="Email" type="email" icon={Mail} autoComplete="email"
          required disabled={isLoading} readOnly={Boolean(googleCredential)}
          value={form.email} onChange={ubahField('email')} placeholder="nama@gmail.com"
          hint={googleCredential ? undefined : 'Link verifikasi akan dikirim ke email ini.'}
        />
        <AuthTextField
          id="username" label="Username" icon={AtSign} autoComplete="username"
          required minLength={3} maxLength={15} disabled={isLoading}
          value={form.username} onChange={ubahField('username')} placeholder="mis. budi.santoso"
          hint="Huruf, angka, titik, atau garis bawah (3–15 karakter)."
        />
        <div>
          <PasswordField
            id="password" label="Password" autoComplete="new-password"
            required disabled={isLoading}
            value={form.password} onChange={ubahField('password')} placeholder="Buat password"
          />
          <PasswordChecklist password={form.password} />
        </div>
        <PasswordField
          id="konfirmasi" label="Konfirmasi Password" autoComplete="new-password"
          required disabled={isLoading}
          value={form.konfirmasi} onChange={ubahField('konfirmasi')} placeholder="Ulangi password"
        />

        <div className="pt-2">
          <AuthButton isLoading={isLoading} loadingText="Mengirim...">Kirim Pendaftaran</AuthButton>
        </div>
      </form>
    </AuthCard>
  );
};

export default Daftar;
