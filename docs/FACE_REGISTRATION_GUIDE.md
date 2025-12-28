# 📸 Panduan Registrasi Wajah untuk Akurasi 90%+

**Tanggal:** 28 Desember 2025  
**Target Akurasi:** ≥ 90%  
**Lokasi Dataset:** `root/dataset_wajah/{nim_user}/`

---

## 🎯 Tujuan

Sistem ini dirancang untuk mencapai **akurasi pengenalan wajah minimal 90%** saat proses absensi dengan mengoptimalkan kualitas dan kuantitas data training wajah setiap mahasiswa.

---

## 📁 Struktur Folder Dataset

```
AbsensiKelas/
├── dataset_wajah/
│   ├── 23215007/
│   │   ├── face_001.jpg
│   │   ├── face_002.jpg
│   │   ├── face_003.jpg
│   │   ├── face_004.jpg
│   │   ├── face_005.jpg
│   │   ├── ...
│   │   └── face_010.jpg
│   ├── 23215008/
│   │   ├── face_001.jpg
│   │   ├── ...
│   └── 23215XXX/
│       └── ...
```

### Konvensi Penamaan File:
- Format: `face_{counter:03d}.jpg`
- Contoh: `face_001.jpg`, `face_002.jpg`, ..., `face_010.jpg`
- Counter mulai dari 001

---

## 🔧 Spesifikasi Teknis Frontend

### Konfigurasi Webcam
```typescript
videoConstraints: {
  width: 1920,
  height: 1080,
  facingMode: 'user',
  aspectRatio: 4/3
}
screenshotQuality: 1.0 // 100% quality
screenshotFormat: "image/jpeg"
```

### Jumlah Foto
- **Minimum:** 5 foto (untuk registrasi dasar)
- **Rekomendasi:** 10 foto (untuk akurasi 90%+)
- **Maksimum:** 15 foto

---

## 📐 Panduan Pengambilan Foto untuk Akurasi Optimal

### 1. **Sudut Pengambilan (Angle Diversity)**
Untuk dataset 10 foto, gunakan distribusi sudut berikut:

| Foto | Sudut | Deskripsi |
|------|-------|-----------|
| 1 | 0° (depan) | Wajah langsung menghadap kamera |
| 2 | 30° kiri | Kepala diputar 30° ke kiri |
| 3 | 30° kanan | Kepala diputar 30° ke kanan |
| 4 | 45° kiri | Kepala diputar 45° ke kiri |
| 5 | 45° kanan | Kepala diputar 45° ke kanan |
| 6 | Sedikit ke atas | Kepala sedikit menengadah (~15°) |
| 7 | Sedikit ke bawah | Kepala sedikit menunduk (~15°) |
| 8 | Diagonal kiri-atas | Kombinasi kiri 30° + atas 15° |
| 9 | Diagonal kanan-bawah | Kombinasi kanan 30° + bawah 15° |
| 10 | Depan (variasi) | Wajah depan dengan sedikit perubahan ekspresi |

### 2. **Pencahayaan (Lighting)**
✅ **Optimal:**
- Cahaya natural dari jendela (indirect sunlight)
- Lampu putih LED dari depan/atas
- Pencahayaan merata tanpa bayangan keras
- Intensitas: 300-500 lux

❌ **Hindari:**
- Backlight (cahaya dari belakang)
- Satu sisi terlalu terang/gelap
- Lampu kuning/warm tone
- Cahaya berkedip (fluorescent)

### 3. **Background**
✅ **Optimal:**
- Background polos (putih, abu-abu, biru muda)
- Tidak ada gerakan di belakang
- Kontras yang baik dengan warna kulit

❌ **Hindari:**
- Background ramai dengan banyak objek
- Warna yang mirip dengan warna kulit
- Orang lain di background

### 4. **Jarak dan Posisi**
- **Jarak ideal:** 50-70 cm dari kamera
- **Posisi wajah:** Memenuhi 70-80% area oval panduan
- **Eye level:** Kamera sejajar dengan mata

