// Modal owner untuk menolak permintaan akun (alasan opsional,
// ikut dikirim ke email pendaftar)

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { tolakPendaftaran } from '../../api/pendaftaranApi';
import { getErrorMessage } from '../../utils/apiError';

const ALASAN_MAKS = 500;

/**
 * @param {object} props
 * @param {{ id: number, nama: string, email: string }} props.pendaftaran
 * @param {() => void} props.onClose
 * @param {() => void} props.onSuccess
 */
const TolakPendaftaranModal = ({ pendaftaran, onClose, onSuccess }) => {
  const [alasan, setAlasan] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await tolakPendaftaran(pendaftaran.id, alasan.trim());
      toast.success('Pendaftaran ditolak');
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menolak pendaftaran'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Tolak Permintaan Akun" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-neutral-600">
          Tolak permintaan akun dari <span className="font-semibold text-[#002444]">{pendaftaran.nama}</span> ({pendaftaran.email})?
        </p>

        <div>
          <label htmlFor="alasan-tolak" className="block text-sm font-medium text-neutral-700 mb-1">Alasan (opsional)</label>
          <textarea
            id="alasan-tolak"
            rows={3}
            maxLength={ALASAN_MAKS}
            value={alasan}
            onChange={(event) => setAlasan(event.target.value)}
            placeholder="Akan dikirim ke email pendaftar"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#002444]"
          />
          <p className="text-[10px] text-neutral-400 text-right">{alasan.length}/{ALASAN_MAKS}</p>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button>
          <Button type="submit" variant="danger" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Tolak Permintaan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TolakPendaftaranModal;
