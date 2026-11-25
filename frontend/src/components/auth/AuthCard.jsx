// Kartu putih pembungkus form/status di halaman autentikasi

/**
 * @param {{ title?: string, subtitle?: string, footer?: React.ReactNode, children: React.ReactNode }} props
 */
const AuthCard = ({ title, subtitle, footer, children }) => (
  <>
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#c3c6cf]/30 shadow-sm">
      {title && <h2 className="text-lg font-bold text-[#191c1e] text-center md:text-left">{title}</h2>}
      {subtitle && <p className="text-xs text-[#73777f] mt-1 text-center md:text-left">{subtitle}</p>}
      <div className={title || subtitle ? 'mt-6' : ''}>{children}</div>
    </div>

    {footer && <div className="mt-6 text-center text-xs text-[#73777f]">{footer}</div>}
  </>
);

export default AuthCard;
