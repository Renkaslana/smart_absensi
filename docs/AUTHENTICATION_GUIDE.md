# 🔐 Authentication System - User Guide
**ClassAttend - Smart Absensi System**

---

## 📖 Cara Kerja Sistem Autentikasi

Sistem autentikasi aplikasi ClassAttend menggunakan **JWT (JSON Web Token)** dengan mekanisme **Access Token** dan **Refresh Token** untuk keamanan maksimal.

---

## 🎯 Token Types

### 1. Access Token
- **Durasi:** 30 menit
- **Fungsi:** Digunakan untuk setiap request ke backend
- **Storage:** localStorage
- **Auto-refresh:** Ya, otomatis di-refresh sebelum expired

### 2. Refresh Token
- **Durasi:** 7 hari
- **Fungsi:** Digunakan untuk mendapatkan access token baru
- **Storage:** localStorage
- **Rotation:** Ya, setiap refresh akan dapat token baru

---

## 🔄 Alur Autentikasi

### 1. Login
```
User input NIM & Password
    ↓
Backend verifikasi kredensial
    ↓
Backend generate Access Token (30 min) & Refresh Token (7 hari)
    ↓
Frontend simpan tokens di localStorage
    ↓
Redirect ke Dashboard
```

### 2. Request API
```
User akses halaman/fitur
    ↓
Frontend cek token validity
    ↓
Token valid? → Request dengan Authorization header
Token expired? → Auto refresh token → Retry request
    ↓
Success: Data displayed
Failed: Redirect to login
```

### 3. Token Refresh
```
Access Token akan expired dalam 30 menit
    ↓
Sebelum request, frontend cek expiry
    ↓
Jika < 10 detik lagi expired → Auto refresh
    ↓
Gunakan Refresh Token untuk dapat Access Token baru
    ↓
Simpan token baru & retry original request
    ↓
Seamless experience (user tidak sadar)
```

### 4. Logout
```
User klik Logout
    ↓
Frontend panggil logout API
    ↓
Backend revoke semua refresh tokens
    ↓
Frontend clear localStorage
    ↓
Redirect ke Login page
```

---

## 🛡️ Security Features

### 1. Token Validation
- ✅ Token divalidasi sebelum setiap request
- ✅ Expired token otomatis di-refresh
- ✅ Invalid token langsung logout

### 2. Session Management
- ✅ Session divalidasi saat app load
- ✅ Stale session otomatis di-clear
- ✅ Multiple tabs sync state via localStorage

### 3. Server Restart Handling
- ✅ Short restart: Token tetap valid
- ✅ Long downtime: Auto logout jika token expired
- ✅ Network error: Session maintained (auto reconnect)

### 4. Token Rotation
- ✅ Refresh token single-use (security best practice)
- ✅ Old refresh token di-revoke setelah dipakai
- ✅ Prevent token replay attacks

---

## 🔍 Troubleshooting

### Problem 1: Login Loop (Fixed! ✅)
**Gejala:** Setelah login, redirect ke dashboard lalu balik ke login lagi

**Solusi:** Sudah diperbaiki dengan:
- Token validation sebelum redirect
- Session validation saat app load
- Auto token refresh mechanism

---

### Problem 2: Stuck at "Memeriksa autentikasi..." (Fixed! ✅)
**Gejala:** Halaman loading infinitely dengan text "Memeriksa autentikasi..."

**Penyebab:** Bug di rehydration callback (sudah diperbaiki)

**Solusi Otomatis:**
- ✅ Fixed `onRehydrateStorage` callback structure
- ✅ Added 2-second timeout fallback
- ✅ Improved error handling

**Manual Fix (jika tetap terjadi):**
1. Clear localStorage: `localStorage.clear()`
2. Reload page (Ctrl+R)
3. Try login again

---

### Problem 3: "Session Expired" setelah beberapa menit
**Penyebab:** Access token expired (30 menit)

**Solusi:** Auto refresh sudah implemented. Jika tetap terjadi:
- Cek koneksi internet
- Cek backend masih running
- Cek refresh token belum expired (7 hari)

---

### Problem 4: Logout dari semua tab
**Penyebab:** localStorage shared across tabs

**Behavior:** Expected! Logout di 1 tab = logout di semua tab

---

### Problem 5: "Network Error"
**Penyebab:** Backend server mati/restart

**Solusi:** 
- Session TIDAK di-clear (by design)
- Tunggu server online kembali
- Request akan auto retry

---

### Problem 6: Layout Shift Warning (Fixed! ✅)
**Gejala:** Console warning "Layout was forced before page fully loaded"

**Solusi:** Sudah diperbaiki dengan loading state di login page

---

## 📱 Multi-Device Behavior

### Scenario 1: Login di 2 device berbeda
- ✅ **Allowed**: Boleh login di multiple devices
- ✅ **Independent**: Setiap device punya token sendiri
- ✅ **Logout**: Logout di 1 device tidak affect device lain

### Scenario 2: Change password
- ⚠️ **Revoke all tokens**: Semua device logout
- ✅ **Security**: Prevent unauthorized access
- 🔄 **Re-login required**: Harus login ulang di semua device

---

## 🧪 Testing Guide

### Test 1: Normal Login Flow
```
1. Buka http://localhost:3001/login
2. Input NIM & Password
3. Klik "Masuk"
4. Verify redirect ke /dashboard atau /admin/dashboard
5. Check localStorage ada access_token & refresh_token
```

