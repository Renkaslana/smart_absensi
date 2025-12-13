# ⚡ Quick Start Guide

Panduan cepat untuk menjalankan Smart Absensi dalam 5 menit!

---

## 🌐 Versi Web Application (Recommended)

### Prerequisites
- ✅ Python 3.11+
- ✅ Node.js 18+
- ✅ Anaconda/Miniconda

### Install & Run (Super Simple!)

**Opsi A: Otomatis (RECOMMENDED) - Hanya 1 Langkah!**
```bash
# Jalankan script ini - semua otomatis!
start_webapp.bat
```

Script ini akan otomatis:
- ✅ Install frontend dependencies (jika belum)
- ✅ Install backend dependencies (jika belum)
- ✅ **Membuat admin user** (jika belum ada)
- ✅ Start backend dan frontend server

**Opsi B: Manual Setup (Jika perlu)**
```bash
# 1. Setup Backend
conda create -n smart-absensi python=3.11 -y
conda activate smart-absensi
pip install -r requirements.txt

# 2. Setup Frontend
cd frontend
npm install
cd ..

# 3. Jalankan (2 terminal)
# Terminal 1:
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001

# Terminal 2:
cd frontend && npm run dev
```

> 💡 **Catatan**: Admin user **otomatis dibuat** saat pertama kali run `start_webapp.bat`. Tidak perlu manual create admin!

### 🔐 Login Admin
| Field | Value |
|-------|-------|
| NIM | `admin` |
| Password | `admin123` |

### 📱 Cara Pakai

1. **Login Admin** → http://localhost:3000/login
2. **Tambah Mahasiswa** → Admin Dashboard → Students → Tambah
3. **Registrasi Wajah** → Admin Dashboard → Registrasi Wajah
   - Pilih mahasiswa
   - Ambil **3+ foto** dari sudut berbeda
   - Klik "Daftarkan"
4. **Absensi** → http://localhost:3000 → "Mulai Absensi"
5. **Lihat Laporan** → Admin Dashboard → Reports

---

## 🔬 Versi Prototype (Jupyter Notebook)

### Install & Run (3 Langkah)

```bash
# 1. Setup
conda create -n smart-absensi python=3.11 -y
conda activate smart-absensi
conda install -c conda-forge opencv pandas jupyter pillow -y
pip install numpy==1.26.4 cmake dlib face-recognition

# 2. Jalankan
jupyter notebook
# Atau: start_project.bat (Windows)

# 3. Buka preprocessing.ipynb
```

### 📱 Cara Pakai

1. **Registrasi**: Cell B → Input nama & NIM → Tekan 'c' 3x
2. **Absensi**: Cell C → Posisikan wajah → Otomatis tercatat
3. **Lihat Data**: Cell D

---

## 🆘 Masalah Umum

### Port 8000 Blocked?
```bash
# Gunakan port 8001
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001
```

### dlib Error? (Prototype only)
```bash
# Windows: Gunakan conda-forge (PALING MUDAH!)
conda activate smart-absensi
pip uninstall dlib cmake -y
conda remove cmake -y 2>nul
conda install -c conda-forge dlib -y
pip install face-recognition
```

### NumPy Error?
```bash
pip uninstall numpy -y
pip install numpy==1.26.4
```

---

## 📖 Dokumentasi Lengkap

- [INSTALLATION.md](INSTALLATION.md) - Panduan instalasi detail
- [README.md](README.md) - Dokumentasi lengkap
- http://localhost:8001/docs - API Documentation

---

**Happy Coding! 🚀**
