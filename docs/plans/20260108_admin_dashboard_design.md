# Rencana Peningkatan — Admin Dashboard (FahrenCenter)

Tanggal: 2026-01-08
Penulis: Luna (FahrenCenterAgent)

Tujuan singkat
- Mentransformasi dashboard admin menjadi produk premium untuk sekolah swasta internasional: bersih, cepat, aksesibel, dan menonjolkan brand sekolah.

Ringkasan langkah utama
1. Riset & benchmark desain modern untuk aplikasi pendidikan.
2. Definisi design system (tokens warna, tipografi, spacing, ikon, motion).
3. Implementasi komponen UI inti + pola layout (responsive, RTL-ready).
4. Animasi & micro-interactions terukur dan aksesibel.
5. Implementasi fitur-fitur admin prioritas.
6. Integrasi performa, keamanan, dan QA.

1) Prinsip Desain (panduan singkat)
- Profesional & ramah: tampilan modern namun hangat untuk orang tua dan staff.
- Konsistensi dan hierarki visual yang jelas.
- Mobile-first, keyboard-navigable, WCAG AA.
- Reduced motion support dan high-contrast mode.

2) Palet Warna (token) — contoh finalisasi
- Primary: Deep Navy — #0F172A (kontras tinggi untuk teks utama)
- Accent / Brand: Teal/Seafoam — #0EA5A4 (aksi utama: tombol utama)
- Accent 2: Warm Coral — #FF6B6B (highlight, warning ringan)
- Surface / Card: Off-white — #F8FAFC
- Muted / Text Secondary: Slate — #6B7280
- Success: #10B981, Warning: #F59E0B, Danger: #EF4444
- Dark mode swaps: background #0B1220, card #0F172A, text #E6EEF8

Catatan: Pastikan semua kombinasi memenuhi kontras 4.5:1 untuk teks normal.

3) Tipografi & Spacing
- Font utama UI: Inter (variable) karena legibilitas dan performa.
- Font judul opsional: Poppins (lebih friendly untuk header jika brand ingin karakter lebih hangat).
- Scale: base 16px, spacing scale 4px (4,8,12,16,24,32,48).
- Line-height: body 1.5, headings 1.2.

4) Ikonografi
- Primary icon set: Heroicons (outline + solid) untuk actions dan nav (licence permissive, cocok Tailwind).
- Analytical / dashboard icons: Tabler Icons (bersih dan konsisten untuk charts).
- Small decorative / marketing: Feather Icons atau custom SVG illustrations (brand).
- Delivery: gunakan icon components (svgr) + tree-shaking; jangan load font icon besar.

5) Animasi & Motion
- Library rekomendasi: Framer Motion (React) untuk interaksi kompleks; fallback CSS transitions untuk performa.
- Timing & easing:
  - Standard: 200–300ms, easing cubic-bezier(.4,0,.2,1)
  - Enter/exit modals: 280ms
  - Micro hover: 120–160ms
- Patterns:
  - Subtle elevation/translate on hover untuk cards.
  - Skeleton loaders untuk tabel dan charts.
  - Staggered list reveal untuk small lists (50–80ms delay step).
  - Lottie success/empty-state animations pada aksi kunci (opsional).
- Accessibility: honor prefers-reduced-motion (disable non-essential motion).

6) Komponen UI Inti
- Layout: Shell — responsive Sidebar (collapsible), Topbar dengan quick actions, content area.
- Navigation: grouped sidebar sections, pinned quick filters, responsive collapse to mini-icons with tooltip.
- DataTable: server-side pagination, sorting, column visibility, multi-select, row actions (popover).
- Forms: React Hook Form + Zod validation, inline errors, autosave draft states.
- Cards & KPI: summary metric cards with sparklines and small trend indicators.
- Charts: Line/Bar/Donut via Recharts or ECharts (performance + animations).
- Notifications: toast center + bell dropdown with read/unread state.
- Face Registration Monitor: camera preview, liveness badge, confidence meter, retry flow.
- Audit Log & History: timeline view, filters by actor/date/type.
- Exports: CSV/PDF with server-side generation and progress UI.

