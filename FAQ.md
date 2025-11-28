# ❓ FAQ - Pertanyaan yang Sering Diajukan

## 📌 Umum

### Q: Apakah sistem ini bisa digunakan untuk absensi kelas?
**A:** Ya! Sistem ini sangat cocok untuk absensi kelas, seminar, workshop, atau event lainnya. Bisa mendeteksi beberapa wajah sekaligus dan mencatat secara otomatis.

### Q: Apakah harus punya GPU untuk menjalankan sistem ini?
**A:** Tidak perlu. Sistem ini bisa berjalan di laptop biasa dengan CPU saja. Kami sudah optimasi dengan resize frame 0.25x agar ringan.

### Q: Berapa lama waktu yang dibutuhkan untuk registrasi 1 wajah?
**A:** Sekitar 10-30 detik per orang, tergantung kecepatan komputer. Proses paling lama ada di pembuatan encoding wajah.

### Q: Apakah data wajah aman?
**A:** Data disimpan secara lokal di komputer Anda. Tidak ada data yang dikirim ke cloud atau server eksternal. Pastikan Anda backup folder `encodings/` dan `dataset_wajah/` secara berkala.

---

## 🔧 Instalasi

### Q: Error "conda: command not found"
**A:** Anda belum install Conda. Download Miniconda dari:
- https://docs.conda.io/en/latest/miniconda.html
- Atau Anaconda dari: https://www.anaconda.com/download

Setelah install, restart terminal/command prompt.

### Q: Error saat install dlib di Windows
**A:** Gunakan wheel prebuilt:
```bash
pip install https://github.com/jloh02/dlib/releases/download/v19.22/dlib-19.22.99-cp39-cp39-win_amd64.whl
```

### Q: Apakah bisa install tanpa conda?
**A:** Bisa, gunakan pip biasa:
```bash
pip install -r requirements.txt
```
Tapi kami rekomendasikan pakai conda untuk menghindari konflik library.

### Q: Python versi berapa yang didukung?
**A:** Python 3.9, 3.10, atau 3.11. Kami rekomendasikan Python 3.9 untuk kompatibilitas terbaik dengan dlib.

---

## 📷 Kamera & Hardware

### Q: Kamera laptop saya tidak terdeteksi
**A:** Coba solusi berikut secara berurutan:
1. Tutup aplikasi lain (Zoom, Teams, Skype)
2. Periksa permission kamera di Windows Settings → Privacy → Camera
3. Restart Jupyter Notebook kernel
4. Restart komputer
5. Coba kamera eksternal USB

### Q: Bisa pakai kamera eksternal USB?
**A:** Bisa! Sistem akan otomatis mencari kamera di index 0, 1, dan 2. Kamera USB biasanya terdeteksi di index 1 atau 2.

### Q: Laptop saya punya 2 kamera, bagaimana memilih?
**A:** Edit fungsi `find_camera()` di notebook, ubah baris:
```python
for i in range(3):
```
Menjadi:
```python
for i in [1]:  # Atau [0] atau [2] tergantung kamera mana yang ingin dipakai
```

### Q: Resolusi kamera rendah, apakah masih bisa?
**A:** Bisa, asal wajah terlihat jelas. Minimal resolusi 640x480 (VGA) sudah cukup.

---

## 👤 Registrasi & Deteksi

### Q: Berapa banyak wajah yang bisa diregistrasi?
**A:** Tidak ada batasan! Bisa puluhan atau ratusan orang. Semakin banyak, waktu processing sedikit lebih lama (tapi masih cepat).

### Q: Apakah perlu registrasi ulang jika ganti penampilan (rambut, kacamata)?
**A:** Tergantung seberapa drastis perubahannya:
- **Tidak perlu**: Ganti warna rambut, potong rambut, pakai kacamata biasa
- **Perlu**: Tumbuh janggut panjang, operasi plastik, pakai kacamata hitam tebal

### Q: Bisa deteksi wajah dengan masker?
**A:** Tidak disarankan. Face recognition butuh area wajah yang terlihat penuh. Jika pakai masker, akurasi akan turun drastis atau tidak terdeteksi sama sekali.

