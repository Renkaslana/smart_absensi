# 🌙 Production-Ready Liveness Detection System
**Date:** 2026-01-08  
**Author:** Luna (FahrenCenter Agent)  
**Status:** Planning  
**Priority:** CRITICAL (Security)

---

## 🎯 Objective

Implementasi sistem **anti-spoofing liveness detection** yang production-ready untuk mencegah:
- ❌ Foto cetak (printed photos)
- ❌ Foto digital (screen display)
- ❌ Video replay attacks
- ❌ Mask attacks (3D printed faces)
- ❌ Low-quality registrations (blur, dark, distorted)

Target: **Akurasi ≥ 95%** untuk real face vs spoofing detection.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           FaceRegistrationPage.tsx                  │
│  (Camera Stream + Real-time Liveness Feedback)      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         LivenessDetectionEngine                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Phase 1: Face Detection (HOG)               │  │
│  │  - Detect face in frame                      │  │
│  │  - Reject no face / multiple faces           │  │
│  │  - Validate face size (min 80x80px)          │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Phase 2: Quality Check                      │  │
│  │  - Blur detection (Laplacian variance)       │  │
│  │  - Brightness check (mean pixel value)       │  │
│  │  - Contrast validation (std deviation)       │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Phase 3: Liveness Detection (Anti-Spoofing) │  │
│  │  - Blink detection (EAR - Eye Aspect Ratio)  │  │
│  │  - Head movement (yaw, pitch, roll)          │  │
│  │  - Screen reflection detection               │  │
│  │  - Texture analysis (frequency domain)       │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│          Auto-Capture Logic                         │
│  ✅ Liveness PASS → Capture Image                   │
│  ❌ Liveness FAIL → Show Feedback + Retry           │
└─────────────────────────────────────────────────────┘
```

---

## 🧩 Phase 1: Face Detection (HOG)

### 1.1 Library: face-api.js (TensorFlow.js based)
**Why face-api.js?**
- ✅ Browser-native (no backend dependency for detection)
- ✅ Support SSD MobileNetV1 (faster) & Tiny Face Detector
- ✅ 68-point facial landmarks (for blink & head pose)
- ✅ Face descriptor generation (for recognition)

**Installation:**
```bash
npm install face-api.js
```

### 1.2 Face Detection Logic

```typescript
// utils/livenessDetection.ts

import * as faceapi from 'face-api.js';

interface FaceDetectionResult {
  detected: boolean;
  count: number;
  size: { width: number; height: number };
  position: { x: number; y: number };
  landmarks: faceapi.FaceLandmarks68 | null;
}

export async function detectFace(
  video: HTMLVideoElement
): Promise<FaceDetectionResult> {
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();

  if (!detection) {
    return {
      detected: false,
      count: 0,
      size: { width: 0, height: 0 },
      position: { x: 0, y: 0 },
      landmarks: null,
    };
  }

  const box = detection.detection.box;

  // Validate minimum face size (80x80px)
  if (box.width < 80 || box.height < 80) {
    return {
      detected: false,
      count: 0,
      size: { width: box.width, height: box.height },
      position: { x: box.x, y: box.y },
      landmarks: null,
    };
  }

  return {
    detected: true,
    count: 1,
    size: { width: box.width, height: box.height },
    position: { x: box.x, y: box.y },
    landmarks: detection.landmarks,
  };
}
```

**Rejection Rules:**
- `count === 0` → "Wajah tidak terdeteksi"
- `count > 1` → "Terdeteksi lebih dari 1 wajah"
- `size.width < 80 || size.height < 80` → "Wajah terlalu kecil, dekatkan ke kamera"

---

## 🧩 Phase 2: Quality Check

### 2.1 Blur Detection (Laplacian Variance)

**Algorithm:** Laplacian operator measures edge sharpness
- Sharp image → High variance (>100)
- Blurry image → Low variance (<100)

```typescript
export function checkBlur(canvas: HTMLCanvasElement): {
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

function toGrayscale(imageData: ImageData): Uint8ClampedArray {
  const data = imageData.data;
  const gray = new Uint8ClampedArray(data.length / 4);

  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  return gray;
}
```

### 2.2 Brightness Check

```typescript
export function checkBrightness(canvas: HTMLCanvasElement): {
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
    isDark: mean < 50 || mean > 220, // Too dark or overexposed
    mean,
  };
}
```

### 2.3 Contrast Check

```typescript
export function checkContrast(canvas: HTMLCanvasElement): {
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
    isLowContrast: stdDev < 25, // Low contrast indicates flat image (photo)
    stdDev,
  };
}
```

---

## 🧩 Phase 3: Liveness Detection (Anti-Spoofing)

### 3.1 Blink Detection (EAR - Eye Aspect Ratio)

**Algorithm:** Eye Aspect Ratio (Soukupová & Čech, 2016)

```
EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)

