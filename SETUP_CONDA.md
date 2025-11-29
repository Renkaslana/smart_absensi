# Setup Environment Conda untuk Smart Absensi Wajah

## 📋 Persyaratan Sistem

- **Python**: 3.11+ (direkomendasikan)
- **Conda**: Anaconda atau Miniconda terinstall
- **OS**: Windows, Linux, atau macOS
- **Kamera**: Webcam atau kamera eksternal

---

## 🚀 Langkah Instalasi

### Langkah 1: Buat Environment Conda Baru

```bash
conda create -n smart-absensi python=3.11 -y
```

**Catatan:** Nama environment `smart-absensi` (bukan `absensi-wajah`)

### Langkah 2: Aktifkan Environment

```bash
conda activate smart-absensi
```

### Langkah 3: Install Library yang Diperlukan

#### 3.1 Install OpenCV, Pandas, Jupyter, Pillow

```bash
conda install -c conda-forge opencv pandas jupyter pillow -y
```

#### 3.2 Install NumPy (Versi Spesifik - PENTING!)

```bash
pip install numpy==1.26.4
```

**⚠️ PENTING:** NumPy 1.26.4 adalah versi yang sudah teruji kompatibel. Versi lain (terutama 2.x atau < 1.24) mungkin menyebabkan error.

#### 3.3 Install dlib

```bash
pip install cmake
pip install dlib
```

**Catatan untuk Windows:** Jika instalasi dlib gagal, gunakan wheel prebuilt:
```bash
# Untuk Python 3.11 (sesuaikan dengan versi Python Anda)
pip install https://github.com/jloh02/dlib/releases/download/v19.22/dlib-19.22.99-cp311-cp311-win_amd64.whl
```

Jika wheel di atas tidak tersedia, cari wheel yang sesuai dengan versi Python Anda di [dlib releases](https://github.com/jloh02/dlib/releases).

#### 3.4 Install face_recognition

```bash
pip install face-recognition
```

### Langkah 4: Verifikasi Instalasi

```bash
python -c "import cv2; import face_recognition; import numpy as np; import pandas; from PIL import Image; print('✓ Semua library berhasil diinstall!'); print(f'  - NumPy: {np.__version__}')"
```

Pastikan output menunjukkan:
- ✓ Semua library berhasil diinstall!
- NumPy: 1.26.4

### Langkah 5: Jalankan Jupyter Notebook

**Opsi A: Menggunakan Batch Script (Windows)**
```bash
# Double-click file:
start_jupyter.bat
```

**Opsi B: Manual**
```bash
cd "C:\my Project\Smart-Absensi"
jupyter notebook
```

Kemudian buka file `notebook.ipynb` di browser.

---

## 📝 Perintah Lengkap (Copy-Paste)

```bash
# Buat dan aktifkan environment
conda create -n smart-absensi python=3.11 -y
conda activate smart-absensi

# Install semua library
conda install -c conda-forge opencv pandas jupyter pillow -y
pip install numpy==1.26.4
pip install cmake dlib face-recognition

# Verifikasi
python -c "import cv2; import face_recognition; import numpy as np; import pandas; from PIL import Image; print('✓ Instalasi berhasil!'); print(f'  - NumPy: {np.__version__}')"

# Jalankan Jupyter
cd "C:\my Project\Smart-Absensi"
jupyter notebook
```

---

## 🔧 Troubleshooting

### Error: "No module named 'numpy._core'"

**Penyebab:** NumPy versi tidak kompatibel dengan Python 3.11

**Solusi:**
```bash
conda activate smart-absensi
pip uninstall numpy -y
pip install numpy==1.26.4
```

### Error: "Unsupported image type, must be 8bit gray or RGB image"

**Penyebab:** NumPy versi tidak kompatibel atau format array tidak benar

**Solusi:**
```bash
conda activate smart-absensi
pip uninstall numpy -y
pip install numpy==1.26.4
# Restart kernel Jupyter setelah install
```

### Jika kamera tidak terdeteksi:
- Pastikan kamera laptop berfungsi
- Coba ganti index kamera dari 0 ke 1 atau 2
- Pastikan tidak ada aplikasi lain yang menggunakan kamera
- Restart kernel Jupyter

### Jika face_recognition error:
- Pastikan dlib terinstall dengan benar
- Untuk Windows, gunakan wheel prebuilt yang sesuai versi Python
- Pastikan NumPy versi 1.26.4

### Jika import error:
```bash
conda activate smart-absensi
pip install --upgrade opencv-python face-recognition pillow
pip install numpy==1.26.4
```

### Dependency Conflicts

Jika ada warning tentang dependency conflicts (misalnya scipy, contourpy), **abaikan** jika tidak mempengaruhi fungsi face_recognition. Library tersebut tidak digunakan dalam project ini.

---

## 📦 Versi Library yang Direkomendasikan

| Library | Versi | Catatan |
|---------|-------|---------|
| Python | 3.11 | Direkomendasikan |
| NumPy | 1.26.4 | **WAJIB** - versi lain mungkin error |
| OpenCV | 4.11.0+ | Latest |
| face_recognition | 1.3.0+ | Latest |
| dlib | 19.24+ | Latest |
| Pandas | 2.3+ | Latest |
| Pillow | 11.3+ | Latest |

---

## ✅ Checklist Instalasi

- [ ] Conda terinstall dan bisa diakses dari terminal
- [ ] Environment `smart-absensi` dibuat dengan Python 3.11
- [ ] Semua library terinstall tanpa error
- [ ] Verifikasi import library berhasil
- [ ] NumPy versi 1.26.4 terkonfirmasi
- [ ] Jupyter Notebook bisa dibuka
- [ ] Kamera terdeteksi saat test

---

## 🎯 Next Steps

Setelah instalasi selesai:
1. Buka Jupyter Notebook
2. Jalankan cell pertama untuk test import library
3. Test kamera dengan cell yang disediakan
4. Mulai registrasi wajah

Selamat menggunakan! 🚀
