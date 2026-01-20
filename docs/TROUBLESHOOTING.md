# Troubleshooting Guide - FahrenCenter

Panduan troubleshooting untuk mengatasi masalah umum dalam pengembangan dan deployment **FahrenCenter Smart Attendance System**.

---

## 📋 Table of Contents

1. [Backend Issues](#backend-issues)
2. [Frontend Issues](#frontend-issues)
3. [Face Recognition Issues](#face-recognition-issues)
4. [Database Issues](#database-issues)
5. [Deployment Issues](#deployment-issues)
6. [Network & CORS Issues](#network--cors-issues)

---

## 🐍 Backend Issues

### 1. Error: `ModuleNotFoundError: No module named 'dlib'`

**Problem:** Install `dlib` di Windows sering gagal karena butuh C++ compiler.

**Solution:**

#### Option A: Install Pre-built Wheel (Recommended)
```bash
# Download wheel dari https://github.com/z-mahmud22/Dlib_Windows_Python3.x
# Pilih sesuai Python version (3.9, 3.10, 3.11)
# Example untuk Python 3.10:
pip install dlib-19.24.0-cp310-cp310-win_amd64.whl
```

#### Option B: Install CMake & Build Tools
```bash
# 1. Install Visual Studio Build Tools
# Download dari: https://visualstudio.microsoft.com/downloads/
# Pilih: "Desktop development with C++"

# 2. Install CMake
# Download dari: https://cmake.org/download/
# Atau via Chocolatey:
choco install cmake

# 3. Install dlib
pip install dlib
```

#### Option C: Use Conda (Alternative)
```bash
conda install -c conda-forge dlib
```

**Verification:**
```python
import dlib
print(dlib.__version__)  # Should print version number
```

---

### 2. Error: `No module named 'face_recognition'`

**Problem:** `face_recognition` butuh `dlib` dan dependencies lainnya.

**Solution:**
```bash
# Pastikan dlib sudah terinstall dulu
pip install dlib

# Install face_recognition
pip install face-recognition

# Jika error, coba install dependencies manual:
pip install numpy
pip install Pillow
pip install face-recognition-models
pip install face-recognition
```

**Common Errors:**
- **"CMake must be installed"** → Install CMake (see solution #1)
- **"No module named 'face_recognition_models'"** → `pip install face-recognition-models`
- **"Microsoft Visual C++ 14.0 is required"** → Install Visual Studio Build Tools

---

### 3. Error: `database is locked` (SQLite)

**Problem:** SQLite tidak support multiple concurrent writes.

**Solution:**

#### Temporary Fix:
```bash
# Stop server
# Delete WAL and SHM files
cd backend/database
del absensi.db-wal
del absensi.db-shm
# atau Linux/Mac:
rm absensi.db-wal absensi.db-shm

# Restart server
python run.py
```

#### Long-term Fix (Enable WAL mode):
```python
# backend/app/db/session.py
from sqlalchemy import create_engine, event

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30  # Increase timeout
    }
)

# Enable WAL mode
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()
```

#### Production Fix (Use PostgreSQL):
```bash
# Install PostgreSQL
# Update .env:
DATABASE_URL=postgresql://user:password@localhost/fahrencenter

# Update requirements.txt:
pip install psycopg2-binary
```

---

### 4. Error: `Port 8001 already in use`

**Problem:** Port 8001 sudah digunakan oleh process lain.

**Solution:**

#### Windows:
```powershell
# Find process using port 8001
netstat -ano | findstr :8001

# Kill process (replace PID with actual PID)
taskkill /PID <PID> /F

# Atau gunakan port lain
uvicorn app.main:app --port 8002
```

#### Linux/Mac:
```bash
# Find process
lsof -i :8001

# Kill process
kill -9 <PID>

# Atau gunakan port lain
uvicorn app.main:app --port 8002
```

---

### 5. Error: `face_recognition.api.encode_faces: Input is not a valid image`

**Problem:** Image format tidak valid atau base64 decode error.

**Solution:**
```python
# Pastikan format base64 benar
# Format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
# atau hanya base64 string tanpa prefix

# backend/app/utils/image_processing.py
import base64
import numpy as np
from PIL import Image
import io

def decode_base64_image(base64_string: str) -> np.ndarray:
    try:
        # Remove data URI prefix if exists
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        # Decode base64
        image_bytes = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        # Convert to numpy array
        return np.array(image)
        
    except Exception as e:
        raise ValueError(f"Invalid image format: {str(e)}")
```

---

## ⚛️ Frontend Issues

### 1. Error: `Webcam not working / Permission denied`

**Problem:** Browser tidak allow akses kamera.

**Solution:**

#### Chrome/Edge:
1. Klik **padlock icon** di address bar
2. **Site settings** → Camera → Allow
3. Refresh halaman

#### Firefox:
1. Klik **info icon** di address bar
2. **Permissions** → Camera → Allow
3. Refresh halaman

#### HTTPS Requirement (Production):
```
Webcam API butuh secure context:
- ✅ localhost (OK untuk development)
- ✅ https:// (REQUIRED untuk production)
- ❌ http:// (TIDAK BISA di production)
```

**Solution untuk Production:**
- Setup SSL certificate (Let's Encrypt gratis)
- Lihat [docs/DEPLOYMENT.md](DEPLOYMENT.md) untuk setup HTTPS

---

### 2. Error: `MediaPipe model 404 Not Found`

**Problem:** MediaPipe model files tidak ada di `public/models/`.

**Solution:**

#### Automatic Download:
```bash
cd frontend

# Run download script
npm run download-models

# Atau manual:
powershell -ExecutionPolicy Bypass -File download_models.ps1
```

#### Manual Download:
1. Download models dari:
   - Face Detection: https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite
   - Face Mesh: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

2. Taruh di `frontend/public/models/`:
   ```
   public/
   └── models/
       ├── blaze_face_short_range.tflite
       └── face_landmarker.task
   ```

**Verification:**
```bash
# Check files exist
ls frontend/public/models/

# Should see:
# blaze_face_short_range.tflite
# face_landmarker.task
```

---

### 3. Error: `Network Error` saat Login

**Problem:** Frontend tidak bisa connect ke backend API.

**Solution:**

#### Check 1: Backend Running?
```bash
# Check backend status
curl http://localhost:8001/docs

# Should return Swagger UI HTML
```

#### Check 2: CORS Settings
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Frontend dev
        "http://localhost:3000",  # Alternative
        # Add production URL juga
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Check 3: API URL di Frontend
```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:8001/api/v1

# Pastikan tidak ada typo
# Pastikan ada /api/v1 di akhir
# Pastikan tidak ada trailing slash
```

#### Check 4: Firewall
```bash
# Windows Firewall mungkin block port 8001
# Allow port di Windows Defender Firewall settings
```

---

### 4. Error: `Failed to fetch` di Browser Console

**Problem:** Request timeout atau network issue.

**Solution:**

#### Increase Axios Timeout:
```typescript
// frontend/src/services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,  // Increase dari 5000 ke 30000 (30 detik)
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### Check Network Tab:
1. Buka **Developer Tools** (F12)
2. Tab **Network**
3. Coba login lagi
4. Lihat request yang fail
5. Check response dan error message

---

### 5. Error: `Unexpected token '<'` in JSON

**Problem:** API return HTML (error page) instead of JSON.

**Solution:**

#### Check Backend Error:
```bash
# Lihat backend console/logs
# Biasanya ada Python error yang di-return sebagai HTML
```

#### Common Causes:
- **500 Internal Server Error** → Check backend logs
- **404 Not Found** → API endpoint URL salah
- **Nginx/Apache redirect** → Check reverse proxy config

#### Debug:
```typescript
// frontend/src/services/api.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.response);  // Debug log
    
    // Check if response is HTML
    if (error.response?.headers['content-type']?.includes('text/html')) {
      console.error('API returned HTML instead of JSON');
    }
    
    return Promise.reject(error);
  }
);
```

---

## 🎭 Face Recognition Issues

### 1. Face Recognition Tidak Akurat (False Positives/Negatives)

**Problem:** Face matching salah atau tidak detect wajah yang benar.

**Solution:**

#### Adjust Threshold:
```python
# backend/app/core/config.py
class Settings(BaseSettings):
    FACE_DISTANCE_THRESHOLD: float = 0.55  # Default
    
    # Lower = more strict (fewer false positives)
    # Higher = more lenient (fewer false negatives)
    
    # Recommendations:
    # 0.4-0.5: Very strict (good for high security)
    # 0.5-0.6: Balanced (recommended)
    # 0.6-0.7: Lenient (good untuk dataset kecil)
```

#### Improve Face Quality:
```python
# Tambah quality checks di backend/app/services/face_service.py
def check_face_quality(image: np.ndarray) -> dict:
    # 1. Blur Detection
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    if laplacian_var < 100:
        return {"quality": "poor", "reason": "Image too blurry"}
    
    # 2. Brightness Check
    brightness = np.mean(gray)
    if brightness < 50:
        return {"quality": "poor", "reason": "Image too dark"}
    if brightness > 200:
        return {"quality": "poor", "reason": "Image too bright"}
    
    # 3. Face Size Check
    face_locations = face_recognition.face_locations(image)
    if not face_locations:
        return {"quality": "poor", "reason": "No face detected"}
    
    top, right, bottom, left = face_locations[0]
    face_width = right - left
    face_height = bottom - top
    
    if face_width < 80 or face_height < 80:
        return {"quality": "poor", "reason": "Face too small"}
    
    return {"quality": "good"}
```

---

### 2. Liveness Detection Tidak Bekerja

**Problem:** Blink detection tidak detect mata berkedip.

**Solution:**

#### Check MediaPipe Models:
```bash
# Pastikan models downloaded
ls frontend/public/models/face_landmarker.task
```

#### Adjust EAR Threshold:
```typescript
// frontend/src/components/features/face/LivenessDetection.tsx
const EYE_ASPECT_RATIO_THRESHOLD = 0.2;  // Default

// Lower = lebih sensitive (lebih mudah detect blink)
// Higher = kurang sensitive (butuh blink lebih jelas)

// Recommended range: 0.15 - 0.25
```

#### Debug Logging:
```typescript
function calculateEAR(landmarks: any) {
  const ear = /* calculation */;
  console.log('EAR:', ear, 'Threshold:', EYE_ASPECT_RATIO_THRESHOLD);  // Debug
  return ear;
}
```

---

### 3. Face Encoding Terlalu Lambat

**Problem:** Face registration butuh waktu lama.

**Solution:**

#### Optimize Image Processing:
```python
# backend/app/utils/image_processing.py
from PIL import Image

def resize_image_for_processing(image: np.ndarray, max_size: int = 800) -> np.ndarray:
    """Resize image untuk speed up processing tanpa sacrifice accuracy"""
    height, width = image.shape[:2]
    
    if max(height, width) > max_size:
        scale = max_size / max(height, width)
        new_width = int(width * scale)
        new_height = int(height * scale)
        
        pil_image = Image.fromarray(image)
        pil_image = pil_image.resize((new_width, new_height), Image.LANCZOS)
        return np.array(pil_image)
    
    return image
```

#### Use HOG Model (Faster):
```python
# backend/app/services/face_service.py
face_locations = face_recognition.face_locations(
    image, 
    model="hog"  # Faster than "cnn"
)

# HOG: Fast, CPU-friendly, good accuracy
# CNN: Slower, GPU-optimized, slightly better accuracy
```

#### Async Processing (Advanced):
```python
# Process multiple images in parallel
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def encode_faces_async(images: list[np.ndarray]) -> list[list[float]]:
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        tasks = [
            loop.run_in_executor(executor, face_recognition.face_encodings, img)
            for img in images
        ]
        results = await asyncio.gather(*tasks)
    return results
```

---

## 💾 Database Issues

### 1. Error: `table already exists`

**Problem:** Database initialization error.

**Solution:**
```bash
# Delete database dan recreate
cd backend/database
del absensi.db  # Windows
# atau
rm absensi.db   # Linux/Mac

# Recreate database
cd ..
python -m app.db.init_db
```

---

### 2. Error: `Cannot add foreign key constraint`

**Problem:** Foreign key relationship error (rare di SQLite).

**Solution:**
```python
# Enable foreign key support di SQLite
# backend/app/db/session.py
from sqlalchemy import create_engine, event

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
```

---

### 3. Database Corrupt

**Problem:** Database file corrupted.

**Solution:**

#### Option A: Restore Backup
```bash
# Jika punya backup
cp backups/absensi_backup_20260120.db database/absensi.db
```

#### Option B: Export & Reimport
```bash
# Export data
sqlite3 database/absensi.db .dump > backup.sql

# Delete corrupt DB
rm database/absensi.db

# Recreate fresh DB
python -m app.db.init_db

# Import data
sqlite3 database/absensi.db < backup.sql
```

---

## 🚀 Deployment Issues

### 1. Webcam Tidak Bekerja di Production (HTTP)

**Problem:** Browser butuh HTTPS untuk akses kamera.

**Solution:** Setup SSL certificate

Lihat lengkap di [docs/DEPLOYMENT.md](DEPLOYMENT.md)

Quick fix:
```bash
# Use Let's Encrypt (gratis)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d fahrencenter.com -d www.fahrencenter.com
```

---

### 2. Face Recognition Lambat di Server

**Problem:** Server CPU lemah atau tidak optimal.

**Solution:**

#### Use Smaller Model:
```python
# backend/app/services/face_service.py
# Gunakan HOG (CPU-friendly) instead of CNN
face_locations = face_recognition.face_locations(image, model="hog")
```

#### Optimize Image Size:
```python
# Resize images sebelum processing
max_size = 800  # pixels
# Reduce dari 1920x1080 → 800x600 (much faster)
```

#### Upgrade Server:
```
Minimum Recommendations:
- CPU: 2 cores, 2.4 GHz
- RAM: 2GB (untuk < 100 users)
- Storage: 10GB SSD

Recommended:
- CPU: 4 cores, 3.0 GHz
- RAM: 4GB
- Storage: 20GB SSD
```

---

## 🌐 Network & CORS Issues

### 1. CORS Error di Production

**Problem:** `Access-Control-Allow-Origin` error.

**Solution:**
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fahrencenter.com",  # Production URL
        "https://www.fahrencenter.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### 2. API Timeout di Slow Network

**Problem:** Request timeout di koneksi lambat.

**Solution:**

#### Backend:
```python
# backend/run.py
import uvicorn

uvicorn.run(
    "app.main:app",
    host="0.0.0.0",
    port=8001,
    timeout_keep_alive=120,  # Increase timeout
    limit_concurrency=100,
)
```

#### Frontend:
```typescript
// frontend/src/services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,  // 60 seconds
});
```

---

## 🔧 General Tips

### Enable Debug Mode

#### Backend:
```python
# backend/app/main.py
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

#### Frontend:
```typescript
// frontend/src/main.tsx
if (import.meta.env.DEV) {
  console.log('Development mode enabled');
  // Enable more detailed logging
}
```

### Clear Cache & Restart

Kadang masalah resolved dengan:
```bash
# Backend
# Stop server, delete __pycache__, restart

# Frontend
rm -rf node_modules
npm install
npm run dev
```

---

## 📞 Masih Butuh Bantuan?

Jika masalah belum resolved:

1. **Check Documentation:**
   - [README.md](../README.md)
   - [backend/README.md](../backend/README.md)
   - [frontend/README.md](../frontend/README.md)

2. **Check Existing Issues:**
   - GitHub Issues

3. **Create New Issue:**
   - Include error message lengkap
   - Include steps to reproduce
   - Include environment info (OS, Python version, Node version)

---

**Dibuat dengan 💙 oleh Lycus (Affif)**  
**FahrenCenter** - *"Attendance Made Smart"*