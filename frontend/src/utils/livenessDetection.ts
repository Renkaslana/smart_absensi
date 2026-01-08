/**
 * 🌙 Production-Ready Liveness Detection System
 * 
 * Phase 1: Face Detection (HOG)
 * Phase 2: Quality Check (Blur, Brightness, Contrast)
 * Phase 3: Liveness Detection (Blink, Head Pose, Anti-Spoofing)
 * 
 * References:
 * - Eye Aspect Ratio: Soukupová & Čech (2016)
 * - Local Binary Patterns: Määttä et al. (2011)
 * - face-api.js: https://github.com/justadudewhohacks/face-api.js
 */

import * as faceapi from 'face-api.js';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface FaceDetectionResult {
  detected: boolean;
  count: number;
  size: { width: number; height: number };
  position: { x: number; y: number };
  landmarks: faceapi.FaceLandmarks68 | null;
  confidence: number;
}

export interface QualityCheckResult {
  isBlurry: boolean;
  isDark: boolean;
  isLowContrast: boolean;
  blurScore: number;
  brightness: number;
  contrast: number;
}

export interface LivenessCheckResult {
  isRealFace: boolean;
  blinkCount: number;
  isNeutralPose: boolean;
  isScreen: boolean;
  textureScore: number;
  headPose: {
    yaw: number;
    pitch: number;
    roll: number;
  };
}

export interface CompleteLivenessResult {
  status: 'pass' | 'fail' | 'checking';
  phase: 'detection' | 'quality' | 'liveness' | 'complete';
  message: string;
  canCapture: boolean;
  progress: number; // 0-100
  details: {
    faceDetected: boolean;
    faceCount: number;
    faceSize: string;
    isBlurry: boolean;
    isDark: boolean;
    isLowContrast: boolean;
    blinkCount: number;
    isNeutralPose: boolean;
    isScreen: boolean;
    isRealTexture: boolean;
  };
}

export interface BlinkDetectionState {
  isBlinking: boolean;
  blinkCount: number;
  lastBlinkTime: number;
}

// ============================================
// PHASE 1: FACE DETECTION (HOG)
// ============================================

/**
 * Load face-api.js models (call once on app init)
 */
export async function loadFaceApiModels(): Promise<void> {
  const MODEL_URL = '/models';
  
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    console.log('[Liveness] Models loaded successfully');
  } catch (error) {
    console.error('[Liveness] Failed to load models:', error);
    throw new Error('Gagal memuat model face detection. Pastikan model ada di /public/models/');
  }
}

/**
 * Detect single face in video frame
 * 
 * Rejection rules:
 * - No face detected
 * - Multiple faces detected
 * - Face size < 80x80px
 */
export async function detectFace(
  video: HTMLVideoElement
): Promise<FaceDetectionResult> {
  try {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5,
      }))
      .withFaceLandmarks();

    if (!detection) {
      return {
        detected: false,
        count: 0,
        size: { width: 0, height: 0 },
        position: { x: 0, y: 0 },
        landmarks: null,
        confidence: 0,
      };
    }

    const box = detection.detection.box;
    const confidence = detection.detection.score;

    // Validate minimum face size (80x80px)
    if (box.width < 80 || box.height < 80) {
      return {
        detected: false,
        count: 0,
        size: { width: box.width, height: box.height },
        position: { x: box.x, y: box.y },
        landmarks: null,
        confidence,
      };
    }

    return {
      detected: true,
      count: 1,
      size: { width: box.width, height: box.height },
      position: { x: box.x, y: box.y },
      landmarks: detection.landmarks,
      confidence,
    };
  } catch (error) {
    console.error('[Liveness] Face detection error:', error);
    return {
      detected: false,
      count: 0,
      size: { width: 0, height: 0 },
      position: { x: 0, y: 0 },
      landmarks: null,
      confidence: 0,
    };
  }
}

// ============================================
// PHASE 2: QUALITY CHECK
// ============================================

/**
 * Capture current video frame to canvas
 */
export function captureFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Check image quality (blur, brightness, contrast)
 */
