# Planning: Fix Critical UI & Webcam Issues + Liveness Detection

**Date**: 2026-01-08  
**Agent**: Luna 🌙  
**Type**: Bug Fix + Feature Enhancement

---

## 🎯 Tujuan

Memperbaiki 3 masalah kritis yang mengganggu user experience:

1. **Webcam tidak berhenti** saat navigasi halaman
2. **Dropdown Kelas tidak terlihat** di dalam modal (z-index issue)
3. **Face Registration belum punya auto-capture & liveness detection**

---

## 🐛 Masalah yang Ditemukan

### 1. Webcam Cleanup Issue
**Lokasi**: `AttendanceTestPage.tsx`

**Root Cause**:
- `useEffect` cleanup sudah ada, tapi masih kurang robust
- Tidak ada handler saat navigasi via React Router
- Video element `srcObject` tidak di-cleanup dengan sempurna

**Impact**: Webcam tetap aktif di background, boros resource & privacy issue

---

### 2. Dropdown Z-Index Issue
**Lokasi**: `Select.tsx` (component UI)

**Root Cause**:
- Dropdown punya `z-50` sama dengan modal backdrop
- Portal tidak menjamin dropdown tampil di atas modal
- Tailwind `z-60` belum cukup, perlu lebih tinggi

**Impact**: User tidak bisa pilih kelas saat edit siswa di modal

**Current CSS**:
```tsx
className="... z-60 ..."  // Tidak cukup
```

**Solution**: Gunakan `z-[9999]` atau `z-[100]` untuk portal dropdown

---

### 3. Face Registration Enhancement
**Lokasi**: `FaceRegistrationPage.tsx`

**Missing Features**:
1. **Auto Capture Mode**: Ambil foto otomatis setiap 2 detik
2. **Liveness Detection**: 
   - Deteksi blink (EAR - Eye Aspect Ratio)
   - Deteksi gerakan kepala
   - Face quality check (blur, brightness)
3. **Progress Indicator**: Visual feedback saat auto capture

**Current Flow**:
- User harus klik manual 3-5 kali
- Tidak ada validasi liveness
- Rawan foto palsu (spoofing)

---

## 🛠️ Solusi Teknis

### 1. Webcam Cleanup Enhancement

**File**: `AttendanceTestPage.tsx`

**Changes**:
```typescript
// A. Enhanced useEffect cleanup
useEffect(() => {
  startCamera();
  
  return () => {
    console.log('[Cleanup] Stopping camera on unmount');
    stopCamera();
  };
}, []);

// B. Add beforeunload event
useEffect(() => {
  const handleBeforeUnload = () => {
    stopCamera();
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, []);

// C. Enhanced stopCamera
const stopCamera = () => {
  console.log('[Camera] Stopping all tracks...');
  
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
      console.log(`[Camera] Track ${track.kind} stopped`);
    });
    setStream(null);
    setCameraReady(false);
  }
  
  if (videoRef.current) {
    videoRef.current.srcObject = null;
    videoRef.current.pause();
  }
};
```

**Testing**:
- ✅ Navigate ke halaman lain → webcam mati
- ✅ Refresh browser → webcam mati
- ✅ Close tab → cleanup triggered

---

### 2. Dropdown Z-Index Fix

**File**: `Select.tsx`

**Change**:
```typescript
<Listbox.Options
  className="absolute mt-2 max-h-60 overflow-auto rounded-lg 
    bg-white dark:bg-primary-800 
    border border-neutral-200 dark:border-neutral-700 
    py-1 text-sm shadow-2xl 
    z-[9999]  // 🔥 Fix: Force highest z-index
    text-neutral-900 dark:text-neutral-100"
  style={{
    position: 'absolute',
    top: dropdownStyle ? dropdownStyle.top : undefined,
    left: dropdownStyle ? dropdownStyle.left : undefined,
    width: dropdownStyle ? dropdownStyle.width : undefined,
  }}
>
```

