# 🎯 Smart Absensi Berbasis Wajah

Sistem absensi berbasis pengenalan wajah (face recognition) dengan dua versi:
- **Prototype**: Jupyter Notebook untuk development dan testing
- **Web Application**: Full-stack web app (FastAPI + Next.js) untuk production

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)
![Face Recognition](https://img.shields.io/badge/Face_Recognition-1.3.0-orange.svg)

---

## 📋 Fitur Utama

### 🔬 Versi Prototype (Jupyter Notebook)
✅ Registrasi wajah via kamera  
✅ Deteksi wajah realtime  
✅ Absensi otomatis dengan timestamp  
✅ Export data ke CSV  
✅ Visualisasi statistik  

### 🌐 Versi Web Application
✅ **Authentication** - Login/Register dengan JWT  
✅ **Role-based Access** - Admin & User (Mahasiswa)  
✅ **Face Registration** - Upload/capture minimal 3 foto untuk akurasi tinggi  
✅ **Face Recognition** - Pengenalan wajah dengan confidence score  
✅ **Liveness Detection** - Anti-spoofing (blink detection)  
✅ **Admin Dashboard** - Kelola users, lihat statistik, generate laporan  
✅ **Attendance History** - Riwayat absensi lengkap  
✅ **Responsive Design** - Mobile-friendly UI  

---

## 📁 Struktur Proyek

```
smart-absensi/
├── preprocessing.ipynb    # 🔬 Prototype Jupyter Notebook
├── backend/               # 🐍 Backend API (FastAPI)
│   ├── main.py           # Entry point
│   ├── config.py         # Configuration
│   ├── routes/           # API endpoints
│   │   ├── auth.py       # Authentication
│   │   ├── face.py       # Face registration/recognition
│   │   ├── absensi.py    # Attendance
│   │   └── admin.py      # Admin features
│   ├── services/         # Business logic
│   │   ├── face_recognition_service.py
│   │   ├── liveness_detection.py
│   │   └── preprocessing.py
│   ├── database/         # Database layer
│   │   └── db_service.py
│   └── utils/            # Utilities
│       └── security.py
├── frontend/              # ⚛️ Frontend (Next.js 14)
│   ├── src/app/          # App Router pages
│   │   ├── login/        # Login page
│   │   ├── register/     # Register page
│   │   ├── dashboard/    # User dashboard
│   │   │   ├── absensi/  # Attendance page
│   │   │   ├── face-register/  # Face registration
│   │   │   └── history/  # Attendance history
│   │   └── admin/        # Admin dashboard
│   │       ├── students/ # Student management
│   │       ├── reports/  # Reports
│   │       └── face-register/  # Admin face registration
│   └── src/lib/          # API & utilities
├── dataset_wajah/         # 📸 Foto wajah registrasi
├── encodings/             # 🧠 File encoding wajah (.pickle)
├── output/                # 📷 Foto hasil absensi
├── uploads/               # 📤 File uploads
├── smart_absensi.db       # 💾 Database SQLite (web)
├── absensi.csv            # 📊 Log absensi (prototype)
├── requirements.txt       # Python dependencies
├── start_project.bat      # 🚀 Script start prototype
├── start_webapp.bat       # 🚀 Script start web app
├── create_admin.py        # 👤 Script buat admin
├── INSTALLATION.md        # 📖 Panduan instalasi lengkap
├── QUICK_START.md         # ⚡ Quick start guide
└── README.md              # 📖 Dokumentasi (file ini)
```

---

## 🚀 Quick Start

### Versi Web Application (Recommended)

```bash
# 1. Clone & Setup Backend
conda create -n smart-absensi python=3.11 -y
conda activate smart-absensi
pip install -r requirements.txt

# 2. Setup Frontend
cd frontend
npm install

# 3. Buat Admin User
cd ..
python create_admin.py

# 4. Jalankan (pilih salah satu)

# Opsi A: Menggunakan script (Windows)
start_webapp.bat

# Opsi B: Manual (2 terminal)
# Terminal 1 - Backend:
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001

# Terminal 2 - Frontend:
cd frontend && npm run dev
```

**Akses:**
- 🌐 **Web App**: http://localhost:3000
- 📚 **API Docs**: http://localhost:8001/docs
- 👤 **Admin Login**: `admin` / `admin123`

### Versi Prototype (Jupyter Notebook)

```bash
# 1. Setup environment
conda create -n smart-absensi python=3.11 -y
conda activate smart-absensi
conda install -c conda-forge opencv pandas jupyter pillow -y
pip install numpy==1.26.4 cmake dlib face-recognition

# 2. Jalankan
jupyter notebook
# Atau: start_project.bat (Windows)

# 3. Buka preprocessing.ipynb
```

> 📖 **Panduan lengkap: [INSTALLATION.md](INSTALLATION.md)**

---

## 🔐 Login Credentials

### Admin Default
| Field | Value |
|-------|-------|
| NIM | `admin` |
| Password | `admin123` |
| Role | Administrator |

### User Baru
- Register melalui `/register` atau dibuat oleh admin di `/admin/students`
- Setelah register, daftarkan wajah di `/dashboard/face-register`

---

## 📸 Cara Registrasi Wajah (Web)

> ⚠️ **Penting**: Minimal **3 foto** dari sudut berbeda untuk akurasi tinggi!

### Untuk User:
1. Login → Dashboard → **Daftar Wajah**
2. Aktifkan kamera
3. Ambil **3+ foto** dari sudut berbeda:
   - 📸 Foto 1: Wajah depan (frontal)
   - 📸 Foto 2: Wajah miring kiri (~15°)
   - 📸 Foto 3: Wajah miring kanan (~15°)
4. Klik **"Daftarkan"**

### Untuk Admin:
1. Login Admin → **Registrasi Wajah**
2. Pilih mahasiswa dari dropdown
3. Ambil **3+ foto** wajah mahasiswa
4. Klik **"Daftarkan"**

---

## 📊 Melakukan Absensi

### Via Web (Tanpa Login)
1. Buka http://localhost:3000
2. Klik **"Mulai Absensi"** di halaman utama
3. Izinkan akses kamera
4. Posisikan wajah di frame
5. Sistem akan otomatis mengenali dan mencatat absensi

### Via Dashboard (Dengan Login)
1. Login → Dashboard → **Absensi**
2. Klik **"Mulai Scan"**
3. Posisikan wajah
4. Tunggu verifikasi dan konfirmasi

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.104+ | REST API Framework |
| SQLite | - | Database |
| face_recognition | 1.3.0 | Face Detection & Encoding |
| OpenCV | 4.11+ | Image Processing |
| JWT | - | Authentication |
| bcrypt | - | Password Hashing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14 | React Framework |
| TypeScript | 5+ | Type Safety |
| Tailwind CSS | 3+ | Styling |
| Framer Motion | - | Animations |
| Axios | - | HTTP Client |
| react-webcam | - | Camera Access |

---

## ⚙️ Konfigurasi

### Port Configuration
| Service | Default Port | Environment Variable |
|---------|--------------|---------------------|
| Backend | 8001 | `--port 8001` |
| Frontend | 3000 | `PORT=3000` |

### Environment Variables

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Face Recognition Settings
| Parameter | Default | Description |
|-----------|---------|-------------|
| `recognition_tolerance` | 0.6 | Lower = stricter matching |
| `min_confidence` | 60.0 | Minimum confidence % |
| `min_photos` | 3 | Minimum photos for registration |

---

## 🔍 Troubleshooting

### Port 8000 Blocked (Windows)
```bash
# Gunakan port 8001
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001
```

### face_recognition Install Error
```bash
# Windows: Install Visual C++ Build Tools dulu
# Download: https://visualstudio.microsoft.com/downloads/

# Atau gunakan prebuilt wheel
pip install https://github.com/jloh02/dlib/releases/download/v19.22/dlib-19.22.99-cp311-cp311-win_amd64.whl
pip install face-recognition
```

### NumPy Compatibility
```bash
pip uninstall numpy -y
pip install numpy==1.26.4
```

### CORS Error
Pastikan backend sudah running dan URL di `.env.local` benar.

> 📖 **Troubleshooting lengkap: [INSTALLATION.md](INSTALLATION.md)**

---

## 📈 Fitur Mendatang (Roadmap)

- [ ] Multi-camera support
- [ ] Cloud database (PostgreSQL/MySQL)
- [ ] Mobile app (React Native)
- [ ] Advanced liveness detection
- [ ] Face mask detection
- [ ] Integration dengan sistem akademik
- [ ] Export PDF reports
- [ ] Email notifications

---

## 📝 Catatan Penting

### Keamanan
- ⚠️ Jangan share folder `encodings/` dan `dataset_wajah/`
- ⚠️ Ganti password admin default di production
- ⚠️ Gunakan HTTPS di production

### Best Practices Registrasi Wajah
- ✅ Pencahayaan baik dan merata
- ✅ Wajah tidak tertutup (tanpa masker/kacamata hitam)
- ✅ Foto dari berbagai sudut
- ✅ Ekspresi netral
- ❌ Hindari backlight
- ❌ Hindari foto blur

---

## 📚 Dokumentasi Lengkap

| Dokumen | Deskripsi |
|---------|-----------|
| [INSTALLATION.md](INSTALLATION.md) | Panduan instalasi lengkap |
| [QUICK_START.md](QUICK_START.md) | Quick start guide |
| [/docs](http://localhost:8001/docs) | API Documentation (Swagger) |

---

## 🎓 Tentang Proyek

Smart Absensi adalah sistem absensi berbasis pengenalan wajah yang dikembangkan untuk keperluan akademik. Proyek ini dimulai sebagai prototype Jupyter Notebook dan kemudian dikembangkan menjadi full-stack web application.

**Teknologi Utama:**
- **Face Detection**: HOG (Histogram of Oriented Gradients)
- **Face Encoding**: 128-dimensional face embedding
- **Matching**: Euclidean distance dengan threshold

---

## 📄 License

MIT License - Bebas digunakan untuk keperluan pribadi dan komersial.

---

## 🎉 Selamat Menggunakan!

**Happy Coding!** 🚀
