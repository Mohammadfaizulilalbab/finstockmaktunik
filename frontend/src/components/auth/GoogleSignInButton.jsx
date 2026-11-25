// Tombol resmi "Masuk dengan Google" (Google Identity Services).
// Tidak dirender sama sekali jika VITE_GOOGLE_CLIENT_ID kosong.

import { useEffect, useRef } from 'react';
import useGoogleIdentity from '../../hooks/useGoogleIdentity';
import { GOOGLE_CLIENT_ID } from '../../utils/googleIdentity';

const LEBAR_DEFAULT = 340;
const LEBAR_MAKS = 400; // batas dari Google

/**
 * @param {object} props
 * @param {(credential: string) => void} props.onCredential - dipanggil dengan ID token Google
 * @param {'signin_with'|'signup_with'|'continue_with'} [props.text]
 */
const GoogleSignInButton = ({ onCredential, text = 'signin_with' }) => {
  const status = useGoogleIdentity();
  const containerRef = useRef(null);
  const onCredentialRef = useRef(onCredential);

  // Simpan callback terbaru tanpa harus merender ulang tombol Google
  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const container = containerRef.current;
    if (status !== 'ready' || !container) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => onCredentialRef.current(response.credential),
    });
    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text,
      locale: 'id',
      width: Math.min(container.offsetWidth || LEBAR_DEFAULT, LEBAR_MAKS),
    });
  }, [status, text]);

  if (status === 'disabled') return null;

  if (status === 'error') {
    return <p className="text-[10px] text-center text-[#ba1a1a]">Gagal memuat tombol Google. Periksa koneksi internet Anda.</p>;
  }

  return <div ref={containerRef} className="w-full flex justify-center min-h-[44px]" />;
};

export default GoogleSignInButton;