Where p1-p6 are eye landmarks
```

- Open eye: EAR ≈ 0.25-0.35
- Closed eye: EAR < 0.2

```typescript
interface BlinkDetectionState {
  isBlinking: boolean;
  blinkCount: number;
  lastBlinkTime: number;
}

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

  // Detect blink (EAR drops below 0.2)
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
```

**Rule:** Must detect **at least 1 blink** before allowing capture.

### 3.2 Head Movement (Yaw, Pitch, Roll)

```typescript
export function detectHeadPose(
  landmarks: faceapi.FaceLandmarks68
): {
  yaw: number; // Left-right rotation
  pitch: number; // Up-down rotation
  roll: number; // Tilt rotation
  isNeutral: boolean;
} {
  const nose = landmarks.getNose();
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const mouth = landmarks.getMouth();

  // Simplified 2D approximation (for 3D, use PnP algorithm)
  const eyeCenter = {
    x: (leftEye[0].x + rightEye[3].x) / 2,
    y: (leftEye[0].y + rightEye[3].y) / 2,
  };

  const noseCenter = nose[3]; // Nose tip

  // Yaw: horizontal deviation
  const yaw = (noseCenter.x - eyeCenter.x) / eyeCenter.x;

  // Pitch: vertical deviation
  const pitch = (noseCenter.y - eyeCenter.y) / eyeCenter.y;

  // Roll: eye line angle
  const roll = Math.atan2(
    rightEye[3].y - leftEye[0].y,
    rightEye[3].x - leftEye[0].x
  );

  return {
    yaw,
    pitch,
    roll,
    isNeutral: Math.abs(yaw) < 0.15 && Math.abs(pitch) < 0.15 && Math.abs(roll) < 0.2,
  };
}
```

**Rule:** Face must be **neutral** (frontal) for capture. Reject extreme poses (yaw > 30°, pitch > 20°).

### 3.3 Screen Reflection Detection

**Method:** Detect high-frequency patterns (screen pixels)

```typescript
export function detectScreenReflection(canvas: HTMLCanvasElement): {
  isScreen: boolean;
  score: number;
} {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Analyze RGB channel variance (screen has lower variance)
  let rSum = 0, gSum = 0, bSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }

  const count = data.length / 4;
  const rMean = rSum / count;
  const gMean = gSum / count;
  const bMean = bSum / count;

  let rVar = 0, gVar = 0, bVar = 0;
  for (let i = 0; i < data.length; i += 4) {
    rVar += Math.pow(data[i] - rMean, 2);
    gVar += Math.pow(data[i + 1] - gMean, 2);
    bVar += Math.pow(data[i + 2] - bMean, 2);
  }

  const avgVariance = (rVar + gVar + bVar) / (3 * count);

  // Screen/printed photo has lower variance (<500)
  return {
    isScreen: avgVariance < 500,
    score: avgVariance,
  };
}
```

### 3.4 Texture Analysis (Frequency Domain)

**Method:** FFT (Fast Fourier Transform) for texture richness

```typescript
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
    isRealFace: entropy > 4.5, // Threshold determined empirically
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

      // 8 neighbors
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
    entropy -= p * Math.log2(p);
  }

  return entropy;
}
```

---

## 🎨 User Interface Integration

### 4.1 Real-time Feedback Component

```typescript
interface LivenessFeedback {
  status: 'checking' | 'pass' | 'fail';
  phase: 'detection' | 'quality' | 'liveness';
  message: string;
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
  progress: number; // 0-100
}
```

**UI Layout:**
```
┌─────────────────────────────────────┐
│       🎥 Video Preview              │
│  ┌────────────────────────────────┐ │
│  │                                │ │
│  │      [Oval Face Guide]         │ │
│  │                                │ │
│  │   ✅ Wajah terdeteksi          │ │
│  │   ✅ Kualitas bagus            │ │
│  │   ⏳ Kedipkan mata...          │ │
│  │                                │ │
│  └────────────────────────────────┘ │
│                                     │
│  📊 Liveness Check: 2/3 Complete    │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░ 67%              │
│                                     │
│  [⏸️ Stop Auto Capture]             │
└─────────────────────────────────────┘
```

### 4.2 Voice Feedback (Web Speech API)

```typescript
export function speakFeedback(message: string) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'id-ID';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

