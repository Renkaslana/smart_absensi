import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ScanFace,
  Camera,
  CheckCircle,
  AlertTriangle,
  Info,
  Upload,
  Trash2,
  Eye,
  Loader,
  XCircle,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Feedback';
import { toast } from 'react-hot-toast';
import { useFaceRegistrationStatus, useRegisterFace, useDeleteFacePhoto } from '../../hooks/useStudent';

const RegisterFacePage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  // 🌙 Fetch face registration status from backend
  const { data: faceStatus, isLoading, error } = useFaceRegistrationStatus();
  const registerMutation = useRegisterFace();
  const deleteMutation = useDeleteFacePhoto();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      if (videoRef.current) {
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      }
      setIsCameraActive(true);
    } catch (error) {
      console.error('Failed to start camera:', error);
      toast.error('Gagal mengaktifkan kamera');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleAddPhoto = () => {
    setShowCameraModal(true);
    setTimeout(() => startCamera(), 100);
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      toast.error('Gagal membuat canvas');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    try {
      await registerMutation.mutateAsync(dataUrl);
      toast.success('Foto wajah berhasil ditambahkan!');
      stopCamera();
      setShowCameraModal(false);
    } catch (error: any) {
      console.error('Failed to register face:', error);
      toast.error(error.response?.data?.detail || 'Gagal menambahkan foto');
    }
  };

  const handleCancelCamera = () => {
    stopCamera();
    setShowCameraModal(false);
  };

  const handleDeletePhoto = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Foto berhasil dihapus');
    } catch (error: any) {
      console.error('Failed to delete photo:', error);
      toast.error(error.response?.data?.detail || 'Gagal menghapus foto');
    }
  };

  const getStatusBadge = () => {
    if (!faceStatus) return null;
    
    switch (faceStatus.status) {
      case 'complete':
        return <Badge variant="success">Terdaftar Lengkap</Badge>;
      case 'partial':
        return <Badge variant="warning">Perlu Tambah Foto</Badge>;
      case 'not_registered':
        return <Badge variant="danger">Belum Terdaftar</Badge>;
    }
  };

  const getStatusIcon = () => {
    if (!faceStatus) return null;
    
    switch (faceStatus.status) {
      case 'complete':
        return <CheckCircle className="w-12 h-12 text-emerald-600" />;
      case 'partial':
      case 'not_registered':
        return <AlertTriangle className="w-12 h-12 text-yellow-600" />;
    }
  };

  const getStatusMessage = () => {
    if (!faceStatus) return '';
    
    switch (faceStatus.status) {
      case 'complete':
        return 'Wajah Anda sudah terdaftar dengan lengkap. Sistem siap mengenali Anda untuk absensi otomatis.';
      case 'partial':
        return `Anda memiliki ${faceStatus.total_photos} foto, tetapi disarankan menambah ${faceStatus.required_photos - faceStatus.total_photos} foto lagi untuk akurasi maksimal.`;
      case 'not_registered':
        return 'Anda belum mendaftarkan wajah. Silakan tambahkan minimal 3 foto untuk menggunakan absensi otomatis.';
    }
  };

  // 🌙 Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader className="w-12 h-12 text-teal-600 animate-spin" />
        <p className="text-gray-600">Memuat status registrasi wajah...</p>
      </div>
    );
  }

  // 🌙 Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl p-6 text-center">
        <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Gagal Memuat Data</h3>
        <p className="text-red-700">Terjadi kesalahan saat mengambil status registrasi wajah.</p>
      </div>
    );
  }

  const photos = faceStatus?.photos || [];
  const requiredPhotos = faceStatus?.required_photos || 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registrasi Wajah</h1>
        <p className="text-gray-600 mt-1">Daftarkan wajah Anda untuk absensi otomatis dengan face recognition</p>
      </div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-l-4 border-l-teal-600">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {getStatusIcon()}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">Status Registrasi</h3>
                  {getStatusBadge()}
                </div>
                <p className="text-gray-600">{getStatusMessage()}</p>
                <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-teal-800">
                      <p className="font-semibold mb-1">Tips untuk foto terbaik:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Pastikan wajah terlihat jelas dan tidak terhalang</li>
                        <li>Ambil foto di tempat dengan pencahayaan yang baik</li>
                        <li>Hindari kacamata atau masker saat pengambilan foto</li>
                        <li>Ambil foto dari berbagai sudut (depan, sedikit miring)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Photo Gallery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-600" />
                <h2 className="text-xl font-bold text-gray-900">Foto Wajah Terdaftar ({photos.length}/{requiredPhotos})</h2>
              </div>
              <button
                onClick={handleAddPhoto}
                disabled={photos.length >= requiredPhotos || registerMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium rounded-xl transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={18} />
                Tambah Foto
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {photos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                      <img
                        src={photo.image_url}
                        alt={`Face ${photo.id}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Foto {photo.id}</p>
                        <p className="text-xs text-gray-500">{new Date(photo.uploaded_at).toLocaleDateString('id-ID')}</p>
                        <Badge
                          variant={photo.quality_score >= 0.9 ? 'success' : 'info'}
                          className="mt-1"
                        >
                          Kualitas {(photo.quality_score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? (
                          <Loader size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ScanFace className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-6">Belum ada foto wajah terdaftar</p>
                <button
                  onClick={handleAddPhoto}
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium rounded-xl transition-all hover:shadow-lg"
                >
                  <Upload className="inline mr-2" size={18} />
                  Tambah Foto Pertama
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Ambil Foto Wajah</h3>
              <button
                onClick={handleCancelCamera}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Camera Preview */}
            <div className="relative bg-gray-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
              />
              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <Loader className="w-12 h-12 text-white animate-spin" />
                </div>
              )}
              {/* Face Oval Guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-teal-500 rounded-full w-64 h-80 opacity-50"></div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 flex items-center justify-center gap-4">
              <button
                onClick={handleCancelCamera}
                className="px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleCapturePhoto}
                disabled={!isCameraActive || registerMutation.isPending}
                className="px-8 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium rounded-xl transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Camera size={20} />
                    Ambil Foto
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold text-gray-900">Cara Kerja Face Recognition</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 mx-auto bg-teal-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-teal-600">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Daftarkan Wajah</h3>
                <p className="text-sm text-gray-600">
                  Tambahkan 3-5 foto wajah Anda dari berbagai sudut untuk akurasi maksimal
                </p>
              </div>

              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 mx-auto bg-teal-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-teal-600">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Sistem Belajar</h3>
                <p className="text-sm text-gray-600">
                  AI kami akan menganalisis dan mempelajari fitur unik wajah Anda
                </p>
              </div>

              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 mx-auto bg-teal-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-teal-600">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Absen Otomatis</h3>
                <p className="text-sm text-gray-600">
                  Sistem akan mengenali wajah Anda secara otomatis saat absensi
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Catatan Keamanan:</p>
                  <p>
                    Foto wajah Anda akan disimpan dengan aman dan hanya digunakan untuk keperluan
                    absensi. Data Anda dilindungi dengan enkripsi dan tidak akan dibagikan kepada
                    pihak ketiga.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterFacePage;
