import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Camera, ScanFace, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

import { faceService } from '../../services/faceService';
import { ShellHeader } from '../../components/layouts/Shell';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Feedback';

const AttendanceTestPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

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
      toast.error('Gagal mengakses kamera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraReady(false);
    }
  };

  const scanMutation = useMutation({
    mutationFn: (imageData: string) => faceService.scanFace(imageData),
    onSuccess: (data) => {
      setScanResult(data);
      setIsScanning(false);

      if (data.recognized) {
        toast.success(`Wajah dikenali: ${data.name}`);
      } else {
        toast.error('Wajah tidak dikenali');
      }
    },
    onError: (error: any) => {
      setIsScanning(false);
      toast.error(error.response?.data?.detail || 'Gagal mengenali wajah');
    },
  });

  const handleScan = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    setScanResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/jpeg', 1.0);
      scanMutation.mutate(imageData);
    }
  };

  return (
    <div className="space-y-6">
      <ShellHeader
        title="Test Face Recognition"
        description="Uji sistem pengenalan wajah untuk memastikan akurasi"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Preview - 2 columns */}
        <div className="lg:col-span-2">
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
                  <div className="absolute top-4 left-4">
                    {cameraReady ? (
                      <Badge variant="success">
                        <Camera size={14} />
                        Kamera Aktif
                      </Badge>
                    ) : (
                      <Badge variant="warning">Menghubungkan...</Badge>
                    )}
                  </div>

                  {/* Scanning Indicator */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-center text-white">
                        <ScanFace size={48} className="animate-pulse mx-auto mb-2" />
                        <p className="text-sm font-medium">Mengenali wajah...</p>
                      </div>
                    </div>
                  )}

                  {/* Face Guide Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-72 h-96 border-4 border-accent-500 rounded-3xl opacity-30"></div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleScan}
                    disabled={!cameraReady || isScanning}
                    isLoading={isScanning}
                    icon={<ScanFace size={20} />}
                  >
                    {isScanning ? 'Mengenali Wajah...' : 'Scan Wajah'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel - 1 column */}
        <div className="space-y-6">
          {/* Scan Result */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Hasil Pengenalan
              </h3>
            </CardHeader>
            <CardContent>
              {!scanResult ? (
                <div className="text-center py-8">
                  <ScanFace size={48} className="text-neutral-400 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Klik "Scan Wajah" untuk memulai
                  </p>
                </div>
              ) : scanResult.recognized ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/20 flex items-center justify-center">
                      <CheckCircle size={32} className="text-success-600 dark:text-success-400" />
                    </div>
                  </div>

                  <div className="text-center">
                    <Badge variant="success" size="md" className="mb-3">
                      Wajah Dikenali
                    </Badge>
                    <h4 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">
                      {scanResult.name}
                    </h4>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      NIM: {scanResult.nim}
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">Kelas:</span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-50">
                        {scanResult.kelas || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">Confidence:</span>
                      <Badge
                        variant={
                          scanResult.confidence >= 0.9
                            ? 'success'
                            : scanResult.confidence >= 0.8
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {(scanResult.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">User ID:</span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-50">
                        #{scanResult.user_id}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-900/20 flex items-center justify-center">
                      <XCircle size={32} className="text-danger-600 dark:text-danger-400" />
                    </div>
                  </div>

                  <div className="text-center">
                    <Badge variant="danger" size="md" className="mb-3">
                      Wajah Tidak Dikenali
                    </Badge>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {scanResult.message || 'Wajah tidak terdaftar dalam sistem'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Panduan Test
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-accent-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      Untuk hasil terbaik:
                    </p>
                    <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                      <li>• Pastikan pencahayaan cukup</li>
                      <li>• Wajah menghadap kamera</li>
                      <li>• Jarak 30-50 cm dari kamera</li>
                      <li>• Tidak menggunakan masker</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    <strong>Note:</strong> Confidence di atas 80% dianggap valid untuk
                    absensi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTestPage;
