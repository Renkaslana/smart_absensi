import React, { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import useMarkAttendance from '../../hooks/useStudent';

const AbsensiPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const mutation = useMarkAttendance();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      
      setStream(mediaStream);
      
      // Wait a bit then attach to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
      
      toast.success('Kamera aktif');
    } catch (e) {
      toast.error('Gagal mengakses kamera');
      console.error('Camera error:', e);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const handleSelfCheckin = async () => {
    setLoading(true);
    try {
      if (!stream) await startCamera();
      if (!videoRef.current) throw new Error('Video not ready');

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Unable to capture');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      const resp = await mutation.mutateAsync({ kelas_id: 0, method: 'face_recognition', image: dataUrl });

      if (resp && resp.success) {
        // Play success audio
        try {
          const audio = new Audio('/voice/AbsensiBerhasil.mp3');
          audio.play().catch(() => {});
        } catch {}

        toast.success(resp.message || 'Absensi berhasil');
      } else {
        toast.error(resp?.message || 'Absensi gagal');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat absensi');
    } finally {
      setLoading(false);
      stopCamera();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Absensi Mandiri</h1>
        <p className="text-gray-600 mt-1">Lakukan absensi menggunakan pengenalan wajah</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-6">
          <div className="relative w-full max-w-2xl mx-auto aspect-video bg-gray-900 rounded-xl overflow-hidden">
            {stream ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-white text-lg font-medium">Kamera belum aktif</p>
                <p className="text-white/60 text-sm mt-1">Klik "Aktifkan Kamera" untuk memulai</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          {!stream ? (
            <button 
              onClick={startCamera} 
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors"
            >
              Aktifkan Kamera
            </button>
          ) : (
            <>
              <button 
                onClick={handleSelfCheckin} 
                className="px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  '📸 Absensi Sekarang'
                )}
              </button>
              <button 
                onClick={stopCamera} 
                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl shadow-md transition-colors"
              >
                Matikan Kamera
              </button>
            </>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tips Absensi:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Pastikan wajah Anda terlihat jelas tanpa halangan</li>
            <li>• Pencahayaan cukup terang</li>
            <li>• Lepaskan masker, kacamata hitam, atau topi</li>
            <li>• Posisikan wajah di tengah kamera</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AbsensiPage;
