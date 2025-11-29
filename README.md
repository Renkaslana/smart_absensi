# 🎯 Smart Absensi Berbasis Wajah

Sistem absensi realtime menggunakan face recognition dengan Python yang berjalan di Jupyter Notebook.

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![OpenCV](https://img.shields.io/badge/OpenCV-4.11.0-green.svg)
![Face Recognition](https://img.shields.io/badge/Face_Recognition-1.3.0-orange.svg)
![NumPy](https://img.shields.io/badge/NumPy-1.26.4-yellow.svg)

---

## 📋 Fitur Utama

✅ **Registrasi Wajah** - Daftarkan wajah baru dengan mudah melalui kamera  
✅ **Deteksi Realtime** - Deteksi wajah secara realtime dengan akurasi tinggi  
✅ **Absensi Otomatis** - Pencatatan absensi otomatis dengan timestamp  
✅ **Visualisasi Data** - Lihat statistik dan laporan absensi  
✅ **Export Data** - Export ke CSV/Excel untuk analisis lebih lanjut  
✅ **Penanganan Error** - Auto-detect kamera dengan fallback mechanism  
✅ **Batch Scripts** - File .bat untuk memudahkan startup project

---

## 📁 Struktur Proyek

```
Smart-Absensi/
├── dataset_wajah/        # Foto wajah yang diregistrasi
├── encodings/            # File encoding wajah (.pickle)
├── output/               # Foto hasil absensi
├── notebook.ipynb        # Jupyter Notebook utama
├── absensi.csv           # Database log absensi
├── start_project.bat     # Script untuk memulai project (interaktif)
├── start_jupyter.bat     # Script untuk langsung buka Jupyter
├── open_anaconda_prompt.bat  # Script untuk buka Anaconda Prompt
├── requirements.txt      # Daftar library dengan versi
├── SETUP_CONDA.md        # Panduan instalasi lengkap
├── FAQ.md                # Pertanyaan yang sering diajukan
└── README.md             # File ini
```

---

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Buat environment conda baru (Python 3.11)
conda create -n smart-absensi python=3.11 -y

# Aktifkan environment
conda activate smart-absensi

# Install dependencies
conda install -c conda-forge opencv pandas jupyter pillow -y
pip install numpy==1.26.4
pip install cmake dlib face-recognition
```

**Catatan Penting:**
- **Python 3.11** direkomendasikan (kompatibel dengan semua library)
- **NumPy 1.26.4** (wajib, versi lain mungkin tidak kompatibel)
- **Pillow** diperlukan untuk kompatibilitas face_recognition
- Untuk Windows: Jika instalasi dlib gagal, lihat `SETUP_CONDA.md`

### 2. Jalankan Project

**Opsi A: Menggunakan Batch Script (Paling Mudah)**
```bash
# Double-click file:
start_jupyter.bat        # Langsung buka Jupyter
# atau
start_project.bat        # Menu interaktif
```

**Opsi B: Manual**
```bash
conda activate smart-absensi
cd "C:\my Project\Smart-Absensi"
jupyter notebook
```

### 3. Mulai Menggunakan

1. **Jalankan cell pertama** untuk import library dan test kamera
2. **Registrasi wajah** dengan menjalankan cell di bagian "B. MODUL REGISTRASI WAJAH"
3. **Mulai absensi** dengan menjalankan cell di bagian "C. MODUL ABSENSI WAJAH"
4. **Lihat hasil** di bagian "D. VISUALISASI DATA ABSENSI"

---

## 📖 Cara Penggunaan

### Registrasi Wajah Baru

1. Jalankan cell registrasi
2. Masukkan nama dan ID/NIM
3. Posisikan wajah di depan kamera
4. Tekan **'c'** untuk capture
5. Sistem akan menyimpan foto dan encoding wajah

### Melakukan Absensi

1. Jalankan cell absensi realtime
2. Posisikan wajah di depan kamera
3. Sistem akan otomatis mendeteksi dan mencatat absensi
4. Tekan **'q'** untuk keluar

### Melihat Data Absensi

1. Jalankan cell visualisasi data
2. Lihat tabel lengkap data absensi
3. Lihat statistik jumlah absensi per orang
4. Export ke Excel/CSV jika diperlukan

---

## 🛠️ Teknologi yang Digunakan

| Library | Versi | Fungsi |
|---------|-------|--------|
| **Python** | 3.11+ | Runtime environment |
| **OpenCV** | 4.11.0 | Capture video dan manipulasi gambar |
| **face_recognition** | 1.3.0 | Deteksi dan encoding wajah |
| **dlib** | 19.24+ | Face detection model |
| **NumPy** | 1.26.4 | Operasi array dan matematika |
| **Pandas** | 2.3+ | Manajemen data dan export |
| **Pillow** | 11.3+ | Image processing |
| **Jupyter** | Latest | Interactive notebook environment |

---

## ⚙️ Konfigurasi

### Setting Kamera

Sistem akan otomatis mencari kamera di index 0, 1, dan 2. Jika kamera tidak terdeteksi, periksa:
- Apakah kamera digunakan aplikasi lain
- Permission kamera di sistem operasi
- Driver kamera terinstall dengan benar

### Toleransi Face Recognition

Default tolerance: **0.6**

- **< 0.6**: Lebih strict (kurangi false positive)
- **> 0.6**: Lebih lenient (tingkatkan detection rate)

Edit di cell fungsi `absensi_realtime()`:
```python
matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.6)
```

### Resize Frame untuk Performa

Default: **0.25x** (1/4 ukuran asli)

- **0.25x**: Cepat, cocok untuk komputer standar
- **0.5x**: Balanced, cocok untuk komputer menengah
- **1.0x**: Full quality, perlu komputer powerful

Edit di cell fungsi `absensi_realtime()`:
```python
small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
```

---

## 📊 Format Data

### absensi.csv

| Kolom | Deskripsi | Contoh |
|-------|-----------|--------|
| nama | Nama lengkap | John Doe |
| id | NIM/ID unik | 12345678 |
| waktu | Timestamp absensi | 2025-11-28 10:30:45 |

### Encoding Files (.pickle)

Disimpan di folder `encodings/` dengan format:
```python
{
    'nama': 'John Doe',
    'id': '12345678',
    'encoding': [array of 128 float values]
}
```

---

## 🔍 Troubleshooting

### Error: "Unsupported image type, must be 8bit gray or RGB image"

**Penyebab:** NumPy versi tidak kompatibel atau format array tidak benar

**Solusi:**
```bash
conda activate smart-absensi
pip uninstall numpy -y
pip install numpy==1.26.4
```
Kemudian restart kernel Jupyter.

### Error: "No module named 'numpy._core'"

**Penyebab:** NumPy versi terlalu lama untuk Python 3.11

**Solusi:**
```bash
pip install numpy==1.26.4
```

### Kamera Tidak Terdeteksi

**Solusi:**
- Tutup aplikasi lain yang menggunakan kamera
- Restart kernel Jupyter
- Coba index kamera berbeda (0, 1, atau 2)
- Periksa permission kamera di sistem

### Wajah Tidak Terdeteksi

**Solusi:**
- Perbaiki pencahayaan ruangan
- Posisikan wajah menghadap langsung ke kamera
- Jangan terlalu jauh atau dekat (jarak ideal: 50-100 cm)
- Pastikan wajah tidak tertutup (masker, topi, dll)

### Error Import dlib

**Solusi untuk Windows:**
```bash
pip install cmake
pip install dlib
```

Jika masih error, gunakan wheel prebuilt:
```bash
pip install https://github.com/jloh02/dlib/releases/download/v19.22/dlib-19.22.99-cp39-cp39-win_amd64.whl
```

**Solusi untuk Linux/Mac:**
```bash
sudo apt-get install cmake  # Ubuntu/Debian
# atau
brew install cmake  # macOS

pip install dlib
```

### Performance Issues

**Solusi:**
- Kurangi ukuran frame (fx=0.2 atau 0.15)
- Tingkatkan `process_every_n_frames` (misal: 3 atau 4)
- Tutup aplikasi lain yang berat

---

## 📝 Tips dan Best Practices

### Registrasi Wajah

✅ **DO:**
- Gunakan pencahayaan yang baik dan merata
- Foto wajah langsung menghadap kamera
- Gunakan background yang polos
- Pastikan wajah terlihat jelas tanpa bayangan

❌ **DON'T:**
- Registrasi di tempat gelap
- Wajah terlalu miring atau samping
- Memakai aksesoris berlebihan saat registrasi
- Registrasi dengan kualitas gambar buruk

### Absensi

✅ **DO:**
- Gunakan kondisi pencahayaan yang sama dengan saat registrasi
- Posisikan wajah di tengah frame
- Tunggu sampai kotak hijau muncul
- Biarkan sistem beberapa detik untuk deteksi

❌ **DON'T:**
- Bergerak terlalu cepat
- Menutupi sebagian wajah
- Absensi di tempat dengan pencahayaan berbeda drastis

---

## 🔒 Keamanan dan Privacy

⚠️ **Penting:**
- File encoding wajah bersifat sensitif
- Jangan share folder `encodings/` dan `dataset_wajah/`
- Simpan backup data absensi secara berkala
- Gunakan sistem ini sesuai regulasi privasi yang berlaku

---

## 📈 Roadmap

- [ ] Multi-camera support
- [ ] Cloud database integration
- [ ] Web dashboard
- [ ] Mobile app companion
- [ ] Advanced analytics
- [ ] Liveness detection
- [ ] Mask detection
- [ ] Integration dengan sistem akademik

---

## 🤝 Kontribusi

Proyek ini dibuat untuk keperluan edukasi dan prototype. Silakan gunakan, modifikasi, dan kembangkan sesuai kebutuhan.

---

## 📄 License

MIT License - Silakan gunakan untuk keperluan pribadi dan komersial.

---

## 👨‍💻 Kontak & Support

Jika ada pertanyaan atau masalah, silakan:
- Buka issue di [repository GitHub](https://github.com/Renkaslana/smart-absensi)
- Baca dokumentasi di `SETUP_CONDA.md`
- Cek troubleshooting guide di atas

---

## 🎉 Selamat Menggunakan!

Sistem Smart Absensi Berbasis Wajah siap membantu Anda mengelola absensi dengan mudah dan efisien.

**Happy Coding!** 🚀