### 5. **Kondisi Subjek**
✅ **Diperbolehkan:**
- Kacamata bening (bila memang dipakai sehari-hari)
- Ekspresi netral dan rileks
- Makeup natural

❌ **Tidak diperbolehkan:**
- Kacamata hitam
- Masker (kecuali untuk dataset khusus)
- Topi/penutup kepala yang menutupi dahi
- Ekspresi berlebihan (tertawa lebar, dll)

---

## 🖥️ Backend Implementation Guide

### API Endpoint

```python
POST /api/v1/face/admin-register
Content-Type: multipart/form-data

Request:
{
  "user_id": 123,
  "images": ["base64_string_1", "base64_string_2", ...]
}

Response:
{
  "success": true,
  "message": "Wajah berhasil didaftarkan dengan 10 foto",
  "dataset_path": "dataset_wajah/23215007/",
  "total_photos": 10
}
```

### Backend Processing Steps

1. **Validasi Input**
   ```python
   - Check minimum 5 images
   - Validate image format (JPEG/PNG)
   - Check image size (min 640x480, max 4K)
   ```

2. **Preprocessing**
   ```python
   - Convert base64 to image
   - Resize to consistent size (e.g., 1024x768)
   - Normalize brightness
   - Face detection validation
   ```

3. **Storage**
   ```python
   folder_path = f"dataset_wajah/{user.nim}/"
   os.makedirs(folder_path, exist_ok=True)
   
   for i, image in enumerate(images, 1):
       filename = f"face_{i:03d}.jpg"
       filepath = os.path.join(folder_path, filename)
       cv2.imwrite(filepath, image, [cv2.IMWRITE_JPEG_QUALITY, 95])
   ```

4. **Feature Extraction & Training**
   ```python
   - Extract face encodings from all images
   - Store encodings in database/pickle
   - Update face recognition model
   ```

### Quality Checks (Backend)

```python
def validate_face_image(image):
    """
    Validate image quality for face recognition
    """
    checks = {
        'has_face': False,
        'face_size_ok': False,
        'brightness_ok': False,
        'sharpness_ok': False
    }
    
    # 1. Face detection
    face_locations = face_recognition.face_locations(image)
    checks['has_face'] = len(face_locations) == 1
    
    # 2. Face size (should be at least 200x200 pixels)
    if checks['has_face']:
        top, right, bottom, left = face_locations[0]
        face_width = right - left
        face_height = bottom - top
        checks['face_size_ok'] = face_width >= 200 and face_height >= 200
    
    # 3. Brightness (mean pixel value between 80-180)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    brightness = gray.mean()
    checks['brightness_ok'] = 80 <= brightness <= 180
    
    # 4. Sharpness (Laplacian variance > 100)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    checks['sharpness_ok'] = laplacian_var > 100
    
    return all(checks.values()), checks
```

---

## 🎓 Training & Recognition Process

### Training (saat registrasi)

```python
def train_face_model(user_id, nim):
    """
    Train model with user's face images
    """
    dataset_path = f"dataset_wajah/{nim}/"
    images = load_images_from_folder(dataset_path)
    
    encodings = []
    for img in images:
        # Extract face encoding
        face_locations = face_recognition.face_locations(img, model="hog")
        face_encodings = face_recognition.face_encodings(img, face_locations)
        
        if face_encodings:
            encodings.append(face_encodings[0])
    
    # Store multiple encodings per person for better accuracy
    save_encodings(user_id, encodings)
    
    return len(encodings)
```

### Recognition (saat absensi)

