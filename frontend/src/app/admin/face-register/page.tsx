'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import {
  Camera,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  ChevronDown,
  Search,
  UserCheck,
  Upload,
  Trash2
} from 'lucide-react';
import { faceAPI, adminAPI } from '@/lib/api';

interface StudentOption {
  id: number;
  nim: string;
  name: string;
  kelas: string;
  jurusan: string;
  has_face: boolean;
}

interface CapturedImage {
  id: string;
  data: string;
}

type RegistrationStatus = 'idle' | 'capturing' | 'processing' | 'success' | 'error';

export default function AdminFaceRegisterPage() {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'no-face'>('no-face');
  
  const [status, setStatus] = useState<RegistrationStatus>('idle');
  const [message, setMessage] = useState('');
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  const MIN_PHOTOS = 3;
  const MAX_PHOTOS = 10;

  // Fetch students dropdown
  useEffect(() => {
    fetchStudents();
  }, [filterMode]);

  // Filter students based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(
          s => 
            s.name.toLowerCase().includes(query) ||
            s.nim.toLowerCase().includes(query) ||
            s.kelas?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      // face_registered=false means get students WITHOUT face registered
      // face_registered=true means get students WITH face registered
      // face_registered=undefined means get ALL students
      const faceRegisteredParam = filterMode === 'no-face' ? false : (filterMode === 'all' ? undefined : true);
      const response = await adminAPI.getStudentsDropdown(faceRegisteredParam);
      setStudents(response.data.students || []);
      setFilteredStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage('Gagal memuat data mahasiswa');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  const handleCapture = useCallback(() => {
    if (!webcamRef.current || !selectedStudent) return;
    if (capturedImages.length >= MAX_PHOTOS) {
      setMessage('Maksimal 10 foto sudah tercapai');
      return;
    }
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const newImage: CapturedImage = {
        id: Date.now().toString(),
        data: imageSrc
      };
      setCapturedImages(prev => [...prev, newImage]);
      setStatus('idle');
      setMessage(`${capturedImages.length + 1} foto diambil. ${Math.max(0, MIN_PHOTOS - capturedImages.length - 1)} foto lagi diperlukan.`);
    }
  }, [selectedStudent, capturedImages.length]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).slice(0, MAX_PHOTOS - capturedImages.length).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const newImage: CapturedImage = {
          id: Date.now().toString() + Math.random(),
          data: result
        };
        setCapturedImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    setCapturedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleRetake = () => {
    setCapturedImages([]);
    setStatus('idle');
    setMessage('');
  };

  const handleRegister = async () => {
    if (capturedImages.length < MIN_PHOTOS || !selectedStudent) {
      setMessage(`Minimal ${MIN_PHOTOS} foto diperlukan untuk registrasi`);
      return;
    }

    setStatus('processing');
    setMessage('Memproses wajah...');

    try {
      // Extract base64 data from data URL (remove "data:image/jpeg;base64," prefix)
      const imageDataArray = capturedImages.map(img => {
        // Check if it's a data URL and extract base64 part
        if (img.data.startsWith('data:')) {
          return img.data.split(',')[1]; // Extract base64 part after comma
        }
        return img.data; // Already base64
      });
      const response = await faceAPI.adminRegister(selectedStudent.id, imageDataArray);
      
      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message || 'Wajah berhasil didaftarkan!');
        
        // Update student list
        setStudents(prev => 
          prev.map(s => 
            s.id === selectedStudent.id ? { ...s, has_face: true } : s
          )
        );
        
        // Reset after success
        setTimeout(() => {
          setCapturedImages([]);
          setSelectedStudent(null);
          setStatus('idle');
          setMessage('');
          // Refresh list if showing only no-face
          if (filterMode === 'no-face') {
            fetchStudents();
          }
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Gagal mendaftarkan wajah');
      }
    } catch (error: any) {
      setStatus('error');
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Terjadi kesalahan saat mendaftarkan wajah';
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Images count:', capturedImages.length);
      console.error('Student ID:', selectedStudent?.id);
      setMessage(errorMessage);
    }
  };

  const handleStudentSelect = (student: StudentOption) => {
    setSelectedStudent(student);
    setIsDropdownOpen(false);
    setSearchQuery('');
    setCapturedImages([]);
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Registrasi Wajah</h1>
          <p className="text-gray-600 mt-1">Daftarkan wajah mahasiswa untuk sistem absensi</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as 'all' | 'no-face')}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="no-face">Belum Registrasi</option>
            <option value="all">Semua Mahasiswa</option>
          </select>
          <button
            onClick={fetchStudents}
            className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Mahasiswa</h2>

          {/* Student Dropdown */}
          <div className="relative mb-6">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              {selectedStudent ? (
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedStudent.has_face ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {selectedStudent.has_face ? (
                      <UserCheck className="w-5 h-5 text-green-600" />
                    ) : (
                      <User className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedStudent.name}</p>
                    <p className="text-sm text-gray-500">{selectedStudent.nim} • {selectedStudent.kelas || '-'}</p>
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">Pilih mahasiswa...</span>
              )}
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                >
                  {/* Search */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama atau NIM..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="max-h-64 overflow-y-auto">
                    {isLoadingStudents ? (
                      <div className="p-4 text-center text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Memuat data...</p>
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Tidak ada mahasiswa ditemukan</p>
                      </div>
                    ) : (
                      filteredStudents.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => handleStudentSelect(student)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                              student.has_face ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              {student.has_face ? (
                                <UserCheck className="w-4 h-4 text-green-600" />
                              ) : (
                                <User className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-xs text-gray-500">{student.nim} • {student.kelas || '-'}</p>
                            </div>
                          </div>
                          {student.has_face && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              Terdaftar
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Selected Student Info */}
          {selectedStudent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-blue-50 rounded-xl border border-blue-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Mahasiswa Terpilih</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedStudent.name}</p>
                  <p className="text-sm text-gray-600">{selectedStudent.nim}</p>
                  {selectedStudent.kelas && (
                    <p className="text-sm text-gray-500">Kelas: {selectedStudent.kelas}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    setCapturedImages([]);
                  }}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-blue-600" />
                </button>
              </div>
              
              {selectedStudent.has_face && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-700">
                      Mahasiswa ini sudah memiliki wajah terdaftar. Mendaftarkan ulang akan mengganti data wajah sebelumnya.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">
                {students.filter(s => !s.has_face).length}
              </p>
              <p className="text-sm text-gray-500">Belum Registrasi</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-700">
                {students.filter(s => s.has_face).length}
              </p>
              <p className="text-sm text-green-600">Sudah Registrasi</p>
            </div>
          </div>
        </motion.div>

        {/* Camera / Capture Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ambil Foto Wajah 
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Minimal {MIN_PHOTOS} foto dari sudut berbeda)
            </span>
          </h2>

          {!selectedStudent ? (
            <div className="aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="text-center text-gray-500">
                <User className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Pilih mahasiswa terlebih dahulu</p>
                <p className="text-sm mt-1">Gunakan dropdown di sebelah kiri</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera View */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.95}
                  videoConstraints={{
                    width: 1280,
                    height: 960,
                    facingMode: 'user'
                  }}
                  onUserMedia={handleCameraReady}
                  className="w-full h-full object-cover"
                />
                
                {/* Face Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-60 border-2 border-white/50 rounded-full"></div>
                </div>
                
                {/* Guide Text */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                    {capturedImages.length < MIN_PHOTOS 
                      ? `Ambil ${MIN_PHOTOS - capturedImages.length} foto lagi (sudut berbeda)` 
                      : 'Siap untuk didaftarkan!'}
                  </p>
                </div>
                
                {/* Photo counter */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    capturedImages.length >= MIN_PHOTOS 
                      ? 'bg-green-500 text-white' 
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {capturedImages.length}/{MIN_PHOTOS} foto
                  </span>
                </div>
                
                {/* Status Overlay */}
                <AnimatePresence>
                  {status === 'processing' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center"
                    >
                      <div className="text-center text-white">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" />
                        <p className="font-medium">{message}</p>
                      </div>
                    </motion.div>
                  )}
                  
                  {status === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-green-600/90 flex items-center justify-center"
                    >
                      <div className="text-center text-white">
                        <CheckCircle className="w-16 h-16 mx-auto mb-3" />
                        <p className="font-semibold text-lg">{message}</p>
                      </div>
                    </motion.div>
                  )}
                  
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-red-600/90 flex items-center justify-center"
                    >
                      <div className="text-center text-white">
                        <AlertCircle className="w-16 h-16 mx-auto mb-3" />
                        <p className="font-semibold text-lg">{message}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Captured Images Preview */}
              {capturedImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Foto yang diambil:</p>
                  <div className="grid grid-cols-5 gap-2">
                    {capturedImages.map((img, index) => (
                      <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img src={img.data} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Trash2 className="w-5 h-5 text-white" />
                        </button>
                        <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Capture Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCapture}
                  disabled={!isCameraReady || capturedImages.length >= MAX_PHOTOS || status === 'processing'}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Ambil Foto ({capturedImages.length}/{MAX_PHOTOS})
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={capturedImages.length >= MAX_PHOTOS}
                  className="inline-flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  <Upload className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Action Buttons */}
              {capturedImages.length > 0 && status !== 'success' && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleRetake}
                    disabled={status === 'processing'}
                    className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Reset Semua
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={status === 'processing' || capturedImages.length < MIN_PHOTOS}
                    className={`flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl transition-colors font-medium disabled:opacity-50 ${
                      capturedImages.length >= MIN_PHOTOS 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-gray-300 text-gray-500'
                    }`}
                  >
                    {status === 'processing' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Daftarkan ({capturedImages.length} foto)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Message */}
              {message && status === 'idle' && (
                <p className="text-sm text-center text-blue-600">{message}</p>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-900 mb-2">Panduan Registrasi Wajah</h3>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Ambil <strong>minimal 3 foto</strong> dari sudut berbeda (depan, kiri, kanan)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Pastikan wajah terlihat jelas dan tidak tertutup</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Pencahayaan cukup dan merata</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>Lepas kacamata hitam atau masker jika ada</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-green-700">Semakin banyak foto (hingga 10), semakin akurat pengenalan wajah</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
