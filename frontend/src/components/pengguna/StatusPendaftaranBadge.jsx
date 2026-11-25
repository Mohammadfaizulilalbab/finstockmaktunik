// Label status permintaan akun

const GAYA_STATUS = {
  MENUNGGU: { label: 'Menunggu', kelas: 'bg-[#ffecc7] text-[#653e00]' },
  DISETUJUI: { label: 'Disetujui', kelas: 'bg-[#83f5c6] text-[#006c4e]' },
  DITOLAK: { label: 'Ditolak', kelas: 'bg-[#ffdad6] text-[#ba1a1a]' },
};

/**
 * @param {{ status: 'MENUNGGU'|'DISETUJUI'|'DITOLAK' }} props
 */
const StatusPendaftaranBadge = ({ status }) => {
  const gaya = GAYA_STATUS[status] || GAYA_STATUS.MENUNGGU;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${gaya.kelas}`}>
      {gaya.label}
    </span>
  );
};

export default StatusPendaftaranBadge;
