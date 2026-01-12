import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Camera, Check, X, ArrowLeft, AlertCircle } from 'lucide-react';

import { adminService } from '../../services/adminService';
import { ShellHeader } from '../../components/layouts/Shell';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Feedback';
import { useLivenessDetection } from '../../hooks/useLivenessDetection';
import { speakFeedback } from '../../utils/livenessDetection';

const FaceRegistrationPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // 🌙 Persistent stream reference

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [autoCapture, setAutoCapture] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null); // 🌙 Countdown state (3, 2, 1, null)
  
  // 🌙 Track which conditions have been met (cumulative, don't reset)
  const [conditionsMet, setConditionsMet] = useState({
    faceDetected: false,
    notBlurry: false,
    notDark: false,
    neutralPose: false,
  });
  
  // 🌙 Track if first photo passed liveness (unlock subsequent auto-captures)
  const [livenessPassedOnce, setLivenessPassedOnce] = useState(false);

  const MIN_IMAGES = 3;
  const MAX_IMAGES = 5;

  // 🌙 Production Liveness Detection
  const { result: livenessResult, resetBlinkCount } = useLivenessDetection(
    videoRef as React.RefObject<HTMLVideoElement>,
    {
      enabled: cameraReady && autoCapture,
      checkInterval: 500,
      voiceFeedback: true,
    }
  );

  useEffect(() => {
    // 🌙 Don't auto-start camera - let user click button first
    // Similar to AttendanceTestPage behavior
    return () => {
      console.log('[FaceRegistration] Component unmounting, stopping camera...');
      window.speechSynthesis.cancel(); // 🌙 Stop any ongoing voice feedback
      stopCamera();
    };
  }, []);

  // 🌙 Auto-stop camera when page hidden (minimize, switch tab/app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && cameraReady) {
        console.log('[FaceRegistration] Page hidden, stopping camera...');
        window.speechSynthesis.cancel();
        stopCamera();
        setAutoCapture(false);
        toast('Kamera dihentikan (halaman tidak aktif)');
      }
    };

    const handleWindowBlur = () => {
      if (cameraReady) {
        console.log('[FaceRegistration] Window blur, stopping camera...');
        window.speechSynthesis.cancel();
        stopCamera();
        setAutoCapture(false);
        toast('Kamera dihentikan (berpindah aplikasi)');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [cameraReady]);

  // 🌙 Additional cleanup on beforeunload (browser close/refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('[FaceRegistration] Page unloading, stopping camera...');
      window.speechSynthesis.cancel();
      stopCamera();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [stream]);

  // 🌙 Update conditionsMet (cumulative - once true, stays true)
  useEffect(() => {
    if (!autoCapture || capturedImages.length > 0) return; // Only for first photo
    
    setConditionsMet(prev => ({
      faceDetected: prev.faceDetected || livenessResult.details.faceDetected,
      notBlurry: prev.notBlurry || !livenessResult.details.isBlurry,
      notDark: prev.notDark || !livenessResult.details.isDark,
      neutralPose: prev.neutralPose || livenessResult.details.isNeutralPose,
    }));
  }, [livenessResult, autoCapture, capturedImages.length]);

  // 🌙 Auto capture with cumulative condition checking
  useEffect(() => {
    if (!autoCapture || !cameraReady || capturedImages.length >= MAX_IMAGES || countdown !== null) {
      return; // Don't start new countdown if one is active
    }

    const isFirstPhoto = capturedImages.length === 0;

    if (isFirstPhoto) {
      // 🔒 FIRST PHOTO: Check cumulative conditions (at least 3 out of 4)
      const metConditions = [
        conditionsMet.faceDetected,
        conditionsMet.notBlurry,
        conditionsMet.notDark,
        conditionsMet.neutralPose
      ];
      const passedCount = metConditions.filter(c => c).length;
      
      // Start countdown when 3+ conditions have been met
      if (passedCount >= 3) {
        setCountdown(3);
      }
    } else if (livenessPassedOnce) {
      // ✅ SUBSEQUENT PHOTOS: Wait 2 seconds for pose change, then countdown
      const nextPhotoIndex = capturedImages.length; // 1, 2, 3, 4
      if (nextPhotoIndex < MAX_IMAGES) {
        // Give 2 seconds for user to read pose instruction and adjust
        setTimeout(() => {
          setCountdown(3); // 3-second countdown for each photo
        }, 2000);
      }
    }
  }, [autoCapture, cameraReady, capturedImages.length, livenessResult, countdown, conditionsMet, livenessPassedOnce]);

  // � Pose variations for each photo
  const poseInstructions = [
    "Hadap depan, pose netral", // Photo 1
    "Senyum natural", // Photo 2
    "Tengok sedikit ke kanan", // Photo 3
    "Tengok sedikit ke kiri", // Photo 4
    "Pose bebas tapi jelas" // Photo 5
  ];

  // 🌙 Countdown effect: 3 → 2 → 1 → 0 (capture) → null (reset)
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      // Countdown animation
      const isFirstPhoto = capturedImages.length === 0;
      const interval = isFirstPhoto ? 1000 : 1000; // 1s for all photos
      
      const timer = setTimeout(() => {
        if (isFirstPhoto) {
          speakFeedback(countdown.toString()); // Voice countdown only for first
        }
        setCountdown(countdown - 1);
      }, interval);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Countdown reached 0 → capture photo
      captureImage();
      
      if (capturedImages.length === 0) {
        speakFeedback(`Foto pertama berhasil! Liveness verified. Mengambil ${MAX_IMAGES - 1} foto lagi dengan variasi pose...`);
        resetBlinkCount(); // Reset after first photo
        setLivenessPassedOnce(true); // Unlock subsequent auto-captures
        setConditionsMet({ // Reset cumulative conditions for next session
          faceDetected: false,
          notBlurry: false,
          notDark: false,
          neutralPose: false,
        });
      } else {
        // Announce next pose variation
        const nextPhotoIndex = capturedImages.length; // Current length = next photo index
        if (nextPhotoIndex < MAX_IMAGES) {
          speakFeedback(poseInstructions[nextPhotoIndex]);
        }
      }
      
      // Reset countdown after capture
      setCountdown(null);
    }
  }, [countdown, capturedImages.length]);

  // Stop auto capture when max reached
  useEffect(() => {
    if (capturedImages.length >= MAX_IMAGES && autoCapture) {
      setAutoCapture(false);
      toast.success('Auto capture selesai! Semua foto sudah diambil.');
    }
  }, [capturedImages.length, autoCapture]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setStream(mediaStream);
        streamRef.current = mediaStream; // 🌙 Save to ref for cleanup
        setCameraReady(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Gagal mengakses kamera. Pastikan izin kamera diaktifkan.');
    }
  };

  const stopCamera = () => {
    console.log('[FaceRegistration] stopCamera called');
    
    // 🌙 Use streamRef.current for reliable cleanup
    const currentStream = streamRef.current || stream;
    
    if (currentStream) {
      console.log('[FaceRegistration] Stopping media tracks:', currentStream.getTracks().length);
      currentStream.getTracks().forEach((track) => {
        console.log(`[FaceRegistration] Stopping track: ${track.kind}, enabled: ${track.enabled}`);
        track.stop();
      });
      setStream(null);
      streamRef.current = null; // 🌙 Clear ref
      setCameraReady(false);
    } else {
      console.log('[FaceRegistration] ⚠️ No stream to stop (both streamRef and state are null)');
    }
    
    // Also clear video srcObject
    if (videoRef.current) {
      console.log('[FaceRegistration] Clearing video srcObject');
      videoRef.current.srcObject = null;
      videoRef.current.pause();
      videoRef.current.load(); // Force reload to clear buffer
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || capturedImages.length >= MAX_IMAGES) {
      return;
    }

    // Manual capture: check basic liveness (lenient)
    if (!autoCapture) {
      if (!livenessResult.details.faceDetected) {
        toast.error('Wajah tidak terdeteksi');
        return;
      }
      if (livenessResult.details.isBlurry) {
        toast.error('Gambar buram, tahan kamera dengan stabil');
        return;
      }
      if (livenessResult.details.isDark) {
        toast.error('Cahaya terlalu gelap/terang, atur pencahayaan');
        return;
      }
    }

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Convert to base64 JPEG
      const imageData = canvas.toDataURL('image/jpeg', 1.0);
      setCapturedImages([...capturedImages, imageData]);

      if (autoCapture) {
        toast.success(`Auto: Foto ${capturedImages.length + 1} berhasil`, { duration: 1500 });
      } else {
        toast.success(`Foto ${capturedImages.length + 1} berhasil diambil`);
      }
    }

    setTimeout(() => setIsCapturing(false), 300);
  };

  const removeImage = (index: number) => {
    setCapturedImages(capturedImages.filter((_, i) => i !== index));
  };

  const registerMutation = useMutation({
    mutationFn: (images: string[]) => {
      const userIdNum = parseInt(userId || '0');
      return adminService.adminRegisterFace(userIdNum, images);
    },
    onSuccess: () => {
      toast.success('Wajah berhasil didaftarkan!');
      stopCamera();
      navigate(`/admin/students`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Gagal mendaftarkan wajah');
    },
  });

  const handleSubmit = () => {
    if (capturedImages.length < MIN_IMAGES) {
      toast.error(`Minimal ${MIN_IMAGES} foto diperlukan`);
      return;
    }

    registerMutation.mutate(capturedImages);
  };

  return (
    <div className="space-y-6">
      <ShellHeader
        title="Registrasi Wajah"
        description="Ambil 3-5 foto wajah dengan pose berbeda untuk akurasi maksimal"
        actions={
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              stopCamera();
              navigate('/admin/students');
            }}
            icon={<ArrowLeft size={18} />}
          >
            Kembali
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Camera Preview */}
        <Card>
          <CardContent>
            <div className="space-y-4">
              <div className="relative aspect-video bg-neutral-900 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Status Badge */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {cameraReady ? (
                    <Badge variant="success">
                      <Camera size={14} />
                      Kamera Aktif
                    </Badge>
                  ) : (
                    <Badge variant="warning">Menghubungkan...</Badge>
                  )}

                  {autoCapture && (
                    <Badge variant="info">
                      🤖 Auto Capture ON
                    </Badge>
                  )}
                </div>

                {/* 🌙 Real-time Liveness Status */}
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex flex-col gap-1 sm:gap-2 items-end">
                  {autoCapture && (() => {
                    // Calculate based on cumulative conditions
                    const metConditions = [
                      conditionsMet.faceDetected,
                      conditionsMet.notBlurry,
                      conditionsMet.notDark,
                      conditionsMet.neutralPose
                    ];
                    const passedCount = metConditions.filter(c => c).length;
                    
                    return (
                      <>
                        <Badge 
                          variant={passedCount >= 3 ? 'success' : passedCount >= 2 ? 'warning' : 'danger'}
                          className="text-xs sm:text-sm"
                        >
                          {passedCount}/4 Kondisi ✓
                        </Badge>
                        
                        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-white space-y-0.5 sm:space-y-1 max-w-[180px] sm:max-w-none">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${conditionsMet.faceDetected ? 'bg-green-400' : 'bg-red-400'}`} />
                            <span className="truncate">Wajah: {livenessResult.details.faceSize}</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${conditionsMet.notBlurry ? 'bg-green-400' : 'bg-red-400'}`} />
                            <span>Blur: {livenessResult.details.isBlurry ? 'Buram' : 'OK'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${conditionsMet.notDark ? 'bg-green-400' : 'bg-red-400'}`} />
                            <span>Cahaya: {livenessResult.details.isDark ? 'Gelap' : 'OK'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${conditionsMet.neutralPose ? 'bg-green-400' : 'bg-yellow-400'}`} />
                            <span>Gerak: {livenessResult.details.isNeutralPose ? 'OK' : 'Belum'}</span>
                          </div>
                          <div className="text-center text-[9px] sm:text-[10px] text-yellow-300 mt-1 pt-1 border-t border-white/20">
                            Min. 3 kondisi hijau (kumulatif)
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Capture Flash Effect */}
                {isCapturing && (
                  <div className="absolute inset-0 bg-white animate-pulse" />
                )}

                {/* 🌙 Countdown Animation (3, 2, 1) */}
                {countdown !== null && countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div 
                      className="text-white font-bold animate-bounce"
                      style={{
                        fontSize: '15rem',
                        textShadow: '0 0 40px rgba(139, 92, 246, 0.8), 0 0 80px rgba(139, 92, 246, 0.6)',
                        animation: 'pulse 0.8s ease-in-out',
                      }}
                    >
                      {countdown}
                    </div>
                  </div>
                )}

                {/* 🎭 Pose Instruction Overlay - shown after first photo */}
                {livenessPassedOnce && capturedImages.length < MAX_IMAGES && countdown === null && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-accent-600 text-white px-4 py-3 rounded-lg shadow-lg animate-bounce">
                    <div className="flex items-center gap-2">
                      <Camera size={20} />
                      <div>
                        <p className="text-sm font-semibold">Foto #{capturedImages.length + 1}</p>
                        <p className="text-xs">{poseInstructions[capturedImages.length]}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-80 border-2 border-accent-500 rounded-full opacity-30"></div>
                </div>
              </div>

              {/* 🌙 Manual Camera Control */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-4">
                {!cameraReady ? (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={startCamera}
                    icon={<Camera size={20} />}
                    className="w-full sm:w-auto"
                  >
                    Aktifkan Kamera
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="danger"
                      size="lg"
                      onClick={() => {
                        stopCamera();
                        setAutoCapture(false);
                        toast('Kamera dimatikan');
                      }}
                      icon={<X size={20} />}
                      className="w-full sm:w-auto"
                    >
                      Matikan Kamera
                    </Button>

                    <Button
                      variant={autoCapture ? 'danger' : 'secondary'}
                      size="lg"
                      onClick={() => {
                        setAutoCapture(!autoCapture);
                        if (!autoCapture) {
                          // Reset conditions when starting auto capture
                          setConditionsMet({
                            faceDetected: false,
                            notBlurry: false,
                            notDark: false,
                            neutralPose: false,
                          });
                          setLivenessPassedOnce(false);
                          toast.success('Auto capture diaktifkan! Foto akan diambil otomatis');
                        } else {
                          toast('Auto capture dinonaktifkan');
                        }
                      }}
                      disabled={capturedImages.length >= MAX_IMAGES}
                      className="w-full sm:w-auto"
                    >
                      {autoCapture ? '⏸️ Stop Auto' : '▶️ Auto Capture'}
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={captureImage}
                  disabled={!cameraReady || capturedImages.length >= MAX_IMAGES || autoCapture}
                  icon={<Camera size={20} />}
                  className="w-full sm:w-auto"
                >
                  Ambil Foto ({capturedImages.length}/{MAX_IMAGES})
                </Button>
              </div>

              {/* Instructions */}
              <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertCircle size={18} className="text-accent-600 dark:text-accent-400 flex-shrink-0 mt-0.5 sm:size-5" />
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm font-semibold text-accent-900 dark:text-accent-100">
                      🌙 Anti-Spoofing Protection + Variasi Pose
                    </p>
                    <ul className="text-[11px] sm:text-xs text-accent-700 dark:text-accent-300 space-y-1">
                      <li>• <strong>Foto 1:</strong> Hadap depan → 3/4 kondisi hijau → countdown 3 detik</li>
                      <li>• <strong>Foto 2:</strong> Senyum natural → countdown 3 detik</li>
                      <li>• <strong>Foto 3:</strong> Tengok kanan → countdown 3 detik</li>
                      <li>• <strong>Foto 4:</strong> Tengok kiri → countdown 3 detik</li>
                      <li>• <strong>Foto 5:</strong> Pose bebas → countdown 3 detik</li>
                      <li>• <strong>Jeda antar foto:</strong> 2 detik (untuk ganti pose)</li>
                      <li>• <strong>Total waktu:</strong> ~20-25 detik untuk 5 foto</li>
                      <li>• Instruksi pose muncul di layar (suara + teks)</li>
                    </ul>
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-accent-200 dark:border-accent-700">
                      <p className="text-[9px] sm:text-[10px] text-accent-600 dark:text-accent-400">
                        <strong>Smart Auto-Capture:</strong> Liveness check hanya di foto pertama. 
                        Foto 2-5 dengan variasi pose untuk akurasi lebih tinggi. Kamera auto-stop saat minimize/switch.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Captured Images */}
        <Card>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                  Foto yang Diambil
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {capturedImages.length === 0
                    ? 'Belum ada foto'
                    : `${capturedImages.length} foto siap untuk registrasi`}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-4">
                {capturedImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square bg-neutral-100 dark:bg-neutral-700 rounded-lg overflow-hidden group"
                  >
                    <img
                      src={image}
                      alt={`Captured ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                      <button
                        onClick={() => removeImage(index)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-danger-500 hover:bg-danger-600 rounded-full transition-all"
                      >
                        <X size={20} className="text-white" />
                      </button>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant="success" size="sm">
                        <Check size={14} />
                        {index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}

                {/* Empty Slots */}
                {[...Array(MAX_IMAGES - capturedImages.length)].map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="aspect-square bg-neutral-100 dark:bg-neutral-700 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center"
                  >
                    <Camera size={32} className="text-neutral-400" />
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="pt-4 space-y-3">
                {capturedImages.length < MIN_IMAGES && (
                  <p className="text-sm text-warning-600 dark:text-warning-400 text-center">
                    Minimal {MIN_IMAGES} foto diperlukan untuk registrasi
                  </p>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={capturedImages.length < MIN_IMAGES}
                  isLoading={registerMutation.isPending}
                  className="w-full"
                >
                  {registerMutation.isPending
                    ? 'Memproses...'
                    : `Daftarkan Wajah (${capturedImages.length} Foto)`}
                </Button>

                {capturedImages.length > 0 && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setCapturedImages([])}
                    className="w-full"
                  >
                    Hapus Semua Foto
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FaceRegistrationPage;
