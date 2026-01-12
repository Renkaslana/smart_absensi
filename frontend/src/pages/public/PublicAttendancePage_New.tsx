import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Camera,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    Zap,
    Home,
    Loader,
    ChevronRight,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Badge } from '../../components/ui/Feedback';
import useMarkPublicAttendance from '../../hooks/usePublic';
import settingsService from '../../services/settingsService';
import { useRealLivenessDetection } from '../../hooks/useRealLivenessDetection';

type AttendanceStep = 'idle' | 'liveness' | 'capturing' | 'recognizing' | 'success' | 'failed';

interface AttendanceResult {
    name: string;
    nis: string;
    kelas: string;
    confidence: number;
    timestamp: string;
    mata_pelajaran: string;
    ruangan: string;
    isAlreadySubmitted: boolean;
}

// Helper function for TTS (Windows Speech Synthesis)
const speak = (text: string, rate: number = 1.0) => {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID'; // Indonesian
        utterance.rate = rate;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
    }
};

const PublicAttendancePage_New = () => {
    const [step, setStep] = useState<AttendanceStep>('idle');
    const [result, setResult] = useState<AttendanceResult | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [countdown, setCountdown] = useState<number | null>(null);
    const [livenessInstruction, setLivenessInstruction] = useState<string>('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const mutation = useMarkPublicAttendance();

    // Fetch liveness settings
    const { data: livenessSettings } = useQuery({
        queryKey: ['livenessDetectionSettings'],
        queryFn: settingsService.getLivenessDetectionSettings,
    });

    const livenessEnabled = livenessSettings?.enabled || false;

    // ✅ REAL liveness detection (not simulation)
    const liveness = useRealLivenessDetection(
        videoRef,
        livenessEnabled,
        {
            require_blink: livenessSettings?.require_blink ?? true,
            require_head_turn: livenessSettings?.require_head_turn ?? true,
            min_checks: livenessSettings?.min_checks ?? 2,
            timeout: livenessSettings?.timeout ?? 30
        }
    );


    // Update clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                console.log('🛑 Stopping camera (unmount)');
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [stream]);

    // Auto-stop camera when page hidden (user switches tab/app) - optional, commented out to avoid UX disruption
    // Uncomment if you want to auto-stop camera when user switches tabs
    /*
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && stream) {
                console.log('🛑 Stopping camera (page hidden)');
                stream.getTracks().forEach((track) => track.stop());
                setStream(null);
                setStep('idle');
                toast('Kamera dimatikan karena aplikasi tidak aktif', { icon: '⚠️' });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [stream]);
    */

    const startCamera = async () => {
        try {
            // ✅ Only request camera, DON'T attach yet
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
            });
            setStream(mediaStream); // This will trigger useEffect to attach
            return true;
        } catch (error) {
            toast.error('Gagal mengakses kamera');
            console.error('Camera error:', error);
            return false;
        }
    };

    // ✅ FIX: Attach stream + play IMMEDIATELY when stream available (no waiting for step)
    useEffect(() => {
        if (!stream || !videoRef.current) return;

        const video = videoRef.current;
        
        // IMMEDIATELY attach stream (don't wait for step change)
        if (video.srcObject !== stream) {
            console.log('🎥 Attaching stream to video element...');
            video.srcObject = stream;
            video.muted = true;
            video.playsInline = true;
        }

        const playVideo = async () => {
            try {
                await video.play();
                console.log('✅ Video playing:', video.videoWidth, 'x', video.videoHeight);
            } catch (err) {
                console.error('❌ Video play failed:', err);
            }
        };

        // Check readyState before playing
        if (video.readyState >= 2) {
            playVideo();
        } else {
            video.onloadeddata = playVideo;
        }

        return () => {
            video.onloadeddata = null;
        };
    }, [stream]); // Only depend on stream, NOT step!


    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const captureImage = (): string => {
        if (!videoRef.current) throw new Error('Video not ready');
        const video = videoRef.current;
        
        // ✅ Validate video has actual frames before capturing
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            throw new Error('Video has no frames yet. Width=' + video.videoWidth);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context error');
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        console.log('📷 Captured image:', canvas.width, 'x', canvas.height);
        return dataUrl;
    };

    const handleStart = async () => {
        // Set step FIRST so video element is rendered
        setStep('capturing');
        toast('🎥 Memulai kamera...', { icon: '📹' });
        
        const cameraOk = await startCamera();
        if (!cameraOk) {
            setStep('idle');
            return;
        }
        
        // Camera started, show instruction
        toast.success('Posisikan wajah Anda dalam frame oval', { icon: '📸' });
    };

    // Auto-proceed when liveness detection completes
    useEffect(() => {
        if (step === 'liveness' && liveness.progress.passedCount >= (livenessSettings?.min_checks || 2)) {
            liveness.stopDetection();
            toast.success('✅ Liveness berhasil! Mengenali wajah...');
            setStep('recognizing');
            handleRecognize();
        }
    }, [step, liveness.progress.passedCount, livenessSettings]);

    // Voice instructions for liveness detection with delays
    useEffect(() => {
        if (step !== 'liveness') return;

        let timeouts: NodeJS.Timeout[] = [];

        const runInstructions = async () => {
            // Give initial instruction with 1.5 second delay between instructions
            if (livenessSettings?.require_head_turn) {
                if (!liveness.progress.turnLeft) {
                    setLivenessInstruction('👈 Hadap kiri');
                    speak('Hadap kiri');
                    
                    // Wait 1.5 seconds, then give next instruction if needed
                    const timeout1 = setTimeout(() => {
                        if (!liveness.progress.turnRight && step === 'liveness') {
                            setLivenessInstruction('👉 Hadap kanan');
                            speak('Hadap kanan');
                        }
                    }, 1500);
                    timeouts.push(timeout1);
                } else if (!liveness.progress.turnRight) {
                    setLivenessInstruction('👉 Hadap kanan');
                    speak('Hadap kanan');
                }
            }

            if (livenessSettings?.require_blink && !liveness.progress.blink) {
                const timeout2 = setTimeout(() => {
                    if (!liveness.progress.blink && step === 'liveness') {
                        setLivenessInstruction('👁️ Berkedip');
                        speak('Berkedip');
                    }
                }, 3000);
                timeouts.push(timeout2);
            }
        };

        runInstructions();

        return () => {
            timeouts.forEach(t => clearTimeout(t));
        };
    }, [step, liveness.progress, livenessSettings]);

    // Countdown with TTS before capture
    useEffect(() => {
        if (countdown === null || countdown < 0) return;

        if (countdown > 0) {
            speak(countdown.toString(), 1.2); // Slightly faster for countdown
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Countdown reached 0, capture immediately
            setCountdown(null);
            const captureNow = async () => {
                const imageData = captureImage();
                if (!imageData) {
                    toast.error('Gagal mengambil gambar');
                    return;
                }

                setStep('recognizing');
                await handleRecognize();
            };
            captureNow();
        }
    }, [countdown]);

    // Manual capture trigger - runs REAL liveness check if enabled, then recognizes
    const handleCapture = async () => {
        if (livenessEnabled && !liveness.modelsLoaded) {
            toast.error('Model liveness detection belum siap. Silakan tunggu...');
            return;
        }

        if (livenessEnabled) {
            // Run REAL liveness detection
            setStep('liveness');
            toast('Ikuti instruksi liveness detection...', { icon: '👀' });
            liveness.startDetection();

            // Set timeout for detection failure
            setTimeout(() => {
                if (step === 'liveness' && liveness.progress.passedCount < (livenessSettings?.min_checks || 2)) {
                    liveness.stopDetection();
                    toast.error('Liveness detection timeout. Silakan coba lagi.');
                    handleReset();
                }
            }, (livenessSettings?.timeout || 30) * 1000);
        } else {
            // No liveness, directly recognize
            setStep('recognizing');
            handleRecognize();
        }
    };

    const handleRecognize = async () => {
        // Don't set step here, it's already set by caller
        try {
            const image = captureImage();
            const resp = await mutation.mutateAsync({ image });

            if (resp && resp.success) {
                const attendance = resp.attendance;
                const user = resp.student;
                const confidencePercent = (resp.confidence || 1.0) * 100;

                const successResult: AttendanceResult = {
                    name: user.name,
                    nis: user.nim || user.username || '',
                    kelas: user.kelas || '',
                    confidence: confidencePercent,
                    timestamp: attendance?.tanggal
                        ? `${attendance.tanggal} ${attendance.waktu}`
                        : new Date().toLocaleString('id-ID'),
                    mata_pelajaran: attendance?.mata_pelajaran || '—',
                    ruangan: attendance?.ruangan || '—',
                    isAlreadySubmitted: resp.already_submitted === true,
                };

                setResult(successResult);
                setStep('success');

                // Play audio/speech with improved fallback
                const message = successResult.isAlreadySubmitted
                    ? `${successResult.name}, Anda sudah melakukan absensi hari ini`
                    : `Absensi berhasil. Selamat datang ${successResult.name}`;

                try {
                    // Always try to play audio first
                    const audio = new Audio('/voice/AbsensiBerhasil.mp3');
                    audio.volume = 0.8;
                    
                    audio.play().then(() => {
                        console.log('🔊 Audio played successfully');
                    }).catch((err) => {
                        console.warn('⚠️ Audio playback failed, using speech synthesis:', err);
                        // Fallback to speech synthesis
                        if ('speechSynthesis' in window) {
                            const utterance = new SpeechSynthesisUtterance(message);
                            utterance.lang = 'id-ID';
                            utterance.rate = 0.95;
                            utterance.volume = 1.0;
                            window.speechSynthesis.speak(utterance);
                        }
                    });
                } catch (e) {
                    console.error('❌ Audio error:', e);
                    // Last resort: speech synthesis
                    if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(message);
                        utterance.lang = 'id-ID';
                        window.speechSynthesis.speak(utterance);
                    }
                }

                // Auto reset after 5s
                setTimeout(() => {
                    handleReset();
                }, 5000);
            } else {
                setStep('failed');
                toast.error(resp?.message || 'Wajah tidak dikenali');

                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(
                        resp?.message || 'Wajah tidak dikenali. Silakan coba lagi.'
                    );
                    utterance.lang = 'id-ID';
                    utterance.rate = 0.95;
                    window.speechSynthesis.speak(utterance);
                }

                setTimeout(() => handleReset(), 3000);
            }
        } catch (err: any) {
            console.error('Scan error:', err);
            console.error('Response data:', err?.response?.data);
            setStep('failed');
            const errorMessage = err?.response?.data?.detail || err?.message || 'Gagal melakukan scan';
            toast.error(errorMessage);
            setTimeout(() => handleReset(), 3000);
        }
    };

    const handleReset = () => {
        setStep('idle');
        setResult(null);
        liveness.resetDetection();
        stopCamera();
    };

    const formatTime = (date: Date) =>
        date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

    const formatDate = (date: Date) =>
        date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 flex flex-col">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-md border-b border-white/20 py-3 sm:py-4 px-3 sm:px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center">
                            <span className="text-xl sm:text-2xl">📚</span>
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-white">FahrenCenter</h1>
                            <p className="text-xs sm:text-sm text-white/80">Smart Attendance System</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6">
                        <div className="text-right">
                            <div className="flex items-center gap-1 sm:gap-2 text-white text-lg sm:text-2xl font-bold mb-1">
                                <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
                                <span className="hidden sm:inline">{formatTime(currentTime)}</span>
                                <span className="sm:hidden">{formatTime(currentTime).slice(0, 5)}</span>
                            </div>
                            <div className="text-white/80 text-xs sm:text-sm">{formatDate(currentTime)}</div>
                        </div>

                        <Link
                            to="/"
                            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm sm:text-base"
                        >
                            <Home className="w-4 h-4" />
                            <span className="hidden sm:inline">Beranda</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-3 sm:p-6">
                <div className="w-full max-w-5xl">
                    <AnimatePresence mode="wait">
                        {step === 'idle' && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center"
                            >
                                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-12 max-w-2xl mx-auto">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-teal-600 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
                                        <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                    </div>

                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Absensi Wajah</h2>
                                    <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                                        {livenessEnabled
                                            ? 'Sistem akan memverifikasi wajah Anda dengan deteksi kehidupan untuk keamanan'
                                            : 'Sistem akan melakukan pengenalan wajah untuk absensi Anda'}
                                    </p>

                                    {livenessEnabled && (
                                        <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                                            <div className="flex items-center justify-center gap-2 text-purple-700 font-semibold mb-2">
                                                <Eye className="w-5 h-5" />
                                                Liveness Detection Aktif
                                            </div>
                                            <p className="text-sm text-purple-600">
                                                Anda akan diminta untuk berkedip dan menggerakkan kepala
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleStart}
                                        className="px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
                                    >
                                        <Zap className="w-5 h-5" />
                                        Mulai Absensi
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {(step === 'liveness' || step === 'capturing' || step === 'recognizing') && (
                            <motion.div
                                key="scanning"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 max-w-4xl mx-auto"
                            >
                                {/* Video Feed */}
                                <div className="relative mb-4 sm:mb-6">
                                    {/* ✅ FIX BUG #3: Remove bg-gray-900, let video show through */}
                                    <div className="aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-inner relative bg-black">
                                        <video
                                            ref={videoRef}
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />


                                        {/* Face Oval Guide for capturing step */}
                                        {step === 'capturing' && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="relative">
                                                    {/* Oval Guide - responsive sizing */}
                                                    <div
                                                        className="w-48 h-64 sm:w-64 sm:h-80 md:w-72 md:h-96 border-4 border-emerald-400 rounded-full shadow-2xl"
                                                        style={{
                                                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(16, 185, 129, 0.3)',
                                                        }}
                                                    />
                                                    {/* Instruction text */}
                                                    <div className="absolute -bottom-12 sm:-bottom-16 left-1/2 transform -translate-x-1/2 text-center bg-black/60 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg">
                                                        <p className="text-white font-semibold text-xs sm:text-sm whitespace-nowrap">
                                                            Posisikan wajah dalam oval
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Liveness Overlay */}
                                        {step === 'liveness' && (
                                            <div className="absolute top-4 left-4 right-4">
                                                <div className="bg-black/60 backdrop-blur-md rounded-xl p-4">
                                                    {livenessInstruction && (
                                                        <div className="mb-3 p-3 bg-teal-500/30 border border-teal-400 rounded-lg text-center">
                                                            <span className="text-white text-lg font-bold">{livenessInstruction}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-white font-semibold">🔍 Real Liveness Detection</span>
                                                        <Badge variant="info">{liveness.progress.passedCount} / {livenessSettings?.min_checks || 2}</Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">{livenessSettings?.require_blink && (
                                                            <div
                                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${liveness.progress.blink
                                                                    ? 'bg-emerald-500/20 border border-emerald-400'
                                                                    : 'bg-white/10 border border-white/20'
                                                                    }`}
                                                            >
                                                                <div
                                                                    className={`w-3 h-3 rounded-full ${liveness.progress.blink ? 'bg-emerald-400' : 'bg-gray-400'
                                                                        }`}
                                                                />
                                                                <span className="text-white text-sm">👁️ Berkedip</span>
                                                            </div>
                                                        )}
                                                        {livenessSettings?.require_head_turn && (
                                                            <>
                                                                <div
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${liveness.progress.turnLeft
                                                                        ? 'bg-emerald-500/20 border border-emerald-400'
                                                                        : 'bg-white/10 border border-white/20'
                                                                        }`}
                                                                >
                                                                    <div
                                                                        className={`w-3 h-3 rounded-full ${liveness.progress.turnLeft ? 'bg-emerald-400' : 'bg-gray-400'
                                                                            }`}
                                                                    />
                                                                    <span className="text-white text-sm">⬅️ Kiri</span>
                                                                </div>
                                                                <div
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${liveness.progress.turnRight
                                                                        ? 'bg-emerald-500/20 border border-emerald-400'
                                                                        : 'bg-white/10 border border-white/20'
                                                                        }`}
                                                                >
                                                                    <div
                                                                        className={`w-3 h-3 rounded-full ${liveness.progress.turnRight ? 'bg-emerald-400' : 'bg-gray-400'
                                                                            }`}
                                                                    />
                                                                    <span className="text-white text-sm">➡️ Kanan</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Recognizing Overlay */}
                                        {step === 'recognizing' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                                                <div className="text-center">
                                                    <Loader className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
                                                    <p className="text-white text-xl font-semibold">Mengenali wajah...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Instructions & Capture Button */}
                                <div className="text-center">
                                    {step === 'capturing' && (
                                        <>
                                            <p className="text-gray-700 text-base sm:text-lg font-medium mb-3 sm:mb-4 px-4">
                                                Posisikan wajah Anda dalam frame oval
                                            </p>
                                            <button
                                                onClick={() => {
                                                    speak('Bersiap');
                                                    setCountdown(3); // Start 3, 2, 1 countdown
                                                }}
                                                disabled={countdown !== null}
                                                className="px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg hover:from-emerald-600 hover:to-emerald-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {countdown !== null ? `${countdown}...` : '📸 Ambil Foto Sekarang'}
                                            </button>
                                        </>
                                    )}
                                    {step === 'liveness' && (
                                        <p className="text-gray-700 text-base sm:text-lg font-medium px-4">
                                            Mohon tunggu, melakukan liveness detection...
                                        </p>
                                    )}
                                    {step === 'recognizing' && (
                                        <p className="text-gray-700 text-base sm:text-lg font-medium px-4">
                                            Mohon tunggu, memproses data wajah Anda...
                                        </p>
                                    )}
                                </div>

                                {/* Cancel Button */}
                                <button
                                    onClick={handleReset}
                                    className="mt-4 sm:mt-6 mx-auto block px-4 py-2 sm:px-6 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                            </motion.div>
                        )}

                        {step === 'success' && result && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-12 max-w-2xl mx-auto"
                            >
                                <div className="text-center">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
                                        <CheckCircle className="w-10 h-10 text-white" />
                                    </div>

                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                        {result.isAlreadySubmitted ? 'Sudah Absen' : 'Absensi Berhasil!'}
                                    </h2>
                                    <p className="text-gray-600 mb-8">
                                        {result.isAlreadySubmitted
                                            ? `Selamat datang kembali, ${result.name}!`
                                            : `Selamat datang, ${result.name}!`}
                                    </p>

                                    <div className="space-y-4 text-left mb-8">
                                        <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                                            <span className="text-gray-600">Nama</span>
                                            <span className="font-semibold text-gray-900">{result.name}</span>
                                        </div>
                                        <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                                            <span className="text-gray-600">NIS</span>
                                            <span className="font-semibold text-gray-900">{result.nis}</span>
                                        </div>
                                        <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                                            <span className="text-gray-600">Kelas</span>
                                            <span className="font-semibold text-gray-900">{result.kelas}</span>
                                        </div>
                                        <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                                            <span className="text-gray-600">Confidence</span>
                                            <Badge variant="success">{result.confidence.toFixed(1)}%</Badge>
                                        </div>
                                        <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                                            <span className="text-gray-600">Waktu</span>
                                            <span className="font-semibold text-gray-900">{result.timestamp}</span>
                                        </div>
                                    </div>

                                    {result.isAlreadySubmitted && (
                                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                            <div className="flex items-center justify-center gap-2 text-amber-700">
                                                <AlertCircle className="w-5 h-5" />
                                                <span className="font-medium">Anda sudah melakukan absensi hari ini</span>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-sm text-gray-500">Terima kasih! Halaman akan direset otomatis...</p>
                                </div>
                            </motion.div>
                        )}

                        {step === 'failed' && (
                            <motion.div
                                key="failed"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl mx-auto"
                            >
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                                        <XCircle className="w-10 h-10 text-white" />
                                    </div>

                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Gagal Mengenali Wajah</h2>
                                    <p className="text-gray-600 mb-8">
                                        Wajah tidak dikenali. Silakan coba lagi atau hubungi administrator.
                                    </p>

                                    <button
                                        onClick={handleReset}
                                        className="px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all mx-auto"
                                    >
                                        Coba Lagi
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 py-4 px-6">
                <div className="max-w-7xl mx-auto text-center text-white/80 text-sm">
                    &copy; {new Date().getFullYear()} FahrenCenter. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default PublicAttendancePage_New;
