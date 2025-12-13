'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Camera, 
  Scan, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Loader2,
  User,
  Clock,
  Calendar,
  ArrowLeft,
  History,
  Award,
  Sparkles,
  Power,
  PowerOff
} from 'lucide-react';
import { publicApi, canvasToBase64 } from '@/lib/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'failed' | 'duplicate';

interface AttendanceResult {
  id: number;
  name: string;
  nim: string;
  kelas: string;
  timestamp: string;
  date: string;
  confidence: number;
  status: string;
}

interface ExistingAttendance {
  id: number;
  timestamp: string;
  confidence: number;
  status: string;
}

export default function AbsenPage() {
  const webcamRef = useRef<Webcam>(null);
  
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('Posisikan wajah Anda di dalam frame');
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [existingAttendance, setExistingAttendance] = useState<ExistingAttendance | null>(null);
  const [userName, setUserName] = useState('');
  const [userNim, setUserNim] = useState('');
  const [userKelas, setUserKelas] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [faceStableCount, setFaceStableCount] = useState(0);
  const [webcamReady, setWebcamReady] = useState(false);
  const [todayStats, setTodayStats] = useState<{
    today_attendance: number;
    total_students: number;
    attendance_rate: number;
  } | null>(null);

  // Video constraints
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user',
  };

  // Handle face scan and attendance
  const handleScan = useCallback(async () => {
    if (!webcamRef.current || isCapturing || !webcamReady) return;

    setIsCapturing(true);
    setStatus('scanning');
    setMessage('Memindai wajah...');
    setLastScanTime(Date.now());

    try {
      // Check if webcam is ready and video is playing
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) {
        throw new Error('Kamera belum siap. Mohon tunggu sebentar.');
      }

      // Capture image from webcam
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Gagal mengambil gambar dari kamera. Pastikan kamera sudah aktif.');
      }

      // Extract base64 data (remove data URL prefix)
      const base64Image = imageSrc.split(',')[1];

      // Get device info
      const deviceInfo = `${navigator.userAgent.split(' ').slice(-2).join(' ')}`;
      
      // Call API
      const response = await publicApi.scanAttendance(base64Image, deviceInfo);
      const data = response.data;

      if (data.success) {
        // Attendance recorded successfully
        setStatus('success');
        setResult(data.absensi);
        setUserName(data.absensi.name);
        setUserNim(data.absensi.nim);
        setUserKelas(data.absensi.kelas);
        setConfidence(data.absensi.confidence);
        setMessage(`Absensi berhasil! Selamat datang, ${data.absensi.name}`);
        
        // Refresh stats
        const statsResponse = await publicApi.getTodayStats();
        setTodayStats(statsResponse.data);
        
      } else if (data.duplicate) {
        // Already attended today
        setStatus('duplicate');
        setUserName(data.user?.name || '');
        setUserNim(data.user?.nim || '');
        setUserKelas(data.user?.kelas || '');
        setExistingAttendance(data.existing_attendance);
        setMessage(data.message);
        
      } else {
        // Failed - face not recognized or other error
        setStatus('failed');
        setMessage(data.message || 'Gagal melakukan absensi');
      }

    } catch (error: any) {
      console.error('Scan error:', error);
      setStatus('failed');
      setMessage(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Terjadi kesalahan. Silakan coba lagi.'
      );
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, webcamReady]);

  // Load today's stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await publicApi.getTodayStats();
        setTodayStats(response.data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };
    loadStats();
  }, []);

  // Auto-scan interval (every 2 seconds when idle and auto-scan enabled)
  useEffect(() => {
    if (!autoScanEnabled || status !== 'idle' || isCapturing || !webcamReady) return;

    const interval = setInterval(() => {
      const now = Date.now();
      // Debounce: only scan if last scan was more than 5 seconds ago
      // Also check if webcam is ready
      if (now - lastScanTime > 5000 && webcamRef.current && webcamReady) {
        handleScan();
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [autoScanEnabled, status, isCapturing, lastScanTime, handleScan, webcamReady]);

  // Reset to try again
  const handleReset = () => {
    setStatus('idle');
    setMessage('Posisikan wajah Anda di dalam frame');
    setResult(null);
    setExistingAttendance(null);
    setUserName('');
    setUserNim('');
    setConfidence(null);
    setLastScanTime(Date.now()); // Reset debounce timer
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Kembali</span>
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Scan className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">Smart Absensi</span>
            </div>
            
            <Link href="/riwayat" className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
              <History className="w-5 h-5" />
              <span className="hidden sm:inline">Riwayat</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Today's Stats */}
        {todayStats && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 grid grid-cols-3 gap-4"
          >
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.today_attendance}</p>
                  <p className="text-xs text-gray-500">Hadir Hari Ini</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.total_students}</p>
                  <p className="text-xs text-gray-500">Total Mahasiswa</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.attendance_rate}%</p>
                  <p className="text-xs text-gray-500">Tingkat Kehadiran</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selamat Datang! 👋
          </h1>
          <p className="text-gray-600">
            {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Webcam Area */}
          <div className="relative">
            <div className="aspect-[4/3] bg-gray-900 relative overflow-hidden">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
                onUserMedia={() => {
                  setWebcamReady(true);
                  setMessage('Kamera siap. Posisikan wajah Anda di dalam frame');
                }}
                onUserMediaError={(error) => {
                  setWebcamReady(false);
                  setMessage('Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.');
                  console.error('Webcam error:', error);
                }}
              />
              
              {/* Face Guide Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div 
                  className={`w-64 h-80 border-4 rounded-[40%] ${
                    status === 'scanning' ? 'border-yellow-400' :
                    status === 'success' ? 'border-green-400' :
                    status === 'duplicate' ? 'border-orange-400' :
                    status === 'failed' ? 'border-red-400' :
                    'border-white/60'
                  }`}
                  animate={status === 'scanning' ? {
                    scale: [1, 1.02, 1],
                    opacity: [0.6, 1, 0.6],
                  } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </div>
              
              {/* Scanning Animation */}
              <AnimatePresence>
                {status === 'scanning' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-blue-500/10"
                  >
                    <motion.div
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Status Indicator */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className={`px-4 py-2 rounded-xl backdrop-blur-sm ${
                  status === 'success' ? 'bg-green-500/90' :
                  status === 'duplicate' ? 'bg-orange-500/90' :
                  status === 'failed' ? 'bg-red-500/90' :
                  status === 'scanning' ? 'bg-yellow-500/90' :
                  autoScanEnabled ? 'bg-blue-500/90' : 'bg-black/50'
                } text-white text-center`}>
                  <p className="text-sm font-medium">
                    {status === 'idle' && autoScanEnabled 
                      ? '🔄 Auto-scan aktif - Memindai otomatis...' 
                      : message
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Result Panel */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Success State */}
              {status === 'success' && result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{result.name}</h2>
                  <p className="text-gray-600 mb-4">NIM: {result.nim} • {result.kelas}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm text-gray-500">Waktu</p>
                      <p className="font-semibold text-gray-900">
                        {format(new Date(result.timestamp), 'HH:mm:ss')}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <Sparkles className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm text-gray-500">Confidence</p>
                      <p className="font-semibold text-gray-900">{result.confidence}%</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Link 
                      href={`/riwayat?nim=${result.nim}`}
                      className="flex-1 btn bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Lihat Riwayat
                    </Link>
                    <button
                      onClick={handleReset}
                      className="flex-1 btn bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Selesai
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Duplicate State */}
              {status === 'duplicate' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-orange-600" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{userName}</h2>
                  <p className="text-gray-600 mb-2">NIM: {userNim} • {userKelas}</p>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                    <p className="text-orange-800 font-medium mb-1">Sudah Absen Hari Ini</p>
                    <p className="text-orange-600 text-sm">
                      Anda telah melakukan absensi pada pukul{' '}
                      {existingAttendance && format(new Date(existingAttendance.timestamp), 'HH:mm')}
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Link 
                      href={`/riwayat?nim=${userNim}`}
                      className="flex-1 btn bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Lihat Riwayat
                    </Link>
                    <button
                      onClick={handleReset}
                      className="flex-1 btn bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Tutup
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Failed State */}
              {status === 'failed' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-600" />
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Absensi Gagal</h2>
                  <p className="text-gray-600 mb-6">{message}</p>
                  
                  <button
                    onClick={handleReset}
                    className="btn bg-blue-600 text-white hover:bg-blue-700 w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Coba Lagi
                  </button>
                </motion.div>
              )}

              {/* Idle / Scanning State */}
              {(status === 'idle' || status === 'scanning') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  {/* Auto-scan Toggle */}
                  <div className="mb-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        autoScanEnabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {autoScanEnabled ? (
                        <>
                          <Power className="w-4 h-4" />
                          <span className="text-sm font-medium">Auto-scan Aktif</span>
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-4 h-4" />
                          <span className="text-sm font-medium">Auto-scan Nonaktif</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-gray-600 mb-6">
                    {autoScanEnabled 
                      ? 'Sistem akan otomatis memindai wajah Anda. Pastikan wajah terlihat jelas di kamera.'
                      : 'Pastikan wajah Anda terlihat jelas di kamera dan berada di dalam garis panduan.'
                    }
                  </p>
                  
                  <button
                    onClick={handleScan}
                    disabled={status === 'scanning'}
                    className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                      status === 'scanning'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {status === 'scanning' ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Memproses...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Scan className="w-5 h-5 mr-2" />
                        {autoScanEnabled ? 'Scan Manual' : 'Mulai Scan Wajah'}
                      </span>
                    )}
                  </button>
                  
                  <p className="text-xs text-gray-400 mt-4">
                    {autoScanEnabled 
                      ? 'Sistem akan otomatis memindai setiap beberapa detik. Anda juga bisa klik tombol di atas untuk scan manual.'
                      : 'Dengan menekan tombol di atas, Anda menyetujui penggunaan data wajah untuk keperluan absensi.'
                    }
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-500 text-sm">
            Mengalami masalah? Hubungi administrator atau{' '}
            <Link href="/bantuan" className="text-blue-600 hover:underline">
              baca panduan
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