7) Fitur Dashboard (prioritas)
- Real-time Attendance Stream: live cards for current session, quick mark/manual override.
- Face Enrollment Dashboard: list pending, quality checks (blurriness, lighting, size), accept/reject.
- Student Management: CRUD, class-assignments, bulk-import (CSV), photo gallery.
- Classrooms & Schedule: view kelas, teacher assignment, daily roster.
- Reports & Analytics: daily/weekly/monthly attendance, tardiness, absent rates, exportable.
- Notifications & Announcements: broadcast to classes or entire school.
- Role & Access: admin, staff, teacher, read-only auditor controls.
- Settings & System: school branding, timezone, attendance rules, thresholds.

8) Visual Language & Microcopy
- Tone: concise, formal-friendly. Gunakan label jelas: “Tandai Hadir”, “Tinjau Enroll”, “Unduh Laporan”.
- Empty states: kombinasi ilustrasi kecil + CTA (Lottie optional).
- Confirmations: inline toasts + undo ketika memungkinkan.

9) Performance & Integrasi Teknikal
- Lazy-load heavy modules (charts, camera components).
- Gunakan React Query + Axios interceptor untuk cache + refetch.
- Server-side table ops untuk mengurangi beban klien.
- Gunakan image/webp untuk avatars; CDN untuk static assets.

10) Accessibility & Localization
- WCAG AA color checks, keyboard nav (tab order), ARIA labels untuk icons, form labels.
- Support English + Indonesian; resource keys untuk terjemahan.

11) Testing & QA
- Component tests (Vitest + Testing Library).
- E2E Playwright flows: attendance, face enrollment, student import, report export.
- Visual regression snapshots untuk halaman kritikal.

