# Smart Absensi - Face Detection Configuration

"""
Konfigurasi untuk optimasi face detection dan recognition.
Sesuaikan parameter di sini untuk mengubah behavior sistem.
"""

# ===========================
# FACE RECOGNITION SETTINGS
# ===========================

# Tolerance untuk face matching (0.0 - 1.0)
# Semakin RENDAH = semakin KETAT (sulit match)
# Semakin TINGGI = semakin LONGGAR (mudah match, risiko false positive)
# Recommended: 0.50 - 0.60
RECOGNITION_TOLERANCE = 0.55

# Minimum confidence untuk valid match (0 - 100%)
# Semakin RENDAH = lebih mudah dikenali
# Semakin TINGGI = lebih ketat
# Recommended: 45 - 60%
MIN_CONFIDENCE = 50.0

# Encoding method
# Options: "face_recognition" (recommended), "lbph", "hybrid"
ENCODING_METHOD = "face_recognition"

# ===========================
# IMAGE PROCESSING SETTINGS
# ===========================

# Resize factor untuk processing (0.1 - 1.0)
# Semakin KECIL = lebih cepat tapi kurang akurat
# Semakin BESAR = lebih lambat tapi lebih akurat
# Recommended: 0.4 - 0.6
RESIZE_FACTOR = 0.5

# Detection model
# Options: "hog" (fast), "cnn" (accurate but slow)
# Recommended: "hog" untuk real-time
DETECTION_MODEL = "hog"

# Number of times to upsample (untuk CNN)
# Semakin TINGGI = deteksi lebih baik tapi lebih lambat
# Recommended: 0 - 2
NUM_UPSAMPLE = 1

# ===========================
# IMAGE ENHANCEMENT SETTINGS
# ===========================

# CLAHE (Contrast Limited Adaptive Histogram Equalization)
# Clip limit untuk CLAHE (1.0 - 5.0)
# Semakin TINGGI = kontras lebih kuat
CLAHE_CLIP_LIMIT = 3.0

# Tile grid size untuk CLAHE
# Default: (8, 8)
CLAHE_TILE_GRID = (8, 8)

# Denoise strength (0 - 20)
# Semakin TINGGI = lebih smooth tapi detail berkurang
DENOISE_STRENGTH = 10

# ===========================
# REGISTRATION SETTINGS
# ===========================

# Minimum images untuk registrasi
MIN_REGISTRATION_IMAGES = 3

# Maximum images untuk registrasi
MAX_REGISTRATION_IMAGES = 10

# Minimum encodings per person untuk valid
MIN_ENCODINGS_PER_PERSON = 3

# ===========================
# CAMERA SETTINGS (Frontend)
# ===========================

# Video resolution
# Options: (640, 480), (1280, 720), (1920, 1080)
# Higher = better quality but more bandwidth
VIDEO_WIDTH = 1280
VIDEO_HEIGHT = 720

# Auto-scan interval (milliseconds)
# Lower = faster scan but more server load
AUTO_SCAN_INTERVAL = 1000  # 1 second

# Scan debounce (milliseconds)
# Minimum time between scans
SCAN_DEBOUNCE = 2000  # 2 seconds

# ===========================
# PERFORMANCE SETTINGS
# ===========================

# Process every N frames (untuk realtime)
# Higher = faster but less accurate tracking
PROCESS_EVERY_N_FRAMES = 3

# Maximum faces to process per frame
MAX_FACES_PER_FRAME = 3

# ===========================
# SECURITY SETTINGS
# ===========================

# Rate limiting
RATE_LIMIT_REQUESTS = 30
RATE_LIMIT_WINDOW = 60  # seconds

# Liveness detection (experimental)
ENABLE_LIVENESS_DETECTION = False
LIVENESS_BLINK_REQUIRED = True

# ===========================
# REKOMENDASI PRESET
# ===========================

# PRESET 1: BALANCED (Default)
# - RECOGNITION_TOLERANCE = 0.55
# - MIN_CONFIDENCE = 50.0
# - RESIZE_FACTOR = 0.5
# Good balance antara speed dan accuracy

# PRESET 2: FAST
# - RECOGNITION_TOLERANCE = 0.60
# - MIN_CONFIDENCE = 45.0
# - RESIZE_FACTOR = 0.4
# Lebih cepat, lebih mudah match, risiko false positive lebih tinggi

# PRESET 3: ACCURATE
# - RECOGNITION_TOLERANCE = 0.50
# - MIN_CONFIDENCE = 60.0
# - RESIZE_FACTOR = 0.6
# Lebih akurat, lebih ketat, mungkin lebih lambat

# PRESET 4: VERY STRICT
# - RECOGNITION_TOLERANCE = 0.45
# - MIN_CONFIDENCE = 70.0
# - RESIZE_FACTOR = 0.75
# Sangat ketat, cocok untuk high-security

# ===========================
# TROUBLESHOOTING GUIDE
# ===========================

"""
Problem: Wajah terdaftar tidak terdeteksi
Solution: 
- Turunkan MIN_CONFIDENCE (misal ke 45%)
- Naikkan RECOGNITION_TOLERANCE (misal ke 0.60)
- Naikkan RESIZE_FACTOR (misal ke 0.6)

Problem: Terlalu banyak false positive
Solution:
- Naikkan MIN_CONFIDENCE (misal ke 60%)
- Turunkan RECOGNITION_TOLERANCE (misal ke 0.50)
- Pastikan foto registrasi berkualitas baik

Problem: Deteksi terlalu lambat
Solution:
- Turunkan RESIZE_FACTOR (misal ke 0.4)
- Turunkan VIDEO_WIDTH/HEIGHT
- Naikkan AUTO_SCAN_INTERVAL

Problem: Gagal deteksi di low light
Solution:
- Naikkan CLAHE_CLIP_LIMIT (misal ke 4.0)
- Pastikan DENOISE_STRENGTH tidak terlalu tinggi
- Gunakan pencahayaan yang lebih baik

Problem: Deteksi tidak stabil
Solution:
- Naikkan SCAN_DEBOUNCE
- Turunkan AUTO_SCAN_INTERVAL
- Pastikan pencahayaan konsisten
"""