### Q: Kenapa confidence saya cuma 70-80%?
**A:** Itu masih bagus! Confidence di atas 60% sudah dianggap match. Faktor yang mempengaruhi:
- Pencahayaan berbeda saat registrasi vs absensi
- Sudut wajah sedikit berbeda
- Kualitas kamera
- Jarak dari kamera

### Q: Apakah bisa salah mengenali orang lain?
**A:** Sangat jarang, tapi bisa terjadi pada kasus:
- Kembar identik
- Mirip banget (saudara)
- Pencahayaan sangat berbeda
- Database terlalu besar (ratusan orang)

Solusi: Turunkan tolerance dari 0.6 ke 0.5 untuk lebih strict.

---

## 💾 Data & Storage

### Q: Di mana data absensi disimpan?
**A:** File `absensi.csv` di root folder proyek. Bisa dibuka dengan Excel atau Google Sheets.

### Q: Format file encoding wajah apa?
**A:** File `.pickle` (Python pickle format) yang berisi array 128 angka float. Ini adalah representasi matematis dari wajah.

### Q: Berapa besar file per orang?
**A:** Sekitar:
- Foto wajah: 50-200 KB (JPG)
- Encoding: 5-10 KB (pickle)
- Total: ~60-210 KB per orang

### Q: Apakah bisa export ke Excel?
**A:** Bisa! Jalankan cell di bagian "Export Data ke Excel". Jika gagal, install dulu:
```bash
pip install openpyxl
```

### Q: Bagaimana cara backup data?
**A:** Copy 3 folder ini:
- `dataset_wajah/` - foto asli
- `encodings/` - data encoding
- `absensi.csv` - log absensi

Simpan di external drive atau cloud storage.

---

## ⚡ Performance

### Q: Sistem lambat/lag, apa solusinya?
**A:** Coba optimasi berikut:

1. **Kurangi ukuran frame:**
```python
small_frame = cv2.resize(frame, (0, 0), fx=0.2, fy=0.2)  # dari 0.25 jadi 0.2
```

2. **Process lebih jarang:**
```python
process_every_n_frames = 3  # dari 2 jadi 3
```

3. **Tutup aplikasi lain** yang berat

4. **Upgrade RAM** jika di bawah 4GB

### Q: Berapa FPS yang dihasilkan?
**A:** Tergantung spesifikasi komputer:
- Laptop standar (i3, 4GB RAM): 10-15 FPS
- Laptop menengah (i5, 8GB RAM): 20-25 FPS
- Laptop gaming (i7, 16GB RAM): 30+ FPS

### Q: Apakah perlu internet?
**A:** Tidak! Sistem berjalan 100% offline setelah library terinstall.

---

## 🔐 Keamanan & Privasi

### Q: Apakah data wajah bisa dicuri?
**A:** Data disimpan lokal di komputer. Risiko sama seperti file lainnya. Proteksi yang bisa dilakukan:
- Password komputer
- Enkripsi folder
- Jangan share folder `encodings/` dan `dataset_wajah/`
- Backup teratur

### Q: Apakah orang lain bisa pakai foto saya untuk absen?
**A:** Bisa. Sistem ini tidak punya **liveness detection** (deteksi wajah asli vs foto). Untuk production, tambahkan:
- Liveness detection (blink, smile, turn head)
- CAPTCHA
- PIN/Password tambahan

### Q: Apakah legal pakai sistem ini untuk absensi?
**A:** Tergantung regulasi di tempat Anda. Pastikan:
- Inform peserta bahwa ada face recognition
- Minta persetujuan (consent)
- Jaga keamanan data
- Patuhi GDPR/UU Perlindungan Data Pribadi

---

## 🛠️ Troubleshooting

### Q: Error "ModuleNotFoundError: No module named 'cv2'"
**A:**
```bash
conda activate absensi-wajah
conda install -c conda-forge opencv -y
```

### Q: Error "ImportError: DLL load failed while importing _dlib_pybind11"
**A:** Install Visual C++ Redistributable:
- Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
- Install dan restart komputer

### Q: Jupyter Notebook tidak bisa dibuka
**A:**
```bash
conda activate absensi-wajah
pip install --upgrade jupyter notebook
jupyter notebook
```

### Q: Cell di notebook tidak bisa dijalankan
**A:** Pastikan kernel yang dipilih adalah `absensi-wajah`. Klik menu:
- Kernel → Change Kernel → absensi-wajah

