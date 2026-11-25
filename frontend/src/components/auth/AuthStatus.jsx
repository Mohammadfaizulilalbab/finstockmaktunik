// Tampilan hasil proses (berhasil / gagal / memuat) di halaman autentikasi

import { CheckCircle2, Loader2, MailCheck, XCircle } from 'lucide-react';

const VARIAN = {
  success: { Icon: CheckCircle2, warna: 'text-[#006c4e] bg-[#83f5c6]/30' },
  email: { Icon: MailCheck, warna: 'text-[#1a3a5c] bg-[#d9e2ec]' },
  error: { Icon: XCircle, warna: 'text-[#ba1a1a] bg-[#ffdad6]' },
  loading: { Icon: Loader2, warna: 'text-[#1a3a5c] bg-[#d9e2ec]' },
};

/**
 * @param {object} props
 * @param {'success'|'email'|'error'|'loading'} props.variant
 * @param {string} props.title
 * @param {React.ReactNode} [props.message]
 * @param {React.ReactNode} [props.children] - tombol/link aksi
 */
const AuthStatus = ({ variant, title, message, children }) => {
  const { Icon, warna } = VARIAN[variant];

  return (
    <div className="flex flex-col items-center text-center" role={variant === 'error' ? 'alert' : 'status'}>
      <span className={`w-14 h-14 rounded-full flex items-center justify-center ${warna}`}>
        <Icon className={`w-7 h-7 ${variant === 'loading' ? 'animate-spin' : ''}`} />
      </span>
      <h2 className="text-lg font-bold text-[#191c1e] mt-4">{title}</h2>
      {message && <p className="text-xs text-[#43474e] mt-2 leading-relaxed">{message}</p>}
      {children && <div className="w-full mt-6 space-y-3">{children}</div>}
    </div>
  );
};

export default AuthStatus;
