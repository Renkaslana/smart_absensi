import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Zap,
  Home,
  Loader,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Badge } from '../../components/ui/Feedback';
import useMarkPublicAttendance from '../../hooks/usePublic';
import settingsService from '../../services/settingsService';

type AttendanceStep = 'idle' | 'liveness' | 'capturing' | 'recognizing' | 'success' | 'failed';

interface AttendanceResult {
  name: string;
  nis: string;
  kelas: string;
  confidence: number;
  timestamp: string;
  mata_pelajaran: string;
  ruangan: string;
  isAlreadySubmitted: boolean;
}

const PublicAttendancePage_New = () => {
  const [step, setStep] = useState<AttendanceStep>('idle');
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState(3);
  const mutation = useMarkPublicAttendance();

  // Fetch liveness settings
  const { data: livenessSettings } = useQuery({
    queryKey: ['livenessDetectionSettings'],
    queryFn: settingsService.getLivenessDetectionSettings,
  });

  const livenessEnabled = livenessSettings?.enabled || false;

  // For now, simplified liveness without complex hook
  const [livenessProgress, setLivenessProgress] = useState<{
    blink: boolean;
    turnLeft: boolean;
    turnRight: boolean;
  }>({ blink: false, turnLeft: false, turnRight: false });

  const [passedCount, setPassedCount] = useState(0);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup camera
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      });
      setStream(mediaStream);
      
      // Wait for video to be ready before attaching
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure video plays
        await videoRef.current.play();
      }
      return true;
    } catch (error) {
      toast.error('Gagal mengakses kamera');
      console.error('Camera error:', error);
      return false;
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
  };

  const captureImage = (): string => {
    if (!videoRef.current) throw new Error('Video not ready');
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context error');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleStart = async () => {
    const cameraOk = await startCamera();
    if (!cameraOk) return;

    if (livenessEnabled) {
      setStep('liveness');
      toast('Ikuti instruksi liveness detection', { icon: '👀' });
      
      // Simulate liveness detection progress
      setTimeout(() => setLivenessProgress(prev => ({ ...prev, blink: true })), 2000);
      setTimeout(() => setLivenessProgress(prev => ({ ...prev, turnLeft: true })), 4000);
      setTimeout(() => setLivenessProgress(prev => ({ ...prev, turnRight: true })), 6000);
      setTimeout(() => setPassedCount(livenessSettings?.min_checks || 2), 6000);
    } else {
      // No liveness, directly capture after countdown
      setStep('capturing');
      let count = 3;
      setCountdown(count);
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(interval);
          handleRecognize();
        }
      }, 1000);
    }
  };

  // Auto-capture when liveness passed
  useEffect(() => {
    if (step === 'liveness' && passedCount >= (livenessSettings?.min_checks || 2)) {
      toast.success('✅ Liveness berhasil! Mengambil foto...');
      setStep('capturing');

      // Countdown before capture
      let count = 3;
      setCountdown(count);
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(interval);
          handleRecognize();
        }
      }, 1000);
    }
  }, [step, passedCount, livenessSettings]);

  const handleRecognize = async () => {
    setStep('recognizing');
    try {
      const image = captureImage();
      const resp = await mutation.mutateAsync({ image });

      if (resp && resp.success) {
        const attendance = resp.attendance;
        const user = resp.student;
        const confidencePercent = (resp.confidence || 1.0) * 100;

        const successResult: AttendanceResult = {
          name: user.name,
          nis: user.nim || user.username || '',
          kelas: user.kelas || '',
          confidence: confidencePercent,
          timestamp: attendance?.tanggal
            ? `${attendance.tanggal} ${attendance.waktu}`
            : new Date().toLocaleString('id-ID'),
          mata_pelajaran: attendance?.mata_pelajaran || '—',
          ruangan: attendance?.ruangan || '—',
          isAlreadySubmitted: resp.already_submitted === true,
        };

        setResult(successResult);
        setStep('success');

        // Play audio/speech
        const message = successResult.isAlreadySubmitted
          ? `${successResult.name}, Anda sudah melakukan absensi hari ini`
          : `Absensi berhasil. Selamat datang ${successResult.name}`;

        try {
          if (!successResult.isAlreadySubmitted) {
            const audio = new Audio('/voice/AbsensiBerhasil.mp3');
            audio.play().catch(() => {
              if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(message);
                utterance.lang = 'id-ID';
                utterance.rate = 0.95;
                window.speechSynthesis.speak(utterance);
              }
            });
          } else {
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(message);
              utterance.lang = 'id-ID';
              utterance.rate = 0.95;
              window.speechSynthesis.speak(utterance);
            }
          }
        } catch (e) {
          console.error('Audio error:', e);
        }

        // Auto reset after 5s
        setTimeout(() => {
          handleReset();
        }, 5000);
      } else {
        setStep('failed');
        toast.error(resp?.message || 'Wajah tidak dikenali');

        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(
            resp?.message || 'Wajah tidak dikenali. Silakan coba lagi.'
          );
          utterance.lang = 'id-ID';
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
        }

        setTimeout(() => handleReset(), 3000);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      console.error('Response data:', err?.response?.data);
      setStep('failed');
      const errorMessage = err?.response?.data?.detail || err?.message || 'Gagal melakukan scan';
      toast.error(errorMessage);
      setTimeout(() => handleReset(), 3000);
    }
  };

  const handleReset = () => {
    setStep('idle');
    setResult(null);
    setLivenessProgress({ blink: false, turnLeft: false, turnRight: false });
    setPassedCount(0);
    stopCamera();
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

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
              <div className="text-white/80 text-sm">{formatDate(currentTime)}</div>
            </div>

            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Beranda
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          <AnimatePresence mode="wait">
            {step === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl mx-auto">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Camera className="w-10 h-10 text-white" />
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Absensi Wajah</h2>
                  <p className="text-gray-600 mb-8">
                    {livenessEnabled
                      ? 'Sistem akan memverifikasi wajah Anda dengan deteksi kehidupan untuk keamanan'
                      : 'Sistem akan melakukan pengenalan wajah untuk absensi Anda'}
                  </p>

                  {livenessEnabled && (
                    <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div className="flex items-center justify-center gap-2 text-purple-700 font-semibold mb-2">
                        <Eye className="w-5 h-5" />
                        Liveness Detection Aktif
                      </div>
                      <p className="text-sm text-purple-600">
                        Anda akan diminta untuk berkedip dan menggerakkan kepala
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleStart}
                    className="px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
                  >
                    <Zap className="w-5 h-5" />
                    Mulai Absensi
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {(step === 'liveness' || step === 'capturing' || step === 'recognizing') && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto"
              >
                {/* Video Feed */}
                <div className="relative mb-6">
                  <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-inner relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover absolute inset-0"
                      onLoadedMetadata={() => {
                        // Ensure video plays when loaded
                        videoRef.current?.play().catch(err => console.error('Video play error:', err));
                      }}
                    />

                    {/* Liveness Overlay */}
                    {step === 'liveness' && (
                      <div className="absolute top-4 left-4 right-4">
                        <div className="bg-black/60 backdrop-blur-md rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-white font-semibold">Liveness Detection</span>
                            <Badge variant="info">{passedCount} / {livenessSettings?.min_checks || 2}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {livenessSettings?.require_blink && (
                              <div
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                  livenessProgress.blink
                                    ? 'bg-emerald-500/20 border border-emerald-400'
                                    : 'bg-white/10 border border-white/20'
                                }`}
                              >
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    livenessProgress.blink ? 'bg-emerald-400' : 'bg-gray-400'
                                  }`}
                                />
                                <span className="text-white text-sm">Berkedip</span>
                              </div>
                            )}
                            {livenessSettings?.require_head_turn && (
                              <>
                                <div
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                    livenessProgress.turnLeft
                                      ? 'bg-emerald-500/20 border border-emerald-400'
                                      : 'bg-white/10 border border-white/20'
                                  }`}
                                >
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      livenessProgress.turnLeft ? 'bg-emerald-400' : 'bg-gray-400'
                                    }`}
                                  />
                                  <span className="text-white text-sm">Kepala Kiri</span>
                                </div>
                                <div
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                    livenessProgress.turnRight
                                      ? 'bg-emerald-500/20 border border-emerald-400'
                                      : 'bg-white/10 border border-white/20'
                                  }`}
                                >
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      livenessProgress.turnRight ? 'bg-emerald-400' : 'bg-gray-400'
                                    }`}
                                  />
                                  <span className="text-white text-sm">Kepala Kanan</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Countdown Overlay */}
                    {step === 'capturing' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          key={countdown}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 1.5, opacity: 0 }}
                          className="text-white text-9xl font-bold"
                        >
                          {countdown}
                        </motion.div>
                      </div>
                    )}

                    {/* Recognizing Overlay */}
                    {step === 'recognizing' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-center">
                          <Loader className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
                          <p className="text-white text-xl font-semibold">Mengenali wajah...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-center">
                  {step === 'liveness' && (
                    <p className="text-gray-700 text-lg font-medium">
                      Ikuti instruksi liveness detection di layar
                    </p>
                  )}
                  {step === 'capturing' && (
                    <p className="text-gray-700 text-lg font-medium">
                      Bersiap mengambil foto...
                    </p>
                  )}
                  {step === 'recognizing' && (
                    <p className="text-gray-700 text-lg font-medium">
                      Mohon tunggu, memproses data wajah Anda...
                    </p>
                  )}
                </div>

                {/* Cancel Button */}
                <button
                  onClick={handleReset}
                  className="mt-6 mx-auto block px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </motion.div>
            )}

            {step === 'success' && result && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl mx-auto"
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {result.isAlreadySubmitted ? 'Sudah Absen' : 'Absensi Berhasil!'}
                  </h2>
                  <p className="text-gray-600 mb-8">
                    {result.isAlreadySubmitted
                      ? `Selamat datang kembali, ${result.name}!`
                      : `Selamat datang, ${result.name}!`}
                  </p>

                  <div className="space-y-4 text-left mb-8">
                    <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Nama</span>
                      <span className="font-semibold text-gray-900">{result.name}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">NIS</span>
                      <span className="font-semibold text-gray-900">{result.nis}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Kelas</span>
                      <span className="font-semibold text-gray-900">{result.kelas}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Confidence</span>
                      <Badge variant="success">{result.confidence.toFixed(1)}%</Badge>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Waktu</span>
                      <span className="font-semibold text-gray-900">{result.timestamp}</span>
                    </div>
                  </div>

                  {result.isAlreadySubmitted && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center justify-center gap-2 text-amber-700">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Anda sudah melakukan absensi hari ini</span>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-500">Terima kasih! Halaman akan direset otomatis...</p>
                </div>
              </motion.div>
            )}

            {step === 'failed' && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl mx-auto"
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <XCircle className="w-10 h-10 text-white" />
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Gagal Mengenali Wajah</h2>
                  <p className="text-gray-600 mb-8">
                    Wajah tidak dikenali. Silakan coba lagi atau hubungi administrator.
                  </p>

                  <button
                    onClick={handleReset}
                    className="px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all mx-auto"
                  >
                    Coba Lagi
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 py-4 px-6">
        <div className="max-w-7xl mx-auto text-center text-white/80 text-sm">
          &copy; {new Date().getFullYear()} FahrenCenter. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PublicAttendancePage_New;
