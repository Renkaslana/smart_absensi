# ⚡ Quick Start Guide

Panduan cepat untuk menjalankan Smart Absensi - **HANYA 1 LANGKAH!**

---

## 🚀 Instalasi & Jalankan (All-in-One)

### Prerequisites (Install Sekali Saja)
- ✅ **Anaconda/Miniconda** - [Download di sini](https://www.anaconda.com/download)
- ✅ **Node.js 18+** - [Download di sini](https://nodejs.org/)

### Cara Pakai (Super Mudah!)

**1. Clone/Download Project**
```bash
git clone <repository-url>
cd smart_absensi
```

**2. Jalankan Script All-in-One**
```bash
# Double-click atau jalankan:
start_webapp.bat
```

**SELESAI!** 🎉

---

## 🎯 Apa yang Dilakukan Script Otomatis?

Script `start_webapp.bat` akan **SEMUA** setup untuk Anda:

### ✅ Automatic Setup (Pertama Kali - 10-15 menit)
1. **Deteksi Conda** - Cari instalasi Anaconda/Miniconda
2. **Buat Environment** - Setup `smart-absensi` dengan Python 3.11
3. **Install dlib** - Via conda-forge (tanpa CMake!)
4. **Install face_recognition** - Library untuk pengenalan wajah
5. **Install Backend** - Semua Python dependencies
6. **Install Frontend** - Semua npm packages
7. **Buat Admin User** - Otomatis (NIM: admin, Password: admin123)

### ✅ Start Services (Kedua & Selanjutnya - 10-30 detik)
- Kill port yang konflik (8001, 3001)
- Start Backend API (port 8001)
- Start Frontend Web (port 3001)

---

## 🌐 Akses Aplikasi

Setelah script selesai, buka browser:

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3001 |
| **Backend API** | http://localhost:8001 |
| **API Docs** | http://localhost:8001/docs |

### 🔐 Login Admin
| Field | Value |
|-------|-------|
| NIM | `admin` |
| Password | `admin123` |

### 📱 Fitur Utama

**Untuk Mahasiswa:**
- 📸 **Absensi** - http://localhost:3001/absen
- 📋 **Riwayat** - http://localhost:3001/riwayat

**Untuk Admin:**
- 👤 **Registrasi Wajah** - http://localhost:3001/admin/face-register
- 📊 **Dashboard** - http://localhost:3001/admin/dashboard
- 📑 **Laporan** - http://localhost:3001/admin/reports
- 👥 **Data Mahasiswa** - http://localhost:3001/admin/students

---

## 🔄 Cara Menjalankan Ulang

Setiap kali ingin menjalankan aplikasi:

1. **Double-click**: `start_webapp.bat`
2. **Tunggu** sampai muncul "Smart Absensi berhasil dijalankan!"
3. **Buka browser**: http://localhost:3001

**Tidak perlu install ulang!** Script akan skip langkah yang sudah selesai.

---

## 🛑 Cara Menghentikan

Tutup kedua window CMD:
- "Smart Absensi - Backend"  
- "Smart Absensi - Frontend"

---

## 🆘 Troubleshooting

### Conda Tidak Ditemukan?
Script akan memberitahu untuk install Anaconda/Miniconda terlebih dahulu:
- **Anaconda**: https://www.anaconda.com/download
- **Miniconda**: https://docs.conda.io/en/latest/miniconda.html

### Port Sudah Digunakan?
✅ Script otomatis kill proses di port 8001 & 3001

### Face Recognition Error?
✅ Script otomatis install dlib via conda-forge

### Dependencies Tidak Lengkap?
✅ Script otomatis install semua yang dibutuhkan

---

## 📖 Dokumentasi Lengkap

- [INSTALLATION.md](INSTALLATION.md) - Panduan instalasi detail & troubleshooting
- [README.md](README.md) - Dokumentasi lengkap project

**Happy Coding! 🚀**
