/**
 * Voice Synthesis Helper for Indonesian Speech
 * 
 * Provides consistent voice feedback across all pages
 * with Indonesian language support.
 * 
 * @author Luna (AbsensiAgent)
 * @date 30 December 2025
 */

/**
 * Speak text in Indonesian voice
 * @param text - Text to speak
 * @param options - Optional configuration
 */
export function speak(
  text: string, 
  options?: { 
    rate?: number; 
    pitch?: number; 
    volume?: number;
    onEnd?: () => void;
  }
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }
  
  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice (Indonesian preferred)
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find Indonesian voice
      const indonesianVoice = voices.find(voice =>
        voice.lang.includes('id') || 
        voice.lang.includes('ID') ||
        voice.name.toLowerCase().includes('indonesian')
      );
      
      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
        console.log('🔊 Using Indonesian voice:', indonesianVoice.name);
      } else {
        console.log('⚠️ Indonesian voice not found, using default');
      }
      
      // Set language and options
      utterance.lang = 'id-ID';
      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;
      
      // Optional callback when speech ends
      if (options?.onEnd) {
        utterance.onend = options.onEnd;
      }
      
      window.speechSynthesis.speak(utterance);
    };
    
    // Check if voices are already loaded
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
    }
    
  } catch (error) {
    console.error('Voice synthesis error:', error);
  }
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if speech synthesis is supported
 */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Predefined Indonesian phrases for consistency
 */
export const VOICE_PHRASES = {
  // Liveness detection
  LIVENESS_START: 'Verifikasi keamanan dimulai',
  BLINK_INSTRUCTION: 'Kedipkan mata Anda dua kali',
  HEAD_MOVE_INSTRUCTION: 'Gerakkan kepala ke kiri atau ke kanan',
  BLINK_DETECTED: 'Kedipan terdeteksi',
  HEAD_MOVE_DETECTED: 'Gerakan kepala terdeteksi',
  LIVENESS_SUCCESS: 'Verifikasi berhasil',
  LIVENESS_TIMEOUT: 'Waktu habis. Silakan coba lagi.',
  
  // Face registration
  CAPTURE_START: 'Pengambilan foto akan dimulai',
  COUNTDOWN_3: 'tiga',
  COUNTDOWN_2: 'dua', 
  COUNTDOWN_1: 'satu',
  COUNTDOWN_GO: 'mulai',
  IMAGE_CAPTURED: 'Gambar telah diambil',
  REGISTRATION_SUCCESS: 'Registrasi wajah berhasil',
  REGISTRATION_FAILED: 'Registrasi gagal. Silakan coba lagi.',
  
  // Attendance
  SCANNING: 'Memindai wajah',
  RECOGNIZED: (name: string) => `Selamat datang, ${name}`,
  NOT_RECOGNIZED: 'Wajah tidak dikenali. Pastikan wajah Anda sudah terdaftar.',
  ATTENDANCE_SUCCESS: 'Absensi berhasil tercatat',
  ATTENDANCE_FAILED: 'Absensi gagal. Silakan coba lagi.',
  
  // Photo angles
  ANGLE_FRONT: 'Lihat langsung ke kamera',
  ANGLE_LEFT: 'Putar kepala sedikit ke kiri',
  ANGLE_RIGHT: 'Putar kepala sedikit ke kanan',
  ANGLE_UP: 'Angkat dagu sedikit',
  ANGLE_DOWN: 'Tundukkan kepala sedikit',
  
  // General
  PLEASE_WAIT: 'Mohon tunggu',
  TRY_AGAIN: 'Silakan coba lagi',
  ERROR: 'Terjadi kesalahan',
} as const;
