# Planning: Face Update Feature untuk Siswa Terdaftar

**Date**: 2026-01-08  
**Agent**: Luna 🌙  
**Feature**: Update/Perbarui Wajah untuk siswa yang sudah punya face encoding

---

## 🎯 Objective

Menambahkan fitur "Perbarui Wajah" untuk siswa yang sudah terdaftar wajahnya, agar admin bisa:
1. Re-register wajah siswa untuk improve accuracy
2. Update foto wajah yang sudah lama/tidak optimal
3. Replace face encodings yang ada dengan yang baru

---

## 📋 Current State

### StudentsPage - Action Buttons
**Saat ini**:
- Siswa **belum** punya wajah → Button "Daftar Wajah" ✅
- Siswa **sudah** punya wajah → Tidak ada button ❌

**Yang diinginkan**:
- Siswa **belum** punya wajah → Button "Daftar Wajah"
- Siswa **sudah** punya wajah → Button "Perbarui Wajah" (UPDATE)

---

## 🛠️ Implementation Plan

### 1. StudentsPage - Add "Perbarui Wajah" Button

**Location**: `frontend/src/pages/admin/StudentsPage.tsx`

**Logic**:
```typescript
// In table row action buttons
{tab === 'siswa' && (
  user.has_face ? (
    // ✅ Sudah punya wajah → Perbarui
    <Button
      size="sm"
      variant="secondary"  // Different color dari "Daftar"
      onClick={() => handleFaceRegistration(user.id)}
      icon={<Camera size={16} />}
    >
      Perbarui Wajah
    </Button>
  ) : (
    // ❌ Belum punya wajah → Daftar
    <Button
      size="sm"
      variant="primary"
      onClick={() => handleFaceRegistration(user.id)}
      icon={<Camera size={16} />}
    >
      Daftar Wajah
    </Button>
  )
)}
```

**Button Variants**:
- `Daftar Wajah` → `variant="primary"` (teal/accent)
- `Perbarui Wajah` → `variant="secondary"` (gray, less prominent)

---

### 2. FaceRegistrationPage - Reuse untuk Update

**Current Route**:
```
/admin/students/:userId/face-registration
```

**No Changes Needed!** 🎉
- Route sama untuk register & update
- Backend API `/api/face/register` sudah handle replace existing encodings
- Frontend logic sama: capture 3-5 foto → submit

**Optional Enhancement** (nice to have):
```typescript
// Detect if user already has face
const { data: userData } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => adminService.getUserDetail(userId),
});

const isUpdate = userData?.has_face;

// Update UI text
<ShellHeader
  title={isUpdate ? "Perbarui Registrasi Wajah" : "Registrasi Wajah"}
  description={
    isUpdate
      ? "Ambil foto baru untuk menggantikan wajah yang terdaftar"
      : "Ambil 3-5 foto wajah dengan pose berbeda untuk akurasi maksimal"
  }
/>

// Update button text
<Button onClick={handleSubmit}>
  {isUpdate ? 'Perbarui & Ganti Wajah' : 'Daftarkan Wajah'}
</Button>
```

---

### 3. Backend API - Already Supported!

**Endpoint**: `POST /api/face/register`

**Behavior** (dari backend code):
```python
# backend/app/api/v1/endpoints/face.py

@router.post("/register", response_model=FaceRegisterResponse)
def register_face(request: FaceRegisterRequest, db: Session = Depends(get_db)):
    # Get user
    user = db.query(User).filter(User.id == request.user_id).first()
    
    # DELETE existing face encodings (if any)
    db.query(FaceEncoding).filter(FaceEncoding.user_id == request.user_id).delete()
    
    # INSERT new encodings
    for img_b64 in request.images:
        # Process image → extract encoding
        encoding = face_recognition.face_encodings(...)
        
        # Save to DB
        face_enc = FaceEncoding(
            user_id=request.user_id,
            encoding=encoding.tolist(),
            image_path=...
        )
        db.add(face_enc)
    
    db.commit()
    return {"message": "Face registered successfully", "encodings_count": len(...)}
```

