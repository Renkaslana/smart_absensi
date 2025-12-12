'use client';

import { useRef, useState, useCallback } from 'react';
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
  Trash2
} from 'lucide-react';
import { faceAPI } from '@/lib/api';

type RegisterStatus = 'idle' | 'capturing' | 'uploading' | 'success' | 'failed';

interface CapturedImage {
  id: string;
  data: string;
  preview: string;
}

export default function FaceRegisterPage() {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [status, setStatus] = useState<RegisterStatus>('idle');
  const [message, setMessage] = useState('Ambil minimal 3 foto wajah dari sudut berbeda');
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user',
  };

  // Capture from webcam
  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
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
    setMessage(`${capturedImages.length + 1} foto diambil. ${Math.max(0, 2 - capturedImages.length)} foto lagi diperlukan.`);
  }, [capturedImages.length]);

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
    if (capturedImages.length < 3) {
      setMessage('Minimal 3 foto diperlukan untuk registrasi');
      return;
    }

    setStatus('uploading');
    setMessage('Mendaftarkan wajah...');

    try {
      // Convert base64 images to blobs
      const files = await Promise.all(
        capturedImages.map(async (img: CapturedImage, index: number) => {
          const response = await fetch(img.data);
          const blob = await response.blob();
          return new File([blob], `face_${index}.jpg`, { type: 'image/jpeg' });
        })
      );

      // Send to backend
      const response = await faceAPI.register(files);

      if (response.data.success) {
        setStatus('success');
        setMessage('Wajah berhasil didaftarkan!');
        setCapturedImages([]);
      } else {
        setStatus('failed');
        setMessage(response.data.message || 'Gagal mendaftarkan wajah');
      }
    } catch (error: any) {
      setStatus('failed');
      setMessage(error.response?.data?.detail || 'Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  // Reset state
  const handleReset = () => {
    setStatus('idle');
    setMessage('Ambil minimal 3 foto wajah dari sudut berbeda');
    setCapturedImages([]);
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
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                  mirrored
                />

                {/* Face Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-3xl" />
                </div>

                {/* Capture Button */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCapture}
                    disabled={status === 'uploading'}
                    className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-500" />
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
            Foto yang Diambil ({capturedImages.length}/3+)
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
