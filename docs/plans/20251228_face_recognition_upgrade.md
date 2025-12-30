# Rencana Upgrade Face Recognition System
**Tanggal**: 28 Desember 2025  
**Agent**: Luna  
**Status**: Pending Approval

---

## 📋 Ringkasan

Upgrade sistem face recognition dari implementasi sederhana (face_recognition library) ke arsitektur modern berbasis:
- **Frontend**: MediaPipe Face Detection + Liveness Detection
- **Backend**: FaceNet/ArcFace embeddings + Cosine Similarity
- **Performance**: Optimized untuk RAM 8GB, tidak perlu GPU, offline-first

---

## 🎯 Tujuan

1. **Meningkatkan Akurasi**: Dari <70% menjadi >90% dengan embeddings 128D
2. **Liveness Detection Real**: Implementasi MediaPipe di browser untuk deteksi wajah live
3. **Performa Stabil**: Optimized untuk laptop dengan RAM 8GB tanpa GPU
4. **Offline-First**: Semua proses berjalan tanpa koneksi internet
5. **Scalable**: Mudah ditambahkan mahasiswa baru tanpa retrain model

---

## 📊 Masalah Saat Ini

### Backend Face Recognition Issues:
```
🔍 [face/scan] Starting face scan...
📸 [face/scan] Decoding base64 image...
✓ [face/scan] Image decoded: (862, 484)  ← Resolusi masih rendah (butuh hard refresh)
📊 [face/scan] Fetching face encodings from database...
✓ [face/scan] Found 5 face encodings
🔓 [face/scan] Deserializing encodings...
✓ [face/scan] Deserialized 5 encodings
🧠 [face/scan] Starting face recognition...
✓ [face/scan] Recognition complete: None  ← Tidak mengenali wajah
❌ [face/scan] Face not recognized
```

**Root Cause Analysis**:
1. Library `face_recognition` menggunakan dlib HOG detector → akurasi rendah di kondisi:
   - Lighting variations
   - Head pose variations
   - Expression changes
2. Encoding method tidak optimal untuk matching (menggunakan `face_recognition.face_encodings()`)
3. Threshold matching terlalu ketat atau terlalu longgar
4. Tidak ada preprocessing image (normalization, alignment, etc.)

### Frontend Issues:
1. Liveness detection hanya simulasi (setTimeout), tidak real
2. Tidak ada face detection feedback real-time
3. Resolusi webcam masih 862x484 di browser (butuh hard refresh)

---

## 🏗️ Arsitektur Target

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER (Frontend)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Webcam 1920x1080]                                          │
│         ↓                                                     │
│  MediaPipe Face Detection                                    │
│    • Detect face landmarks (468 points)                      │
│    • Real-time face tracking                                 │
│    • Bounding box extraction                                 │
│         ↓                                                     │
│  Liveness Detection (MediaPipe)                              │
│    • Blink detection (eye aspect ratio)                      │
│    • Head pose estimation (yaw, pitch, roll)                 │
│    • Face mesh depth analysis                                │
│         ↓                                                     │
│  Image Preprocessing                                         │
│    • Face alignment (eye coordinates)                        │
│    • Normalization (mean=0.5, std=0.5)                       │
│    • Resize to 160x160 (FaceNet input)                       │
│         ↓                                                     │
│  Send to Backend (Base64 JPEG)                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    POST /api/v1/face/scan
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Receive Base64 Image                                        │
│         ↓                                                     │
│  Decode & Validate                                           │
│    • Check resolution (160x160)                              │
│    • Validate face presence                                  │
│         ↓                                                     │
│  Face Embedding Extraction (FaceNet/ArcFace)                 │
│    • Load pre-trained model (Keras-FaceNet)                  │
│    • Extract 128D embedding vector                           │
│    • L2 normalization                                        │
│         ↓                                                     │
│  Load Database Embeddings                                    │
│    • Fetch all registered face embeddings                    │
│    • Deserialize from BLOB                                   │
│         ↓                                                     │
│  Similarity Matching (Cosine Similarity)                     │
│    • Calculate cosine distance for each embedding            │
│    • Find best match (highest similarity)                    │
│    • Threshold: similarity > 0.6 (adjustable)                │
│         ↓                                                     │
│  Response                                                    │
│    • recognized: True/False                                  │
│    • name: "Mahasiswa Name"                                  │
│    • confidence: 0.85 (similarity score)                     │
│    • nim: "23215xxx"                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementasi Detail

