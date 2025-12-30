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
import { mediaPipeService, type LivenessResult } from '@/lib/mediapipe';

type ScanStatus = 'idle' | 'initializing' | 'liveness' | 'scanning' | 'verifying' | 'success' | 'failed';

interface LivenessProgress {
  blinkCount: number;
  headMovement: boolean;
  isComplete: boolean;
}

export default function AbsensiPage() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const livenessIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('Posisikan wajah Anda di dalam frame');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [userName, setUserName] = useState('');
  const [livenessProgress, setLivenessProgress] = useState<LivenessProgress>({
    blinkCount: 0,
    headMovement: false,
    isComplete: false,
  });
  const [scanningProgress, setScanningProgress] = useState(0);

  // Video constraints - high resolution for better face recognition
  const videoConstraints = {
    width: 1920,
    height: 1080,
    facingMode: 'user',
  };

  // Indonesian voice feedback
  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const indonesianVoice = voices.find(v => v.lang.includes('id'));
      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (livenessIntervalRef.current) {
        clearInterval(livenessIntervalRef.current);
      }
      mediaPipeService.resetLivenessState();
    };
  }, []);

  // Start liveness detection
  const startLivenessDetection = useCallback(async () => {
    if (!webcamRef.current?.video) return;
    
    const videoElement = webcamRef.current.video;
    
    // Initialize MediaPipe
    setStatus('initializing');
    setMessage('Menginisialisasi deteksi wajah...');
    
    try {
      await mediaPipeService.initialize();
      mediaPipeService.resetLivenessState();
      
      setStatus('liveness');
      setMessage('Kedipkan mata Anda 2 kali dan gerakkan kepala');
      speak('Kedipkan mata Anda dua kali dan gerakkan kepala ke kiri atau kanan');
      
      // Start liveness detection loop
      let checkCount = 0;
      const maxChecks = 100; // ~10 seconds at 100ms interval
      
      livenessIntervalRef.current = setInterval(async () => {
        checkCount++;
        
        if (checkCount > maxChecks) {
          // Timeout
          clearInterval(livenessIntervalRef.current!);
          livenessIntervalRef.current = null;
          setStatus('failed');
          setMessage('Waktu habis. Verifikasi liveness gagal.');
          speak('Waktu habis. Silakan coba lagi.');
          return;
        }
        
        try {
          const result: LivenessResult = await mediaPipeService.detectLiveness(videoElement);
          
          // Update progress
          setLivenessProgress({
            blinkCount: mediaPipeService.getBlinkCount(),
            headMovement: mediaPipeService.hasHeadMovement(),
            isComplete: result.isLive,
          });
          
          // Update progress bar
          const progress = Math.min(
            ((mediaPipeService.getBlinkCount() * 40) + (mediaPipeService.hasHeadMovement() ? 60 : 0)),
            100
          );
          setScanningProgress(progress);
          
          // Voice feedback for blink
          if (result.blinkDetected) {
            speak(`Kedipan terdeteksi. ${mediaPipeService.getBlinkCount()} dari 2.`);
          }
          
          // Voice feedback for head movement
          if (result.headMovementDetected && !livenessProgress.headMovement) {
            speak('Gerakan kepala terdeteksi.');
          }
          
          // Check if liveness is complete
          if (result.isLive) {
            clearInterval(livenessIntervalRef.current!);
            livenessIntervalRef.current = null;
            
            speak('Verifikasi berhasil. Memproses absensi.');
            
            // Proceed to face recognition
            await processFaceRecognition();
          }
          
        } catch (error) {
          console.error('Liveness detection error:', error);
        }
      }, 100); // Check every 100ms
      
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
      setStatus('failed');
      setMessage('Gagal menginisialisasi deteksi wajah. Coba lagi.');
    }
  }, [speak, livenessProgress.headMovement]);

  // Process face recognition after liveness check
  const processFaceRecognition = useCallback(async () => {
    if (!webcamRef.current) return;
    
    setStatus('scanning');
    setMessage('Memindai wajah...');
    setScanningProgress(0);

    // Capture at highest quality
    const imageSrc = webcamRef.current.getScreenshot({
      width: 1920,
      height: 1080,
    });
    
    if (!imageSrc) {
      setStatus('failed');
      setMessage('Gagal mengambil gambar. Coba lagi.');
      speak('Gagal mengambil gambar. Silakan coba lagi.');
      return;
    }

    try {
      setStatus('verifying');
      setMessage('Memverifikasi identitas...');

      // Extract base64 from imageSrc (remove data URL prefix)
      const base64Image = imageSrc.split(',')[1];
      console.log('📸 Image captured, base64 length:', base64Image?.length);

      // Send to backend for face scan with FaceNet
      console.log('🔍 Sending to FaceNet recognition...');
      const scanResponse = await faceAPI.scan(base64Image);
      console.log('✅ Face scan response:', scanResponse.data);
      
      if (scanResponse.data.recognized) {
        // Face recognized
        const recognizedData = scanResponse.data;
        console.log('✓ Face recognized:', recognizedData.name, 'Confidence:', recognizedData.confidence);
        
        setStatus('success');
        setConfidence(recognizedData.confidence);
        setUserName(recognizedData.name || '');
        
        // Indonesian voice greeting
        speak(`Selamat datang, ${recognizedData.name}`);
        setMessage(`Selamat datang, ${recognizedData.name}!`);
        
        // Submit attendance
        console.log('📝 Submitting attendance...');
        const submitResponse = await absensiAPI.submit({ image_base64: base64Image });
        console.log('✅ Attendance submitted:', submitResponse.data);
        
        // Show timestamp if available
        if (submitResponse.data?.timestamp) {
          const timestamp = new Date(submitResponse.data.timestamp);
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
        console.log('❌ Face not recognized');
        setStatus('failed');
        setMessage('Wajah tidak dikenali. Pastikan wajah Anda sudah terdaftar.');
        speak('Wajah tidak dikenali. Pastikan wajah Anda sudah terdaftar.');
      }
    } catch (error: any) {
      console.error('❌ Attendance error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error detail:', error.response?.data?.detail);
      
      const errorMsg = error.response?.data?.detail || error.message || 'Terjadi kesalahan. Silakan coba lagi.';
      console.error('Final error message:', errorMsg);
      
      setStatus('failed');
      setMessage(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      speak('Terjadi kesalahan. Silakan coba lagi.');
    }
  }, [speak]);

  // Handle capture and verification (start with liveness)
  const handleCapture = useCallback(async () => {
    if (!webcamRef.current) return;
    
    // Reset state
    setLivenessProgress({ blinkCount: 0, headMovement: false, isComplete: false });
    setScanningProgress(0);
    
    // Start liveness detection first
    await startLivenessDetection();
  }, [startLivenessDetection]);

  // Reset state
  const handleReset = () => {
    if (livenessIntervalRef.current) {
      clearInterval(livenessIntervalRef.current);
      livenessIntervalRef.current = null;
    }
    mediaPipeService.resetLivenessState();
    
    setStatus('idle');
    setMessage('Posisikan wajah Anda di dalam frame');
    setConfidence(null);
    setFaceDetected(false);
    setUserName('');
    setLivenessProgress({ blinkCount: 0, headMovement: false, isComplete: false });
    setScanningProgress(0);
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'initializing':
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
            screenshotQuality={1.0}
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
                borderColor: status === 'initializing' || status === 'scanning' || status === 'liveness' || status === 'verifying'
                  ? ['#3B82F6', '#0EA5E9', '#3B82F6']
                  : status === 'success'
                  ? '#10B981'
                  : status === 'failed'
                  ? '#EF4444'
                  : '#9CA3AF',
                boxShadow: status === 'initializing' || status === 'scanning' || status === 'liveness' || status === 'verifying'
                  ? ['0 0 20px rgba(59, 130, 246, 0.5)', '0 0 40px rgba(14, 165, 233, 0.5)', '0 0 20px rgba(59, 130, 246, 0.5)']
                  : 'none',
              }}
              transition={{
                duration: 1.5,
                repeat: status === 'initializing' || status === 'scanning' || status === 'liveness' || status === 'verifying' ? Infinity : 0,
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
                {(status === 'initializing' || status === 'scanning' || status === 'liveness' || status === 'verifying') && (
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

          {/* Liveness Progress Overlay */}
          <AnimatePresence>
            {status === 'liveness' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute bottom-4 left-4 right-4"
              >
                <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium">Verifikasi Keamanan</p>
                      <span className="text-primary-400 text-sm">{scanningProgress}%</span>
                    </div>
                    
                    {/* Blink Progress */}
                    <div className="flex items-center space-x-3">
                      <Eye className={`w-5 h-5 ${livenessProgress.blinkCount >= 2 ? 'text-green-400' : 'text-neutral-400'}`} />
                      <div className="flex-1">
                        <p className="text-white text-sm">Kedipkan mata</p>
                        <div className="flex space-x-1 mt-1">
                          {[0, 1].map((i) => (
                            <div 
                              key={i}
                              className={`w-4 h-1 rounded-full ${livenessProgress.blinkCount > i ? 'bg-green-400' : 'bg-neutral-600'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-neutral-400 text-sm">{livenessProgress.blinkCount}/2</span>
                    </div>
                    
                    {/* Head Movement Progress */}
                    <div className="flex items-center space-x-3">
                      <MoveHorizontal className={`w-5 h-5 ${livenessProgress.headMovement ? 'text-green-400' : 'text-neutral-400'}`} />
                      <div className="flex-1">
                        <p className="text-white text-sm">Gerakkan kepala</p>
                        <div className="w-full h-1 bg-neutral-600 rounded-full mt-1">
                          <div 
                            className={`h-full rounded-full transition-all ${livenessProgress.headMovement ? 'bg-green-400 w-full' : 'w-0'}`}
                          />
                        </div>
                      </div>
                      <span className="text-neutral-400 text-sm">{livenessProgress.headMovement ? '✓' : '-'}</span>
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
              {(status === 'initializing' || status === 'scanning' || status === 'liveness' || status === 'verifying') && (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              )}
              {status === 'success' && <CheckCircle className="w-4 h-4 text-white" />}
              {status === 'failed' && <XCircle className="w-4 h-4 text-white" />}
              <span className="text-white text-sm font-medium capitalize">
                {status === 'idle' ? 'Siap' : 
                 status === 'initializing' ? 'Memuat...' :
                 status === 'liveness' ? 'Verifikasi' : 
                 status === 'scanning' ? 'Memindai' :
                 status === 'verifying' ? 'Memverifikasi' :
                 status}
              </span>
            </motion.div>
          </div>

          {/* Progress Bar (during scanning) */}
          {(status === 'initializing' || status === 'scanning' || status === 'liveness' || status === 'verifying') && (
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
                {(status === 'initializing' || status === 'scanning' || status === 'liveness' || status === 'verifying') ? (
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
