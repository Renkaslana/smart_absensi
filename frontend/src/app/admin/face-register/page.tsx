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
  Trash2,
  Shield
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

interface FaceSettings {
  confidenceThreshold: number;
  livenessEnabled: boolean;
  blinkDetection: boolean;
  headMovement: boolean;
  maxAttempts: number;
}

type RegistrationStatus = 'idle' | 'capturing' | 'processing' | 'success' | 'error' | 'liveness-check';
type LivenessStep = 'blink' | 'turn-left' | 'turn-right' | 'complete';

export default function AdminFaceRegisterPage() {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'no-face' | 'registered'>('no-face');

  const [status, setStatus] = useState<RegistrationStatus>('idle');
  const [message, setMessage] = useState('');
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  // Liveness Detection
  const [settings, setSettings] = useState<FaceSettings>({
    confidenceThreshold: 0.8,
    livenessEnabled: false,
    blinkDetection: false,
    headMovement: false,
    maxAttempts: 3,
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [livenessStep, setLivenessStep] = useState<LivenessStep>('blink');
  const [livenessInstructions, setLivenessInstructions] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);

  // Auto-capture feature
  const [isAutoCapture, setIsAutoCapture] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentPhotoAngle, setCurrentPhotoAngle] = useState(0);
  const autoCaptureTimerRef = useRef<NodeJS.Timeout | null>(null);

  const MIN_PHOTOS = 3;
  const MAX_PHOTOS = 5;
  const RECOMMENDED_PHOTOS = 5;

  // Photo angles for progressive guidance (5 angles for 5 photos max)
  const PHOTO_ANGLES = [
    'Foto depan - Lihat langsung ke kamera',
    'Foto kiri - Putar kepala 30 derajat ke kiri',
    'Foto kanan - Putar kepala 30 derajat ke kanan',
    'Foto sedikit ke atas - Angkat dagu sedikit',
    'Foto depan lagi - Kembali lihat langsung ke kamera'
  ];


  // Voice synthesis helper with Indonesian support
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Wait for voices to load
        const setVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          // Try to find Indonesian voice
          const indonesianVoice = voices.find(voice =>
            voice.lang.includes('id') || voice.lang.includes('ID')
          );

          if (indonesianVoice) {
            utterance.voice = indonesianVoice;
            console.log('✓ Using Indonesian voice:', indonesianVoice.name);
          } else {
            console.log('⚠️ Indonesian voice not found, using default');
          }

          utterance.lang = 'id-ID';
          utterance.rate = 0.9; // Sedikit lebih lambat untuk clarity
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          window.speechSynthesis.speak(utterance);
        };

        // Some browsers need time to load voices
        if (window.speechSynthesis.getVoices().length > 0) {
          setVoice();
        } else {
          window.speechSynthesis.onvoiceschanged = setVoice;
        }
      } catch (error) {
        console.error('Voice synthesis error:', error);
      }
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  }, []);

  function startLivenessCheck() {
    const steps: LivenessStep[] = [];
    if (settings.blinkDetection) steps.push('blink');
    if (settings.headMovement) {
      steps.push('turn-left');
      steps.push('turn-right');
    }

    if (steps.length === 0) {
      setStatus('idle');
      return;
    }

    setStatus('liveness-check');
    setLivenessStep(steps[0]);
    performLivenessSteps(steps, 0);
  }
  
  // Cleanup auto-capture timer
  useEffect(() => {
    return () => {
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // Fetch settings and students with auto-refresh
  useEffect(() => {
    fetchSettings();
    fetchStudents();

    // Auto-refresh every 10 seconds for real-time updates
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refreshing students...');
      fetchStudents();
    }, 10000);

    // Cleanup interval on unmount or filterMode change
    return () => clearInterval(intervalId);
  }, [filterMode]);

  const fetchSettings = async () => {
    setIsLoadingSettings(true);
    try {
      // Try to get from API, fallback to localStorage
      const storedSettings = localStorage.getItem('faceRecognitionSettings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings({
          confidenceThreshold: parsed.confidenceThreshold || 0.8,
          livenessEnabled: parsed.livenessEnabled || false,
          blinkDetection: parsed.blinkDetection || false,
          headMovement: parsed.headMovement || false,
          maxAttempts: parsed.maxAttempts || 3,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

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
      const response = await adminAPI.getStudents({});

      // Normalize backend response (sama seperti di students page)
      const payload = response.data || {};
      const rawItems = payload.students ?? payload.items ?? payload.data?.students ?? payload.data?.items ?? [];

      const normalized = (rawItems || []).map((it: any) => ({
        id: it.id,
        nim: it.nim,
        name: it.name,
        kelas: it.kelas || it.class || '-',
        jurusan: it.jurusan || it.major || '-',
        has_face: it.has_face ?? it.hasFace ?? it.face_registered ?? false
      }));

      // Filter based on mode
      let filtered = normalized;
      if (filterMode === 'no-face') {
        filtered = normalized.filter((s: StudentOption) => !s.has_face);
      } else if (filterMode === 'registered') {
        filtered = normalized.filter((s: StudentOption) => s.has_face);
      }
      // filterMode === 'all' means show all

      setStudents(filtered);
      setFilteredStudents(filtered);
      console.log('✅ Students loaded:', filtered.length, 'Mode:', filterMode);
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      setMessage('Gagal memuat data mahasiswa');
      setStudents([]);
      setFilteredStudents([]);
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
      setMessage(`Maksimal ${MAX_PHOTOS} foto sudah tercapai`);
      return;
    }

    // Liveness check before first photo
    if (capturedImages.length === 0 && settings.livenessEnabled) {
      startLivenessCheck();
      return;
    }

    // Check max attempts
    if (attemptCount >= settings.maxAttempts && capturedImages.length < MIN_PHOTOS) {
      setStatus('error');
      setMessage(`Maksimal ${settings.maxAttempts} percobaan tercapai. Silakan reset dan coba lagi.`);
      return;
    }

    // If liveness detection enabled, do liveness check first
    if (settings.livenessEnabled && capturedImages.length === 0) {
      setStatus('liveness-check');
      startLivenessCheck();
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const newImage: CapturedImage = {
        id: Date.now().toString(),
        data: imageSrc
      };
      setCapturedImages(prev => [...prev, newImage]);
      setAttemptCount(prev => prev + 1);
      setStatus('idle');

      // Voice feedback: "Gambar telah diambil"
      speak('Gambar telah diambil');

      // Progressive feedback messages
      const remaining = MIN_PHOTOS - capturedImages.length - 1;
      const totalCaptured = capturedImages.length + 1;

      if (totalCaptured < MIN_PHOTOS) {
        setMessage(`✓ ${totalCaptured} foto diambil. ${remaining} foto lagi untuk mencapai minimum.`);
      } else if (totalCaptured >= MIN_PHOTOS && totalCaptured < RECOMMENDED_PHOTOS) {
        const toOptimal = RECOMMENDED_PHOTOS - totalCaptured;
        setMessage(`✓ Minimum tercapai! ${toOptimal} foto lagi untuk hasil optimal (akurasi 90%+).`);
      } else {
        setMessage(`✓ Sempurna! ${totalCaptured} foto - Dataset optimal untuk akurasi tinggi!`);
      }

      // Update current photo angle for next capture
      setCurrentPhotoAngle(prev => (prev + 1) % PHOTO_ANGLES.length);
    }
  }, [selectedStudent, capturedImages.length, attemptCount, settings]);

  const startAutoCapture = useCallback(() => {
    if (!selectedStudent || capturedImages.length >= MAX_PHOTOS) {
      setMessage('Pilih mahasiswa terlebih dahulu atau sudah mencapai batas maksimum foto');
      return;
    }

    // Liveness check before starting auto-capture (only for first time)
    if (capturedImages.length === 0 && settings.livenessEnabled) {
      speak('Verifikasi keamanan akan dimulai');
      startLivenessCheck();
      // After liveness, will need to click Auto again
      return;
    }

    setIsAutoCapture(true);
    speak('Pengambilan foto otomatis akan dimulai');
    setCountdown(3);

    // Countdown 3, 2, 1 (Indonesian voice)
    let count = 3;
    const countdownInterval = setInterval(() => {
      if (count > 0) {
        setCountdown(count);
        // Indonesian countdown: "tiga", "dua", "satu"
        const countIndonesian = ['', 'satu', 'dua', 'tiga'];
        speak(countIndonesian[count]);
        count--;
      } else {
        clearInterval(countdownInterval);
        setCountdown(0);
        speak('Mulai');

        // Start auto-capture sequence
        let photoIndex = capturedImages.length;
        const captureInterval = setInterval(() => {
          if (photoIndex >= MAX_PHOTOS) {
            clearInterval(captureInterval);
            stopAutoCapture();
            return;
          }

          // Announce angle instruction
          if (photoIndex < PHOTO_ANGLES.length) {
            speak(PHOTO_ANGLES[photoIndex]);
            setMessage(PHOTO_ANGLES[photoIndex]);
          }

          // Capture photo after 1 second (give time for user to position)
          setTimeout(() => {
            if (webcamRef.current) {
              const imageSrc = webcamRef.current.getScreenshot();
              if (imageSrc) {
                const newImage: CapturedImage = {
                  id: Date.now().toString(),
                  data: imageSrc
                };
                setCapturedImages(prev => [...prev, newImage]);
                speak('Gambar telah diambil');
              }
            }
          }, 1000);

          photoIndex++;
        }, 4000); // Every 4 seconds (1s instruction + 1s position + 2s next)

        autoCaptureTimerRef.current = captureInterval;
      }
    }, 1000);
  }, [selectedStudent, capturedImages.length, settings.livenessEnabled, speak, webcamRef, startLivenessCheck]);

  const stopAutoCapture = useCallback(() => {
    setIsAutoCapture(false);
    setCountdown(0);
    if (autoCaptureTimerRef.current) {
      clearInterval(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
    }
  }, []);


  

  const performLivenessSteps = (steps: LivenessStep[], currentIndex: number) => {
    if (currentIndex >= steps.length) {
      setStatus('idle');
      setLivenessStep('complete');
      setMessage('✓ Verifikasi keamanan berhasil! Siap mengambil foto.');
      speak('Verifikasi berhasil, siap mengambil foto');
      return;
    }

    const currentStep = steps[currentIndex];
    setLivenessStep(currentStep);

    const instructions: Record<LivenessStep, string> = {
      'blink': 'Kedipkan mata Anda dua kali',
      'turn-left': 'Putar kepala ke kiri',
      'turn-right': 'Putar kepala ke kanan',
      'complete': 'Selesai'
    };

    const instruction = instructions[currentStep];
    setLivenessInstructions(instruction);
    speak(instruction);

    // User has 4 seconds to perform action
    setTimeout(() => {
      performLivenessSteps(steps, currentIndex + 1);
    }, 4000);
  };

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
    setAttemptCount(0);
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
        const qualityNote = capturedImages.length >= RECOMMENDED_PHOTOS
          ? ' (Dataset optimal - akurasi 90%+!)'
          : capturedImages.length >= MIN_PHOTOS
            ? ' (Dapat ditingkatkan dengan lebih banyak foto)'
            : '';
        setMessage(`✓ Wajah berhasil didaftarkan dengan ${capturedImages.length} foto${qualityNote}\nDisimpan: dataset_wajah/${selectedStudent.nim}/`);

        // Voice feedback: "Semua data gambar terkait absensi sudah disimpan, terima kasih"
        speak('Semua data gambar terkait absensi sudah disimpan, terima kasih');

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
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Images count:', capturedImages.length);
      console.error('Student ID:', selectedStudent?.id);

      // Handle error message properly - convert object to string
      let errorMessage = 'Terjadi kesalahan saat mendaftarkan wajah';

      if (error.response?.data) {
        const errorData = error.response.data;

        // Handle validation errors (array of objects)
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
        }
        // Handle single detail object or string
        else if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (typeof errorData.detail === 'object') {
            errorMessage = errorData.detail.msg || JSON.stringify(errorData.detail);
          }
        }
        // Handle message field
        else if (errorData.message) {
          errorMessage = typeof errorData.message === 'string' ? errorData.message : JSON.stringify(errorData.message);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

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
    setAttemptCount(0);
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
          <p className="text-gray-600 mt-1">Daftarkan wajah mahasiswa untuk sistem absensi dengan auto-capture</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as 'all' | 'no-face' | 'registered')}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          >
            <option value="no-face">Belum Registrasi</option>
            <option value="registered">Sudah Registrasi</option>
            <option value="all">Semua Mahasiswa</option>
          </select>
          <button
            onClick={fetchStudents}
            disabled={isLoadingStudents}
            className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh data mahasiswa"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStudents ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Info Panel */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Loader2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">✨ Fitur Auto-Capture + Voice Indonesia</h3>
            <p className="text-sm text-gray-700">
              Klik tombol <strong>Auto</strong> untuk pengambilan foto otomatis dengan panduan sudut berbahasa Indonesia.
              Sistem akan mengambil <strong>5 foto</strong> secara otomatis setiap 4 detik dengan:
            </p>
            <ul className="text-sm text-gray-700 mt-2 ml-4 space-y-1">
              <li>• 🔊 Countdown: <strong>"tiga, dua, satu, mulai"</strong></li>
              <li>• 🔊 Panduan sudut: <strong>"Foto depan", "Foto kiri"</strong>, dll</li>
              <li>• 🔊 Konfirmasi: <strong>"Gambar telah diambil"</strong></li>
              <li>• 🔊 Selesai: <strong>"Semua data gambar sudah disimpan"</strong></li>
            </ul>
          </div>
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedStudent.has_face ? 'bg-green-100' : 'bg-blue-100'
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
                  <div className="p-3 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama atau NIM..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
                          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-150 border-b border-gray-100 last:border-0 group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${student.has_face
                                ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                                : 'bg-gradient-to-br from-gray-200 to-gray-300'
                              }`}>
                              {student.has_face ? (
                                <UserCheck className="w-5 h-5 text-white" />
                              ) : (
                                <User className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{student.name}</p>
                              <p className="text-xs text-gray-600 font-medium">{student.nim} • {student.kelas || '-'}</p>
                            </div>
                          </div>
                          {student.has_face && (
                            <span className="text-xs text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-full font-semibold">
                              ✓ Terdaftar
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
              className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full font-semibold">Dipilih</span>
                    {selectedStudent.has_face && (
                      <span className="px-2 py-0.5 text-xs bg-green-500 text-white rounded-full font-semibold">✓ Sudah Terdaftar</span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-gray-900">{selectedStudent.name}</p>
                  <p className="text-sm text-gray-700 font-medium mt-0.5">{selectedStudent.nim}</p>
                  {selectedStudent.kelas && (
                    <p className="text-sm text-gray-600 mt-1">Kelas: <span className="font-semibold">{selectedStudent.kelas}</span></p>
                  )}
                  {selectedStudent.jurusan && (
                    <p className="text-sm text-gray-600">Jurusan: <span className="font-semibold">{selectedStudent.jurusan}</span></p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    setCapturedImages([]);
                  }}
                  className="p-2.5 hover:bg-blue-200 rounded-lg transition-colors group"
                  title="Batalkan pilihan"
                >
                  <X className="w-5 h-5 text-blue-600 group-hover:text-blue-800" />
                </button>
              </div>

              {selectedStudent.has_face && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800 font-medium">
                      Mahasiswa ini sudah memiliki wajah terdaftar. Mendaftarkan ulang akan <strong>mengganti data wajah sebelumnya</strong>.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {students.filter(s => !s.has_face).length}
              </p>
              <p className="text-sm text-gray-600 font-medium mt-1">Belum Registrasi</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:border-green-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-700">
                {students.filter(s => s.has_face).length}
              </p>
              <p className="text-sm text-green-700 font-medium mt-1">Sudah Registrasi</p>
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
                  screenshotQuality={1.0}
                  videoConstraints={{
                    width: 1920,
                    height: 1080,
                    facingMode: 'user',
                    aspectRatio: 4 / 3
                  }}
                  onUserMedia={handleCameraReady}
                  className="w-full h-full object-cover"
                />

                {/* Face Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-60 border-2 border-white/50 rounded-full"></div>
                </div>

                {/* Guide Text */}
                <div className="absolute bottom-4 left-0 right-0 text-center px-4">
                  <div className="bg-black/70 inline-block px-5 py-3 rounded-xl backdrop-blur-sm border border-white/20">
                    {countdown > 0 ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                        <div>
                          <p className="text-white text-xl font-bold">
                            {countdown}
                          </p>
                          <p className="text-white/80 text-xs">Bersiaplah...</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-white text-sm font-semibold mb-1">
                          {capturedImages.length < MIN_PHOTOS
                            ? `Foto ${capturedImages.length}/${MIN_PHOTOS} - ${MIN_PHOTOS - capturedImages.length} foto lagi`
                            : capturedImages.length < RECOMMENDED_PHOTOS
                              ? `✓ Minimum tercapai! ${RECOMMENDED_PHOTOS - capturedImages.length} foto lagi untuk hasil optimal`
                              : '✓ Sempurna! Siap registrasi dengan akurasi tinggi'}
                        </p>
                        <p className="text-white/80 text-xs">
                          {capturedImages.length < PHOTO_ANGLES.length
                            ? PHOTO_ANGLES[currentPhotoAngle]
                            : 'Dataset sempurna untuk training!'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Photo counter */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${capturedImages.length >= MIN_PHOTOS
                      ? 'bg-green-500 text-white'
                      : 'bg-yellow-500 text-white'
                    }`}>
                    {capturedImages.length}/{MIN_PHOTOS} foto
                  </span>
                </div>

                {/* Liveness Detection Overlay */}
                <AnimatePresence>
                  {status === 'liveness-check' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/70 flex items-center justify-center"
                    >
                      <div className="text-center text-white px-6">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                        <p className="font-semibold text-xl mb-2">Verifikasi Liveness</p>
                        <p className="text-lg">{livenessInstructions}</p>
                        <p className="text-sm mt-3 text-white/70">Ikuti instruksi untuk membuktikan Anda manusia asli</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Foto yang diambil:</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${capturedImages.length >= MIN_PHOTOS
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      }`}>
                      {capturedImages.length >= MIN_PHOTOS ? '✓ Cukup!' : `${MIN_PHOTOS - capturedImages.length} lagi`}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {capturedImages.map((img, index) => (
                      <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group border-2 border-gray-200 hover:border-blue-400 transition-all">
                        <img src={img.data} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          title="Hapus foto ini"
                        >
                          <Trash2 className="w-5 h-5 text-white" />
                        </button>
                        <span className="absolute top-1 left-1 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold shadow-lg">
                          #{index + 1}
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
                  disabled={!isCameraReady || capturedImages.length >= MAX_PHOTOS || status === 'processing' || isAutoCapture}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Ambil Foto ({capturedImages.length}/{MAX_PHOTOS})
                </button>

                {/* Auto-Capture Button */}
                {!isAutoCapture ? (
                  <button
                    onClick={startAutoCapture}
                    disabled={!isCameraReady || !selectedStudent || capturedImages.length >= MAX_PHOTOS}
                    className="inline-flex items-center justify-center px-4 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Auto-capture otomatis"
                  >
                    <Loader2 className="w-5 h-5 mr-2" />
                    Auto
                  </button>
                ) : (
                  <button
                    onClick={stopAutoCapture}
                    className="inline-flex items-center justify-center px-4 py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Stop
                  </button>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={capturedImages.length >= MAX_PHOTOS}
                  className="inline-flex items-center justify-center px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold border-2 border-gray-300 disabled:opacity-50"
                  title="Upload dari file"
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
                    className="flex-1 inline-flex items-center justify-center px-4 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold disabled:opacity-50"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Reset Semua
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={status === 'processing' || capturedImages.length < MIN_PHOTOS}
                    className={`flex-1 inline-flex items-center justify-center px-4 py-3.5 rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${capturedImages.length >= MIN_PHOTOS
                        ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800'
                        : 'bg-gray-300 text-gray-500'
                      }`}
                  >
                    {status === 'processing' ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Daftarkan Wajah ({capturedImages.length} foto)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Message */}
              {message && status === 'idle' && (
                <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-sm text-center text-blue-700 font-medium">{message}</p>
                </div>
              )}
            </div>
          )}

          {/* Settings Info */}
          {selectedStudent && (
            <div className="mt-4 p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
              <h3 className="font-bold text-purple-900 mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Pengaturan Keamanan
              </h3>
              <div className="space-y-2 text-sm text-purple-800">
                {settings.livenessEnabled ? (
                  <div className="flex items-center space-x-2 p-2 bg-green-100 rounded-lg border border-green-300">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Liveness Detection: <strong className="text-green-700">Aktif</strong></span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg border border-gray-300">
                    <AlertCircle className="w-5 h-5 text-gray-500" />
                    <span className="font-semibold text-gray-600">Liveness Detection: Nonaktif</span>
                  </div>
                )}
                {settings.blinkDetection && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Deteksi Kedipan Mata</span>
                  </div>
                )}
                {settings.headMovement && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Deteksi Gerakan Kepala</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-purple-200 mt-2">
                  <span className="font-medium">Maksimal Percobaan:</span>
                  <span className="font-bold text-purple-900">{settings.maxAttempts}x</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Percobaan saat ini:</span>
                  <span className={`font-bold ${attemptCount >= settings.maxAttempts ? 'text-red-700' : 'text-purple-900'}`}>{attemptCount}/{settings.maxAttempts}</span>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 shadow-sm">
            <h3 className="font-bold text-indigo-900 mb-4 flex items-center text-base">
              <Shield className="w-5 h-5 mr-2" />
              Panduan Registrasi Wajah untuk Akurasi 90%+
            </h3>
            <ul className="text-sm text-gray-700 space-y-2.5">
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Ambil <strong className="text-blue-700">minimal 5 foto</strong> (rekomendasi <strong className="text-green-700">10 foto</strong>) dari berbagai sudut:</span>
              </li>
              <li className="ml-8 text-xs text-gray-600 space-y-1">
                <div>• Depan langsung (0°)</div>
                <div>• Kiri 30° dan 45°</div>
                <div>• Kanan 30° dan 45°</div>
                <div>• Sedikit miring ke atas dan bawah</div>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span><strong className="text-blue-700">Pencahayaan optimal:</strong> Cahaya natural/lampu putih dari depan, hindari backlight</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Wajah <strong className="text-blue-700">harus jelas</strong>: lepas kacamata hitam, masker, topi</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span><strong className="text-blue-700">Ekspresi netral</strong> dan rileks, hindari ekspresi berlebihan</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                <span><strong className="text-blue-700">Background sederhana</strong>, hindari latar ramai atau bergerak</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
                <span><strong className="text-blue-700">Jarak optimal:</strong> 50-70cm dari kamera, wajah memenuhi oval panduan</span>
              </li>
              <li className="flex items-start space-x-2 pt-3 border-t-2 border-indigo-300 mt-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <div>
                  <span className="text-green-800 font-bold block">Rekomendasi terbaik: 10 foto berbeda!</span>
                  <span className="text-xs text-gray-600 block mt-1">Foto disimpan di: <code className="bg-purple-100 px-2 py-0.5 rounded text-purple-700">dataset_wajah/{'{'}NIM{'}'}/</code></span>
                </div>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
