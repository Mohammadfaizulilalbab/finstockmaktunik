// Pemisah "atau" antara form biasa dan tombol Google

const AuthDivider = ({ label = 'atau' }) => (
  <div className="flex items-center gap-3 my-5" role="separator">
    <span className="flex-1 h-px bg-[#c3c6cf]/60"></span>
    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#73777f]">{label}</span>
    <span className="flex-1 h-px bg-[#c3c6cf]/60"></span>
  </div>
);

export default AuthDivider;