**Why `z-[9999]`?**
- Modal backdrop: `z-50`
- Modal content: `z-50`
- Dropdown harus **lebih tinggi**: `z-[9999]`

---

### 3. Auto Capture & Liveness Detection

**File**: `FaceRegistrationPage.tsx`

**New Features**:

#### A. Auto Capture Mode
```typescript
const [autoCapture, setAutoCapture] = useState(false);

useEffect(() => {
  if (!autoCapture || capturedImages.length >= MAX_IMAGES) return;
  
  const interval = setInterval(() => {
    captureImage();
  }, 2000); // Every 2 seconds
  
  return () => clearInterval(interval);
}, [autoCapture, capturedImages.length]);
```

#### B. Liveness Detection (Simplified)
```typescript
const [livenessStatus, setLivenessStatus] = useState({
  faceDetected: false,
  eyesOpen: true,
  facingCamera: true,
  quality: 'good' as 'good' | 'poor'
});

// Check before capture
const captureImage = () => {
  if (!livenessStatus.faceDetected) {
    toast.error('Wajah tidak terdeteksi');
    return;
  }
  
  if (!livenessStatus.eyesOpen) {
    toast.error('Mata harus terbuka');
    return;
  }
  
  // Proceed with capture...
};
```

#### C. Quality Check
```typescript
const checkImageQuality = (imageData: string): boolean => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  img.src = imageData;
  // Check brightness, contrast, blur
  // Return true if quality is good
};
```

**UI Changes**:
```tsx
// Toggle button
<Button
  variant={autoCapture ? 'danger' : 'primary'}
  onClick={() => setAutoCapture(!autoCapture)}
>
  {autoCapture ? 'Stop Auto' : 'Start Auto Capture'}
</Button>

// Liveness indicator
<div className="absolute top-4 right-4">
  <Badge variant={livenessStatus.faceDetected ? 'success' : 'warning'}>
    {livenessStatus.faceDetected ? 'Wajah Terdeteksi' : 'Hadapkan Kamera'}
  </Badge>
</div>
```

---

## 📋 Implementation Checklist

### Phase 1: Critical Fixes (Priority)
- [ ] Fix webcam cleanup di `AttendanceTestPage.tsx`
- [ ] Fix dropdown z-index di `Select.tsx`
- [ ] Test navigation & dropdown visibility

### Phase 2: Feature Enhancement
- [ ] Add auto capture mode
- [ ] Add liveness detection (basic)
- [ ] Add quality check
- [ ] Add UI toggle & indicators

### Phase 3: Testing & Polish
- [ ] Test webcam cleanup di semua browser
- [ ] Test dropdown di dalam modal
- [ ] Test auto capture flow
- [ ] Test liveness detection accuracy

---

## 🧪 Testing Scenarios

### Webcam Cleanup
1. Buka Test Absensi → webcam on
2. Klik sidebar menu lain → webcam harus off
3. Browser console: check "Track stopped" log
4. Chrome DevTools → Media tab → no active streams

### Dropdown Z-Index
1. Buka Siswa & Guru → Edit user
2. Klik dropdown Kelas
3. Opsi harus terlihat jelas di atas backdrop

### Auto Capture
1. Daftar Wajah → Enable Auto Capture
2. Foto diambil otomatis setiap 2 detik
3. Stop saat 5 foto tercapai
4. Liveness warning muncul jika wajah tidak pas

---

## 🎯 Success Criteria

✅ Webcam berhenti 100% saat navigasi  
✅ Dropdown terlihat jelas di dalam modal  
✅ Auto capture bekerja smooth (2s interval)  
✅ Liveness detection mendeteksi wajah palsu  
✅ UX lebih baik: less clicks, more guidance  

---

## 📝 Notes

- Liveness detection versi penuh (MediaPipe) bisa ditambahkan later
- Focus dulu pada user experience & critical bugs
- Gunakan toast notification untuk feedback
- Log semua camera operations untuk debugging

---

**Next Steps**: Implementasi → Testing → Commit → Report

Luna 🌙