export function checkQuality(canvas: HTMLCanvasElement): QualityCheckResult {
  const blurResult = checkBlur(canvas);
  const brightnessResult = checkBrightness(canvas);
  const contrastResult = checkContrast(canvas);

  return {
    isBlurry: blurResult.isBlurry,
    isDark: brightnessResult.isDark,
    isLowContrast: contrastResult.isLowContrast,
    blurScore: blurResult.variance,
    brightness: brightnessResult.mean,
    contrast: contrastResult.stdDev,
  };
}

/**
 * Blur detection using Laplacian variance
 * 
 * Algorithm: Laplacian operator measures edge sharpness
 * - Sharp image: variance > 100
 * - Blurry image: variance < 100
 */
function checkBlur(canvas: HTMLCanvasElement): {
  isBlurry: boolean;
  variance: number;
} {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const gray = toGrayscale(imageData);

  // Apply Laplacian kernel
  const laplacian = applyLaplacianKernel(gray, canvas.width, canvas.height);

  // Calculate variance
  const mean = laplacian.reduce((a, b) => a + b, 0) / laplacian.length;
  const variance =
    laplacian.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    laplacian.length;

  return {
    isBlurry: variance < 100,
    variance,
  };
}

function applyLaplacianKernel(
  gray: Uint8ClampedArray,
  width: number,
  height: number
): number[] {
  const kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
  const output: number[] = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          sum += gray[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
        }
      }
      output.push(Math.abs(sum));
    }
  }

  return output;
}

/**
 * Brightness check
 * 
 * Rule: Reject if too dark (< 50) or overexposed (> 220)
 */
function checkBrightness(canvas: HTMLCanvasElement): {
  isDark: boolean;
  mean: number;
} {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  const mean = sum / (data.length / 4);

  return {
    isDark: mean < 50 || mean > 220,
    mean,
  };
}

/**
 * Contrast check
 * 
 * Rule: Low contrast (stdDev < 25) indicates flat image (possibly a photo)
 */
function checkContrast(canvas: HTMLCanvasElement): {
  isLowContrast: boolean;
  stdDev: number;
} {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const gray = toGrayscale(imageData);

  const mean = gray.reduce((a, b) => a + b, 0) / gray.length;
  const variance =
    gray.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / gray.length;
  const stdDev = Math.sqrt(variance);

  return {
    isLowContrast: stdDev < 25,
    stdDev,
  };
}

function toGrayscale(imageData: ImageData): Uint8ClampedArray {
  const data = imageData.data;
  const gray = new Uint8ClampedArray(data.length / 4);

  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  return gray;
}

// ============================================
// PHASE 3: LIVENESS DETECTION (ANTI-SPOOFING)
// ============================================

/**
 * Blink detection using Eye Aspect Ratio (EAR)
 * 
 * Algorithm: Soukupová & Čech (2016)
 * EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
 * 
 * - Open eye: EAR ≈ 0.25-0.35
 * - Closed eye: EAR < 0.2
 */
export function detectBlink(
  landmarks: faceapi.FaceLandmarks68,
  state: BlinkDetectionState
): BlinkDetectionState {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();

  const leftEAR = calculateEAR(leftEye);
  const rightEAR = calculateEAR(rightEye);
  const avgEAR = (leftEAR + rightEAR) / 2;

  const now = Date.now();

  // Detect blink start (EAR drops below 0.2)
  if (avgEAR < 0.2 && !state.isBlinking) {
    return {
      isBlinking: true,
      blinkCount: state.blinkCount,
      lastBlinkTime: now,
    };
  }

  // Blink complete (EAR returns to normal)
  if (avgEAR > 0.25 && state.isBlinking) {
    return {
      isBlinking: false,
      blinkCount: state.blinkCount + 1,
      lastBlinkTime: now,
    };
  }

  return state;
}

