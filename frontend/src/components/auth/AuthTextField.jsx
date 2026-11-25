// Input teks bergaya halaman autentikasi (label kecil + ikon kiri)

/**
 * @param {object} props
 * @param {string} props.id - id input, juga dipakai label
 * @param {string} props.label
 * @param {React.ComponentType} [props.icon] - ikon lucide di kiri
 * @param {React.ReactNode} [props.labelAction] - elemen di kanan label (mis. link)
 * @param {React.ReactNode} [props.trailing] - elemen di kanan input (mis. tombol lihat password)
 * @param {string} [props.hint] - teks bantuan di bawah input
 */
const AuthTextField = ({ id, label, icon: Icon, labelAction, trailing, hint, ...inputProps }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center">
      <label htmlFor={id} className="text-[10px] font-bold text-[#191c1e] uppercase tracking-wide">{label}</label>
      {labelAction}
    </div>

    <div className="relative">
      {Icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#73777f] pointer-events-none">
          <Icon className="w-4 h-4" />
        </span>
      )}
      <input
        id={id}
        className={`w-full text-xs h-10 ${Icon ? 'pl-9' : 'pl-3'} ${trailing ? 'pr-10' : 'pr-4'} bg-white border border-[#c3c6cf] rounded-lg focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c] outline-none transition-all placeholder-[#73777f]/50 read-only:bg-[#f2f4f6] read-only:text-[#43474e] disabled:opacity-60`}
        {...inputProps}
      />
      {trailing && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</span>}
    </div>

    {hint && <p className="text-[10px] text-[#73777f]">{hint}</p>}
  </div>
);

export default AuthTextField;
