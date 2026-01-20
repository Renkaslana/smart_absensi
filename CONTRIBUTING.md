# Contributing to FahrenCenter

Terima kasih atas minat Anda untuk berkontribusi pada **FahrenCenter - Smart Attendance System**! 🎉

Dokumen ini berisi panduan untuk berkontribusi pada proyek ini.

---

## 📋 Table of Contents

1. [Prinsip Pengembangan](#prinsip-pengembangan)
2. [Setup Development Environment](#setup-development-environment)
3. [Coding Conventions](#coding-conventions)
4. [Git Workflow](#git-workflow)
5. [Commit Message Guidelines](#commit-message-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Guidelines](#testing-guidelines)
8. [Documentation](#documentation)

---

## 🎯 Prinsip Pengembangan

### Core Values
- **Production-Ready:** Kode harus layak produksi, bukan sekadar demo
- **Type-Safe:** Gunakan TypeScript dengan strict mode
- **Clean Code:** Readable, maintainable, dan well-documented
- **Separation of Concerns:** Component, service, dan utils terpisah jelas
- **Accessibility:** WCAG 2.1 AA compliance

### Design Philosophy
- **Mobile-First:** Design untuk mobile dulu, lalu desktop
- **Progressive Enhancement:** Fitur tambahan tidak mengganggu core functionality
- **Error Handling:** User-friendly error messages
- **Performance:** Lazy loading, code splitting, optimized images

---

## 🛠️ Setup Development Environment

### 1. Fork & Clone Repository

```bash
# Fork repository di GitHub, lalu clone
git clone https://github.com/YOUR_USERNAME/smart_absensi.git
cd smart_absensi

# Add upstream remote
git remote add upstream https://github.com/Renkaslana/smart_absensi.git
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup database
python -m app.db.init_db

# Run server
python run.py
```

Backend akan berjalan di `http://localhost:8001`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Download MediaPipe models
npm run download-models

# Copy environment variables
cp .env.example .env

# Edit .env sesuai kebutuhan
# VITE_API_BASE_URL=http://localhost:8001/api/v1

# Run development server
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

### 4. Verify Setup

- Buka `http://localhost:5173`
- Login dengan credentials default:
  - **NIM:** admin
  - **Password:** admin123
- Test face registration dan attendance

---

## 📝 Coding Conventions

### Python (Backend)

#### Naming Conventions
```python
# snake_case untuk variabel, fungsi, dan module
user_name = "John Doe"
def get_user_by_id(user_id: int):
    pass

# PascalCase untuk class
class UserService:
    pass

# UPPERCASE untuk konstanta
MAX_FACE_ENCODINGS = 5
DEFAULT_THRESHOLD = 0.55
```

#### Code Style
- **PEP 8** compliance (use `black` formatter)
- **Type hints** wajib untuk fungsi dan class methods
- **Docstrings** untuk public functions dan classes

```python
def register_face(
    user_id: int, 
    images: list[str], 
    db: Session
) -> dict[str, Any]:
    """
    Register face encodings for a user.
    
    Args:
        user_id: ID of the user
        images: List of base64 encoded images
        db: Database session
        
    Returns:
        dict: Registration result with status and message
        
    Raises:
        ValueError: If user not found or images invalid
    """
    pass
```

#### Imports
```python
# Standard library
import os
import sys
from datetime import datetime

# Third-party
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# Local
from app.core.config import settings
from app.models.user import User
from app.schemas.face import FaceRegisterRequest
```

### TypeScript (Frontend)

#### Naming Conventions
```typescript
// camelCase untuk variabel dan fungsi
const userName = "John Doe";
function getUserById(userId: number): User {
  // ...
}

// PascalCase untuk components, interfaces, types
interface UserData {
  id: number;
  name: string;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

function UserProfile() {
  return <div>Profile</div>;
}

// UPPERCASE untuk konstanta
const MAX_RETRY_ATTEMPTS = 3;
const API_TIMEOUT = 5000;
```

#### Code Style
- **ESLint** rules enforced
- **No `any` type** kecuali absolutely necessary
- **Explicit return types** untuk functions
- **Prefer `const`** over `let`

```typescript
// ❌ Bad
function fetchUser(id) {
  return api.get('/users/' + id);
}

// ✅ Good
async function fetchUser(id: number): Promise<User> {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
}
```

#### Component Structure
```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Types
interface UserProfileProps {
  userId: number;
  onUpdate?: (user: User) => void;
}

// 3. Component
export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // 3a. Hooks
  const [isEditing, setIsEditing] = useState(false);
  const { data: user, isLoading } = useQuery(['user', userId], () => fetchUser(userId));
  
  // 3b. Effects
  useEffect(() => {
    // ...
  }, [userId]);
  
  // 3c. Handlers
  const handleUpdate = () => {
    // ...
  };
  
  // 3d. Render
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

#### File Naming
- **Components:** PascalCase (`UserProfile.tsx`)
- **Utilities:** camelCase (`faceUtils.ts`)
- **Services:** camelCase (`authService.ts`)
- **Types:** camelCase with `.types.ts` (`auth.types.ts`)

### CSS/TailwindCSS

#### Class Order (Prettier Plugin)
```tsx
// Layout → Spacing → Sizing → Typography → Visual → Misc
<div className="flex items-center justify-between p-4 w-full h-12 text-lg font-bold bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors" />
```

#### Custom Classes (jika perlu)
```css
/* Gunakan @apply di index.css */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors;
  }
}
```

---

## 🌿 Git Workflow

### Branching Strategy

```
main (production-ready)
  ↓
dev (development)
  ↓
feature/nama-fitur (untuk fitur baru)
fix/nama-bug (untuk bug fixes)
docs/nama-doc (untuk dokumentasi)
```

### Creating a Branch

```bash
# Update dev branch
git checkout dev
git pull upstream dev

# Create feature branch
git checkout -b feature/liveness-detection

# atau untuk bug fix
git checkout -b fix/webcam-permission-error
```

### Branch Naming

- **Feature:** `feature/nama-fitur`
  - Example: `feature/voice-notification`
- **Bug Fix:** `fix/nama-bug`
  - Example: `fix/login-loop-bug`
- **Documentation:** `docs/nama-doc`
  - Example: `docs/api-documentation`
- **Refactor:** `refactor/nama-refactor`
  - Example: `refactor/face-service-optimization`

---

## 📝 Commit Message Guidelines

**Referensi Lengkap:** [docs/GIT_COMMIT_TEMPLATE.md](docs/GIT_COMMIT_TEMPLATE.md)

### Format (Conventional Commits)

```
<emoji> <type>: <subject>

<body> (optional)

<footer> (optional)
```

### Types

- `feat` 🎉 - Fitur baru
- `fix` 🐛 - Bug fix
- `docs` 📝 - Perubahan dokumentasi
- `style` 💄 - Perubahan styling (tidak mengubah logic)
- `refactor` ♻️ - Refactoring code
- `test` ✅ - Menambah atau update tests
- `chore` 🔧 - Perubahan build, tools, dependencies

### Examples

```bash
# Fitur baru
git commit -m "🎉 feat: Add voice notification for attendance success"

# Bug fix
git commit -m "🐛 fix: Resolve webcam permission denied on Chrome"

# Dokumentasi
git commit -m "📝 docs: Update frontend README with setup instructions"

# Refactor
git commit -m "♻️ refactor: Optimize face encoding comparison algorithm"
```

### Detailed Commit (untuk perubahan besar)

```bash
git commit -m "🔐 fix: Authentication security & login loop bug

✅ Implemented auto token refresh mechanism
✅ Added JWT validation utilities
✅ Enhanced session management
✅ Fixed login → dashboard → login loop

Breaking Changes: None
Backward Compatible: Yes

Files Changed:
- NEW: frontend/src/lib/jwt.ts
- UPDATE: frontend/src/lib/api.ts
- UPDATE: frontend/src/components/AuthGate.tsx

Tested: ✅ All scenarios passed"
```

---

## 🔄 Pull Request Process

### 1. Before Creating PR

```bash
# Update your branch with latest dev
git checkout dev
git pull upstream dev
git checkout feature/your-feature
git merge dev

# Resolve conflicts if any
# Run tests
npm run lint
npm run type-check

# Commit and push
git push origin feature/your-feature
```

### 2. Create Pull Request

**Title Format:**
```
[FEATURE] Voice notification for attendance
[FIX] Webcam permission error on Chrome
[DOCS] Update API documentation
```

**PR Description Template:**
```markdown
## 🎯 Tujuan
Brief description of what this PR does.

## 📝 Perubahan
- Added voice notification feature
- Updated attendance service
- Added audio files to public/voice/

## ✅ Checklist
- [x] Code follows coding conventions
- [x] All tests passed
- [x] Documentation updated
- [x] No breaking changes
- [ ] Tested on mobile devices

## 📸 Screenshots (jika UI changes)
[Add screenshots here]

## 🔗 Related Issues
Closes #123
Relates to #456

## 📌 Notes
Additional context or notes for reviewers.
```

### 3. Review Process

- **Self-review:** Review your own changes sebelum submit
- **Wait for review:** Minimal 1 approval dari maintainer
- **Address feedback:** Respond to review comments dengan commit baru
- **Squash commits (optional):** Untuk PR dengan banyak commit kecil

### 4. Merge

- **Maintainer** akan merge setelah approval
- PR akan di-squash merge ke `dev` branch
- Delete branch setelah merge

---

## 🧪 Testing Guidelines

### Backend Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test
pytest tests/test_face_service.py -v
```

### Frontend Testing (Manual untuk saat ini)

#### Critical Test Scenarios

**Authentication:**
- [ ] Login dengan credentials valid
- [ ] Login dengan credentials invalid
- [ ] Auto logout saat token expired
- [ ] Refresh token otomatis saat 401

**Face Registration:**
- [ ] Upload 3-5 foto dari file
- [ ] Capture foto dari webcam
- [ ] Quality check (blur, lighting, size)
- [ ] Error handling untuk foto rejected

**Liveness Detection:**
- [ ] Blink detection works
- [ ] Pass liveness dengan 2+ blinks
- [ ] Fail liveness jika tidak blink
- [ ] Timeout setelah 10 detik

**Attendance:**
- [ ] Face recognition dengan confidence > 55%
- [ ] Voice notification plays
- [ ] Duplicate prevention (sudah absen hari ini)
- [ ] Error handling untuk face not recognized

**Admin Dashboard:**
- [ ] Statistics loaded correctly
- [ ] Charts displayed properly
- [ ] Student list pagination works
- [ ] Add/edit/delete student works

---

## 📖 Documentation

### When to Update Documentation

- **Menambah fitur baru** → Update README, buat docs/plans/
- **Mengubah API endpoint** → Update API docs di backend/README.md
- **Mengubah environment variables** → Update .env.example dan README
- **Bug fix signifikan** → Buat docs/reports/

### Documentation Files

- **README.md** - Overview dan quick start
- **docs/plans/** - Rencana fitur sebelum implementasi
- **docs/reports/** - Laporan implementasi setelah selesai
- **docs/AUTHENTICATION_GUIDE.md** - Panduan authentication
- **docs/FACE_REGISTRATION_GUIDE.md** - Panduan face registration
- **docs/TROUBLESHOOTING.md** - Panduan troubleshooting

### Writing Documentation

- **Gunakan bahasa Indonesia** untuk dokumentasi internal
- **Gunakan bahasa Inggris** untuk code comments dan docstrings
- **Sertakan contoh code** jika perlu
- **Gunakan Markdown formatting** yang proper (headings, lists, code blocks)

---

## 🚫 What NOT to Do

❌ **Jangan:**
- Push langsung ke `main` atau `dev` branch
- Commit dengan message yang tidak jelas ("fix bug", "update")
- Mengubah tech stack tanpa diskusi
- Menambah dependencies besar tanpa persetujuan
- Ignore linter errors
- Commit `.env` file atau credentials
- Commit `node_modules/`, `venv/`, `__pycache__/`
- Membuat PR dengan banyak perubahan unrelated

✅ **Lakukan:**
- Buat branch baru untuk setiap perubahan
- Commit dengan message yang descriptive
- Update dokumentasi saat mengubah code
- Test perubahan sebelum PR
- Respond to review feedback dengan cepat
- Ask questions jika tidak yakin

---

## 💬 Communication

### Asking Questions

- **GitHub Issues:** Untuk bug reports dan feature requests
- **GitHub Discussions:** Untuk pertanyaan umum
- **PR Comments:** Untuk diskusi terkait code review

### Reporting Bugs

**Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
Add screenshots if applicable.

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Node version: [e.g. 18.17.0]
- Python version: [e.g. 3.10.11]

**Additional context**
Any other context about the problem.
```

---

## 🎓 For Academic Contributors

### Universitas Harkat Negeri Students

Jika Anda mahasiswa yang menggunakan project ini untuk tugas akademik:

1. **Fork repository** untuk project pribadi Anda
2. **Cite properly** jika menggunakan sebagian code
3. **Follow academic integrity** guidelines kampus
4. **Contribute back** jika menemukan improvement atau bug fix

### Citation

```
FahrenCenter - Smart Attendance System
https://github.com/Renkaslana/smart_absensi
Developed as part of Pengolahan Citra Digital (PCD) course
Universitas Harkat Negeri, 2025/2026
```

---

## 📞 Need Help?

- **Documentation:** Baca [docs/](docs/) folder
- **Backend Setup:** Lihat [backend/README_SETUP.md](backend/README_SETUP.md)
- **Frontend Setup:** Lihat [frontend/README.md](frontend/README.md)
- **Troubleshooting:** Lihat [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## 🙏 Thank You!

Terima kasih telah berkontribusi pada FahrenCenter! Setiap kontribusi, sekecil apapun, sangat berarti untuk perkembangan project ini.

**Happy Coding! 🚀**

---

**Dibuat dengan � oleh Lycus (Affif)**  
**FahrenCenter** - *"Attendance Made Smart"*