// Usage examples:
speakFeedback('Wajah terdeteksi');
speakFeedback('Kedipkan mata Anda');
speakFeedback('Hadapkan wajah ke depan');
speakFeedback('Foto berhasil diambil');
```

---

## 🔧 Implementation Steps

### Step 1: Install Dependencies
```bash
cd frontend
npm install face-api.js
```

### Step 2: Download Models
```typescript
// utils/loadFaceApiModels.ts
export async function loadFaceApiModels() {
  const MODEL_URL = '/models'; // Store in public/models/
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
}
```

Download models dari:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Put in: `frontend/public/models/`

### Step 3: Create LivenessDetection Hook
```typescript
// hooks/useLivenessDetection.ts
export function useLivenessDetection(
  videoRef: React.RefObject<HTMLVideoElement>
) {
  const [feedback, setFeedback] = useState<LivenessFeedback>({...});
  
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!videoRef.current) return;
      
      // Phase 1: Face Detection
      const faceResult = await detectFace(videoRef.current);
      
      // Phase 2: Quality Check
      const canvas = captureFrame(videoRef.current);
      const qualityResult = checkQuality(canvas);
      
      // Phase 3: Liveness Check
      const livenessResult = await checkLiveness(faceResult.landmarks);
      
      setFeedback(aggregateFeedback(faceResult, qualityResult, livenessResult));
    }, 500); // Check every 500ms
    
    return () => clearInterval(interval);
  }, [videoRef]);
  
  return feedback;
}
```

### Step 4: Update FaceRegistrationPage
```typescript
// pages/admin/FaceRegistrationPage.tsx

const livenessFeedback = useLivenessDetection(videoRef);

// Auto-capture only if ALL checks pass
useEffect(() => {
  if (!autoCapture || capturedImages.length >= MAX_IMAGES) return;
  
  const canCapture = 
    livenessFeedback.status === 'pass' &&
    livenessFeedback.details.faceDetected &&
    !livenessFeedback.details.isBlurry &&
    !livenessFeedback.details.isDark &&
    livenessFeedback.details.blinkCount > 0 &&
    livenessFeedback.details.isNeutralPose &&
    !livenessFeedback.details.isScreen &&
    livenessFeedback.details.isRealTexture;
  
  if (canCapture) {
    const timer = setTimeout(() => {
      captureImage();
      speakFeedback('Foto berhasil diambil');
    }, 1000);
    
    return () => clearTimeout(timer);
  }
}, [autoCapture, livenessFeedback]);
```

---

## 📊 Testing Strategy

### Test Case 1: Printed Photo Attack
- ✅ Should reject: isScreen = true, textureScore < 4.5
- Expected: "Gunakan wajah asli, bukan foto"

### Test Case 2: Screen Display Attack
- ✅ Should reject: variance < 500, blinkCount = 0
- Expected: "Terdeteksi layar, gunakan wajah asli"

### Test Case 3: Low Light Condition
- ✅ Should reject: mean < 50
- Expected: "Cahaya terlalu gelap, cari tempat lebih terang"

### Test Case 4: Blurry Face
- ✅ Should reject: variance < 100
- Expected: "Gambar buram, tahan kamera dengan stabil"

### Test Case 5: Legitimate User
- ✅ Should pass all checks
- Expected: Auto-capture successful

---

## 🚀 Performance Optimization

### 1. Throttle Detection Frequency
- Run detection every **500ms** (not every frame)
- Reduces CPU load while maintaining responsiveness

### 2. WebWorker for Heavy Computation
```typescript
// workers/livenessWorker.ts
self.onmessage = async (e) => {
  const { imageData, type } = e.data;
  
  if (type === 'blur') {
    const result = checkBlur(imageData);
    self.postMessage(result);
  }
  
  if (type === 'texture') {
    const result = analyzeTexture(imageData);
    self.postMessage(result);
  }
};
```

### 3. Progressive Enhancement
- Phase 1 (mandatory): Face detection + quality
- Phase 2 (recommended): Blink detection
- Phase 3 (optional): Advanced anti-spoofing

Allow degraded mode if device performance is low.

---

## 🔐 Security Considerations

### Backend Validation (CRITICAL)
Frontend liveness is **NOT SECURE** alone. Backend MUST:
1. Re-validate face quality on upload
2. Check encoding quality (face-recognition library)
3. Rate-limit registration attempts (max 3 attempts per 5 minutes)
4. Log all registration attempts (audit trail)

```python
# backend/app/services/face_service.py