### Phase 1: Backend Face Recognition Engine (Priority: HIGH)

#### 1.1 Install Dependencies
```bash
cd backend
pip install tensorflow==2.15.0  # atau 2.14.0 untuk CPU
pip install keras-facenet==0.3.2
pip install scikit-learn
pip install opencv-python-headless
pip install pillow
```

**Why These Libraries?**
- `keras-facenet`: Pre-trained FaceNet model (128D embeddings), lightweight
- `tensorflow`: Backend untuk FaceNet inference (CPU-optimized)
- `scikit-learn`: Cosine similarity calculations
- `opencv-python-headless`: Image processing tanpa GUI (lighter)

#### 1.2 Create Face Recognition Service

**File**: `backend/app/services/facenet_service.py`

```python
from typing import List, Tuple, Optional
import numpy as np
from keras_facenet import FaceNet
import cv2
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

class FaceNetService:
    """
    Face recognition service using FaceNet embeddings
    and cosine similarity matching.
    """
    
    def __init__(self, similarity_threshold: float = 0.6):
        """
        Initialize FaceNet model.
        
        Args:
            similarity_threshold: Minimum cosine similarity for match (0.0-1.0)
        """
        self.model = FaceNet()
        self.threshold = similarity_threshold
        logger.info(f"✓ FaceNet model loaded, threshold={self.threshold}")
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for FaceNet.
        
        Args:
            image: BGR image from OpenCV
            
        Returns:
            Preprocessed image (160x160x3, normalized)
        """
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Resize to FaceNet input size (160x160)
        resized = cv2.resize(rgb_image, (160, 160))
        
        # Normalize to [-1, 1] (FaceNet expects this range)
        normalized = (resized - 127.5) / 128.0
        
        return normalized
    
    def extract_embedding(self, image: np.ndarray) -> np.ndarray:
        """
        Extract 128D face embedding from image.
        
        Args:
            image: Preprocessed face image (160x160x3)
            
        Returns:
            128D embedding vector (L2 normalized)
        """
        # Add batch dimension
        image_batch = np.expand_dims(image, axis=0)
        
        # Extract embedding
        embedding = self.model.embeddings(image_batch)[0]
        
        # L2 normalization
        norm = np.linalg.norm(embedding)
        normalized_embedding = embedding / norm
        
        logger.info(f"✓ Extracted embedding: shape={normalized_embedding.shape}, norm={norm:.4f}")
        
        return normalized_embedding
    
    def find_best_match(
        self, 
        query_embedding: np.ndarray, 
        database_embeddings: List[Tuple[str, np.ndarray]]
    ) -> Optional[Tuple[str, float]]:
        """
        Find best matching face from database.
        
        Args:
            query_embedding: Query face embedding (128D)
            database_embeddings: List of (user_id, embedding) tuples
            
        Returns:
            (user_id, confidence) if match found, else None
        """
        if not database_embeddings:
            logger.warning("No database embeddings to match against")
            return None
        
        best_match = None
        best_similarity = -1.0
        
        # Calculate cosine similarity with each database embedding
        for user_id, db_embedding in database_embeddings:
            # Reshape for sklearn
            query_vec = query_embedding.reshape(1, -1)
            db_vec = db_embedding.reshape(1, -1)
            
            # Cosine similarity (range: -1 to 1, higher is better)
            similarity = cosine_similarity(query_vec, db_vec)[0][0]
            
            logger.debug(f"  • {user_id}: similarity={similarity:.4f}")
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = user_id
        
        # Check if best match exceeds threshold
        if best_similarity >= self.threshold:
            logger.info(f"✓ Match found: {best_match} (confidence={best_similarity:.4f})")
            return (best_match, best_similarity)
        else:
            logger.warning(f"✗ No match above threshold ({best_similarity:.4f} < {self.threshold})")
            return None
    
    def recognize_face(
        self, 
        image: np.ndarray, 
        database_embeddings: List[Tuple[str, np.ndarray]]
    ) -> Optional[Tuple[str, float]]:
        """
        Complete face recognition pipeline.
        
        Args:
            image: BGR image containing face
            database_embeddings: Registered face embeddings
            
        Returns:
            (user_id, confidence) if recognized, else None
        """
        try:
            # Preprocess
            preprocessed = self.preprocess_image(image)
            
            # Extract embedding
            query_embedding = self.extract_embedding(preprocessed)
            
            # Find match
            match = self.find_best_match(query_embedding, database_embeddings)
            
            return match
            
        except Exception as e:
            logger.error(f"Face recognition error: {e}", exc_info=True)
            return None
```

