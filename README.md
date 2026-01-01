# AbsensiKelas (ClassAttend)

Sistem absensi berbasis pengenalan wajah untuk keperluan pembelajaran.

Ringkasan singkat
- Teknologi backend: Python (FastAPI), SQLAlchemy, SQLite
- Teknologi frontend: Next.js + React + TailwindCSS
- Face recognition: `face-recognition`, FaceNet, OpenCV, MediaPipe

Persyaratan
- Python 3.10+
- Node.js 18+ dan npm

Quick start — Backend

1. Masuk ke folder backend:

```bash
cd backend
```

2. Buat virtual environment dan install dependensi:

```bash
python -m venv venv
# Windows
venv\Scripts\activate
pip install -r requirements.txt
```

3. Copy file env contoh (jika ada) dan sesuaikan `SECRET` bila perlu.

4. Inisialisasi database:

```bash
python -m app.db.init_db
```

5. Jalankan server (development):

```bash
python run.py
# atau
uvicorn app.main:app --reload --port 8001
```

API docs tersedia di: http://localhost:8001/docs

Quick start — Frontend

1. Masuk ke folder frontend:

```bash
cd frontend
```

2. Install dependensi dan jalankan:

```bash
npm install
npm run dev
```

Frontend default berjalan di `http://localhost:3001`.

Lokasi data penting
- Database SQLite: `backend/database/absensi.db`
- Folder simpan wajah: `backend/database/wajah_siswa/`
- Dataset contoh: `dataset_wajah/`

Default credentials (setelah `init_db`)
- NIM: `admin`
- Password: `admin123`  (ganti setelah login pertama)

Dokumentasi lebih lengkap dan detail API ada di `backend/README.md` dan folder `docs/`.

Catatan
- Proyek ini dibuat untuk keperluan pembelajaran. Jangan gunakan data sensitif di lingkungan publik.
- Untuk Windows, beberapa dependensi face recognition (dlib) memerlukan CMake dan build tool.

Butuh bantuan lebih lanjut?
- Saya bisa menjalankan pengecekan runtime (men-start server backend/frontend) atau menjalankan tes jika Anda mau.

---

Terakhir diperbarui: 2026-01-01