**Key Points**:
- ✅ **Delete existing** encodings sebelum insert baru
- ✅ **Replace**, bukan append
- ✅ **No additional API** needed untuk update
- ✅ Frontend tidak perlu tahu difference antara create vs update

---

## 📐 UI/UX Design

### StudentsPage Table Row

```
┌─────────────────────────────────────────────────────────────────┐
│ NIM      │ Nama           │ Kelas     │ Status Wajah │ Actions │
├─────────────────────────────────────────────────────────────────┤
│ 23225046 │ Muhammad Afiff │ SMK-G11-A │ ✅ Terdaftar │ [Perbarui Wajah] [Edit] [Delete] │
│ 24225046 │ Muhammad Afiff │ -         │ ⚠️ Belum     │ [Daftar Wajah]   [Edit] [Delete] │
└─────────────────────────────────────────────────────────────────┘
```

### FaceRegistrationPage (Update Mode)

```
┌───────────────────────────────────────────────────────┐
│ ← Kembali                                             │
│                                                       │
│ Perbarui Registrasi Wajah                           │
│ Ambil foto baru untuk menggantikan wajah terdaftar  │
│                                                       │
│ ┌─────────────────────────────┐                     │
│ │  📷 Kamera Aktif            │                     │
│ │                             │                     │
│ │     [  Video Preview  ]     │                     │
│ │                             │                     │
│ │  ⚠️ Catatan: Foto baru akan│                     │
│ │  menggantikan yang lama     │                     │
│ └─────────────────────────────┘                     │
│                                                       │
│ [▶️ Auto Capture] [📷 Ambil Foto (0/5)]             │
│                                                       │
│ ┌─────────────────────────────┐                     │
│ │ Foto yang Diambil:          │                     │
│ │ [IMG1] [IMG2] [IMG3]        │                     │
│ └─────────────────────────────┘                     │
│                                                       │
│ [Batal]  [Perbarui & Ganti Wajah] ✅               │
└───────────────────────────────────────────────────────┘
```

---

## 🔄 User Flow

### Flow 1: Siswa Belum Punya Wajah (Register)
1. Admin → Siswa & Guru
2. Klik "Daftar Wajah" (primary button)
3. Navigate → `/admin/students/:id/face-registration`
4. Capture 3-5 foto
5. Klik "Daftarkan Wajah"
6. Success → Back to StudentsPage
7. Status berubah: ⚠️ Belum → ✅ Terdaftar

### Flow 2: Siswa Sudah Punya Wajah (Update)
1. Admin → Siswa & Guru
2. Klik "Perbarui Wajah" (secondary button)
3. Navigate → `/admin/students/:id/face-registration`
4. (Optional) Show warning: "Foto baru akan menggantikan yang lama"
5. Capture 3-5 foto baru
6. Klik "Perbarui & Ganti Wajah"
7. Backend DELETE old encodings → INSERT new ones
8. Success → Back to StudentsPage
9. Status tetap: ✅ Terdaftar (tapi dengan encoding baru)

---

## 💻 Code Changes

### File 1: `StudentsPage.tsx`

**Change**: Update action buttons logic

```typescript
// Before
{tab === 'siswa' && !user.has_face && (
  <Button
    size="sm"
    variant="primary"
    onClick={() => handleFaceRegistration(user.id)}
    icon={<Camera size={16} />}
  >
    Daftar Wajah
  </Button>
)}

// After
{tab === 'siswa' && (
  user.has_face ? (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => handleFaceRegistration(user.id)}
      icon={<Camera size={16} />}
    >
      Perbarui Wajah
    </Button>
  ) : (
    <Button
      size="sm"
      variant="primary"
      onClick={() => handleFaceRegistration(user.id)}
      icon={<Camera size={16} />}
    >
      Daftar Wajah
    </Button>
  )
)}
```

### File 2: `FaceRegistrationPage.tsx` (Optional Enhancement)

**Change**: Detect update mode & adjust UI text