#### 1.3 Update Face API Endpoint

**File**: `backend/app/api/v1/face.py`

Update `/scan` endpoint untuk menggunakan `FaceNetService`:

```python
from app.services.facenet_service import FaceNetService
import numpy as np

# Initialize FaceNet service (do this once at module level)
facenet_service = FaceNetService(similarity_threshold=0.6)

@router.post("/scan", response_model=FaceRecognitionResponse)
async def scan_face(
    request: FaceRecognitionRequest,
    db: Session = Depends(get_db)
):
    """
    Scan face and identify user using FaceNet + Cosine Similarity.
    """
    print("🔍 [face/scan] Starting face scan with FaceNet...")
    
    try:
        # Decode base64 image
        print("📸 [face/scan] Decoding base64 image...")
        image_data = base64.b64decode(request.image_base64)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        print(f"✓ [face/scan] Image decoded: {image.shape}")
        
        # Fetch all face encodings from database
        print("📊 [face/scan] Fetching face encodings from database...")
        face_encodings = db.query(FaceEncoding).filter(FaceEncoding.is_active == True).all()
        print(f"✓ [face/scan] Found {len(face_encodings)} face encodings")
        
        if not face_encodings:
            print("❌ [face/scan] No face encodings in database")
            return FaceRecognitionResponse(recognized=False)
        
        # Deserialize embeddings
        print("🔓 [face/scan] Deserializing embeddings...")
        database_embeddings = []
        for enc in face_encodings:
            embedding = np.frombuffer(enc.encoding, dtype=np.float64)
            database_embeddings.append((str(enc.user_id), embedding))
        print(f"✓ [face/scan] Deserialized {len(database_embeddings)} embeddings")
        
        # Recognize face using FaceNet
        print("🧠 [face/scan] Starting FaceNet recognition...")
        match = facenet_service.recognize_face(image, database_embeddings)
        print(f"✓ [face/scan] Recognition complete: {match}")
        
        if match:
            user_id_str, confidence = match
            user_id = int(user_id_str)
            
            # Get user details
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                print(f"❌ [face/scan] User {user_id} not found in database")
                return FaceRecognitionResponse(recognized=False)
            
            print(f"✓ [face/scan] User recognized: {user.full_name} ({user.nim})")
            
            return FaceRecognitionResponse(
                recognized=True,
                user_id=user.id,
                name=user.full_name,
                nim=user.nim,
                confidence=float(confidence)
            )
        else:
            print("❌ [face/scan] Face not recognized")
            return FaceRecognitionResponse(recognized=False)
            
    except Exception as e:
        print(f"💥 [face/scan] Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
```

#### 1.4 Update Face Registration

**File**: `backend/app/api/v1/face.py` - `/register` endpoint

Update untuk menggunakan FaceNet embeddings:

