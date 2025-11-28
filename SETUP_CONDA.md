# Setup Environment Conda untuk Smart Absensi Wajah

## Langkah 1: Buat Environment Conda Baru

```bash
conda create -n absensi-wajah python=3.9 -y
```

## Langkah 2: Aktifkan Environment

```bash
conda activate absensi-wajah
```

## Langkah 3: Install Library yang Diperlukan

### Install OpenCV, NumPy, Pandas, Jupyter
```bash
conda install -c conda-forge opencv numpy pandas jupyter imutils -y
```

### Install dlib (prebuilt)
```bash
pip install cmake
pip install dlib
```

**Catatan untuk Windows:** Jika instalasi dlib gagal, gunakan wheel prebuilt:
```bash
pip install https://github.com/jloh02/dlib/releases/download/v19.22/dlib-19.22.99-cp39-cp39-win_amd64.whl
```

### Install face_recognition
```bash
pip install face-recognition
```

## Langkah 4: Verifikasi Instalasi

```bash
python -c "import cv2; import face_recognition; import numpy; import pandas; print('Semua library berhasil diinstall!')"
```

## Langkah 5: Jalankan Jupyter Notebook

```bash
jupyter notebook
```

Kemudian buka file `notebook.ipynb` di browser.

---

## Troubleshooting

### Jika kamera tidak terdeteksi:
- Pastikan kamera laptop berfungsi
- Coba ganti index kamera dari 0 ke 1 atau 2
- Pastikan tidak ada aplikasi lain yang menggunakan kamera

### Jika face_recognition error:
- Pastikan dlib terinstall dengan benar
- Untuk Windows, gunakan wheel prebuilt yang disediakan

### Jika import error:
```bash
pip install --upgrade opencv-python face-recognition numpy pandas
```

---

## Perintah Lengkap (Copy-Paste)

```bash
# Buat dan aktifkan environment
conda create -n absensi-wajah python=3.9 -y
conda activate absensi-wajah

# Install semua library
conda install -c conda-forge opencv numpy pandas jupyter imutils -y
pip install cmake dlib face-recognition

# Verifikasi
python -c "import cv2; import face_recognition; import numpy; import pandas; print('✓ Instalasi berhasil!')"

# Jalankan Jupyter
jupyter notebook
```