```typescript
// Fetch user data to check has_face
const { data: userData } = useQuery({
  queryKey: ['user-detail', userId],
  queryFn: () => adminService.getUserDetail(parseInt(userId || '0')),
});

const isUpdateMode = userData?.has_face || false;

// Update title & description
<ShellHeader
  title={isUpdateMode ? "Perbarui Registrasi Wajah" : "Registrasi Wajah"}
  description={
    isUpdateMode
      ? "Ambil foto baru untuk menggantikan wajah yang terdaftar"
      : "Ambil 3-5 foto wajah dengan pose berbeda untuk akurasi maksimal"
  }
  actions={...}
/>

// Update submit button text
registerMutation.mutate(capturedImages);
toast.success(isUpdateMode ? 'Wajah berhasil diperbarui!' : 'Wajah berhasil didaftarkan!');

// Optional: Add warning for update mode
{isUpdateMode && (
  <Alert variant="warning">
    <p>Foto baru akan menggantikan foto wajah yang sudah terdaftar.</p>
  </Alert>
)}
```

---

## 🧪 Testing Checklist

### Test Case 1: Register (Belum Punya Wajah)
- [ ] Button "Daftar Wajah" muncul (primary/teal)
- [ ] Klik button → navigate ke face registration
- [ ] Capture 3-5 foto
- [ ] Submit → success toast
- [ ] Back to StudentsPage → status ✅ Terdaftar
- [ ] Button berubah jadi "Perbarui Wajah" (secondary/gray)

### Test Case 2: Update (Sudah Punya Wajah)
- [ ] Button "Perbarui Wajah" muncul (secondary/gray)
- [ ] Klik button → navigate ke face registration
- [ ] Title: "Perbarui Registrasi Wajah"
- [ ] Capture 3-5 foto baru
- [ ] Submit → "Wajah berhasil diperbarui!" toast
- [ ] Back to StudentsPage → status tetap ✅ Terdaftar
- [ ] Face recognition accuracy improved (test di attendance)

### Test Case 3: Backend
- [ ] Old encodings deleted from DB
- [ ] New encodings inserted
- [ ] `face_encodings` table: old data replaced
- [ ] Face recognition still works dengan encodings baru

---

## 🎯 Success Criteria

✅ Button "Perbarui Wajah" muncul untuk siswa dengan `has_face = true`  
✅ Navigate ke `/admin/students/:id/face-registration`  
✅ FaceRegistrationPage reused (no duplicate code)  
✅ Backend API replace old encodings dengan new ones  
✅ UI feedback jelas (toast, title, description)  
✅ Siswa bisa di-update berkali-kali  
✅ No breaking changes untuk register flow  

---

## 🚀 Implementation Steps

1. **Update `StudentsPage.tsx`**
   - Conditional button rendering
   - `user.has_face ? "Perbarui" : "Daftar"`

2. **(Optional) Update `FaceRegistrationPage.tsx`**
   - Fetch user data
   - Detect update mode
   - Adjust title & button text

3. **(Optional) Add Admin Service Method**
   ```typescript
   getUserDetail(userId: number) {
     return apiClient.get(`/api/users/${userId}`);
   }
   ```

4. **Testing**
   - Test register flow (unchanged)
   - Test update flow (new)
   - Verify backend replacement logic

5. **Commit**
   ```bash
   git add -A
   git commit -m "feat: add update face feature for registered students
   
   - Add 'Perbarui Wajah' button for students with face
   - Reuse FaceRegistrationPage for update mode
   - Backend API already supports replacement
   - (Optional) Detect update mode & adjust UI text"
   ```

---

## 📝 Notes

- **Backend sudah support!** Delete old + insert new = replace ✅
- **No new API** needed → reuse `/api/face/register`
- **Same route** → `/admin/students/:id/face-registration`
- **Minimal changes** → hanya StudentsPage button logic
- **Optional enhancement** → UI text adjustment di FaceRegistrationPage

Simple implementation → big user value! 🌙

---

**Next**: Implement → Test → Commit  
Luna 🌙