```python
@router.post("/register", response_model=dict)
async def register_face(
    nim: str = Form(...),
    images: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Register multiple face images for a student using FaceNet embeddings.
    """
    print(f"🔐 [face/register] Registering faces for NIM: {nim}")
    
    # Validate image count
    if len(images) < 3 or len(images) > 5:
        raise HTTPException(
            status_code=400, 
            detail="Must provide between 3 and 5 face images"
        )
    
    # Find user
    user = db.query(User).filter(User.nim == nim).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Student with NIM {nim} not found")
    
    # Delete existing encodings
    db.query(FaceEncoding).filter(FaceEncoding.user_id == user.id).delete()
    db.commit()
    print(f"🗑️ [face/register] Deleted existing encodings for user {user.id}")
    
    # Process each image
    embeddings_extracted = 0
    saved_files = []
    
    for idx, image_file in enumerate(images, 1):
        try:
            # Read image
            contents = await image_file.read()
            nparr = np.frombuffer(contents, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                print(f"❌ [face/register] Failed to decode image {idx}")
                continue
            
            # Preprocess and extract embedding
            preprocessed = facenet_service.preprocess_image(image)
            embedding = facenet_service.extract_embedding(preprocessed)
            
            # Save to database
            face_enc = FaceEncoding(
                user_id=user.id,
                encoding=embedding.tobytes(),  # Store as binary
                confidence=1.0,  # Training images have 100% confidence
                created_at=datetime.utcnow(),
                is_active=True
            )
            db.add(face_enc)
            
            # Save image file
            save_dir = Path("dataset_wajah") / nim
            save_dir.mkdir(parents=True, exist_ok=True)
            save_path = save_dir / f"face_{idx:03d}.jpg"
            cv2.imwrite(str(save_path), image)
            saved_files.append(str(save_path))
            
            embeddings_extracted += 1
            print(f"✓ [face/register] Processed image {idx}: saved to {save_path}")
            
        except Exception as e:
            print(f"❌ [face/register] Error processing image {idx}: {e}")
            continue
    
    # Commit to database
    db.commit()
    
    # Update user has_face flag
    user.has_face = embeddings_extracted >= 3
    db.commit()
    
    print(f"✓ [face/register] Registered {embeddings_extracted} face embeddings for {user.full_name}")
    
    return {
        "success": True,
        "nim": nim,
        "images_processed": embeddings_extracted,
        "saved_files": saved_files,
        "message": f"Successfully registered {embeddings_extracted} face images"
    }
```

---

### Phase 2: Frontend MediaPipe Integration (Priority: MEDIUM)

#### 2.1 Install Dependencies

```bash
cd frontend
npm install @mediapipe/face_detection
npm install @mediapipe/face_mesh
npm install @tensorflow/tfjs
```

#### 2.2 Create MediaPipe Service

**File**: `frontend/src/lib/mediapipe.ts`

```typescript
import { FaceDetection } from '@mediapipe/face_detection';
import { FaceMesh } from '@mediapipe/face_mesh';

export class MediaPipeService {
  private faceDetection: FaceDetection;
  private faceMesh: FaceMesh;
  private isInitialized = false;

  constructor() {
    // Initialize Face Detection
    this.faceDetection = new FaceDetection({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
      }
    });
    
    this.faceDetection.setOptions({
      model: 'short',
      minDetectionConfidence: 0.5
    });

    // Initialize Face Mesh
    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });
    
    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    await this.faceDetection.initialize();
    await this.faceMesh.initialize();
    
    this.isInitialized = true;
    console.log('✓ MediaPipe initialized');
  }

  async detectFace(imageElement: HTMLImageElement | HTMLVideoElement): Promise<boolean> {
    const results = await this.faceDetection.send({ image: imageElement });
    return results.detections && results.detections.length > 0;
  }

  async detectBlink(videoElement: HTMLVideoElement): Promise<boolean> {
    const results = await this.faceMesh.send({ image: videoElement });
    
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return false;
    }
    
    // Calculate Eye Aspect Ratio (EAR)
    const landmarks = results.multiFaceLandmarks[0];
    const leftEye = this.calculateEAR(landmarks, [33, 160, 158, 133, 153, 144]);
    const rightEye = this.calculateEAR(landmarks, [362, 385, 387, 263, 373, 380]);
    
    // Blink detected if EAR < threshold
    return (leftEye + rightEye) / 2 < 0.2;
  }

  private calculateEAR(landmarks: any[], indices: number[]): number {
    // Eye Aspect Ratio formula
    const p1 = landmarks[indices[1]];
    const p2 = landmarks[indices[2]];
    const p3 = landmarks[indices[3]];
    const p4 = landmarks[indices[4]];
    const p5 = landmarks[indices[0]];
    const p6 = landmarks[indices[5]];
    
    const vertical1 = this.distance(p1, p4);
    const vertical2 = this.distance(p2, p3);
    const horizontal = this.distance(p5, p6);
    
    return (vertical1 + vertical2) / (2.0 * horizontal);
  }

  private distance(p1: any, p2: any): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }
}
```