12) Deliverables & Handoff
- Design tokens file (JSON) + Tailwind config snippets.
- Storybook dengan semua komponen di src/components.
- Implementation checklist dan API contracts untuk services/*.

Timeline perkiraan (MVP 6 minggu)
- Minggu 1: Riset, design tokens, high-fidelity wireframes.
- Minggu 2–3: Komponen inti + layout + forms.
- Minggu 4: Dashboard pages (KPI, charts) + face monitor.
- Minggu 5: Reports, exports, notifications.
- Minggu 6: QA, accessibility, docs, handoff.

Referensi & tools yang direkomendasikan
- Icon: Heroicons, Tabler Icons
- Motion: Framer Motion, Lottie
- Charts: Recharts / ECharts
- Forms & Validation: React Hook Form + Zod
- State & Data: Zustand + React Query
- Design system: TailwindCSS + Storybook


Langkah selanjutnya (opsional)
- Saya bisa: (a) buat design-tokens.json + tailwind.config.js snippet, atau (b) scaffold Storybook dan komponen Shell + Sidebar untuk frontend.

0️⃣ **Ringkasan Peningkatan — 5 Pilar Baru**
- Decision Framework: buat alasan desain yang dapat dipertanggungjawabkan untuk stakeholder.
- Information Architecture & User Flows: dokumentasi alur admin inti untuk FE/QA/PM.
- Observability & Admin Intelligence: layer insight operasional untuk membantu keputusan.
- Security, Compliance & Data Governance: perlindungan PII/biometric dan auditability.
- Adoption & Change Management: strategi onboarding untuk pengguna non-teknis.

1️⃣ **Decision Framework (Design Decision Principles)**
- Default to clarity over density: prioritas KPI sedikit tetapi actionable.
- Server-first for data-heavy views: tabel, report, export di-handle server-side.
- Progressive disclosure: fitur advanced tersembunyi hingga dibutuhkan.
- Fail-safe UX: tidak ada destructive action tanpa recovery/undo.

Contoh keputusan teknis (defensible):
- Recharts untuk KPI ringan (small, performant, React-friendly) — cukup untuk sparklines dan summary.
- ECharts untuk analytics berat (large datasets, built-in downsampling, advanced interactions).
- React Query + server pagination: mengurangi memory client, konsisten dengan server-side sorting/filtering.

2️⃣ **Information Architecture & Core Admin Flows**
Dokumentasikan alur mental administrator; setiap flow dijabarkan sebagai langkah minimal.

- Daily Attendance Flow
  - Login → Dashboard KPI → Live Attendance (pilih sesi) → Manual Override → Audit Log (record reason)

- Face Enrollment Flow
  - Pending List → Quality Check (blurriness/lighting/size) → Accept / Reject → Confidence Feedback ke teacher

- Reporting Flow
  - Filter (kelas/tanggal/range) → Preview → Export (CSV/PDF) → Notification when ready (email/UI)

- Incident Flow
  - Error (camera/recognition) → Alert (to on-duty staff) → Resolution (retry/manual mark) → Logged (immutable)

3️⃣ **Observability & Admin Intelligence**
Tambahkan layer yang memberi insight operasional, bukan hanya data mentah.

- Admin Intelligence Widgets (rule-based awal)
  - Misrecognition alerts: "3 siswa kemungkinan gagal dikenali hari ini (confidence < 70%)"
  - Trend alerts: "Tingkat keterlambatan kelas 6B naik 12% minggu ini"
  - Infra alerts: "Kamera A sering delay > 2s (last 24h)"

- Teknis: start dengan rule-based engine (thresholds + cron jobs), log events, expose endpoints untuk ML/analysis nanti.

4️⃣ **Security, Compliance & Data Governance**
Kebutuhan wajib untuk institusi internasional.

- PII & Biometric Data
  - Face embeddings encrypted at rest (AES-256 or KMS-backed).
  - No raw image download for non-superadmin; images stored with ACLs/obfuscation.
  - Consent flags per student (opt-in) and retention config.

- Auditability
  - Immutable audit logs (append-only) with actor, timestamp, action, reason.
  - Manual override requires actor + reason; logged and surfaced in UI.

- Session & Access
  - Role-based UI rendering and feature flags.
  - Auto-logout on idle (configurable), MFA for admins.

5️⃣ **Adoption & Change Management (Real School Rollout)**
- Training: 1-hour hands-on for admin/staff + quick reference cards.
- Dogfooding: internal pilot 2 weeks with selected classes.
- Support flows: in-app help, tooltips, video micro-guides, helpdesk ticket link.
- Success metrics: %attendance captured, time-to-recover incidents, user satisfaction.

6️⃣ **Performance (Advanced Tuning & Budgets)**
- KPI refresh interval: 30–60s; heavy analytics on-demand.
- Live attendance: WebSocket/SSE only for active sessions; otherwise polling fallback.
- Charts: aggregate server-side; downsample for ranges >30 days.
- Performance budgets:
  - TTI < 2.5s on mid-range laptop
  - Initial JS bundle for main dashboard < 300KB

7️⃣ **UX Microcopy & Error Strategy**
- Prinsip pesan error: Jelaskan apa, dampak, dan tindakan user.
- Contoh microcopy: "Wajah kurang jelas (confidence 42%). Minta siswa menghadap kamera dengan pencahayaan cukup."
- Error handling pattern: inline first, contextual toasts, modals only for destructive/resolution flows.

8️⃣ **Testing Strategy (lebih tajam)**
- Area fokus dan risiko
  - Attendance: data correctness (contract tests)
  - Face Enrollment: edge cases & retries (mock camera)
  - Export: long-running jobs (background job tests)
  - Role Access: privilege leak tests
  - Dashboard KPI: snapshot + threshold assertions

- Tambahan: contract testing FE–BE untuk attendance & face APIs; mock camera input in CI for enrollment flows.

9️⃣ **Timeline: Realistis & Aman**
- Sisipkan buffer 20–30% pada Minggu 4–5 (komponen analytics + export).
- Internal dogfooding 2 minggu sebelum final QA.

10️⃣ **Deliverables Tambahan (Enterprise Touch)**
- `admin-ux-guidelines.md` — pola UI, microcopy, dan accessibility rules.
- `access-matrix.xlsx` — role-to-permission mapping.
- `dashboard-metrics.md` — definisi KPI, source of truth, refresh interval.

Langkah eksekusi yang saya rekomendasikan
- Lock Information Architecture + Core Flows.
- Generate `design-tokens.json`.
- Scaffold `Shell` + `Sidebar` + `Topbar` (minimal, responsive).
- Implement KPI cards & lightweight charts (Recharts) → lalu implement heavy analytics (ECharts) di modul terpisah.

---