### Test 2: Token Refresh (Auto)
```
1. Login dengan NIM & Password
2. Buka DevTools → Application → localStorage
3. Copy access_token value
4. Decode di jwt.io (check exp time)
5. Tunggu sampai hampir expired
6. Refresh page atau navigate
7. Verify token di-refresh (token baru di localStorage)
```

### Test 3: Session Persistence
```
1. Login ke aplikasi
2. Close browser/tab
3. Open browser/tab baru
4. Buka http://localhost:3001
5. Verify auto redirect ke dashboard (still logged in)
```

### Test 4: Logout
```
1. Login ke aplikasi
2. Navigate ke dashboard
3. Klik "Logout"
4. Verify redirect ke /login
5. Check localStorage empty (no tokens)
```

### Test 5: Server Restart
```
1. Login ke aplikasi
2. Navigate ke dashboard
3. Stop backend server (Ctrl+C)
4. Tunggu 5 detik
5. Start backend server lagi
6. Refresh dashboard
7. Verify: Auto reconnect (no logout)
```

### Test 6: Long Server Downtime
```
1. Login ke aplikasi
2. Stop backend server
3. Tunggu > 30 menit (atau edit token expiry)
4. Refresh page
5. Verify: Auto logout ke /login (token expired)
```

### Test 7: Invalid Token
```
1. Login ke aplikasi
2. Open DevTools → Application → localStorage
3. Edit access_token (ubah 1 karakter)
4. Refresh page
5. Verify: Auto logout ke /login (invalid token)
```

---

## 🚀 Developer Tips

### 1. Debugging Authentication
```javascript
// Open browser console
// Check auth state
localStorage.getItem('access_token')
localStorage.getItem('refresh_token')
localStorage.getItem('user')

// Check token expiry
import { getTokenExpiry } from '@/lib/jwt'
getTokenExpiry(localStorage.getItem('access_token'))
```

### 2. Force Logout
```javascript
// Clear all auth data
localStorage.clear()
// Reload page
window.location.href = '/login'
```

### 3. Simulate Token Expiry
```javascript
// Edit token exp claim di localStorage
// Or wait 30 minutes for access token
// Or wait 7 days for refresh token
```

---

## ⚙️ Configuration

### Backend (Python)
```python
# app/core/config.py

ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Access token: 30 minutes
REFRESH_TOKEN_EXPIRE_DAYS = 7     # Refresh token: 7 days
JWT_SECRET_KEY = "your-secret-key"
JWT_ALGORITHM = "HS256"
```

### Frontend (TypeScript)
```typescript
// lib/jwt.ts

const EXPIRY_BUFFER = 10; // 10 seconds buffer before expiry
```

### Environment Variables
```bash
# frontend/.env.local

NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## 📊 Token Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   User Login                            │
└──────────────────┬──────────────────────────────────────┘
                   ↓
        ┌──────────────────────┐
        │  Access Token (30m)  │
        │  Refresh Token (7d)  │
        └──────────┬───────────┘
                   ↓
        ┌──────────────────────┐
        │   Store in localStorage│
        └──────────┬───────────┘
                   ↓
     ┌─────────────────────────────┐
     │  User uses app (< 30 min)   │
     │  Token valid → All good ✅  │
     └─────────────────────────────┘
                   ↓
     ┌─────────────────────────────┐
     │ After 30 min → Token expired│
     └──────────┬──────────────────┘
                   ↓
     ┌─────────────────────────────┐
     │  Auto Refresh (use refresh  │
     │  token to get new access)   │
     └──────────┬──────────────────┘
                   ↓
     ┌─────────────────────────────┐
     │  New Access Token (30m)     │
     │  New Refresh Token (7d)     │
     └──────────┬──────────────────┘
                   ↓
     ┌─────────────────────────────┐
     │  Continue using app ✅      │
     └─────────────────────────────┘
                   ↓
     ┌─────────────────────────────┐
     │ After 7 days → Refresh      │
     │ token expired → Logout 🚪   │
     └─────────────────────────────┘
```

---

## ✅ Best Practices

### For Users:
1. ✅ Logout saat selesai menggunakan (shared computer)
2. ✅ Jangan share NIM & Password
3. ✅ Change password secara berkala
4. ✅ Logout dari semua device jika password leaked

### For Developers:
1. ✅ Never log sensitive data (tokens, passwords)
2. ✅ Use HTTPS in production
3. ✅ Rotate JWT secret key secara berkala
4. ✅ Monitor failed login attempts
5. ✅ Implement rate limiting untuk login

---

## 🔗 Related Documentation

- [Backend Architecture](../plans/backend-architecture-plan.md)
- [Face Recognition Guide](../FACE_REGISTRATION_GUIDE.md)
- [Authentication Security Fix Report](../reports/20260103_authentication_security_fix.md)

---

## 📞 Support

Jika mengalami masalah dengan autentikasi:
1. Check console logs (F12 → Console)
2. Verify tokens di localStorage
3. Test backend dengan Postman/Thunder Client
4. Check server logs (backend terminal)

---

**Last Updated:** 3 Januari 2026  
**Version:** 2.0 (With Auto Token Refresh)  
**Status:** ✅ Production Ready

---

*Luna - Your Authentication Expert* 🌙
