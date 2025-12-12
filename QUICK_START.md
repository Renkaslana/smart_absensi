# ⚡ Quick Start Guide

Panduan cepat untuk menjalankan Smart Absensi dalam 5 menit!

---

## 🌐 Versi Web Application (Recommended)

### Prerequisites
- ✅ Python 3.11+
- ✅ Node.js 18+
- ✅ Anaconda/Miniconda

### Install & Run (5 Langkah)

```bash
# 1. Setup Backend
conda create -n smart-absensi python=3.11 -y
conda activate smart-absensi
pip install -r requirements.txt

# 2. Setup Frontend
cd frontend
npm install
cd ..

# 3. Buat Admin
python create_admin.py

# 4. Jalankan (pilih salah satu)

# Opsi A: Script (Windows)
start_webapp.bat

# Opsi B: Manual (2 terminal)
# Terminal 1:
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001

# Terminal 2:
cd frontend && npm run dev

# 5. Buka Browser
# http://localhost:3000
```

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

### dlib Error?
```bash
# Windows: Gunakan prebuilt
pip install https://github.com/jloh02/dlib/releases/download/v19.22/dlib-19.22.99-cp311-cp311-win_amd64.whl
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
