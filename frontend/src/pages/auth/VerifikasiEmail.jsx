// ============================================
// Halaman Verifikasi Email — FinStocks
// ============================================
// Dibuka dari link di email pendaftaran: /verifikasi-email?token=...
// Token dikirim ke server sekali saat halaman dibuka.

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifikasiEmail } from '../../api/pendaftaranApi';
import { getErrorMessage } from '../../utils/apiError';
import AuthCard from '../../components/auth/AuthCard';
import AuthStatus from '../../components/auth/AuthStatus';
import AuthLink from '../../components/auth/AuthLink';

const VerifikasiEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [hasil, setHasil] = useState(
    token ? { status: 'loading' } : { status: 'error', pesan: 'Link verifikasi tidak lengkap.' }
  );

  // Token hanya sah sekali; cegah pengiriman ganda (mis. StrictMode di development)
  const sudahDikirim = useRef(false);

  useEffect(() => {
    if (!token || sudahDikirim.current) return;
    sudahDikirim.current = true;

    verifikasiEmail(token)
      .then((data) => setHasil({ status: 'success', data }))
      .catch((error) => setHasil({ status: 'error', pesan: getErrorMessage(error, 'Verifikasi email gagal.') }));
  }, [token]);

  return (
    <AuthCard>
      {hasil.status === 'loading' && <AuthStatus variant="loading" title="Memverifikasi email..." />}

      {hasil.status === 'success' && (
        <AuthStatus
          variant="success"
          title="Email Terverifikasi"
          message={`Terima kasih, ${hasil.data.nama}. Permintaan akun Anda sudah diteruskan ke owner. Kabar persetujuan akan dikirim ke ${hasil.data.email}.`}
        >
          <p className="text-xs text-center"><AuthLink to="/login">Ke halaman masuk</AuthLink></p>
        </AuthStatus>
      )}

      {hasil.status === 'error' && (
        <AuthStatus variant="error" title="Verifikasi Gagal" message={hasil.pesan}>
          <p className="text-xs text-center"><AuthLink to="/daftar">Daftar ulang</AuthLink></p>
        </AuthStatus>
      )}
    </AuthCard>
  );
};

export default VerifikasiEmail;