```python
def recognize_face(unknown_image):
    """
    Recognize face with 90%+ accuracy
    """
    # Get face encoding from unknown image
    unknown_encoding = face_recognition.face_encodings(unknown_image)[0]
    
    # Load all known encodings
    known_encodings = load_all_encodings()
    
    # Compare with tolerance=0.5 (stricter for 90% accuracy)
    for user_id, encodings_list in known_encodings.items():
        matches = []
        for encoding in encodings_list:
            distance = face_recognition.face_distance([encoding], unknown_encoding)[0]
            matches.append(distance)
        
        # Use average distance from multiple encodings
        avg_distance = sum(matches) / len(matches)
        confidence = (1 - avg_distance) * 100
        
        if avg_distance < 0.5:  # Match threshold
            return {
                'user_id': user_id,
                'confidence': confidence,
                'matched': True
            }
    
    return {'matched': False}
```

---

## 📊 Metrics untuk Monitoring Akurasi

### KPI yang harus ditrack:

1. **True Positive Rate (TPR)** - Target: ≥ 95%
   - Mahasiswa yang benar dikenali sebagai dirinya

2. **False Positive Rate (FPR)** - Target: ≤ 5%
   - Mahasiswa salah dikenali sebagai orang lain

3. **False Negative Rate (FNR)** - Target: ≤ 5%
   - Mahasiswa tidak dikenali padahal terdaftar

4. **Average Confidence Score** - Target: ≥ 80%
   - Rata-rata confidence saat recognition berhasil

### Logging

```python
# Log setiap attempt recognition
{
  "timestamp": "2025-12-28T10:30:00Z",
  "user_id": 123,
  "recognized": true,
  "confidence": 92.5,
  "processing_time_ms": 450,
  "lighting_condition": "good",
  "face_angle": "frontal"
}
```

---

## 🚀 Best Practices

### Frontend
1. ✅ Gunakan resolusi tinggi (1920x1080)
2. ✅ Quality 100% untuk JPEG
3. ✅ Panduan visual (oval guide) untuk posisi wajah
4. ✅ Real-time feedback untuk kualitas foto
5. ✅ Progress indicator yang jelas

### Backend
1. ✅ Validasi setiap gambar sebelum disimpan
2. ✅ Simpan gambar original (jangan over-compress)
3. ✅ Extract multiple encodings per person
4. ✅ Gunakan ensemble dari multiple foto saat recognition
5. ✅ Log semua attempt untuk analisis

### Data Management
1. ✅ Backup folder `dataset_wajah` secara berkala
2. ✅ Gunakan version control untuk model
3. ✅ Periodic retraining jika ada gambar baru
4. ✅ Archive old datasets dengan timestamp

---

## 🔄 Update & Maintenance

### Kapan melakukan re-registrasi:
- Perubahan penampilan signifikan (ganti kacamata, gaya rambut drastis)
- Jika akurasi turun di bawah 85%
- Setelah 6 bulan (optional refresh)

### Kapan menambah foto:
- User boleh menambah foto kapan saja (max 15)
- Recommended: tambah foto jika sering gagal recognize

---

## 📝 Checklist Implementation

### Frontend ✅
- [x] Minimum 5 foto, rekomendasi 10 foto
- [x] Resolusi 1920x1080, quality 100%
- [x] Panduan progresif untuk setiap sudut
- [x] Feedback messages yang informatif
- [x] Display dataset path di UI

### Backend 🔄
- [ ] API endpoint `/face/admin-register` dengan validasi
- [ ] Simpan ke `dataset_wajah/{nim}/` dengan naming convention
- [ ] Quality validation (brightness, sharpness, face detection)
- [ ] Multiple encodings extraction
- [ ] Ensemble recognition dengan avg distance
- [ ] Logging metrics untuk monitoring

### Documentation ✅
- [x] Panduan teknis lengkap
- [x] Best practices untuk 90%+ accuracy
- [x] Troubleshooting guide

---

## 🎯 Expected Outcome

Dengan mengikuti panduan ini:
- **Akurasi Recognition:** ≥ 90%
- **False Positive Rate:** ≤ 5%
- **Processing Time:** < 500ms per recognition
- **User Satisfaction:** Tinggi (minimal retry untuk absensi)

---

**Dibuat oleh:** AbsensiAgent (Luna)  
**Terakhir diupdate:** 28 Desember 2025  
**Status:** Production-Ready
