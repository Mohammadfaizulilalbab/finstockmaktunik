// Tombol aksi utama di halaman autentikasi

/**
 * @param {{ isLoading?: boolean, loadingText?: string, children: React.ReactNode }} props
 *   props lain diteruskan ke <button>
 */
const AuthButton = ({ isLoading = false, loadingText = 'Memproses...', children, disabled, type = 'submit', ...props }) => (
  <button
    type={type}
    disabled={disabled || isLoading}
    className="w-full py-3 px-4 rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-sm bg-[#1a3a5c] hover:bg-[#002444] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    {...props}
  >
    {isLoading ? loadingText : children}
  </button>
);

export default AuthButton;
