import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Input from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';

const Pengguna = () => {
  const [pengguna, setPengguna] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('TAMBAH'); // TAMBAH, EDIT
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    password: '',
    role: 'KARYAWAN',
    status: 'AKTIF',
    permissions: []
  });

  // Confirm Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null); // { id, action: 'NONAKTIFKAN' | 'AKTIFKAN' | 'HAPUS' }

  // Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({ newPassword: '' });

  useEffect(() => {
    fetchPengguna();
  }, []);

  const fetchPengguna = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/pengguna');
      setPengguna(response.data.data || []);
    } catch (error) {
      toast.error('Gagal memuat data pengguna');
      console.error('Failed to fetch pengguna', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    if (type === 'EDIT' && user) {
      setFormData({
        nama: user.nama,
        username: user.username,
        role: user.role,
        status: user.status,
        password: '', // Kosongkan password saat edit
        permissions: Array.isArray(user.permissions) ? user.permissions : []
      });
    } else {
      setFormData({
        nama: '',
        username: '',
        password: '',
        role: 'KARYAWAN',
        status: 'AKTIF',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'TAMBAH') {
        if (!formData.password) {
          toast.error('Password wajib diisi untuk pengguna baru');
          return;
        }
        await axiosInstance.post('/pengguna', formData);
        toast.success('Pengguna berhasil ditambahkan');
      } else {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Jangan kirim password kosong saat edit
        
        await axiosInstance.put(`/pengguna/${selectedUser.id}`, payload);
        
        // Show different message for permission changes
        if (formData.role === 'KARYAWAN' && payload.permissions !== undefined) {
          toast.success('Data pengguna berhasil diperbarui. Karyawan perlu logout dan login ulang untuk melihat perubahan akses.', {
            duration: 5000
          });
        } else {
          toast.success('Data pengguna berhasil diperbarui');
        }
      }
      setIsModalOpen(false);
      fetchPengguna();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPasswordData.newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    try {
      await axiosInstance.put(`/pengguna/${selectedUser.id}/reset-password`, resetPasswordData);
      toast.success('Password berhasil di-reset');
      setIsResetModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mereset password');
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmData) return;
    try {
      if (confirmData.action === 'HAPUS') {
        await axiosInstance.delete(`/pengguna/${confirmData.id}`);
        toast.success('Pengguna berhasil dihapus');
      } else {
        const statusBaru = confirmData.action === 'NONAKTIFKAN' ? 'NONAKTIF' : 'AKTIF';
        await axiosInstance.put(`/pengguna/${confirmData.id}`, { status: statusBaru });
        toast.success(`Pengguna berhasil di${confirmData.action.toLowerCase()}`);
      }
      setIsConfirmOpen(false);
      fetchPengguna();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memproses permintaan');
    }
  };

  const StatCard = ({ title, value, subtitle, subtitleColorClass, topBorderColor }) => (
    <Card topBorderColor={topBorderColor} className="flex flex-col justify-center py-5 px-6">
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">{title}</p>
      <h4 className="text-2xl font-bold text-neutral-800 leading-none mb-2">{value}</h4>
      <p className={`text-[11px] font-medium ${subtitleColorClass}`}>{subtitle}</p>
    </Card>
  );

  const handleTogglePermission = (path) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      if (current.includes(path)) {
        return { ...prev, permissions: current.filter(p => p !== path) };
      } else {
        return { ...prev, permissions: [...current, path] };
      }
    });
  };

  const availableFeatures = [
    { id: '/', label: 'Dashboard' },
    { id: '/kasir', label: 'Kasir' },
    { id: '/transaksi', label: 'Riwayat Transaksi' },
    { id: '/pengeluaran', label: 'Pengeluaran' },
    { id: '/menu', label: 'Menu Makanan' },
    { id: '/persediaan', label: 'Stok Persediaan' },
    { id: '/laporan', label: 'Laporan Keuangan' },
    { id: '/vendor', label: 'Kelola Vendor' },
    { id: '/pengaturan', label: 'Pengaturan' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <h1 className="text-xl font-bold text-neutral-800">Manajemen Pengguna</h1>
        <button 
          onClick={() => openModal('TAMBAH')}
          className="bg-[#1e3251] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-800"
        >
          <Plus size={16} />
          Tambah Pengguna
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="TOTAL PENGGUNA" 
          value={`${pengguna.length} Orang`} 
          subtitle="Terdaftar di sistem"
          subtitleColorClass="text-teal-500"
          topBorderColor="indigo"
        />
        <StatCard 
          title="ADMIN / OWNER" 
          value={`${pengguna.filter(p => p.role === 'OWNER').length} Orang`} 
          subtitle="Hak akses penuh"
          subtitleColorClass="text-neutral-400"
          topBorderColor="success"
        />
        <StatCard 
          title="KARYAWAN / KASIR" 
          value={`${pengguna.filter(p => p.role === 'KARYAWAN').length} Orang`} 
          subtitle="Akses terbatas"
          subtitleColorClass="text-neutral-400"
          topBorderColor="warning"
        />
      </div>

      <Card title="Daftar Pengguna Sistem" noPadding>
        <div className="p-4 border-b border-neutral-100 flex flex-wrap gap-3">
          <input type="text" placeholder="Cari nama atau username..." className="flex-1 min-w-[200px] px-3 py-1.5 border border-neutral-200 rounded-md text-sm outline-none focus:border-teal-500" />
          <select className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm bg-white outline-none">
            <option>Semua Role</option>
            <option>Owner</option>
            <option>Karyawan</option>
          </select>
          <select className="px-3 py-1.5 border border-neutral-200 rounded-md text-sm bg-white outline-none">
            <option>Semua Status</option>
            <option>Aktif</option>
            <option>Nonaktif</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">ID</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">NAMA LENGKAP</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">USERNAME</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">ROLE</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">STATUS</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">LOGIN TERAKHIR</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 text-neutral-600">
              {pengguna.length > 0 ? pengguna.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user, idx) => (
                <tr key={user.id || idx} className="even:bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                  <td className="py-3 px-6 text-xs text-[#1e3251] font-medium">#U-00{user.id || idx+1}</td>
                  <td className="py-3 px-6 text-xs font-semibold flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold">
                      {user.nama ? user.nama.charAt(0) : 'U'}
                    </div>
                    {user.nama}
                  </td>
                  <td className="py-3 px-6 text-xs text-neutral-500">{user.username}</td>
                  <td className="py-3 px-6 text-xs">
                    <Badge variant={user.role === 'OWNER' ? 'primary' : 'neutral'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-6 text-xs">
                    <Badge variant={user.status === 'NONAKTIF' ? 'danger' : 'success'}>
                      {user.status || 'AKTIF'}
                    </Badge>
                  </td>
                  <td className="py-3 px-6 text-xs text-neutral-500">{user.lastLogin || '-'}</td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openModal('EDIT', user)}
                        className="text-[10px] font-medium text-[#1e3251] hover:text-white hover:bg-[#1e3251] border border-[#1e3251] px-3 py-1.5 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setResetPasswordData({ newPassword: '' });
                          setIsResetModalOpen(true);
                        }}
                        className="text-[10px] font-medium text-amber-500 hover:text-white hover:bg-amber-500 border border-amber-500 px-3 py-1.5 rounded transition-colors"
                      >
                        Reset Password
                      </button>
                      {user.status === 'NONAKTIF' ? (
                        <button 
                          onClick={() => {
                            setConfirmData({ id: user.id, action: 'AKTIFKAN' });
                            setIsConfirmOpen(true);
                          }}
                          className="text-[10px] font-medium text-green-500 hover:text-white hover:bg-green-500 border border-green-500 px-3 py-1.5 rounded transition-colors"
                        >
                          Aktifkan
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setConfirmData({ id: user.id, action: 'NONAKTIFKAN' });
                            setIsConfirmOpen(true);
                          }}
                          className="text-[10px] font-medium text-red-500 hover:text-white hover:bg-red-500 border border-red-500 px-3 py-1.5 rounded transition-colors"
                        >
                          Nonaktifkan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="py-4 text-center text-xs text-neutral-500">Belum ada data pengguna</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          totalItems={pengguna.length} 
          itemsPerPage={itemsPerPage} 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'TAMBAH' ? 'Tambah Pengguna Baru' : 'Edit Pengguna'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nama Lengkap" 
            placeholder="Masukkan nama lengkap"
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            required
          />
          <Input 
            label="Username" 
            placeholder="Masukkan username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />
          {modalType === 'TAMBAH' && (
            <Input 
              label="Password" 
              type="password"
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={modalType === 'TAMBAH'}
            />
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Role Akses</label>
            <select 
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="KARYAWAN">KARYAWAN / KASIR</option>
              <option value="OWNER">ADMIN / OWNER</option>
            </select>
          </div>

          {formData.role === 'KARYAWAN' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Izin Akses Fitur</label>
              <div className="grid grid-cols-2 gap-2 border border-neutral-200 rounded-md p-3 max-h-48 overflow-y-auto bg-neutral-50/50">
                {availableFeatures.map(feature => (
                  <label key={feature.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1.5 rounded transition-colors">
                    <input 
                      type="checkbox" 
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                      checked={(formData.permissions || []).includes(feature.id)}
                      onChange={() => handleTogglePermission(feature.id)}
                    />
                    <span className="text-neutral-700">{feature.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">* Akun dengan role OWNER otomatis mendapatkan akses penuh ke semua fitur.</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-neutral-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">
              {modalType === 'TAMBAH' ? 'Simpan' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={`Reset Password ${selectedUser?.nama}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input 
            label="Password Baru" 
            type="password"
            placeholder="Masukkan password baru (min. 6 karakter)"
            value={resetPasswordData.newPassword}
            onChange={(e) => setResetPasswordData({ newPassword: e.target.value })}
            required
          />
          <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-neutral-100">
            <Button type="button" variant="outline" onClick={() => setIsResetModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={confirmData?.action === 'NONAKTIFKAN' ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
        message={`Apakah Anda yakin ingin ${confirmData?.action?.toLowerCase()} pengguna ini?`}
        onConfirm={handleConfirmAction}
        confirmText="Ya, Lanjutkan"
        confirmVariant={confirmData?.action === 'NONAKTIFKAN' ? 'danger' : 'primary'}
      />
    </div>
  );
};

export default Pengguna;
