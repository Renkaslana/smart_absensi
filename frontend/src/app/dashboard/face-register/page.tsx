'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Play,
  Square
} from 'lucide-react';
import { faceAPI } from '@/lib/api';
import { speak, stopSpeaking, VOICE_PHRASES } from '@/lib/voice';

type RegisterStatus = 'idle' | 'capturing' | 'uploading' | 'success' | 'failed';

interface CapturedImage {
  id: string;
  data: string;
  preview: string;
}

// Photo angle instructions in Indonesian
const PHOTO_ANGLES = [
  { instruction: 'Foto depan - Lihat langsung ke kamera', voice: 'Lihat langsung ke kamera' },
  { instruction: 'Foto kiri - Putar kepala 30° ke kiri', voice: 'Putar kepala sedikit ke kiri' },
  { instruction: 'Foto kanan - Putar kepala 30° ke kanan', voice: 'Putar kepala sedikit ke kanan' },
  { instruction: 'Foto atas - Angkat dagu sedikit', voice: 'Angkat dagu sedikit' },
  { instruction: 'Foto depan lagi - Kembali lihat ke kamera', voice: 'Kembali lihat langsung ke kamera' },
];

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 5;

export default function FaceRegisterPage() {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoCaptureRef = useRef<NodeJS.Timeout | null>(null);
  
  const [status, setStatus] = useState<RegisterStatus>('idle');
  const [message, setMessage] = useState('Ambil minimal 3 foto wajah dari sudut berbeda');
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [isAutoCapture, setIsAutoCapture] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentAngle, setCurrentAngle] = useState(0);

  // High resolution for better recognition
  const videoConstraints = {
    width: 1920,
    height: 1080,
    facingMode: 'user',
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoCaptureRef.current) {
        clearInterval(autoCaptureRef.current);
      }
      stopSpeaking();
    };
  }, []);

  // Capture from webcam
  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;
    if (capturedImages.length >= MAX_PHOTOS) {
      setMessage(`Maksimal ${MAX_PHOTOS} foto sudah tercapai`);
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot({
      width: 1920,
      height: 1080,
    });
    if (!imageSrc) {
      setMessage('Gagal mengambil gambar. Coba lagi.');
      return;
    }

    const newImage: CapturedImage = {
      id: Date.now().toString(),
      data: imageSrc,
      preview: imageSrc,
    };

    setCapturedImages((prev: CapturedImage[]) => [...prev, newImage]);
    speak(VOICE_PHRASES.IMAGE_CAPTURED);
    
    const totalCaptured = capturedImages.length + 1;
    const remaining = MIN_PHOTOS - totalCaptured;
    
    if (remaining > 0) {
      setMessage(`✓ ${totalCaptured} foto diambil. ${remaining} foto lagi diperlukan.`);
    } else {
      setMessage(`✓ ${totalCaptured} foto diambil. Sudah cukup untuk registrasi!`);
    }
    
    setCurrentAngle((prev) => (prev + 1) % PHOTO_ANGLES.length);
  }, [capturedImages.length]);

  // Auto-capture mode
  const startAutoCapture = useCallback(() => {
    if (capturedImages.length >= MAX_PHOTOS) {
      setMessage(`Sudah mencapai maksimal ${MAX_PHOTOS} foto`);
      return;
    }

    setIsAutoCapture(true);
    speak('Pengambilan foto otomatis akan dimulai');
    setCountdown(3);

    // Countdown
    let count = 3;
    const countdownInterval = setInterval(() => {
      if (count > 0) {
        setCountdown(count);
        speak(['', 'satu', 'dua', 'tiga'][count]);
        count--;
      } else {
        clearInterval(countdownInterval);
        setCountdown(0);
        speak('mulai');

        // Start capturing
        let photoIndex = capturedImages.length;
        autoCaptureRef.current = setInterval(() => {
          if (photoIndex >= MAX_PHOTOS) {
            stopAutoCapture();
            return;
          }

          // Voice instruction for angle
          if (photoIndex < PHOTO_ANGLES.length) {
            speak(PHOTO_ANGLES[photoIndex].voice);
            setMessage(PHOTO_ANGLES[photoIndex].instruction);
          }

          // Capture after 1.5s delay
          setTimeout(() => {
            if (webcamRef.current) {
              const imageSrc = webcamRef.current.getScreenshot({
                width: 1920,
                height: 1080,
              });
              if (imageSrc) {
                const newImage: CapturedImage = {
                  id: Date.now().toString(),
                  data: imageSrc,
                  preview: imageSrc,
                };
                setCapturedImages((prev) => [...prev, newImage]);
                speak(VOICE_PHRASES.IMAGE_CAPTURED);
              }
            }
          }, 1500);

          photoIndex++;
          setCurrentAngle(photoIndex % PHOTO_ANGLES.length);
        }, 4000);
      }
    }, 1000);
  }, [capturedImages.length]);

  const stopAutoCapture = useCallback(() => {
    if (autoCaptureRef.current) {
      clearInterval(autoCaptureRef.current);
      autoCaptureRef.current = null;
    }
    setIsAutoCapture(false);
    setCountdown(0);
    speak('Pengambilan foto selesai');
  }, []);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result as string;
        const newImage: CapturedImage = {
          id: Date.now().toString() + Math.random(),
          data: result,
          preview: result,
        };
        setCapturedImages((prev: CapturedImage[]) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove image
  const removeImage = (id: string) => {
    setCapturedImages((prev: CapturedImage[]) => prev.filter((img: CapturedImage) => img.id !== id));
  };

  // Submit for registration
  const handleSubmit = async () => {
    if (capturedImages.length < MIN_PHOTOS) {
      setMessage(`Minimal ${MIN_PHOTOS} foto diperlukan untuk registrasi`);
      speak(`Minimal ${MIN_PHOTOS} foto diperlukan`);
      return;
    }

    setStatus('uploading');
    setMessage('Mendaftarkan wajah...');
    speak('Mendaftarkan wajah. Mohon tunggu.');

    try {
      // Convert base64 images to array of base64 strings
      const base64Images = capturedImages.map((img: CapturedImage) => img.data);

      // Send to backend with images_base64
      const response = await faceAPI.register(base64Images);

      if (response.data.success) {
        setStatus('success');
        setMessage(`Wajah berhasil didaftarkan dengan ${response.data.encodings_count} encoding!`);
        speak(VOICE_PHRASES.REGISTRATION_SUCCESS);
        setCapturedImages([]);
        
        // Refresh user data to update has_face status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setStatus('failed');
        setMessage(response.data.message || 'Gagal mendaftarkan wajah');
        speak(VOICE_PHRASES.REGISTRATION_FAILED);
      }
    } catch (error: any) {
      console.error('Face registration error:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Terjadi kesalahan. Silakan coba lagi.';
      setStatus('failed');
      setMessage(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      speak(VOICE_PHRASES.REGISTRATION_FAILED);
    }
  };

  // Reset state
  const handleReset = () => {
    stopAutoCapture();
    setStatus('idle');
    setMessage('Ambil minimal 3 foto wajah dari sudut berbeda');
    setCapturedImages([]);
    setCurrentAngle(0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-primary-900">Daftar Wajah</h1>
        <p className="text-neutral-600 mt-1">
          Daftarkan wajah Anda untuk dapat melakukan absensi
        </p>
      </motion.div>

      {/* Tab Selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center"
      >
        <div className="bg-neutral-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab('camera')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'camera'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Camera className="w-4 h-4 inline-block mr-2" />
            Kamera
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Upload className="w-4 h-4 inline-block mr-2" />
            Upload
          </button>
        </div>
      </motion.div>

      {/* Camera/Upload Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'camera' ? (
            <motion.div
              key="camera"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="relative aspect-video bg-neutral-900 rounded-lg overflow-hidden">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={1.0}
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                  mirrored
                />

                {/* Face Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-3xl" />
                </div>

                {/* Countdown Overlay */}
                {countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <motion.span
                      key={countdown}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className="text-8xl font-bold text-white"
                    >
                      {countdown}
                    </motion.span>
                  </div>
                )}

                {/* Current Angle Instruction */}
                {isAutoCapture && countdown === 0 && (
                  <div className="absolute top-4 left-4 right-4">
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                      <p className="text-white text-sm">{PHOTO_ANGLES[currentAngle]?.instruction}</p>
                    </div>
                  </div>
                )}

                {/* Capture Buttons */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                  {/* Manual Capture */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCapture}
                    disabled={status === 'uploading' || isAutoCapture}
                    className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center disabled:opacity-50"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-500" />
                  </motion.button>

                  {/* Auto Capture Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isAutoCapture ? stopAutoCapture : startAutoCapture}
                    disabled={status === 'uploading' || capturedImages.length >= MAX_PHOTOS}
                    className={`px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 ${
                      isAutoCapture 
                        ? 'bg-red-500 text-white' 
                        : 'bg-primary-500 text-white'
                    } disabled:opacity-50`}
                  >
                    {isAutoCapture ? (
                      <>
                        <Square className="w-4 h-4" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Auto</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
                <p className="text-neutral-600 font-medium">
                  Klik atau drag & drop untuk upload foto
                </p>
                <p className="text-neutral-400 text-sm mt-1">
                  Mendukung JPG, PNG (Max 5MB per file)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Captured Images Preview */}
      {capturedImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h3 className="font-semibold text-primary-900 mb-4">
            Foto yang Diambil ({capturedImages.length}/{MAX_PHOTOS})
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {capturedImages.map((img, index) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square rounded-lg overflow-hidden group"
              >
                <img
                  src={img.preview}
                  alt={`Captured ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-6 h-6 text-white" />
                </button>
                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                  {index + 1}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

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
                  <p className="text-neutral-500 mt-1">
                    Anda sudah dapat melakukan absensi dengan wajah
                  </p>
                </div>
              </div>
            ) : status === 'failed' ? (
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-red-600">Registrasi Gagal</p>
                  <p className="text-neutral-500 mt-1">{message}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                {status === 'uploading' ? (
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
        {status === 'idle' && capturedImages.length >= 3 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="btn-primary flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Daftarkan Wajah</span>
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
            <span>Daftar Ulang</span>
          </motion.button>
        )}

        {status === 'idle' && capturedImages.length > 0 && capturedImages.length < 3 && (
          <p className="text-amber-600 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Ambil {3 - capturedImages.length} foto lagi
          </p>
        )}
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card bg-primary-50 border border-primary-200"
      >
        <h3 className="font-semibold text-primary-900 mb-3">Petunjuk Registrasi Wajah</h3>
        <ul className="space-y-2 text-sm text-primary-700">
          <li className="flex items-start space-x-2">
            <span className="text-primary-500">1.</span>
            <span>Ambil minimal 3 foto wajah dari sudut yang berbeda (depan, kiri, kanan)</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary-500">2.</span>
            <span>Pastikan wajah terlihat jelas dan pencahayaan cukup</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary-500">3.</span>
            <span>Hindari penggunaan aksesoris yang menutupi wajah</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary-500">4.</span>
            <span>Foto akan digunakan untuk verifikasi identitas saat absensi</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