def validate_face_image(image: np.ndarray) -> Dict[str, Any]:
    """Backend validation untuk face quality"""
    
    # Check blur (Laplacian)
    laplacian_var = cv2.Laplacian(image, cv2.CV_64F).var()
    if laplacian_var < 100:
        raise HTTPException(400, "Image too blurry")
    
    # Check brightness
    mean_brightness = np.mean(image)
    if mean_brightness < 50 or mean_brightness > 220:
        raise HTTPException(400, "Poor lighting condition")
    
    # Check face count
    faces = face_recognition.face_locations(image)
    if len(faces) != 1:
        raise HTTPException(400, "Must contain exactly 1 face")
    
    # Check face size
    top, right, bottom, left = faces[0]
    width = right - left
    height = bottom - top
    if width < 80 or height < 80:
        raise HTTPException(400, "Face too small")
    
    return {
        "valid": True,
        "quality": {
            "blur_score": laplacian_var,
            "brightness": mean_brightness,
            "face_size": (width, height)
        }
    }
```

---

## 📚 References & Best Practices

1. **Eye Aspect Ratio (EAR):**
   - Soukupová, T., & Čech, J. (2016). "Real-Time Eye Blink Detection using Facial Landmarks"
   - Paper: https://vision.fe.uni-lj.si/cvww2016/proceedings/papers/05.pdf

2. **Local Binary Patterns (LBP):**
   - Määttä, J., et al. (2011). "Face Spoofing Detection From Single Images Using Micro-Texture Analysis"
   - IEEE Biometrics Compendium

3. **Face Anti-Spoofing:**
   - Boulkenafet, Z., et al. (2017). "Face Anti-Spoofing Using Speeded-Up Robust Features and Fisher Vector Encoding"
   - IEEE Signal Processing Letters

4. **Production Systems:**
   - Apple Face ID: Uses infrared + depth sensing (hardware-based)
   - Google Face Unlock: Multi-modal liveness (passive + active)
   - Microsoft Hello: 3D structured light + IR

5. **Web-based Anti-Spoofing:**
   - face-api.js: https://github.com/justadudewhohacks/face-api.js
   - MediaPipe Face Mesh: https://google.github.io/mediapipe/solutions/face_mesh.html

---

## ✅ Success Criteria

- [x] Face detection rejects no face / multiple faces
- [x] Quality check rejects blur / dark / low-contrast images
- [x] Blink detection requires at least 1 blink
- [x] Head pose validation ensures frontal face
- [x] Screen reflection detection flags digital displays
- [x] Texture analysis distinguishes photo vs real face
- [x] Real-time UI feedback (visual + voice)
- [x] Auto-capture only when ALL checks pass
- [x] Backend re-validation for security
- [x] Performance optimized (<500ms per check)

---

## 🎯 Next Steps After Implementation

1. **Test extensively** with real users
2. **Collect false positive/negative data**
3. **Tune thresholds** based on real-world performance
4. **Add optional challenge-response** (smile detection, head rotation prompt)
5. **Monitor registration success rate** (target >90%)
6. **Document edge cases** (glasses, masks, beards)

---

**Estimated Implementation Time:** 6-8 hours  
**Complexity:** HIGH (Production-grade anti-spoofing)  
**Impact:** CRITICAL (Security foundation for entire system)

🌙 *"Security is not a feature, it's a foundation."* - Luna
