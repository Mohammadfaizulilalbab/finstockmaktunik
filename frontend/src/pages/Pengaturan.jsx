import React from 'react';
import Card from '../components/ui/Card';
import useAuthStore from '../store/useAuthStore';

const Pengaturan = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Pengaturan</h1>
        <p className="text-neutral-500">Preferensi akun dan sistem</p>
      </div>

      <Card title="Profil Pengguna">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-4xl shrink-0">
            {user?.nama?.charAt(0) || 'U'}
          </div>
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Nama Lengkap</p>
                <p className="font-semibold text-neutral-800">{user?.nama}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Username</p>
                <p className="font-semibold text-neutral-800">@{user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Role Akses</p>
                <p className="font-semibold text-primary-600">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      <Card title="Informasi Sistem">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-500">Versi Aplikasi</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-500">Koneksi Backend</span>
            <span className="font-medium text-success">Terhubung</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-500">Lisensi</span>
            <span className="font-medium">Hak Milik Mak Tunik</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Pengaturan;
