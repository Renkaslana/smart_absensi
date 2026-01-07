'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, CheckCircle, XCircle, Loader2, Clock, AlertCircle } from 'lucide-react';
import { faceAPI, absensiAPI } from '@/lib/api';

export default function AdminFaceCheckPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const autoScanRef = useRef<number | null>(null);
  const [result, setResult] = useState<null | {
    name: string;
    nim?: string;
    confidence?: number;
    message?: string;
    recognized?: boolean;
    userId?: number;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const [attendanceResult, setAttendanceResult] = useState<null | {
    success: boolean;
    alreadySubmitted?: boolean;
    message?: string;
    timestamp?: string;
  }>(null);
  const [todayHistory, setTodayHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    startCamera();
    loadTodayHistory(); // Load history saat pertama kali

    return () => {
      stopCamera();
      if (autoScanRef.current) {
        window.clearInterval(autoScanRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    setVideoReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // add event listeners to detect when video is actually playing
        const onLoaded = () => {
          setStreamActive(true);
          setVideoReady(true);
          setError(null);
        };

        const onPlay = () => {
          setStreamActive(true);
          setVideoReady(true);
          setError(null);
        };

        videoRef.current.addEventListener('loadedmetadata', onLoaded);
        videoRef.current.addEventListener('playing', onPlay);

        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play deferred', playErr);
        }
      }
    } catch (err: any) {
      console.error('Camera error', err);
      if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setError('Izin kamera ditolak. Izinkan akses kamera pada browser dan muat ulang halaman.');
      } else if (err && (err.name === 'NotFoundError' || err.name === 'OverconstrainedError')) {
        setError('Perangkat kamera tidak ditemukan. Periksa sambungan kamera Anda.');
      } else {
        setError('Gagal mengakses kamera. Periksa pengaturan privasi browser.');
      }
      setStreamActive(false);
      setVideoReady(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    setStreamActive(false);
    setVideoReady(false);
  };

  const captureAndScan = async () => {
    setError(null);
    setResult(null);
    if (!videoRef.current) return;
    setScanning(true);
    try {
      const video = videoRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      if (width === 0 || height === 0) {
        setError('Kamera belum siap. Tunggu beberapa saat lalu coba lagi.');
        setScanning(false);
        return;
      }
      const canvas = canvasRef.current!;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      // Call API to scan face
      const res = await faceAPI.scan(base64);
      // expected: { data: { name, nim, confidence, status, recognized, user_id } }
      const payload = res.data;
      if (payload?.recognized && payload?.name) {
        setResult({ 
          name: payload.name, 
          nim: payload.nim, 
          confidence: payload.confidence,
          recognized: true,
          userId: payload.user_id
        });
        
        // Auto submit if recognized
        setTimeout(() => {
          submitAttendance();
        }, 500);
      } else if (payload?.name) {
        setResult({ name: payload.name, nim: payload.nim, confidence: payload.confidence, recognized: false });
      } else if (payload?.detail) {
        setResult({ name: 'Tidak Dikenal', message: payload.detail, recognized: false });
      } else {
        setResult({ name: 'Tidak Dikenal', message: 'Tidak ada kecocokan.', recognized: false });
      }
    } catch (err: any) {
      console.error('Scan error', err);
      setError(err.response?.data?.detail || 'Terjadi kesalahan saat memproses gambar.');
    } finally {
      setScanning(false);
    }
  };

  const toggleAutoScan = () => {
    if (autoScan) {
      setAutoScan(false);
      if (autoScanRef.current) {
        window.clearInterval(autoScanRef.current);
        autoScanRef.current = null;
      }
    } else {
      setAutoScan(true);
      // start interval
      autoScanRef.current = window.setInterval(() => {
        if (!scanning && videoReady) {
          captureAndScan();
        }
      }, 3000);
    }
  };

  const loadTodayHistory = async () => {
    setLoadingHistory(true);
    try {
      // Get today's date
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = startDate;

      // Fetch attendance history for today
      const response = await absensiAPI.getHistory({
        page: 1,
        page_size: 100,
        start_date: startDate,
        end_date: endDate
      });

      if (response.data?.items) {
        setTodayHistory(response.data.items);
      }
    } catch (err) {
      console.error('Failed to load today history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const submitAttendance = async () => {
    if (!result?.recognized || !videoRef.current) return;

    setSubmitting(true);
    setAttendanceResult(null);
    setError(null);

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      const canvas = canvasRef.current!;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      // Submit attendance using regular endpoint (akan menggunakan recognized user dari scan)
      const response = await absensiAPI.adminSubmit({
        image_base64: base64
      });

      const data = response.data;
      
      // Check if already submitted
      if (data.already_submitted) {
        const timestamp = new Date(data.timestamp);
        const waktu = timestamp.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
        
        setAttendanceResult({
          success: true,
          alreadySubmitted: true,
          message: `${result.name} (${result.nim}) sudah absen pada pukul ${waktu}`,
          timestamp: data.timestamp
        });
      } else {
        const timestamp = new Date(data.timestamp);
        const waktu = timestamp.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
        
        // Show success notification
        setSuccessNotification(`Absensi berhasil! Selamat datang, ${result.name}`);
        setTimeout(() => setSuccessNotification(null), 5000); // Hide after 5 seconds
        
        setAttendanceResult({
          success: true,
          alreadySubmitted: false,
          message: `Absensi berhasil dicatat pada pukul ${waktu}`,
          timestamp: data.timestamp
        });
      }

      // Reload history
      await loadTodayHistory();

      // Auto reset after 3 seconds for queue system
      setTimeout(() => {
        setResult(null);
        setAttendanceResult(null);
      }, 3000);

    } catch (err: any) {
      console.error('Attendance submission error:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Gagal mencatat absensi';
      setError(errorMsg);
      setAttendanceResult({
        success: false,
        message: errorMsg
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pengecekan Wajah — Absensi</h1>
          <p className="text-gray-500 mt-1">Arahkan kamera ke wajah mahasiswa, lalu tekan "Scan"</p>
        </div>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">Kembali ke Dashboard</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="relative overflow-hidden rounded-md bg-black h-[420px] flex items-center justify-center">
            {/* auto-scan toggle */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={toggleAutoScan}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${autoScan ? 'bg-green-50 text-green-700' : 'bg-white/10 text-white/80'}`}
              >
                {autoScan ? 'Auto: On' : 'Auto: Off'}
              </button>
            </div>

            {!streamActive && (
              <div className="text-center text-gray-400">
                <p className="mb-2">Kamera belum aktif</p>
                <button onClick={startCamera} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md">Buka Kamera</button>
              </div>
            )}

            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Success Notification Overlay */}
            {successNotification && (
              <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white px-6 py-4 text-center font-medium animate-fade-in">
                {successNotification}
              </div>
            )}
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <button
                onClick={captureAndScan}
                disabled={!streamActive || scanning}
                className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:brightness-105 disabled:opacity-60"
              >
                {scanning ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Camera className="w-5 h-5 mr-2" />}
                {scanning ? 'Memindai...' : 'Scan'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-100 text-red-700 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* helper state info */}
          <div className="mt-3 text-sm text-gray-500">
            {videoReady ? (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400" /> Kamera siap
              </div>
            ) : streamActive ? (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" /> Menunggu video
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-400" /> Kamera tidak aktif
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Hasil Scan</h2>

          {!result && (
            <div className="text-center text-gray-500">
              <p className="mb-2">Belum ada hasil</p>
              <p className="text-sm">Tekan tombol Scan untuk memulai pengecekan</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xl">
                  {result.name.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-lg">{result.name}</p>
                  {result.nim && <p className="text-sm text-gray-500">{result.nim}</p>}
                </div>
              </div>

              {typeof result.confidence === 'number' && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Confidence</div>
                  <div className="font-medium">{(result.confidence * 100).toFixed(1)}%</div>
                </div>
              )}

              {result.message && (
                <div className="text-sm text-gray-500">{result.message}</div>
              )}

              {/* Attendance Result */}
              {submitting && (
                <div className="flex items-center justify-center py-3 bg-blue-50 rounded-md">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" />
                  <span className="text-blue-700 text-sm">Mencatat absensi...</span>
                </div>
              )}

              {attendanceResult && (
                <div>
                  {attendanceResult.success && attendanceResult.alreadySubmitted ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-900 text-sm">Sudah Absen</p>
                          <p className="text-amber-700 text-xs mt-1">{attendanceResult.message}</p>
                        </div>
                      </div>
                    </div>
                  ) : attendanceResult.success ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900 text-sm">Absensi Berhasil</p>
                          <p className="text-green-700 text-xs mt-1">{attendanceResult.message}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex items-start space-x-2">
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-900 text-sm">Gagal</p>
                          <p className="text-red-700 text-xs mt-1">{attendanceResult.message}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <button onClick={captureAndScan} disabled={scanning || submitting} className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-60">Scan Lagi</button>
                <button onClick={() => { setResult(null); setAttendanceResult(null); }} className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md">Reset</button>
              </div>

              {result.recognized && (
                <div className="pt-2">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Teridentifikasi
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Riwayat Absensi Hari Ini */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Riwayat Absensi Hari Ini</h2>
          </div>
          <button 
            onClick={loadTodayHistory}
            disabled={loadingHistory}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            {loadingHistory ? 'Memuat...' : 'Refresh'}
          </button>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : todayHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Belum ada absensi hari ini</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {todayHistory.map((item, index) => {
              const timestamp = new Date(item.timestamp);
              const waktu = timestamp.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              });
              
              return (
                <div 
                  key={item.id || index} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                      {item.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.nim}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{waktu}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
