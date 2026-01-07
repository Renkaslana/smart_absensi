'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogIn, UserCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

/**
 * Absen Page - Redirect to Dashboard Absensi
 * 
 * This page now redirects to the proper absensi page at /dashboard/absensi
 * which requires authentication and has better features:
 * - FaceNet recognition (90%+ accuracy)
 * - MediaPipe liveness detection (real blink/head movement)
 * - Indonesian voice feedback
 * - High-resolution camera (1920x1080)
 */
export default function AbsenPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Wait for auth state to load
    if (isLoading) return;

    // If authenticated, redirect to dashboard absensi
    if (isAuthenticated && user) {
      router.replace('/dashboard/absensi');
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If authenticated, show redirecting message
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-700">Mengalihkan ke halaman absensi...</p>
        </div>
      </div>
    );
  }

  // Show login prompt for unauthenticated users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-6">
            <UserCircle className="w-10 h-10 text-primary-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Login Diperlukan
          </h1>
          <p className="text-neutral-600 mb-8">
            Silakan login terlebih dahulu untuk melakukan absensi dengan sistem pengenalan wajah terbaru.
          </p>

          {/* Features */}
          <div className="bg-primary-50 rounded-xl p-4 mb-8 text-left">
            <h3 className="font-semibold text-primary-900 mb-2">Fitur Absensi:</h3>
            <ul className="space-y-2 text-sm text-primary-700">
              <li className="flex items-start space-x-2">
                <span className="text-primary-500">✓</span>
                <span>Pengenalan wajah dengan FaceNet (akurasi 90%+)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary-500">✓</span>
                <span>Liveness detection (kedipan mata & gerakan kepala)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary-500">✓</span>
                <span>Voice feedback dalam Bahasa Indonesia</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary-500">✓</span>
                <span>Kamera high-resolution (1920x1080)</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
              >
                <LogIn className="w-5 h-5" />
                <span>Login Sekarang</span>
              </motion.button>
            </Link>

            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-outline flex items-center justify-center space-x-2"
              >
                <span>Kembali ke Beranda</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>

          {/* Register Link */}
          <p className="mt-6 text-sm text-neutral-500">
            Belum punya akun?{' '}
            <Link href="/register" className="text-primary-600 hover:underline font-medium">
              Daftar di sini
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
