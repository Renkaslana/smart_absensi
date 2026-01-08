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

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [autoCapture, setAutoCapture] = useState(false);

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
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Auto capture effect with REAL liveness detection 🌙
  useEffect(() => {
    if (!autoCapture || !cameraReady || capturedImages.length >= MAX_IMAGES) {
      return;
    }

    // Only capture when ALL liveness checks pass
    if (livenessResult.canCapture && livenessResult.status === 'pass') {
      const timer = setTimeout(() => {
        captureImage();
        speakFeedback(`Foto ${capturedImages.length + 1} berhasil diambil`);
        
        // Reset blink count after successful capture
        resetBlinkCount();
      }, 1000); // 1 second delay after passing all checks

      return () => clearTimeout(timer);
    }
  }, [autoCapture, cameraReady, capturedImages.length, livenessResult]);

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
        setCameraReady(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Gagal mengakses kamera. Pastikan izin kamera diaktifkan.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraReady(false);
    }
    // Also clear video srcObject
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                  <Badge 
                    variant={
                      livenessResult.status === 'pass' 
                        ? 'success' 
                        : livenessResult.status === 'fail' 
                        ? 'danger' 
                        : 'warning'
                    }
                  >
                    {livenessResult.message}
                  </Badge>
                  
                  {autoCapture && (
                    <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${livenessResult.details.faceDetected ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span>Wajah: {livenessResult.details.faceSize}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${!livenessResult.details.isBlurry ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span>Blur: {livenessResult.details.isBlurry ? 'Buram' : 'OK'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${livenessResult.details.blinkCount > 0 ? 'bg-green-400' : 'bg-yellow-400'}`} />
                        <span>Kedip: {livenessResult.details.blinkCount}x</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${livenessResult.details.isNeutralPose ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span>Pose: {livenessResult.details.isNeutralPose ? 'Frontal' : 'Miring'}</span>
                      </div>
                      <div className="w-full bg-neutral-700 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-accent-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${livenessResult.progress}%` }}
                        />
                      </div>
                      <div className="text-center text-[10px] text-neutral-300">
                        {livenessResult.progress}% Complete
                      </div>
                    </div>
                  )}
                </div>

                {/* Capture Flash Effect */}
                {isCapturing && (
                  <div className="absolute inset-0 bg-white animate-pulse" />
                )}

                {/* Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-80 border-2 border-accent-500 rounded-full opacity-30"></div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={autoCapture ? 'danger' : 'secondary'}
                  size="lg"
                  onClick={() => {
                    setAutoCapture(!autoCapture);
                    if (!autoCapture) {
                      toast.success('Auto capture diaktifkan! Foto akan diambil otomatis');
                    } else {
                      toast('Auto capture dinonaktifkan');
                    }
                  }}
                  disabled={!cameraReady || capturedImages.length >= MAX_IMAGES}
                >
                  {autoCapture ? '⏸️ Stop Auto' : '▶️ Auto Capture'}
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={captureImage}
                  disabled={!cameraReady || capturedImages.length >= MAX_IMAGES || autoCapture}
                  icon={<Camera size={20} />}
                >
                  Ambil Foto ({capturedImages.length}/{MAX_IMAGES})
                </Button>
              </div>

              {/* Instructions */}
              <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-accent-600 dark:text-accent-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-accent-900 dark:text-accent-100">
                      🌙 Anti-Spoofing Protection Aktif
                    </p>
                    <ul className="text-xs text-accent-700 dark:text-accent-300 space-y-1">
                      <li>• Pastikan pencahayaan cukup terang (tidak gelap/overexposed)</li>
                      <li>• Wajah menghadap kamera langsung (frontal, tidak miring)</li>
                      <li>• Kedipkan mata saat auto capture aktif</li>
                      <li>• Gunakan wajah asli (bukan foto atau layar)</li>
                      <li>• Tahan kamera dengan stabil (hindari blur)</li>
                      <li>• Minimal 3 foto, maksimal 5 foto</li>
                    </ul>
                    <div className="mt-3 pt-3 border-t border-accent-200 dark:border-accent-700">
                      <p className="text-[10px] text-accent-600 dark:text-accent-400">
                        Sistem menggunakan HOG face detection, blur detection (Laplacian), 
                        blink detection (EAR), head pose estimation, dan texture analysis (LBP) 
                        untuk memastikan hanya wajah asli yang dapat didaftarkan.
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

              <div className="grid grid-cols-2 gap-4">
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
