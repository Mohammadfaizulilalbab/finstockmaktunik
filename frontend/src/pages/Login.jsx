import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Lock, User } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useAuthStore from '../store/useAuthStore';
import axiosInstance from '../api/axiosInstance';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Username dan password wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/auth/login', {
        username,
        password
      });

      const { token, user } = response.data.data;
      
      // Save to global state
      setAuth(token, user);
      
      toast.success('Login berhasil!');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Terjadi kesalahan saat login';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-primary-500 py-8 px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4 backdrop-blur-sm">
            <span className="text-4xl">🍗</span>
          </div>
          <h2 className="text-2xl font-bold text-white">FinStocks</h2>
          <p className="text-primary-100 mt-1">Sistem Manajemen Mak Tunik</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <h3 className="text-xl font-semibold text-neutral-800 text-center mb-6">
            Masuk ke Akun Anda
          </h3>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              id="username"
              label="Username"
              type="text"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={User}
              disabled={isLoading}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              disabled={isLoading}
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full py-2.5 text-base"
                isLoading={isLoading}
              >
                Masuk ke Sistem
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-neutral-500">
            <p>Khusus untuk internal UMKM Mak Tunik</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
