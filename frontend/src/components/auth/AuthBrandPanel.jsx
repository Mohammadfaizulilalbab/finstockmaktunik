// Panel branding kiri pada halaman autentikasi (disembunyikan di layar kecil)

const FITUR_UNGGULAN = [
  'Dashboard analitik penjualan & pengeluaran.',
  'Pencatatan kasir instan ber-struk thermal PDF.',
  'Pengendalian stok bahan baku otomatis.',
  'Manajemen vendor dan kemitraan bahan baku.',
];

const AuthBrandPanel = () => (
  <div className="hidden md:flex flex-col w-[390px] bg-[#1a3a5c] text-white p-10 shrink-0 md:sticky md:top-0 md:h-screen relative overflow-hidden">
    <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#002444] rounded-full opacity-60 blur-3xl"></div>
    <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-[#006c4e] rounded-full opacity-35 blur-2xl"></div>

    <div className="relative z-10 flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#1a3a5c] rounded-sm"></div>
          </div>
          <span className="text-xl font-bold tracking-tight">FinStock UMKM</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-2xl font-bold leading-tight">Sistem Keuangan &amp; Persediaan POS UMKM</h1>
          <p className="text-xs text-[#abc9f2] leading-relaxed">
            Platform terpadu untuk pencatatan transaksi harian dan manajemen stok bahan baku secara real-time.
          </p>
        </div>

        <ul className="mt-10 space-y-4">
          {FITUR_UNGGULAN.map((fitur) => (
            <li key={fitur} className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#83f5c6] mt-1.5 shrink-0"></span>
              <span className="text-xs text-[#abc9f2]/90">{fitur}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-6 border-t border-[#002444]">
        <p className="text-[9px] uppercase tracking-wider text-[#abc9f2]/70 font-semibold">Powered by FinStock Enterprise</p>
      </div>
    </div>
  </div>
);

export default AuthBrandPanel;
