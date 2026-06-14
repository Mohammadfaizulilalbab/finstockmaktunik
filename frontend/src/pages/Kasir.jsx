import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, Save, ShoppingCart, CheckCircle, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { exportStrukPDF } from '../utils/exportUtils';
import axiosInstance from '../api/axiosInstance';
import { formatRupiah } from '../utils/formatRupiah';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

const Kasir = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Cart state
  const [cart, setCart] = useState([]);
  const [metode, setMetode] = useState('TUNAI');
  const [catatan, setCatatan] = useState('');
  const [namaPelanggan, setNamaPelanggan] = useState('');

  // Success Modal state
  const [successTx, setSuccessTx] = useState(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await axiosInstance.get('/menu');
        setMenus(response.data.data);
      } catch (error) {
        console.error('Failed to fetch menus', error);
        toast.error('Gagal mengambil daftar menu');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenus();
  }, []);

  const addToCart = (menu) => {
    const existing = cart.find(item => item.menuId === menu.id);
    if (existing) {
      setCart(cart.map(item => 
        item.menuId === menu.id 
          ? { ...item, qty: item.qty + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { 
        menuId: menu.id, 
        nama: menu.nama, 
        hargaSatuan: Number(menu.harga), 
        qty: 1 
      }]);
    }
  };

  const updateQty = (menuId, newQty) => {
    if (newQty < 1) return;
    setCart(cart.map(item => 
      item.menuId === menuId ? { ...item, qty: newQty } : item
    ));
  };

  const removeFromCart = (menuId) => {
    setCart(cart.filter(item => item.menuId !== menuId));
  };

  const totalBelanja = cart.reduce((sum, item) => sum + (item.hargaSatuan * item.qty), 0);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error('Belum ada menu yang dipilih');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: cart.map(item => ({
          menuId: item.menuId,
          qty: item.qty,
          hargaSatuan: item.hargaSatuan
        })),
        metode,
        catatan,
        namaPelanggan,
        status: 'SELESAI'
      };

      const response = await axiosInstance.post('/transaksi', payload);
      toast.success('Transaksi berhasil disimpan');
      setSuccessTx(response.data.data);
    } catch (error) {
      console.error('Failed to save transaction', error);
      toast.error('Gagal menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetKasir = () => {
    setCart([]);
    setMetode('TUNAI');
    setCatatan('');
    setNamaPelanggan('');
    setSuccessTx(null);
  };

  const handleCetakNota = () => {
    if (successTx) {
      exportStrukPDF(successTx);
      toast.success('Nota sedang diunduh');
      handleResetKasir();
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>;
  }

  // Group available menus by category
  const categories = ['MAKANAN', 'MINUMAN', 'SNACK'];
  const menuByCategory = categories.map(cat => ({
    name: cat,
    items: menus.filter(m => m.kategori === cat && m.isAvailable !== false)
  })).filter(c => c.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Kasir</h1>
          <p className="text-neutral-500">Pencatatan Transaksi Pelanggan</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Kiri: Daftar Menu */}
        <div className="flex-1 space-y-6">
          {menuByCategory.map((category) => (
            <div key={category.name}>
              <h3 className="text-lg font-semibold text-neutral-800 mb-3">{category.name}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {category.items.map(menu => (
                  <div 
                    key={menu.id}
                    onClick={() => addToCart(menu)}
                    className="bg-white border border-neutral-200 rounded-xl p-4 cursor-pointer hover:border-primary-500 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="font-medium text-neutral-800 line-clamp-2">{menu.nama}</div>
                    <div className="text-primary-600 font-semibold mt-2">{formatRupiah(menu.harga)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Kanan: Keranjang & Pembayaran */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <Card className="sticky top-20 h-[calc(100vh-100px)] flex flex-col" noPadding>
            <div className="p-4 border-b border-neutral-100 bg-neutral-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                <ShoppingCart size={20} />
                Pesanan Saat Ini
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-neutral-400 py-10">
                  Belum ada menu di keranjang
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.menuId} className="flex justify-between items-start border-b border-neutral-100 pb-4">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-neutral-800">{item.nama}</div>
                      <div className="text-xs text-neutral-500 mt-1">{formatRupiah(item.hargaSatuan)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center bg-neutral-100 rounded-lg overflow-hidden">
                        <button 
                          onClick={() => updateQty(item.menuId, item.qty - 1)}
                          className="px-2 py-1 hover:bg-neutral-200 text-neutral-600"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                        <button 
                          onClick={() => updateQty(item.menuId, item.qty + 1)}
                          className="px-2 py-1 hover:bg-neutral-200 text-neutral-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{formatRupiah(item.hargaSatuan * item.qty)}</span>
                        <button 
                          onClick={() => removeFromCart(item.menuId)}
                          className="text-danger hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-neutral-100 space-y-4 bg-white rounded-b-xl">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-neutral-800">Total:</span>
                <span className="text-primary-600 text-2xl">{formatRupiah(totalBelanja)}</span>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {['TUNAI', 'QRIS', 'TRANSFER'].map(m => (
                    <button
                      key={m}
                      onClick={() => setMetode(m)}
                      className={`py-2 text-sm font-medium rounded-lg border ${
                        metode === m 
                          ? 'bg-primary-50 border-primary-500 text-primary-700' 
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Input 
                  placeholder="Nama Pelanggan (opsional)" 
                  value={namaPelanggan}
                  onChange={(e) => setNamaPelanggan(e.target.value)}
                />
                <Input 
                  placeholder="Catatan opsional..." 
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>

              <Button 
                className="w-full py-3" 
                onClick={handleSubmit}
                disabled={cart.length === 0 || isSubmitting}
                isLoading={isSubmitting}
              >
                <Save size={18} className="mr-2" />
                Simpan & Bayar
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={!!successTx}
        onClose={handleResetKasir}
        title="Transaksi Berhasil!"
      >
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-neutral-800 mb-1">Rp {successTx && formatRupiah(successTx.total)}</h3>
          <p className="text-sm text-neutral-500 mb-6">
            Pembayaran dengan {successTx?.metode} telah berhasil dicatat.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button 
              variant="outline" 
              className="flex-1 flex justify-center items-center gap-2"
              onClick={handleResetKasir}
            >
              <RefreshCw size={18} />
              Transaksi Baru
            </Button>
            <Button 
              className="flex-1 flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700"
              onClick={handleCetakNota}
            >
              <Printer size={18} />
              Cetak Nota / Struk
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Kasir;
