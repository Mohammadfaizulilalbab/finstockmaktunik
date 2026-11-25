// Layout bersama semua halaman autentikasi:
// panel branding di kiri, konten halaman (Outlet) di kanan.

import { Outlet } from 'react-router-dom';
import AuthBrandPanel from './AuthBrandPanel';

const AuthLayout = () => (
  <div className="min-h-screen w-full flex flex-col md:flex-row font-sans bg-white">
    <AuthBrandPanel />

    <main className="flex-1 bg-[#f8f9fb] flex items-center justify-center px-4 py-10 md:p-12">
      <div className="w-full max-w-[420px] flex flex-col">
        {/* Logo untuk layar kecil */}
        <div className="flex md:hidden items-center justify-center gap-3 mb-8">
          <div className="w-8 h-8 bg-white border border-[#c3c6cf] rounded-lg flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-[#1a3a5c] rounded-sm"></div>
          </div>
          <span className="text-lg font-bold text-[#002444]">FinStock UMKM</span>
        </div>

        <Outlet />
      </div>
    </main>
  </div>
);

export default AuthLayout;
