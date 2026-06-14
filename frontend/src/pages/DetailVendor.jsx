import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Phone, Mail, MapPin, Package, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { formatRupiah } from '../utils/formatRupiah';

const DetailVendor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal produk
  const [activeModal, setActiveModal] = useState(null); // 'TAMBAH_PRODUK', 'EDIT_PRODUK', 'HAPUS_PRODUK'
  const [selectedProduk, setSelectedProduk] = useState(null);
  const [formProduk, setFormProduk] = useState({ namaProduk: '', harga: '', satuan: '', keterangan: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Search produk
  const [searchProduk, setSearchProduk] = useState('');

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/vendor/${id}`);
      setVendor(response.data.data);
    } catch (error) {
      console.error('Failed to fetch vendor detail', error);
      toast.error('Vendor tidak ditemukan');
      navigate('/vendor');
    } finally {
      setIsLoading(false);
    }
  };

  const openProdukModal = (type, produk = null) => {
    setActiveModal(type);
    setSelectedProduk(produk);
    if (type === 'TAMBAH_PRODUK') {
      setFormProduk({ namaProduk: '', harga: '', satuan: '', keterangan: '' });
    } else if (type === 'EDIT_PRODUK' && produk) {
      setFormProduk({
        namaProduk: produk.namaProduk || '',
        harga: produk.harga || '',
        satuan: produk.satuan || '',
        keterangan: produk.keterangan || '',
      });
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedProduk(null);
    setFormProduk({ namaProduk: '', harga: '', satuan: '', keterangan: '' });
  };

  const handleSaveProduk = async () => {
    if (!formProduk.namaProduk.trim()) {
      toast.error('Nama produk wajib diisi');
      return;
    }
    if (!formProduk.harga || parseFloat(formProduk.harga) < 0) {
      toast.error('Harga wajib diisi dan valid');
      return;
    }
    if (!formProduk.satuan.trim()) {
      toast.error('Satuan wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      if (activeModal === 'TAMBAH_PRODUK') {
        await axiosInstance.post(`/vendor/${id}/produk`, {
          ...formProduk,
          harga: parseFloat(formProduk.harga),
        });
        toast.success('Produk berhasil ditambahkan');
      } else if (activeModal === 'EDIT_PRODUK') {
        await axiosInstance.put(`/vendor/${id}/produk/${selectedProduk.id}`, {
          ...formProduk,
          harga: parseFloat(formProduk.harga),
        });
        toast.success('Produk berhasil diperbarui');
      }
      closeModal();
      fetchVendor();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan produk');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduk = async () => {
    setIsSaving(true);
    try {
      await axiosInstance.delete(`/vendor/${id}/produk/${selectedProduk.id}`);
      toast.success('Produk berhasil dihapus');
      closeModal();
      fetchVendor();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus produk');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProduk = (vendor?.produk || []).filter(p =>
    !searchProduk || p.namaProduk.toLowerCase().includes(searchProduk.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3251]"></div>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/vendor')}
          className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Detail Vendor</h1>
          <p className="text-xs text-neutral-400 mt-0.5">ID: #V-{String(vendor.id).padStart(3, '0')}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={vendor.status === 'AKTIF' ? 'success' : 'danger'}>
            {vendor.status}
          </Badge>
        </div>
      </div>

      {/* Vendor Info Card */}
      <Card>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#1e3251] to-teal-600 flex items-center justify-center text-white font-bold text-2xl">
              {vendor.nama.substring(0, 2).toUpperCase()}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-neutral-800 mb-3">{vendor.nama}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-neutral-400 shrink-0" />
                <span className="text-sm text-neutral-600">{vendor.telepon || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-neutral-400 shrink-0" />
                <span className="text-sm text-neutral-600">{vendor.email || '-'}</span>
              </div>
              <div className="flex items-start gap-2 md:col-span-2">
                <MapPin size={14} className="text-neutral-400 shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-600">{vendor.alamat || '-'}</span>
              </div>
              {vendor.catatan && (
                <div className="flex items-start gap-2 md:col-span-2">
                  <FileText size={14} className="text-neutral-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-neutral-500 italic">{vendor.catatan}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="shrink-0 flex flex-row md:flex-col gap-4 md:gap-2 items-center md:items-end">
            <div className="text-center md:text-right">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Produk</p>
              <p className="text-2xl font-bold text-[#1e3251]">{vendor._count?.produk || 0}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Produk Vendor */}
      <Card title="Daftar Produk Vendor" noPadding>
        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchProduk}
              onChange={(e) => setSearchProduk(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-md text-sm outline-none focus:border-teal-500"
            />
          </div>
          <button
            onClick={() => openProdukModal('TAMBAH_PRODUK')}
            className="bg-[#1e3251] text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
          >
            <Plus size={14} />
            Tambah Produk
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">NO</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">NAMA PRODUK</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">HARGA</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">SATUAN</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">KETERANGAN</th>
                <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 text-neutral-600">
              {filteredProduk.length > 0 ? filteredProduk.map((produk, idx) => (
                <tr key={produk.id} className="even:bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                  <td className="py-3 px-6 text-xs text-neutral-400">{idx + 1}</td>
                  <td className="py-3 px-6 text-xs font-semibold text-neutral-800">{produk.namaProduk}</td>
                  <td className="py-3 px-6 text-xs font-medium text-[#1e3251]">{formatRupiah(produk.harga)}</td>
                  <td className="py-3 px-6 text-xs text-neutral-500">{produk.satuan}</td>
                  <td className="py-3 px-6 text-xs text-neutral-400 max-w-[200px] truncate">{produk.keterangan || '-'}</td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openProdukModal('EDIT_PRODUK', produk)}
                        className="p-1.5 text-neutral-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        title="Edit Produk"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => openProdukModal('HAPUS_PRODUK', produk)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Hapus Produk"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <Package size={32} className="mx-auto text-neutral-300 mb-3" />
                    <p className="text-sm text-neutral-400">Belum ada produk</p>
                    <p className="text-xs text-neutral-300 mt-1">Klik "Tambah Produk" untuk menambah produk vendor ini</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Tambah / Edit Produk */}
      <Modal
        isOpen={activeModal === 'TAMBAH_PRODUK' || activeModal === 'EDIT_PRODUK'}
        onClose={closeModal}
        title={activeModal === 'TAMBAH_PRODUK' ? 'Tambah Produk Baru' : 'Edit Produk'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Batal</Button>
            <Button variant="primary" onClick={handleSaveProduk} isLoading={isSaving}>
              {activeModal === 'TAMBAH_PRODUK' ? 'Simpan' : 'Perbarui'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nama Produk <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formProduk.namaProduk}
              onChange={(e) => setFormProduk({ ...formProduk, namaProduk: e.target.value })}
              placeholder="Contoh: Tepung Terigu Segitiga Biru"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Harga (Rp) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={formProduk.harga}
                onChange={(e) => setFormProduk({ ...formProduk, harga: e.target.value })}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Satuan <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formProduk.satuan}
                onChange={(e) => setFormProduk({ ...formProduk, satuan: e.target.value })}
                placeholder="Kg, Liter, Pcs, dll"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Keterangan</label>
            <textarea
              value={formProduk.keterangan}
              onChange={(e) => setFormProduk({ ...formProduk, keterangan: e.target.value })}
              placeholder="Keterangan tambahan..."
              rows={2}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Hapus Produk */}
      <Modal
        isOpen={activeModal === 'HAPUS_PRODUK'}
        onClose={closeModal}
        title="Hapus Produk"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Batal</Button>
            <Button variant="danger" onClick={handleDeleteProduk} isLoading={isSaving}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          Apakah Anda yakin ingin menghapus produk <strong>{selectedProduk?.namaProduk}</strong> dari vendor ini?
        </p>
      </Modal>
    </div>
  );
};

export default DetailVendor;
