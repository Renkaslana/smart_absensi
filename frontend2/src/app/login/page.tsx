'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Scan, 
  ArrowLeft,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading, validateSession } = useAuthStore();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [formData, setFormData] = useState({
    nim: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated AND session is valid
  useEffect(() => {
    // Add small delay to avoid layout shift during SSR
    if (authLoading) return;
    
    if (isAuthenticated && user) {
      // Double-check session validity
      const isValid = validateSession();
      if (isValid) {
        console.log('✅ User already authenticated, redirecting...');
        if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/dashboard');
        }
      } else {
        console.warn('⚠️ Session invalid despite isAuthenticated=true');
      }
    }
  }, [isAuthenticated, user, authLoading, router, validateSession]);

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-white animate-spin mx-auto" />
          <p className="mt-4 text-white/80">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login({ nim: formData.nim, password: formData.password });
      const { access_token, refresh_token, user } = response.data;

      if (!access_token || !user) {
        throw new Error('Invalid response format from server');
      }

      // Update zustand store (store should handle persistence)
      setAuth(user, access_token, refresh_token);

      // Redirect using Next router (replace so history isn't cluttered)
      if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      const serverData = err?.response?.data;
      const message = serverData?.detail || serverData?.message || (typeof serverData === 'string' ? serverData : null) || err.message || 'Login gagal. Periksa NIM dan password Anda.';
      setError(typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-secondary-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Back Link */}
        <Link 
          href="/"
          className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Beranda
        </Link>

        {/* Login Card */}
        <div className="card p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Scan className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary-900">Selamat Datang</h1>
            <p className="text-neutral-600 mt-1">Masuk ke akun Smart Absensi Anda</p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* NIM Field */}
            <div>
              <label htmlFor="nim" className="label">
                NIM / ID Mahasiswa
              </label>
              <input
                type="text"
                id="nim"
                name="nim"
                value={formData.nim}
                onChange={handleChange}
                placeholder="Masukkan NIM Anda"
                className="input"
                disabled={isLoading}
                required
                autoComplete="username"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan password Anda"
                  className="input pr-12"
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="text-right mt-2">
                <Link href="/forgot-password" className="text-xs text-primary-600 hover:underline">
                  Lupa password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-lg font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Belum punya akun?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-white/60 text-sm mt-6">
          © 2025 Smart Absensi. Sistem Absensi Berbasis Wajah.
        </p>
      </motion.div>
    </div>
  );
}
