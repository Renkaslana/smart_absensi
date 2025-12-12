'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Scan, 
  ArrowLeft,
  Info,
  Shield,
  LogIn
} from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 py-12">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-20 right-20 w-72 h-72 bg-secondary-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 left-10 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl"
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

        {/* Info Card */}
        <div className="card p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Scan className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary-900">Registrasi Mahasiswa</h1>
            <p className="text-neutral-600 mt-1">Sistem Absensi Wajah</p>
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6"
          >
            <div className="flex items-start space-x-3">
              <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Informasi Penting</h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  Registrasi akun mahasiswa hanya dapat dilakukan oleh <strong>Administrator</strong>. 
                  Silakan hubungi admin atau dosen Anda untuk didaftarkan ke sistem.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-primary-900">Langkah Registrasi:</h3>
            
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-neutral-800">Hubungi Admin</p>
                <p className="text-sm text-neutral-600">Berikan NIM, nama lengkap, dan email Anda</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-neutral-800">Admin Mendaftarkan Akun</p>
                <p className="text-sm text-neutral-600">Admin akan membuat akun dan registrasi wajah Anda</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-neutral-800">Login ke Sistem</p>
                <p className="text-sm text-neutral-600">Gunakan NIM dan password yang diberikan admin</p>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/login" className="block">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-3 text-lg font-semibold flex items-center justify-center"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sudah Punya Akun? Login
              </motion.button>
            </Link>
          </div>

          {/* Security Note */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 flex items-center justify-center text-neutral-500 text-sm"
          >
            <Shield className="w-4 h-4 mr-2" />
            <span>Data Anda dilindungi dan terenkripsi</span>
          </motion.div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-white/60 text-sm mt-6">
          Smart Absensi - Sistem Absensi Berbasis Pengenalan Wajah
        </p>
      </motion.div>
    </div>
  );
}
