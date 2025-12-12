'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Users, 
  Clock, 
  BarChart3, 
  Scan, 
  ArrowRight,
  CheckCircle,
  Zap,
  Lock
} from 'lucide-react';

const features = [
  {
    icon: Scan,
    title: 'Face Recognition',
    description: 'Teknologi pengenalan wajah canggih dengan akurasi tinggi untuk identifikasi yang cepat dan tepat.'
  },
  {
    icon: ShieldCheck,
    title: 'Liveness Detection',
    description: 'Sistem keamanan anti-spoofing dengan deteksi kedipan mata dan gerakan kepala.'
  },
  {
    icon: Clock,
    title: 'Real-time Processing',
    description: 'Proses absensi instan dengan feedback langsung tanpa perlu menunggu.'
  },
  {
    icon: BarChart3,
    title: 'Dashboard Analytics',
    description: 'Visualisasi data kehadiran dengan grafik interaktif dan laporan komprehensif.'
  },
  {
    icon: Users,
    title: 'Multi-User Support',
    description: 'Dukungan untuk ribuan pengguna dengan manajemen yang mudah.'
  },
  {
    icon: Lock,
    title: 'Keamanan Tinggi',
    description: 'Enkripsi data dan autentikasi JWT untuk keamanan maksimal.'
  }
];

const benefits = [
  'Tidak perlu kartu fisik atau fingerprint',
  'Proses absensi kurang dari 2 detik',
  'Akurasi pengenalan 99.5%',
  'Laporan otomatis dan ekspor data',
  'Notifikasi real-time',
  'Dashboard admin lengkap'
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Scan className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-primary-900">Smart Absensi</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-neutral-600 hover:text-primary-600 transition-colors">Fitur</a>
              <a href="#benefits" className="text-neutral-600 hover:text-primary-600 transition-colors">Keunggulan</a>
              <Link href="/login" className="btn-outline text-sm">
                Masuk
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Daftar Sekarang
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center gradient-hero overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating Elements */}
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-secondary-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6 backdrop-blur-sm"
              >
                <Zap className="w-4 h-4 mr-2" />
                Sistem Absensi Modern untuk Kampus
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Absensi Cerdas dengan{' '}
                <span className="text-secondary-400">Face Recognition</span>
              </h1>
              
              <p className="text-lg text-white/80 mb-8 max-w-xl">
                Transformasi sistem kehadiran kampus Anda dengan teknologi pengenalan wajah 
                yang akurat, aman, dan mudah digunakan. Tidak perlu kartu, tidak perlu antri.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/absen"
                  className="btn bg-white text-primary-900 hover:bg-neutral-100 px-8 py-3 text-lg font-semibold"
                >
                  Mulai Absensi
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link 
                  href="/login"
                  className="btn bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm px-8 py-3 text-lg"
                >
                  Masuk Admin
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/20">
                <div>
                  <div className="text-3xl font-bold text-white">99.5%</div>
                  <div className="text-white/60 text-sm">Akurasi</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">&lt;2s</div>
                  <div className="text-white/60 text-sm">Waktu Proses</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">24/7</div>
                  <div className="text-white/60 text-sm">Monitoring</div>
                </div>
              </div>
            </motion.div>

            {/* Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Phone/Device Frame */}
                <div className="relative w-80 h-[500px] mx-auto bg-neutral-900 rounded-[40px] shadow-2xl p-3 border-4 border-neutral-800">
                  <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-[32px] overflow-hidden relative">
                    {/* Camera Preview Simulation */}
                    <div className="absolute inset-4 bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-2xl flex items-center justify-center">
                      {/* Face Outline */}
                      <motion.div
                        className="w-40 h-52 border-4 border-secondary-500 rounded-[100px] relative"
                        animate={{ 
                          borderColor: ['#0ea5e9', '#22c55e', '#0ea5e9']
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {/* Scan Line */}
                        <motion.div
                          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary-400 to-transparent"
                          animate={{ top: ['0%', '100%', '0%'] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                    </div>

                    {/* Status Bar */}
                    <div className="absolute bottom-4 left-4 right-4 bg-green-500/20 backdrop-blur-sm rounded-xl p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-medium">Wajah Terdeteksi</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Cards */}
                <motion.div 
                  className="absolute -left-20 top-20 bg-white rounded-xl shadow-xl p-4 w-48"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-neutral-900">Absensi Sukses</div>
                      <div className="text-xs text-neutral-500">08:00 WIB</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="absolute -right-10 bottom-32 bg-white rounded-xl shadow-xl p-4"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className="text-sm font-medium text-neutral-600">Confidence</div>
                  <div className="text-2xl font-bold text-primary-600">98.7%</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-900 mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Dilengkapi dengan teknologi terdepan untuk pengalaman absensi yang sempurna
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-hover p-6"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-900 mb-6">
                Mengapa Memilih Smart Absensi?
              </h2>
              <p className="text-lg text-neutral-600 mb-8">
                Solusi absensi yang dikembangkan khusus untuk kebutuhan institusi pendidikan 
                dengan standar keamanan dan akurasi tinggi.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-neutral-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="card p-8 shadow-xl">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-gradient mb-2">2x</div>
                  <div className="text-neutral-600">Lebih Cepat dari Absensi Manual</div>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-neutral-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">0%</div>
                    <div className="text-sm text-neutral-500">Antrian</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">100%</div>
                    <div className="text-sm text-neutral-500">Akurat</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Siap Melakukan Absensi?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Mahasiswa dapat langsung melakukan absensi tanpa perlu login. 
              Cukup scan wajah dan kehadiran Anda langsung tercatat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/absen"
                className="btn bg-white text-primary-900 hover:bg-neutral-100 px-8 py-3 text-lg font-semibold"
              >
                Mulai Absensi Sekarang
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link 
                href="/riwayat"
                className="btn bg-white/10 text-white hover:bg-white/20 px-8 py-3 text-lg"
              >
                Cek Riwayat Kehadiran
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Scan className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl">Smart Absensi</span>
            </div>
            <div className="text-neutral-400 text-sm">
              © 2024 Smart Absensi. Sistem Absensi Berbasis Wajah.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
