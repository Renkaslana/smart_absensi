import React, { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Feedback';
import { toast } from 'react-hot-toast';

const RegisterFacePage: React.FC = () => {
  const [registrationStatus, setRegistrationStatus] = useState<'not_registered' | 'partial' | 'complete'>('partial');
  const [photos, setPhotos] = useState([
    {
      id: 1,
      url: 'https://via.placeholder.com/300',
      timestamp: '2026-01-05 10:30',
      quality: 'good',
    },
    {
      id: 2,
      url: 'https://via.placeholder.com/300',
      timestamp: '2026-01-05 10:32',
      quality: 'excellent',
    },
  ]);

  const handleAddPhoto = () => {
    // TODO: Implement camera capture with liveness detection
    toast.success('Foto berhasil ditambahkan');
  };

  const handleDeletePhoto = (id: number) => {
    setPhotos(photos.filter((p) => p.id !== id));
    toast.success('Foto berhasil dihapus');
  };

  const getStatusBadge = () => {
    switch (registrationStatus) {
      case 'complete':
        return <Badge variant="success">Terdaftar Lengkap</Badge>;
      case 'partial':
        return <Badge variant="warning">Perlu Tambah Foto</Badge>;
      case 'not_registered':
        return <Badge variant="danger">Belum Terdaftar</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (registrationStatus) {
      case 'complete':
        return <CheckCircle className="w-12 h-12 text-emerald-600" />;
      case 'partial':
      case 'not_registered':
        return <AlertTriangle className="w-12 h-12 text-yellow-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (registrationStatus) {
      case 'complete':
        return 'Wajah Anda sudah terdaftar dengan lengkap. Sistem siap mengenali Anda untuk absensi otomatis.';
      case 'partial':
        return 'Anda memiliki beberapa foto, tetapi disarankan menambah 3-5 foto untuk akurasi maksimal.';
      case 'not_registered':
        return 'Anda belum mendaftarkan wajah. Silakan tambahkan minimal 3 foto untuk menggunakan absensi otomatis.';
    }
  };

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
                <h2 className="text-xl font-bold text-gray-900">Foto Wajah Terdaftar ({photos.length}/5)</h2>
              </div>
              <button
                onClick={handleAddPhoto}
                disabled={photos.length >= 5}
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
                        src={photo.url}
                        alt={`Face ${photo.id}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Foto {photo.id}</p>
                        <p className="text-xs text-gray-500">{photo.timestamp}</p>
                        <Badge
                          variant={photo.quality === 'excellent' ? 'success' : 'info'}
                          className="mt-1"
                        >
                          {photo.quality === 'excellent' ? 'Kualitas Sangat Baik' : 'Kualitas Baik'}
                        </Badge>
                      </div>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
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
