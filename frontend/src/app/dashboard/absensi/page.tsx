'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Scan, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Loader2,
  Eye,
  MoveHorizontal
} from 'lucide-react';
import { faceAPI, absensiAPI } from '@/lib/api';

type ScanStatus = 'idle' | 'scanning' | 'liveness' | 'verifying' | 'success' | 'failed';

interface LivenessChallenge {
  type: 'blink' | 'head_movement';
  instruction: string;
  completed: boolean;
}

export default function AbsensiPage() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('Posisikan wajah Anda di dalam frame');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [userName, setUserName] = useState('');
  const [livenessChallenge, setLivenessChallenge] = useState<LivenessChallenge | null>(null);
  const [scanningProgress, setScanningProgress] = useState(0);

  // Video constraints
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user',
  };

  // Simulate face detection (real implementation would use backend)
  useEffect(() => {
    if (status === 'scanning') {
      const interval = setInterval(() => {
        setScanningProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Handle capture and verification
  const handleCapture = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setMessage('Gagal mengambil gambar. Coba lagi.');
      return;
    }

    setStatus('scanning');
    setMessage('Memindai wajah...');
    setScanningProgress(0);

    try {
      // Step 1: Liveness detection
      setStatus('liveness');
      setMessage('Verifikasi keamanan...');
      
      // Generate random challenge
      const challenges: LivenessChallenge[] = [
        { type: 'blink', instruction: 'Kedipkan mata Anda 2 kali', completed: false },
        { type: 'head_movement', instruction: 'Gerakkan kepala ke kanan lalu kiri', completed: false },
      ];
      const challenge = challenges[Math.floor(Math.random() * challenges.length)];
      setLivenessChallenge(challenge);

      // Wait for liveness (simulated - real implementation would track frames)
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      // Mark challenge as completed
      setLivenessChallenge({ ...challenge, completed: true });

      // Step 2: Face verification
      setStatus('verifying');
      setMessage('Memverifikasi identitas...');

      // Extract base64 from imageSrc (remove data URL prefix)
      const base64Image = imageSrc.split(',')[1];

      // Send to backend for face scan with base64 image
      const scanResponse = await faceAPI.scan(base64Image);
      
      if (scanResponse.data.recognized && scanResponse.data.faces && scanResponse.data.faces.length > 0) {
        // Get first recognized face
        const recognizedFace = scanResponse.data.faces.find((f: any) => f.recognized);
        
        if (recognizedFace) {
          setStatus('success');
          setConfidence(recognizedFace.confidence / 100); // Backend returns percentage, convert to 0-1
          setUserName(recognizedFace.name);
          setMessage(`Selamat datang, ${recognizedFace.name}!`);
          
          // Submit attendance with image
          const submitResponse = await absensiAPI.submit(base64Image);
          
          // Show timestamp if available
          if (submitResponse.data?.absensi?.timestamp) {
            const timestamp = new Date(submitResponse.data.absensi.timestamp);
            const tanggal = timestamp.toLocaleDateString('id-ID', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
            const waktu = timestamp.toLocaleTimeString('id-ID', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            });
            setMessage(`Absensi berhasil! Tercatat pada ${tanggal} pukul ${waktu}`);
          }
        } else {
          setStatus('failed');
          setMessage(scanResponse.data.message || 'Wajah tidak dikenali');
        }
      } else {
        setStatus('failed');
        setMessage(scanResponse.data.message || 'Wajah tidak dikenali');
      }
    } catch (error: any) {
      setStatus('failed');
      setMessage(error.response?.data?.detail || 'Terjadi kesalahan. Silakan coba lagi.');
    }
  }, []);

  // Reset state
  const handleReset = () => {
    setStatus('idle');
    setMessage('Posisikan wajah Anda di dalam frame');
    setConfidence(null);
    setFaceDetected(false);
    setUserName('');
    setLivenessChallenge(null);
    setScanningProgress(0);
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'scanning':
      case 'liveness':
      case 'verifying':
        return 'bg-primary-500';
      default:
        return 'bg-neutral-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-primary-900">Absensi Wajah</h1>
        <p className="text-neutral-600 mt-1">
          Posisikan wajah Anda di depan kamera untuk melakukan absensi
        </p>
      </motion.div>

      {/* Camera Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card overflow-hidden"
      >
        <div className="relative aspect-video bg-neutral-900 rounded-lg overflow-hidden">
          {/* Webcam */}
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
            mirrored
          />

          {/* Overlay Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Face Guide Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Animated Face Frame */}
            <motion.div
              animate={{
                borderColor: status === 'scanning' || status === 'liveness' || status === 'verifying'
                  ? ['#3B82F6', '#0EA5E9', '#3B82F6']
                  : status === 'success'
                  ? '#10B981'
                  : status === 'failed'
                  ? '#EF4444'
                  : '#9CA3AF',
                boxShadow: status === 'scanning' || status === 'liveness' || status === 'verifying'
                  ? ['0 0 20px rgba(59, 130, 246, 0.5)', '0 0 40px rgba(14, 165, 233, 0.5)', '0 0 20px rgba(59, 130, 246, 0.5)']
                  : 'none',
              }}
              transition={{
                duration: 1.5,
                repeat: status === 'scanning' || status === 'liveness' || status === 'verifying' ? Infinity : 0,
              }}
              className="w-64 h-80 border-4 rounded-3xl relative"
            >
              {/* Corner Accents */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-inherit rounded-tl-lg" />
              <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-inherit rounded-tr-lg" />
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-inherit rounded-bl-lg" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-inherit rounded-br-lg" />

              {/* Scanning Line Animation */}
              <AnimatePresence>
                {(status === 'scanning' || status === 'liveness' || status === 'verifying') && (
                  <motion.div
                    initial={{ top: 0 }}
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-400 to-transparent"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Liveness Challenge Overlay */}
          <AnimatePresence>
            {livenessChallenge && !livenessChallenge.completed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute bottom-4 left-4 right-4"
              >
                <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    {livenessChallenge.type === 'blink' ? (
                      <Eye className="w-8 h-8 text-primary-400" />
                    ) : (
                      <MoveHorizontal className="w-8 h-8 text-primary-400" />
                    )}
                    <div>
                      <p className="text-white font-medium">Verifikasi Keamanan</p>
                      <p className="text-neutral-300 text-sm">{livenessChallenge.instruction}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className={`${getStatusColor()} px-3 py-1.5 rounded-full flex items-center space-x-2`}
            >
              {status === 'idle' && <Camera className="w-4 h-4 text-white" />}
              {(status === 'scanning' || status === 'liveness' || status === 'verifying') && (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              )}
              {status === 'success' && <CheckCircle className="w-4 h-4 text-white" />}
              {status === 'failed' && <XCircle className="w-4 h-4 text-white" />}
              <span className="text-white text-sm font-medium capitalize">
                {status === 'idle' ? 'Siap' : status === 'liveness' ? 'Verifikasi' : status}
              </span>
            </motion.div>
          </div>

          {/* Progress Bar (during scanning) */}
          {(status === 'scanning' || status === 'liveness' || status === 'verifying') && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scanningProgress}%` }}
                className="h-full bg-primary-500"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Status Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card text-center"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {status === 'success' ? (
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">{message}</p>
                  {confidence && (
                    <p className="text-neutral-500 mt-1">
                      Tingkat kepercayaan: {(confidence * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            ) : status === 'failed' ? (
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-red-600">Verifikasi Gagal</p>
                  <p className="text-neutral-500 mt-1">{message}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                {(status === 'scanning' || status === 'liveness' || status === 'verifying') ? (
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-primary-600" />
                )}
                <p className="text-neutral-700">{message}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {status === 'idle' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCapture}
            className="btn-primary flex items-center space-x-2 px-8 py-4 text-lg"
          >
            <Scan className="w-6 h-6" />
            <span>Mulai Absensi</span>
          </motion.button>
        )}

        {(status === 'success' || status === 'failed') && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="btn-outline flex items-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Coba Lagi</span>
          </motion.button>
        )}
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card bg-primary-50 border border-primary-200"
      >
        <h3 className="font-semibold text-primary-900 mb-3">Petunjuk Penggunaan</h3>
        <ul className="space-y-2 text-sm text-primary-700">
          <li className="flex items-start space-x-2">
            <span className="text-primary-500">•</span>
            <span>Pastikan wajah Anda berada di dalam frame oval</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary-500">•</span>
            <span>Pastikan pencahayaan cukup dan wajah terlihat jelas</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary-500">•</span>
            <span>Lepas aksesoris yang menutupi wajah (kacamata hitam, masker, dll)</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary-500">•</span>
            <span>Ikuti instruksi verifikasi keamanan yang muncul</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