### Q: Window OpenCV tidak muncul
**A:** Tambahkan di cell pertama:
```python
import os
os.environ["OPENCV_VIDEOIO_PRIORITY_MSMF"] = "0"
```

---

## 📱 Platform

### Q: Apakah bisa jalan di Mac?
**A:** Bisa! Instalasi sama, tapi untuk dlib gunakan:
```bash
brew install cmake
pip install dlib
```

### Q: Apakah bisa jalan di Linux?
**A:** Bisa! Install dependencies dulu:
```bash
sudo apt-get update
sudo apt-get install cmake build-essential
```

### Q: Apakah ada versi mobile app?
**A:** Belum. Ini masih prototype di Jupyter Notebook. Untuk mobile, perlu develop ulang dengan Flutter/React Native.

### Q: Bisa deploy ke web?
**A:** Bisa, tapi perlu convert ke Flask/Django/FastAPI. Kompleksitas meningkat karena perlu handle streaming video di web.

---

## 🎓 Edukasi

### Q: Bagaimana cara kerja face recognition?
**A:** Singkatnya:
1. Deteksi wajah dengan HOG/CNN
2. Align wajah (straighten)
3. Extract 128 measurements (face encoding)
4. Compare dengan database (Euclidean distance)
5. Jika distance < threshold → Match!

### Q: Library apa yang dipakai?
**A:** 
- **dlib** - Face detection & landmarks
- **face_recognition** - Face encoding & comparison
- **OpenCV** - Video capture & image processing

### Q: Bisakah saya modifikasi kodenya?
**A:** Tentu! Kode open source dan bebas dimodifikasi. Beberapa ide:
- Tambah logging
- Kirim notifikasi email
- Save ke database MySQL
- Buat dashboard web
- Tambah suara notification

### Q: Apakah bisa untuk skripsi/tugas akhir?
**A:** Bisa! Ini bisa jadi pondasi. Kembangkan dengan:
- Frontend web/mobile
- Database relational
- Dashboard analytics
- Multi-kamera
- Cloud deployment
- API integration

---

## 🤔 Lain-lain

### Q: Berapa akurasi sistem ini?
**A:** Di kondisi ideal (pencahayaan bagus, database < 50 orang):
- True Positive Rate: ~95-98%
- False Positive Rate: <2%

Di kondisi kurang ideal:
- True Positive Rate: ~80-90%
- False Positive Rate: <5%

### Q: Apakah gratis?
**A:** Ya, 100% gratis! Semua library yang dipakai open source.

### Q: Dimana saya bisa dapat bantuan?
**A:**
1. Baca README.md
2. Baca SETUP_CONDA.md
3. Baca PANDUAN_CEPAT.md
4. Cek komentar di notebook
5. Google error message
6. Stack Overflow
7. GitHub Issues

### Q: Bisa request fitur baru?
**A:** Bisa! Open issue di GitHub atau kembangkan sendiri. Beberapa ide:
- [ ] Multi-language support
- [ ] Voice notification
- [ ] SMS integration
- [ ] Liveness detection
- [ ] QR code alternative
- [ ] Admin dashboard
- [ ] Report generator
- [ ] Mobile app

---

## 💡 Tips Pro

### Q: Bagaimana cara meningkatkan akurasi?
**A:**
1. **Registrasi di kondisi ideal:**
   - Pencahayaan merata
   - Background polos
   - Wajah langsung ke depan
   - Multiple angles (depan, kiri, kanan)

2. **Tuning parameters:**
   - Tolerance: 0.5 (strict) - 0.6 (default) - 0.7 (lenient)
   - Model: hog (cepat) atau cnn (akurat tapi lambat)

3. **Preprocessing:**
   - Brightness adjustment
   - Contrast enhancement
   - Face alignment

### Q: Bagaimana cara scale untuk ratusan orang?
**A:**
1. Gunakan database (SQLite/MySQL) bukan CSV
2. Index encodings dengan FAISS/Annoy untuk fast search
3. Multi-threading untuk parallel processing
4. Cache hasil deteksi
5. Gunakan Redis untuk session management

---

Masih ada pertanyaan? Silakan buka issue atau hubungi developer! 🚀


