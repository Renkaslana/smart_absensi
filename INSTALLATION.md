# 📦 Panduan Instalasi Smart Absensi

Dokumentasi lengkap untuk instalasi dan setup project Smart Absensi.

---

## 📋 Daftar Isi

1. [Persyaratan Sistem](#-persyaratan-sistem)
2. [Instalasi Versi Web Application](#-instalasi-versi-web-application-recommended)
3. [Instalasi Versi Prototype](#-instalasi-versi-prototype-jupyter-notebook)
4. [Konfigurasi](#-konfigurasi)
5. [Troubleshooting](#-troubleshooting)

---

## 🖥️ Persyaratan Sistem

### Minimum Requirements

| Komponen | Spesifikasi |
|----------|-------------|
| **OS** | Windows 10/11, Linux, macOS |
| **RAM** | 4 GB (8 GB recommended) |
| **Storage** | 2 GB free space |
| **Python** | 3.11+ (wajib) |
| **Node.js** | 18+ (untuk web version) |
| **Kamera** | Webcam built-in atau external |

### Software yang Diperlukan

| Software | Versi | Download |
|----------|-------|----------|
| Python | 3.11+ | [python.org](https://python.org) |
| Anaconda/Miniconda | Latest | [anaconda.com](https://anaconda.com/download) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Visual C++ Build Tools | Latest | [visualstudio.com](https://visualstudio.microsoft.com/downloads/) |

---

## 🌐 Instalasi Versi Web Application (Recommended)

### Step 1: Install Prerequisites

#### A. Install Python & Anaconda
```bash
# Download dan install Anaconda dari:
# https://www.anaconda.com/download

# Atau Miniconda (lebih ringan):
# https://docs.conda.io/en/latest/miniconda.html

# Verifikasi instalasi
conda --version
python --version
```

#### B. Install Node.js
```bash
# Download dan install dari:
# https://nodejs.org/ (pilih LTS version)

# Verifikasi instalasi
node --version   # Harus 18+
npm --version
```

#### C. Install Visual C++ Build Tools (Windows)
```bash
# Download dari:
# https://visualstudio.microsoft.com/downloads/
# Pilih "Build Tools for Visual Studio"
# Install dengan workload "Desktop development with C++"
```

### Step 2: Setup Backend (Python)

```bash
# 1. Buat conda environment
conda create -n smart-absensi python=3.11 -y

# 2. Aktifkan environment
conda activate smart-absensi

# 3. Install dependencies
pip install -r requirements.txt

# Jika ada error dengan dlib/face_recognition:
pip install cmake
pip install dlib
pip install face-recognition

# Atau gunakan prebuilt wheel (Windows):
pip install https://github.com/jloh02/dlib/releases/download/v19.22/dlib-19.22.99-cp311-cp311-win_amd64.whl
pip install face-recognition
```

### Step 3: Setup Frontend (Node.js)

```bash
# 1. Masuk ke folder frontend
cd frontend

# 2. Install dependencies
npm install

# Jika ada error:
npm install --legacy-peer-deps

# 3. Buat file environment (opsional, sudah ada default)
# File: frontend/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Step 4: Jalankan Aplikasi

#### Opsi A: Menggunakan Script (Windows) - RECOMMENDED
```bash
# Double-click atau jalankan:
start_webapp.bat
```

**Script ini akan otomatis:**
- ✅ Install frontend dependencies (jika belum)
- ✅ Install backend dependencies (jika belum)
- ✅ **Membuat admin user otomatis** (jika belum ada)
- ✅ Start backend server
- ✅ Start frontend server

**Admin akan otomatis dibuat dengan kredensial:**
- NIM: `admin`
- Password: `admin123`

> 💡 **Catatan**: Admin hanya dibuat sekali. Jika sudah ada, script akan skip dan menggunakan admin yang sudah ada.

#### Opsi B: Manual Setup (Jika perlu)

**Setup Database & Admin Manual:**
```bash
# Kembali ke root folder
cd ..

# Buat admin user (opsional - sudah otomatis di start_webapp.bat)
python create_admin.py
```

#### Opsi B: Manual (2 Terminal)

**Terminal 1 - Backend:**
```bash
# Aktifkan environment
conda activate smart-absensi

# Jalankan backend di port 8001
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001
```

**Terminal 2 - Frontend:**
```bash
# Masuk ke folder frontend
cd frontend

# Jalankan frontend
npm run dev
```

### Step 5: Akses Aplikasi

| Service | URL |
|---------|-----|
| **Web App** | http://localhost:3000 |
| **API Docs** | http://localhost:8001/docs |
| **Admin Login** | NIM: `admin`, Password: `admin123` |

> 💡 **Penting**: Admin user **otomatis dibuat** saat pertama kali menjalankan `start_webapp.bat`. Tidak perlu menjalankan `create_admin.py` secara manual.

---

## 🔬 Instalasi Versi Prototype (Jupyter Notebook)

> ℹ️ Versi prototype menggunakan Jupyter Notebook untuk development dan testing.

### Quick Start (2 Langkah Saja!)

**Langkah 1: Setup Environment**
```bash
# Jalankan script setup (install semua dependencies)
setup_prototype.bat
```

**Langkah 2: Jalankan Project**
```bash
# Jalankan Jupyter Notebook
start_project.bat
```

**Selesai!** Buka `preprocessing.ipynb` di Jupyter Notebook.

---


Script ini akan otomatis:
- ✅ Membuat/mengaktifkan conda environment
- ✅ Install semua dependencies (opencv, pandas, jupyter, pillow)
- ✅ Install NumPy 1.26.4
- ✅ Install dlib via conda-forge (tidak perlu CMake!)
- ✅ Install face-recognition
- ✅ Verifikasi semua library terinstall dengan benar

**Opsi B: Manual Setup**
```bash
# 1. Buat conda environment
conda create -n smart-absensi python=3.11 -y

# 2. Aktifkan environment
conda activate smart-absensi

# 3. Install dependencies via conda
conda install -c conda-forge opencv pandas jupyter pillow -y

# 4. Install NumPy versi spesifik (PENTING!)
pip install numpy==1.26.4

# 5. Install dlib via conda-forge (PALING MUDAH - RECOMMENDED!)
# Bersihkan dlib lama jika ada
pip uninstall dlib cmake -y
conda remove cmake -y 2>nul

# Install dlib via conda-forge (tidak perlu CMake atau Visual C++!)
conda install -c conda-forge dlib -y

# 6. Install face-recognition
pip install face-recognition
```

> ⚠️ **PENTING**: 
> - Pastikan NumPy versi 1.26.4! Versi lain (terutama 2.x) akan menyebabkan error.
> - **Metode conda-forge adalah PALING MUDAH** - tidak perlu CMake atau Visual C++ Build Tools!
> - Jika conda-forge gagal, alternatif: gunakan prebuilt wheel (lihat troubleshooting).

### Step 2: Verifikasi Instalasi

```bash
# Pastikan environment aktif
conda activate smart-absensi

# Verifikasi versi library
python -c "import numpy; print(f'NumPy: {numpy.__version__}')"  # Harus 1.26.4
python -c "import cv2; print(f'OpenCV: {cv2.__version__}')"
python -c "import dlib; print(f'dlib: {dlib.__version__}')"
python -c "import face_recognition; print(f'Face Recognition: {face_recognition.__version__}')"
```

**Output yang diharapkan:**
```
NumPy: 1.26.4
OpenCV: 4.11.0
dlib: 19.24.2
Face Recognition: 1.3.0
```

### Step 3: Jalankan Jupyter Notebook

```bash
# Opsi A: Menggunakan script (Windows)
start_project.bat

# Opsi B: Manual
conda activate smart-absensi
jupyter notebook
```

> 💡 **Tips**: Jika Jupyter tidak menggunakan environment yang benar, install kernel:
> ```bash
> pip install ipykernel
> python -m ipykernel install --user --name smart-absensi --display-name "Python (smart-absensi)"
> ```
> Lalu di Jupyter: **Kernel → Change Kernel → Python (smart-absensi)**

### Step 4: Buka dan Gunakan

1. Jupyter akan terbuka di browser
2. Buka file `preprocessing.ipynb`
3. **Pastikan kernel yang benar dipilih**: Kernel → Change Kernel → Python (smart-absensi)
4. Jalankan cells sesuai kebutuhan:
   - **Section A**: Test kamera
   - **Section B**: Registrasi wajah
   - **Section C**: Absensi realtime
   - **Section D**: Visualisasi data

---

## 📝 Ringkasan Instalasi Prototype

**Untuk user yang baru clone project:**

1. **Jalankan setup sekali:**
   ```bash
   setup_prototype.bat
   ```
   Script ini akan install semua yang diperlukan, termasuk dlib via conda-forge.

2. **Jalankan project:**
   ```bash
   start_project.bat
   ```

3. **Buka `preprocessing.ipynb` di Jupyter Notebook**

**Selesai!** Tidak perlu install CMake atau Visual C++ Build Tools karena menggunakan conda-forge.

> 📖 **Troubleshooting lengkap**: Lihat bagian [Troubleshooting](#-troubleshooting) di bawah

---

## ⚙️ Konfigurasi

### Port Configuration

| Service | Default Port | Cara Ubah |
|---------|--------------|-----------|
| Backend | 8001 | `--port XXXX` di command uvicorn |
| Frontend | 3000 | Set `PORT=XXXX` sebelum `npm run dev` |

> ⚠️ **Catatan**: Port 8000 sering terblokir di Windows, gunakan port 8001.

### Environment Variables

**Backend** - Tidak perlu file .env, konfigurasi di `backend/config.py`

**Frontend** - File `frontend/.env.local`:
```env
# API URL (sesuaikan dengan port backend)
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Timezone Configuration

**Sistem menggunakan WIB (Western Indonesian Time, UTC+7)** untuk semua timestamp absensi.

- ✅ **Record Baru**: Otomatis menggunakan waktu WIB
- ⚠️ **Record Lama**: Jika ada record lama yang masih menggunakan UTC, jalankan migration script:
  ```bash
  python backend/migrate_timestamps_to_wib.py
  ```
  Script ini akan:
  - Membuat backup database otomatis
  - Mengkonversi timestamp UTC ke WIB (menambahkan 7 jam)
  - Meminta konfirmasi sebelum melakukan perubahan

**Dependencies Frontend untuk Timezone:**
- `date-fns`: ^3.0.6 (date formatting)
- `date-fns-tz`: ^3.2.0 (timezone handling)

Kedua package ini sudah termasuk di `package.json` dan akan terinstall otomatis saat `npm install`.

### Face Recognition Settings

Edit di `backend/routes/face.py`:
```python
face_recognizer = FaceRecognizer(
    encodings_dir=str(ENCODINGS_DIR),
    recognition_tolerance=0.6,   # Lower = stricter (0.4-0.6)
    min_confidence=60.0          # Minimum confidence %
)
```

| Parameter | Default | Range | Keterangan |
|-----------|---------|-------|------------|
| `recognition_tolerance` | 0.6 | 0.4-0.8 | Lower = lebih strict |
| `min_confidence` | 60.0 | 50-80 | Minimum % untuk valid |
| `min_photos` | 3 | 3-10 | Minimum foto registrasi |

---

## 🔄 Migration Timestamp (Record Lama)

Jika Anda memiliki record absensi lama yang dibuat sebelum update timezone, jalankan script migration:

```bash
# Pastikan Anda berada di root folder project
python backend/migrate_timestamps_to_wib.py
```

**Proses Migration:**
1. Script akan membuat backup database otomatis
2. Mengasumsikan timestamp lama adalah UTC
3. Menambahkan 7 jam untuk mengkonversi ke WIB
4. Meminta konfirmasi sebelum melakukan perubahan

**Backup File Format:** `smart_absensi_backup_YYYYMMDD_HHMMSS.db`

> ⚠️ **PENTING**: Selalu backup database sebelum migration, atau gunakan backup otomatis yang dibuat script.

## 🔍 Troubleshooting

### 1. Port 8000 Blocked (Windows)

**Problem**: `OSError: [WinError 10013] An attempt was made to access a socket in a way forbidden by its access permissions`

**Solution**: Gunakan port lain (8001)
```bash
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001
```

Update `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

### 2. dlib/face_recognition Install Error

**Problem**: 
- `CMake is not installed on your system`
- `error: Microsoft Visual C++ 14.0 or greater is required`
- `Failed building wheel for dlib`

**Solution A: Install via Conda-Forge (PALING MUDAH) - RECOMMENDED**

**Menggunakan Script Setup (Sudah Include Fix):**
```bash
# Jalankan script setup (sudah include install dlib via conda-forge)
setup_prototype.bat
```

**Manual Fix (Jika sudah ada environment):**
```bash
conda activate smart-absensi

# Bersihkan dlib lama
pip uninstall dlib cmake -y
conda remove cmake -y 2>nul

# Install dlib via conda-forge (PALING MUDAH!)
conda install -c conda-forge dlib -y

# Install face-recognition
pip install face-recognition
```

> ✅ **Ini adalah solusi TERMUDAH untuk Windows - tidak perlu CMake atau Visual C++!**
> ✅ **Conda-forge sudah include precompiled dlib, jadi tidak perlu build dari source.**

**Solution A2: Gunakan Prebuilt Wheel (Alternatif)**

Jika conda-forge tidak berfungsi:
```bash
conda activate smart-absensi
pip uninstall dlib -y
pip install https://github.com/jloh02/dlib/releases/download/v19.22/dlib-19.22.99-cp311-cp311-win_amd64.whl
pip install face-recognition
```

**Solution B: Install CMake dan Visual C++ Build Tools**

Hanya jika prebuilt wheel tidak berfungsi:

1. **Install CMake:**
   - Download dari: https://cmake.org/download/
   - **PENTING**: Centang "Add CMake to system PATH"
   - Restart terminal

2. **Install Visual C++ Build Tools:**
   - Download dari: https://visualstudio.microsoft.com/downloads/
   - Pilih "Build Tools for Visual Studio"
   - Install workload "Desktop development with C++"
   - Restart terminal

3. **Install dlib:**
   ```bash
   conda activate smart-absensi
   pip install cmake dlib face-recognition
   ```

---

### 3. NumPy Compatibility Error

**Problem**: 
- `Unsupported image type, must be 8bit gray or RGB image`
- NumPy version tidak sesuai (terlihat di output notebook)

**Solution**:
```bash
conda activate smart-absensi
pip uninstall numpy -y
pip install numpy==1.26.4

# Verifikasi
python -c "import numpy; print(numpy.__version__)"  # Harus menampilkan 1.26.4
```

> ⚠️ **PENTING**: NumPy 2.x tidak kompatibel! Harus versi 1.26.4

---

### 4. CORS Error di Browser

**Problem**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
1. Pastikan backend sudah running
2. Pastikan URL di `.env.local` benar
3. Restart backend dan frontend

---

### 5. Kamera Tidak Terdeteksi

**Problem**: Kamera tidak bisa diakses

**Solution**:
- Tutup aplikasi lain yang menggunakan kamera (Zoom, Teams, dll)
- Cek permission kamera di browser
- Cek permission kamera di Windows Settings
- Coba browser berbeda (Chrome recommended)

---

### 6. Database Error

**Problem**: `no such table: users`

**Solution**:
```bash
# Hapus database lama dan buat ulang
rm smart_absensi.db
python create_admin.py
```

---

### 7. npm install Error

**Problem**: `npm ERR! peer dependency`

**Solution**:
```bash
# Clear cache
npm cache clean --force

# Hapus node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install --legacy-peer-deps
```

---

### 8. Wajah Tidak Terdeteksi

**Problem**: Sistem tidak mendeteksi wajah

**Solution**:
- Perbaiki pencahayaan (tidak terlalu gelap/terang)
- Posisikan wajah menghadap langsung ke kamera
- Jarak ideal: 50-100 cm dari kamera
- Pastikan wajah tidak tertutup (masker, kacamata hitam)
- Pastikan sudah registrasi dengan minimal 3 foto

---

### 9. face_recognition Library Not Available

**Problem**: `face_recognition library not available`

**Solution**:
Backend masih bisa berjalan tanpa face_recognition, tetapi fitur face recognition tidak akan berfungsi. Install library:
```bash
conda activate smart-absensi
pip install cmake dlib face-recognition
```

---

## ✅ Checklist Instalasi

### Versi Web Application:
- [ ] Python 3.11+ terinstall
- [ ] Node.js 18+ terinstall
- [ ] Conda environment `smart-absensi` dibuat
- [ ] Backend dependencies terinstall (`pip install -r requirements.txt`)
- [ ] Frontend dependencies terinstall (`npm install`)
- [ ] Admin user dibuat (`python create_admin.py`)
- [ ] Backend berjalan di port 8001
- [ ] Frontend berjalan di port 3000
- [ ] Bisa akses http://localhost:3000
- [ ] Bisa login sebagai admin

### Versi Prototype:
- [ ] Python 3.11+ terinstall
- [ ] Conda environment dibuat
- [ ] OpenCV, pandas, jupyter terinstall
- [ ] NumPy 1.26.4 terinstall
- [ ] face_recognition terinstall
- [ ] Jupyter Notebook bisa dibuka
- [ ] preprocessing.ipynb bisa dijalankan
- [ ] Kamera terdeteksi

---

## 📞 Bantuan

Jika masih ada masalah:

1. **Cek Logs**:
   - Backend: Output di terminal
   - Frontend: Browser console (F12 → Console)

2. **Verifikasi Instalasi**:
   ```bash
   # Python packages
   pip list | grep -E "opencv|face|numpy|dlib|fastapi"
   
   # Node packages
   cd frontend && npm list --depth=0
   ```

3. **Fresh Install**:
   ```bash
   conda deactivate
   conda env remove -n smart-absensi
   # Kemudian ikuti instalasi dari awal
   ```

---

**Selamat! Project Smart Absensi siap digunakan! 🎉**