#### 2.3 Update Absensi Page

**File**: `frontend/src/app/dashboard/absensi/page.tsx`

Integrate MediaPipe for real liveness detection.

---

### Phase 3: Testing & Optimization

#### 3.1 Performance Benchmarks
- [ ] Measure face recognition latency (target: <2s)
- [ ] Test accuracy with 10+ students (target: >90%)
- [ ] Memory usage monitoring (target: <2GB RAM)

#### 3.2 Edge Cases Testing
- [ ] Poor lighting conditions
- [ ] Glasses/mask wearing
- [ ] Different head poses (±30°)
- [ ] Expression variations (smile, neutral, serious)

#### 3.3 Threshold Tuning
- [ ] Test different similarity thresholds (0.5, 0.6, 0.7)
- [ ] Find optimal balance between false positives and false negatives

---

## 📦 Deliverables

### Backend
- ✅ `FaceNetService` class in `services/facenet_service.py`
- ✅ Updated `/scan` endpoint with FaceNet recognition
- ✅ Updated `/register` endpoint with FaceNet embeddings
- ✅ Migration for existing face encodings (optional)

### Frontend
- ✅ MediaPipe service in `lib/mediapipe.ts`
- ✅ Real-time face detection feedback
- ✅ Real liveness detection (blink + head movement)
- ✅ Preprocessed image before sending to backend

### Documentation
- ✅ API documentation update
- ✅ Face recognition accuracy report
- ✅ Performance benchmarks
- ✅ Troubleshooting guide

---

## ⏱️ Estimasi Waktu

| Phase | Task | Estimasi |
|-------|------|----------|
| 1 | Backend FaceNet Service | 1-2 jam |
| 1 | Update Face API Endpoints | 1 jam |
| 1 | Testing Backend Recognition | 30 min |
| 2 | Frontend MediaPipe Service | 1-2 jam |
| 2 | Update Absensi Page | 1 jam |
| 2 | Testing Frontend Liveness | 30 min |
| 3 | Performance Testing | 1 jam |
| 3 | Threshold Tuning | 30 min |
| 3 | Documentation | 30 min |
| **Total** | | **7-9 jam** |

---

## ⚠️ Risks & Mitigations

### Risk 1: TensorFlow Installation Issues
- **Impact**: High
- **Mitigation**: Use `tensorflow-cpu` version 2.15.0, provide fallback to current system

### Risk 2: MediaPipe CDN Dependency
- **Impact**: Medium
- **Mitigation**: Download and host MediaPipe files locally

### Risk 3: False Negatives (Registered Students Not Recognized)
- **Impact**: High
- **Mitigation**: Lower threshold to 0.5, add retry mechanism

### Risk 4: Performance Degradation on Low-End Laptops
- **Impact**: Medium
- **Mitigation**: Add loading states, optimize image preprocessing

---

## ✅ Acceptance Criteria

1. Face recognition accuracy >90% with 5 test students
2. Response time <3 seconds from capture to result
3. Liveness detection works (real blink/head movement)
4. Memory usage <2GB RAM
5. System works offline (no internet required)
6. Clear error messages for failure cases

---

## 📝 Notes

- Current backend masih menggunakan `face_recognition` library (dlib HOG + 128D encodings)
- New system akan menggunakan FaceNet (Inception ResNet v1) dengan 128D embeddings
- MediaPipe akan berjalan di browser (JavaScript), tidak membutuhkan backend processing
- Semua model pre-trained, tidak perlu training manual
- Threshold 0.6 adalah starting point, akan di-tune berdasarkan testing

---

**Approval Required Before Implementation**

Apakah rencana ini sudah sesuai dengan ekspektasi? Ada yang perlu ditambahkan atau diubah?
