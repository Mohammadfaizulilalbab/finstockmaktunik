// Panel owner (superadmin) di halaman Pengguna:
// daftar permintaan akun yang menunggu persetujuan + riwayatnya.

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { BadgeCheck, MailCheck } from 'lucide-react';
import Card from '../ui/Card';
import StatusPendaftaranBadge from './StatusPendaftaranBadge';
import SetujuiPendaftaranModal from './SetujuiPendaftaranModal';
import TolakPendaftaranModal from './TolakPendaftaranModal';
import { getPendaftaran } from '../../api/pendaftaranApi';
import { getErrorMessage } from '../../utils/apiError';
import { formatTanggalWaktu } from '../../utils/formatTanggal';

const FILTER = [
  { value: 'MENUNGGU', label: 'Menunggu Persetujuan' },
  { value: 'SEMUA', label: 'Semua Riwayat' },
];

/**
 * Keterangan cara email pendaftar diverifikasi
 * @param {{ viaGoogle: boolean }} props
 */
const SumberVerifikasi = ({ viaGoogle }) => (
  <span className="inline-flex items-center gap-1 text-[10px] text-[#006c4e] font-semibold">
    {viaGoogle ? <BadgeCheck size={12} /> : <MailCheck size={12} />}
    {viaGoogle ? 'Terverifikasi Google' : 'Email terverifikasi'}
  </span>
);

/**
 * Tombol aksi atau keterangan hasil tinjauan untuk satu baris
 */
const AksiPendaftaran = ({ pendaftaran, onSetujui, onTolak }) => {
  if (pendaftaran.status !== 'MENUNGGU') {
    return (
      <span className="text-[10px] text-neutral-500">
        oleh {pendaftaran.peninjau?.nama || '-'}
        {pendaftaran.alasanTolak && <span className="block italic">“{pendaftaran.alasanTolak}”</span>}
      </span>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => onSetujui(pendaftaran)}
        className="text-[10px] font-medium text-[#006c4e] hover:text-white hover:bg-[#006c4e] border border-[#006c4e] px-3 py-1.5 rounded transition-colors"
      >
        Setujui
      </button>
      <button
        onClick={() => onTolak(pendaftaran)}
        className="text-[10px] font-medium text-[#ba1a1a] hover:text-white hover:bg-[#ba1a1a] border border-[#ba1a1a] px-3 py-1.5 rounded transition-colors"
      >
        Tolak
      </button>
    </div>
  );
};

/**
 * @param {{ onAkunDibuat: () => void }} props - dipanggil setelah akun baru dibuat
 */
const PermintaanAkunPanel = ({ onAkunDibuat }) => {
  const [filter, setFilter] = useState('MENUNGGU');
  const [versiData, setVersiData] = useState(0); // dinaikkan untuk memuat ulang
  const [daftar, setDaftar] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aksi, setAksi] = useState(null); // { jenis: 'SETUJUI' | 'TOLAK', pendaftaran }

  // Muat data saat filter berubah atau diminta ulang.
  // Flag `aktif` mengabaikan respons lama jika filter sudah diganti.
  useEffect(() => {
    let aktif = true;
    getPendaftaran(filter)
      .then((data) => aktif && setDaftar(data))
      .catch((error) => aktif && toast.error(getErrorMessage(error, 'Gagal memuat permintaan akun')))
      .finally(() => aktif && setIsLoading(false));
    return () => {
      aktif = false;
    };
  }, [filter, versiData]);

  const gantiFilter = (nilai) => {
    setIsLoading(true);
    setFilter(nilai);
  };

  const muatUlang = () => setVersiData((versi) => versi + 1);

  const tutupModal = () => setAksi(null);

  const setelahDisetujui = () => {
    tutupModal();
    muatUlang();
    onAkunDibuat();
  };

  const setelahDitolak = () => {
    tutupModal();
    muatUlang();
  };

  const jumlahMenunggu = daftar.filter((item) => item.status === 'MENUNGGU').length;

  return (
    <Card
      noPadding
      title={`Permintaan Akun${jumlahMenunggu ? ` (${jumlahMenunggu} menunggu)` : ''}`}
      subtitle="Akun baru hanya dibuat setelah Anda menyetujuinya."
      action={
        <select
          aria-label="Filter permintaan akun"
          value={filter}
          onChange={(event) => gantiFilter(event.target.value)}
          className="px-3 py-1.5 border border-[#c3c6cf] rounded-md text-xs bg-white outline-none focus:border-[#002444] cursor-pointer"
        >
          {FILTER.map((opsi) => <option key={opsi.value} value={opsi.value}>{opsi.label}</option>)}
        </select>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse bg-white">
          <thead>
            <tr className="bg-[#f8f9fb] border-b border-[#c3c6cf]/30 text-[#43474e]">
              <th className="py-3 px-6 font-semibold">NAMA</th>
              <th className="py-3 px-6 font-semibold">EMAIL</th>
              <th className="py-3 px-6 font-semibold">USERNAME</th>
              <th className="py-3 px-6 font-semibold">DIAJUKAN</th>
              <th className="py-3 px-6 font-semibold">STATUS</th>
              <th className="py-3 px-6 font-semibold text-right">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c3c6cf]/20 font-medium text-neutral-600">
            {isLoading && (
              <tr><td colSpan="6" className="py-4 text-center text-neutral-500">Memuat...</td></tr>
            )}
            {!isLoading && daftar.length === 0 && (
              <tr><td colSpan="6" className="py-4 text-center text-neutral-500">Tidak ada permintaan akun.</td></tr>
            )}
            {!isLoading && daftar.map((pendaftaran) => (
              <tr key={pendaftaran.id} className="hover:bg-[#f8f9fb] transition-colors">
                <td className="py-4 px-6 font-bold text-[#002444]">{pendaftaran.nama}</td>
                <td className="py-4 px-6">
                  <span className="block text-neutral-600 break-all">{pendaftaran.email}</span>
                  <SumberVerifikasi viaGoogle={pendaftaran.viaGoogle} />
                </td>
                <td className="py-4 px-6 text-neutral-500">{pendaftaran.username}</td>
                <td className="py-4 px-6 text-neutral-500 whitespace-nowrap">{formatTanggalWaktu(pendaftaran.createdAt)}</td>
                <td className="py-4 px-6"><StatusPendaftaranBadge status={pendaftaran.status} /></td>
                <td className="py-4 px-6 text-right">
                  <AksiPendaftaran
                    pendaftaran={pendaftaran}
                    onSetujui={(item) => setAksi({ jenis: 'SETUJUI', pendaftaran: item })}
                    onTolak={(item) => setAksi({ jenis: 'TOLAK', pendaftaran: item })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {aksi?.jenis === 'SETUJUI' && (
        <SetujuiPendaftaranModal pendaftaran={aksi.pendaftaran} onClose={tutupModal} onSuccess={setelahDisetujui} />
      )}
      {aksi?.jenis === 'TOLAK' && (
        <TolakPendaftaranModal pendaftaran={aksi.pendaftaran} onClose={tutupModal} onSuccess={setelahDitolak} />
      )}
    </Card>
  );
};

export default PermintaanAkunPanel;
