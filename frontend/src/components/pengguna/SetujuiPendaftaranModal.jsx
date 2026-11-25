// Modal owner untuk menyetujui permintaan akun
// sekaligus memilih role dan izin akses akun baru.

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import IzinAksesCheckboxes from './IzinAksesCheckboxes';
import { setujuiPendaftaran } from '../../api/pendaftaranApi';
import { getErrorMessage } from '../../utils/apiError';
import { FITUR_DEFAULT_KARYAWAN } from '../../constants/permissions';

/**
 * @param {object} props
 * @param {{ id: number, nama: string, email: string, username: string }} props.pendaftaran
 * @param {() => void} props.onClose
 * @param {(akun: object) => void} props.onSuccess
 */
const SetujuiPendaftaranModal = ({ pendaftaran, onClose, onSuccess }) => {
  const [role, setRole] = useState('KARYAWAN');
  const [permissions, setPermissions] = useState(FITUR_DEFAULT_KARYAWAN);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const akun = await setujuiPendaftaran(pendaftaran.id, { role, permissions });
      toast.success(`Akun ${akun.username} berhasil dibuat`);
      onSuccess(akun);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menyetujui pendaftaran'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Setujui Permintaan Akun">
      <form onSubmit={handleSubmit} className="space-y-4">
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm bg-[#f8f9fb] border border-[#c3c6cf]/40 rounded-lg p-3">
          <dt className="text-neutral-500">Nama</dt>
          <dd className="font-semibold text-[#002444]">{pendaftaran.nama}</dd>
          <dt className="text-neutral-500">Email</dt>
          <dd className="text-neutral-700 break-all">{pendaftaran.email}</dd>
          <dt className="text-neutral-500">Username</dt>
          <dd className="text-neutral-700">{pendaftaran.username}</dd>
        </dl>

        <div>
          <label htmlFor="role-baru" className="block text-sm font-medium text-neutral-700 mb-1">Role Akses</label>
          <select
            id="role-baru"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#002444]"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="KARYAWAN">KARYAWAN / KASIR</option>
            <option value="OWNER">ADMIN / OWNER</option>
          </select>
        </div>

        {role === 'KARYAWAN' && <IzinAksesCheckboxes value={permissions} onChange={setPermissions} />}

        <div className="flex gap-3 justify-end pt-4 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button>
          <Button type="submit" variant="success" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Setujui & Buat Akun'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SetujuiPendaftaranModal;
