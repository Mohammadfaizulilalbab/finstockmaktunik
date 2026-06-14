import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Pagination from '../components/ui/Pagination';
import { formatRupiah } from '../utils/formatRupiah';

const DaftarMenu = () => {
  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('TAMBAH'); // TAMBAH, EDIT
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nama: '' });

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    kategori: 'MAKANAN',
    harga: ''
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/menu');
      setMenus(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch menus', error);
      toast.error('Gagal mengambil daftar menu');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (mode, menu = null) => {
    setModalMode(mode);
    setSelectedMenu(menu);
    if (mode === 'EDIT' && menu) {
      setFormData({
        nama: menu.nama,
        kategori: menu.kategori,
        harga: menu.harga
      });
    } else {
      setFormData({
        nama: '',
        kategori: 'MAKANAN',
        harga: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMenu(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        harga: Number(formData.harga)
      };

      if (modalMode === 'TAMBAH') {
        await axiosInstance.post('/menu', payload);
        toast.success('Menu berhasil ditambahkan');
      } else {
        await axiosInstance.put(`/menu/${selectedMenu.id}`, payload);
        toast.success('Menu berhasil diperbarui');
      }
      
      closeModal();
      fetchMenus();
    } catch (error) {
      console.error('Submit error', error);
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan menu');
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    try {
      await axiosInstance.put(`/menu/${id}`, { isAvailable: !currentStatus });
      toast.success(`Menu berhasil di-${!currentStatus ? 'aktifkan' : 'nonaktifkan'}`);
      fetchMenus();
    } catch (error) {
      console.error('Toggle error', error);
      toast.error('Gagal mengubah status ketersediaan');
    }
  };

  const handleDeleteClick = (id, nama) => {
    setConfirmDelete({ isOpen: true, id, nama });
  };

  const executeDelete = async () => {
    const { id, nama } = confirmDelete;
    if (!id) return;
    try {
      await axiosInstance.delete(`/menu/${id}`);
      toast.success(`Menu "${nama}" berhasil dihapus`);
      fetchMenus();
    } catch (error) {
      toast.error('Gagal menghapus menu');
      console.error(error);
    } finally {
      setConfirmDelete({ isOpen: false, id: null, nama: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <h1 className="text-xl font-bold text-neutral-800">Manajemen Menu</h1>
        <button 
          onClick={() => openModal('TAMBAH')}
          className="bg-[#1e3251] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-800"
        >
          <Plus size={16} />
          Tambah Menu
        </button>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">NAMA MENU</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">KATEGORI</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">HARGA</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">STATUS</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 text-neutral-600">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-neutral-400">Memuat data...</td>
                </tr>
              ) : menus.length > 0 ? (
                menus.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((menu) => (
                  <tr key={menu.id} className={`${!menu.isAvailable ? 'bg-neutral-50 opacity-70' : 'even:bg-slate-50/50 hover:bg-slate-100/50 transition-colors'}`}>
                    <td className="py-3 px-6 text-xs text-[#1e3251] font-medium">{menu.nama}</td>
                    <td className="py-3 px-6 text-xs">{menu.kategori}</td>
                    <td className="py-3 px-6 text-xs font-medium">{formatRupiah(menu.harga)}</td>
                    <td className="py-3 px-6 text-xs">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${menu.isAvailable !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {menu.isAvailable !== false ? 'Tersedia' : 'Kosong'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => toggleAvailability(menu.id, menu.isAvailable !== false)}
                          className={`text-[10px] font-medium flex items-center gap-1 px-3 py-1.5 rounded border transition-colors ${menu.isAvailable !== false ? 'text-red-500 hover:text-white hover:bg-red-500 border-red-500' : 'text-green-500 hover:text-white hover:bg-green-500 border-green-500'}`}
                          title={menu.isAvailable !== false ? 'Tandai Kosong' : 'Tandai Tersedia'}
                        >
                          <Power size={12} />
                          {menu.isAvailable !== false ? 'Disable' : 'Enable'}
                        </button>
                        <button 
                          onClick={() => openModal('EDIT', menu)}
                          className="text-[10px] font-medium text-amber-500 hover:text-white hover:bg-amber-500 border border-amber-500 px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(menu.id, menu.nama)}
                          className="text-[10px] font-medium text-red-500 hover:text-white hover:bg-red-500 border border-red-500 px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                        >
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-xs text-neutral-500">
                    Belum ada data menu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          totalItems={menus.length} 
          itemsPerPage={itemsPerPage} 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === 'TAMBAH' ? 'Tambah Menu Baru' : 'Edit Menu'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nama Menu"
            name="nama"
            value={formData.nama}
            onChange={handleInputChange}
            required
            placeholder="Minyak Goreng"
          />
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Kategori</label>
            <select
              name="kategori"
              value={formData.kategori}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              <option value="MAKANAN">MAKANAN</option>
              <option value="MINUMAN">MINUMAN</option>
              <option value="SNACK">SNACK</option>
            </select>
          </div>

          <Input 
            label="Harga (Rp)"
            name="harga"
            type="number"
            value={formData.harga}
            onChange={handleInputChange}
            required
            placeholder="15000"
            min="0"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
            <Button type="submit">{modalMode === 'TAMBAH' ? 'Simpan Menu' : 'Simpan Perubahan'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, nama: '' })}
        title="Hapus Menu"
        message={`Apakah Anda yakin ingin menghapus menu "${confirmDelete.nama}"? Data yang terhapus tidak dapat dikembalikan.`}
        onConfirm={executeDelete}
      />
    </div>
  );
};

export default DaftarMenu;