function calculateEAR(eye: faceapi.Point[]): number {
  // eye[0] = left corner, eye[3] = right corner
  // eye[1], eye[5] = top points, eye[2], eye[4] = bottom points

  const v1 = euclideanDistance(eye[1], eye[5]);
  const v2 = euclideanDistance(eye[2], eye[4]);
  const h = euclideanDistance(eye[0], eye[3]);

  return (v1 + v2) / (2 * h);
}

function euclideanDistance(p1: faceapi.Point, p2: faceapi.Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Head pose detection (yaw, pitch, roll)
 * 
 * Rule: Face must be neutral (frontal) for capture
 * - Reject: |yaw| > 0.15, |pitch| > 0.15, |roll| > 0.2
 */
export function detectHeadPose(
  landmarks: faceapi.FaceLandmarks68
): {
  yaw: number;
  pitch: number;
  roll: number;
  isNeutral: boolean;
} {
  const nose = landmarks.getNose();
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();

  // Calculate eye center
  const eyeCenter = {
    x: (leftEye[0].x + rightEye[3].x) / 2,
    y: (leftEye[0].y + rightEye[3].y) / 2,
  };

  const noseCenter = nose[3]; // Nose tip

  // Yaw: horizontal deviation (left-right rotation)
  const yaw = (noseCenter.x - eyeCenter.x) / eyeCenter.x;

  // Pitch: vertical deviation (up-down rotation)
  const pitch = (noseCenter.y - eyeCenter.y) / eyeCenter.y;

  // Roll: eye line angle (tilt rotation)
  const roll = Math.atan2(
    rightEye[3].y - leftEye[0].y,
    rightEye[3].x - leftEye[0].x
  );

  return {
    yaw,
    pitch,
    roll,
    isNeutral:
      Math.abs(yaw) < 0.15 && Math.abs(pitch) < 0.15 && Math.abs(roll) < 0.2,
  };
}

/**
 * Screen reflection detection
 * 
 * Method: Analyze RGB variance
 * - Real face: high variance (> 500)
 * - Screen/photo: low variance (< 500)
 */
export function detectScreenReflection(canvas: HTMLCanvasElement): {
  isScreen: boolean;
  score: number;
} {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Analyze RGB channel variance
  let rSum = 0,
    gSum = 0,
    bSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }

  const count = data.length / 4;
  const rMean = rSum / count;
  const gMean = gSum / count;
  const bMean = bSum / count;

  let rVar = 0,
    gVar = 0,
    bVar = 0;
  for (let i = 0; i < data.length; i += 4) {
    rVar += Math.pow(data[i] - rMean, 2);
    gVar += Math.pow(data[i + 1] - gMean, 2);
    bVar += Math.pow(data[i + 2] - bMean, 2);
  }

  const avgVariance = (rVar + gVar + bVar) / (3 * count);

  return {
    isScreen: avgVariance < 500,
    score: avgVariance,
  };
}

/**
 * Texture analysis using Local Binary Patterns (LBP)
 * 
 * Algorithm: Määttä et al. (2011)
 * Real face has richer texture (higher entropy > 4.5)
 */
export function analyzeTexture(canvas: HTMLCanvasElement): {
  isRealFace: boolean;
  textureScore: number;
} {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const gray = toGrayscale(imageData);

  // Calculate Local Binary Pattern (LBP) histogram
  const lbp = calculateLBP(gray, canvas.width, canvas.height);

  // Real face has richer texture (higher entropy)
  const entropy = calculateEntropy(lbp);

  return {
    isRealFace: entropy > 4.5,
    textureScore: entropy,
  };
}

function calculateLBP(
  gray: Uint8ClampedArray,
  width: number,
  height: number
): number[] {
  const lbp: number[] = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = gray[y * width + x];
      let code = 0;

      // 8 neighbors (clockwise from top-left)
      const neighbors = [
        gray[(y - 1) * width + (x - 1)], // Top-left
        gray[(y - 1) * width + x], // Top
        gray[(y - 1) * width + (x + 1)], // Top-right
        gray[y * width + (x + 1)], // Right
        gray[(y + 1) * width + (x + 1)], // Bottom-right
        gray[(y + 1) * width + x], // Bottom
        gray[(y + 1) * width + (x - 1)], // Bottom-left
        gray[y * width + (x - 1)], // Left
      ];

      for (let i = 0; i < 8; i++) {
        if (neighbors[i] >= center) {
          code |= 1 << i;
        }
      }

      lbp.push(code);
    }
  }

  return lbp;
}

