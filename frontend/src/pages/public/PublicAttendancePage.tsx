import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  Loader,
  Home,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Badge } from '../../components/ui/Feedback';
import useMarkPublicAttendance from '../../hooks/usePublic';

type AttendanceStatus = 'idle' | 'scanning' | 'success' | 'failed';

interface AttendanceResult {
  name: string;
  nis: string;
  kelas: string;
  confidence: number;
  timestamp: string;
  mata_pelajaran: string;
  ruangan: string;
}

const PublicAttendancePage: React.FC = () => {
  const [status, setStatus] = useState<AttendanceStatus>('idle');
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mutation = useMarkPublicAttendance();

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      });
      
      setStream(mediaStream);
      setCameraActive(true);
      
      // Wait a bit then attach to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
      
      toast.success('Kamera aktif');
    } catch (error) {
      toast.error('Gagal mengakses kamera');
      console.error('Camera error:', error);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleStartScan = async () => {
    if (!cameraActive) {
      await startCamera();
    }

    setStatus('scanning');
    setResult(null);

    // Simulate face recognition process (2-3 seconds)
    try {
      // Capture current video frame to base64
      if (!videoRef.current) throw new Error('Video element not ready');
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Unable to get canvas context');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Call public attendance API
      const resp = await mutation.mutateAsync({ image: dataUrl });

      if (resp && resp.success) {
        // Build result object from response
        const attendance = resp.attendance;
        const user = resp.student;
        
        // Convert confidence to percentage (0.755 → 75.5%)
        const confidenceValue = resp.confidence || attendance?.confidence || 1.0;
        const confidencePercent = confidenceValue * 100;
        
        const successResult: AttendanceResult = {
          name: user.name,
          nis: user.nim || user.username || '',
          kelas: user.kelas || '',
          confidence: confidencePercent,
          timestamp: attendance?.tanggal ? `${attendance.tanggal} ${attendance.waktu}` : new Date().toLocaleString('id-ID'),
          mata_pelajaran: attendance?.mata_pelajaran || '—',
          ruangan: attendance?.ruangan || '—',
        };

        setResult(successResult);
        setStatus('success');

        // Play success audio (public/voice/AbsensiBerhasil.mp3)
        try {
          const audio = new Audio('/voice/AbsensiBerhasil.mp3');
          audio.play().catch(() => {
            // Fallback to speech synthesis if audio autoplay blocked
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(
                `Absensi berhasil. Selamat datang ${successResult.name}`
              );
              utterance.lang = 'id-ID';
              utterance.rate = 0.95;
              window.speechSynthesis.speak(utterance);
            }
          });
        } catch (e) {
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
              `Absensi berhasil. Selamat datang ${successResult.name}`
            );
            utterance.lang = 'id-ID';
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
          }
        }

        // Auto reset after 5 seconds
        setTimeout(() => {
          setStatus('idle');
          setResult(null);
          stopCamera();
        }, 5000);
      } else {
        setStatus('failed');
        toast.error(resp?.message || 'Wajah tidak dikenali');

        // Fallback speech
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(
            resp?.message || 'Wajah tidak dikenali. Silakan coba lagi or hubungi admin.'
          );
          utterance.lang = 'id-ID';
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
        }

        setTimeout(() => {
          setStatus('idle');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setStatus('failed');
      toast.error(err?.message || 'Gagal melakukan scan');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResult(null);
    stopCamera();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 flex flex-col">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">FahrenCenter</h1>
              <p className="text-sm text-white/80">Smart Attendance System</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-center gap-2 text-white text-2xl font-bold mb-1">
                <Clock className="w-6 h-6" />
                {formatTime(currentTime)}
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Calendar className="w-4 h-4" />
                {formatDate(currentTime)}
              </div>
            </div>
            
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors backdrop-blur-sm"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Beranda</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <AnimatePresence mode="wait">
            {/* Idle State */}
            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <div className="bg-white rounded-3xl shadow-2xl p-12 mb-8">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Absensi Wajah
                  </h2>
                  <p className="text-xl text-gray-600 mb-6">
                    Posisikan wajah Anda di depan kamera untuk melakukan absensi
                  </p>

                  {/* Camera Preview in Idle State */}
                  <div className="relative w-full max-w-2xl mx-auto aspect-video bg-gray-900 rounded-2xl overflow-hidden mb-6">
                    {cameraActive ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mb-4"
                        >
                          <Camera className="w-12 h-12 text-white" />
                        </motion.div>
                        <p className="text-white text-lg">Klik tombol di bawah untuk mengaktifkan kamera</p>
                      </div>
                    )}
                  </div>

                  {!cameraActive ? (
                    <button
                      onClick={startCamera}
                      className="px-12 py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xl font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105"
                    >
                      Aktifkan Kamera
                    </button>
                  ) : (
                    <button
                      onClick={handleStartScan}
                      className="px-12 py-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xl font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105"
                    >
                      Mulai Scan Wajah
                    </button>
                  )}
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-8 h-8" />
                      <div>
                        <p className="text-sm opacity-80">Lokasi</p>
                        <p className="font-semibold">Lab Komputer 1</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8" />
                      <div>
                        <p className="text-sm opacity-80">Mata Pelajaran</p>
                        <p className="font-semibold">Matematika</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-8 h-8" />
                      <div>
                        <p className="text-sm opacity-80">Jam</p>
                        <p className="font-semibold">07:00 - 08:30</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Scanning State */}
            {status === 'scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <div className="bg-white rounded-3xl shadow-2xl p-12 overflow-hidden">
                  {/* Video Feed */}
                  <div className="relative mb-8">
                    <div className="relative w-full max-w-2xl mx-auto aspect-video bg-gray-900 rounded-2xl overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Scanning Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.4, 0.8] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-64 h-64 border-4 border-teal-500 rounded-full"
                        />
                      </div>

                      {/* Corner Brackets */}
                      <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-teal-500" />
                      <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-teal-500" />
                      <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-teal-500" />
                      <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-teal-500" />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 text-teal-600">
                    <Loader className="w-8 h-8 animate-spin" />
                    <p className="text-2xl font-bold">Mengenali wajah...</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Success State */}
            {status === 'success' && result && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <div className="bg-white rounded-3xl shadow-2xl p-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-32 h-32 mx-auto bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mb-6"
                  >
                    <CheckCircle className="w-20 h-20 text-white" />
                  </motion.div>

                  <h2 className="text-4xl font-bold text-emerald-600 mb-2">
                    Absensi Berhasil! ✅
                  </h2>
                  <p className="text-xl text-gray-600 mb-8">
                    Selamat datang di kelas
                  </p>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6 text-left">
                      <div className="bg-gray-50 rounded-xl p-6">
                        <p className="text-sm text-gray-600 mb-1">Nama</p>
                        <p className="text-xl font-bold text-gray-900">{result.name}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6">
                        <p className="text-sm text-gray-600 mb-1">NIS</p>
                        <p className="text-xl font-bold text-gray-900">{result.nis}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6">
                        <p className="text-sm text-gray-600 mb-1">Kelas</p>
                        <p className="text-xl font-bold text-gray-900">{result.kelas}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6">
                        <p className="text-sm text-gray-600 mb-1">Confidence</p>
                        <Badge variant="success" className="text-lg px-4 py-2">
                          {result.confidence.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-emerald-700 mb-1">Mata Pelajaran</p>
                          <p className="font-bold text-emerald-900">{result.mata_pelajaran}</p>
                        </div>
                        <div>
                          <p className="text-sm text-emerald-700 mb-1">Ruangan</p>
                          <p className="font-bold text-emerald-900">{result.ruangan}</p>
                        </div>
                        <div>
                          <p className="text-sm text-emerald-700 mb-1">Waktu</p>
                          <p className="font-bold text-emerald-900">{result.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Failed State */}
            {status === 'failed' && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <div className="bg-white rounded-3xl shadow-2xl p-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-32 h-32 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-6"
                  >
                    <XCircle className="w-20 h-20 text-white" />
                  </motion.div>

                  <h2 className="text-4xl font-bold text-red-600 mb-2">
                    Wajah Tidak Dikenali ❌
                  </h2>
                  <p className="text-xl text-gray-600 mb-8">
                    Pastikan wajah Anda terlihat jelas dan tidak terhalang
                  </p>

                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
                    <h3 className="font-semibold text-red-900 mb-3">Tips:</h3>
                    <ul className="text-left space-y-2 text-red-800">
                      <li>• Pastikan pencahayaan cukup</li>
                      <li>• Lepaskan masker, kacamata, atau topi</li>
                      <li>• Posisikan wajah tepat di tengah kamera</li>
                      <li>• Jika gagal terus, hubungi admin untuk registrasi ulang</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleReset}
                    className="px-12 py-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xl font-bold rounded-2xl shadow-lg transition-all"
                  >
                    Coba Lagi
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 py-4 px-6">
        <div className="max-w-7xl mx-auto text-center text-white/60 text-sm">
          <p>© 2026 FahrenCenter Smart Attendance System • Powered by Face Recognition Technology</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicAttendancePage;