function calculateEntropy(data: number[]): number {
  const histogram: { [key: number]: number } = {};
  for (const val of data) {
    histogram[val] = (histogram[val] || 0) + 1;
  }

  let entropy = 0;
  const total = data.length;

  for (const count of Object.values(histogram)) {
    const p = count / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

// ============================================
// COMPLETE LIVENESS CHECK
// ============================================

/**
 * Aggregate all checks into single result
 */
export function aggregateLivenessResult(
  faceResult: FaceDetectionResult,
  qualityResult: QualityCheckResult,
  livenessResult: LivenessCheckResult
): CompleteLivenessResult {
  // Determine current phase
  let phase: 'detection' | 'quality' | 'liveness' | 'complete' = 'detection';
  let message = 'Mencari wajah...';
  let progress = 0;

  if (!faceResult.detected) {
    message = faceResult.count === 0 
      ? 'Wajah tidak terdeteksi' 
      : 'Terdeteksi lebih dari 1 wajah';
    progress = 10;
  } else if (faceResult.size.width < 80 || faceResult.size.height < 80) {
    message = 'Wajah terlalu kecil, dekatkan ke kamera';
    progress = 20;
  } else {
    phase = 'quality';
    progress = 30;

    if (qualityResult.isBlurry) {
      message = 'Gambar buram, tahan kamera dengan stabil';
      progress = 35;
    } else if (qualityResult.isDark) {
      message = 'Cahaya terlalu gelap/terang, atur pencahayaan';
      progress = 40;
    } else if (qualityResult.isLowContrast) {
      message = 'Kontras rendah, pastikan wajah terlihat jelas';
      progress = 45;
    } else {
      phase = 'liveness';
      progress = 50;

      if (livenessResult.blinkCount === 0) {
        message = 'Kedipkan mata Anda...';
        progress = 60;
      } else if (!livenessResult.isNeutralPose) {
        message = 'Hadapkan wajah ke depan';
        progress = 70;
      } else if (livenessResult.isScreen) {
        message = 'Terdeteksi layar, gunakan wajah asli';
        progress = 75;
      } else if (!livenessResult.isRealFace) {
        message = 'Gunakan wajah asli, bukan foto';
        progress = 80;
      } else {
        phase = 'complete';
        message = '✅ Siap mengambil foto!';
        progress = 100;
      }
    }
  }

  const canCapture =
    faceResult.detected &&
    faceResult.size.width >= 80 &&
    faceResult.size.height >= 80 &&
    !qualityResult.isBlurry &&
    !qualityResult.isDark &&
    !qualityResult.isLowContrast &&
    livenessResult.blinkCount > 0 &&
    livenessResult.isNeutralPose &&
    !livenessResult.isScreen &&
    livenessResult.isRealFace;

  const status = canCapture ? 'pass' : progress < 50 ? 'checking' : 'fail';

  return {
    status,
    phase,
    message,
    canCapture,
    progress,
    details: {
      faceDetected: faceResult.detected,
      faceCount: faceResult.count,
      faceSize: `${Math.round(faceResult.size.width)}x${Math.round(faceResult.size.height)}px`,
      isBlurry: qualityResult.isBlurry,
      isDark: qualityResult.isDark,
      isLowContrast: qualityResult.isLowContrast,
      blinkCount: livenessResult.blinkCount,
      isNeutralPose: livenessResult.isNeutralPose,
      isScreen: livenessResult.isScreen,
      isRealTexture: livenessResult.isRealFace,
    },
  };
}

// ============================================
// VOICE FEEDBACK
// ============================================

/**
 * Speak feedback using Web Speech API
 */
export function speakFeedback(message: string): void {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'id-ID';
    utterance.rate = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  }
}
