System & UI/UX Design Specification

Project: SchoolCare

Version: 2.1.0
Architecture: Next.js App Router + TypeScript + Prisma + Pure PostgreSQL + SSE + Gemini
Design Philosophy: Crisis-responsive, utilitarian, accessible, privacy-aware
Primary Interface: Mobile-first for students, desktop-first for TPPK

────────

1. Design Principles

1.1 Crisis-Responsive

The interface must prioritize:

1. clarity;
2. readable typography;
3. obvious actions;
4. low cognitive load;
5. predictable navigation.

Decorative visual effects must never compete with critical information.

1.2 Anti-AI-Slop

Avoid:

• mesh gradients;
• excessive purple/neon;
• glassmorphism;
• excessive floating cards;
• 3D illustrations;
• decorative AI imagery;
• excessive rounded containers;
• unnecessary animation.

Use:

• solid surfaces;
• crisp borders;
• restrained radius;
• strong typography;
• clear hierarchy;
• functional status indicators.

────────

2. Visual System

2.1 Base Colors

Background       #FFFFFF
Muted Background #F8FAFC
Border           #E2E8F0
Strong Border    #CBD5E1

Primary Text     #0F172A
Secondary Text   #475569

Brand            #0284C7
Brand Light      #F0F9FF
Brand Border     #BAE6FD

2.2 Severity Tokens

CRITICAL

Text:   #B91C1C
Border: #FECACA
BG:     #FEF2F2

HIGH

Text:   #C2410C
Border: #FED7AA
BG:     #FFF7ED

MEDIUM

Text:   #B45309
Border: #FDE68A
BG:     #FFFBEB

LOW

Text:   #047857
Border: #A7F3D0
BG:     #ECFDF5

Color must never be the only indicator. Always pair severity colors with text/icons.

────────

3. Typography

Primary:

Inter
-apple-system
BlinkMacSystemFont
Segoe UI
Roboto
sans-serif

Critical identifiers:

ui-monospace
SFMono-Regular
Menlo
Monaco
Consolas

Use monospace for:

• ticket token;
• report ID;
• timestamps where appropriate.

Avoid using monospace for normal paragraphs.

────────

4. Spacing and Radius

Base spacing:

4px
8px
12px
16px
24px
32px

Radius:

rounded-md → buttons / inputs
rounded-lg → cards / panels

Avoid rounded-3xl.

────────

5. Interaction Rules

All interactive components require:

focus-visible:ring-2
focus-visible:ring-slate-900
focus-visible:outline-none

Buttons must have:

• visible hover state;
• visible focus state;
• disabled state;
• loading state;
• error feedback where relevant.

Avoid relying exclusively on hover because students may use touch devices.

────────

6. Information Architecture

SchoolCare
│
├── /
│   └── Landing / school entry
│
├── /lapor?school_id=...
│   └── Anonymous report form
│
├── /lacak?token=...
│   └── Report tracking
│
└── /dashboard
    ├── Login
    └── TPPK Workstation

────────

7. Student Experience

7.1 Landing Page

Purpose:

• explain SchoolCare;
• provide “Buat Laporan” action;
• provide “Lacak Laporan” action;
• explain that name/identity is not required.

Suggested hierarchy:

SCHOOLCARE

Laporkan kejadian dengan aman.
Anda tidak perlu mencantumkan nama untuk membuat laporan.

[ Buat Laporan ]

Sudah punya kode tiket?
[ Lacak Laporan ]

Avoid excessive marketing copy.

────────

8. Report Form

Route:

/lapor?school_id=SMKN1-SBY

Layout:

┌────────────────────────────────────┐
│ SchoolCare          SMK Negeri ... │
├────────────────────────────────────┤
│ LAPORAN KEJADIAN                   │
│                                    │
│ Kategori *                         │
│ ○ Kekerasan fisik                  │
│ ○ Pemalakan                        │
│ ○ Intimidasi / bullying            │
│ ○ Kekerasan siber                  │
│ ○ Pelecehan                        │
│ ○ Lainnya                          │
│                                    │
│ Lokasi *                           │
│ [...............................]  │
│                                    │
│ Perkiraan waktu                    │
│ [...............................]  │
│                                    │
│ Kronologi *                        │
│ ┌──────────────────────────────┐   │
│ │ Jelaskan kejadian secara     │   │
│ │ objektif...                  │   │
│ └──────────────────────────────┘   │
│ 42 / 20 karakter minimum          │
│                                    │
│ Bukti (opsional)                  │
│ [ Pilih file ]                    │
│                                    │
│ [ KIRIM LAPORAN ]                 │
│                                    │
│ Nama dan NISN tidak diperlukan.   │
└────────────────────────────────────┘

────────

9. Form Validation

Minimum description:

20 characters

Validation should appear immediately but not aggressively.

Example:

Kronologi terlalu singkat.
Tambahkan minimal 20 karakter agar laporan dapat ditinjau.

Do not expose internal errors such as:

PrismaClientKnownRequestError

Instead:

Laporan belum dapat dikirim.
Periksa koneksi lalu coba lagi.

────────

10. Token Success Screen

After successful submission:

┌─────────────────────────────────────┐
│ ✓ LAPORAN DITERIMA                  │
├─────────────────────────────────────┤
│ Simpan kode tiket Anda              │
│                                     │
│       CARE-8F2A-99BC                │
│                                     │
│ [ Salin Kode ] [ Lacak Laporan ]    │
│                                     │
│ Kode ini digunakan untuk mengakses  │
│ perkembangan laporan Anda.          │
│ Jangan bagikan kode ini kepada      │
│ orang lain.                         │
└─────────────────────────────────────┘

Do not say:

> “Ini satu-satunya kunci yang menjamin anonimitas 100%.”

Use:

> “Kode ini diperlukan untuk mengakses laporan Anda.”

────────

11. Tracking Page

Route:

/lacak?token=...

Header:

TIKET
CARE-8F2A-99BC

● LIVE

Connection state:

CONNECTING
Menyambungkan...

OPEN
Pelacakan aktif

CLOSED
Koneksi terputus. Mencoba menyambungkan kembali...

────────

12. Status Stepper

✓ Laporan diterima
│
✓ Sedang ditinjau
│
● Tindakan sedang dilakukan
│
○ Penanganan selesai

Status must use both:

• icon;
• text;
• optional timestamp.

Never communicate state using color alone.

────────

13. Live Chat

┌─────────────────────────────────────┐
│ KOMUNIKASI DENGAN TPPK              │
├─────────────────────────────────────┤
│ TPPK                                │
│ Laporan Anda sudah kami terima.     │
│                                     │
│ Anda                                │
│ Terima kasih, saya ingin...         │
│                                     │
│ [ Ketik pesan...              ]     │
│                         [Kirim]     │
└─────────────────────────────────────┘

Student UI should refer to the recipient as:

> TPPK / Guru BK

rather than exposing unnecessary staff personal information.

────────

14. Realtime UX

When SSE is connected:

● Live

When reconnecting:

● Menyambungkan kembali...

When disconnected:

● Koneksi terputus
Status akan diperbarui kembali secara otomatis.

Do not block the entire interface merely because SSE is disconnected.

Fallback polling can continue reading the latest report state.

────────

15. TPPK Dashboard

Desktop-first:

┌───────────────────────────────────────────────────────────────┐
│ SchoolCare Console                     [Status] [Priority]   │
├──────────────────────────┬────────────────────────────────────┤
│ LAPORAN MASUK            │ DETAIL LAPORAN                     │
│                          │                                    │
│ CRITICAL                 │ CARE-8F2A-99BC                    │
│ CARE-8F2A-99BC           │ Kekerasan fisik                   │
│ 10:14                    │                                    │
│                          │ Lokasi: Toilet lantai 2            │
│ HIGH                     │                                    │
│ CARE-5512-ZZ99           │ Kronologi                          │
│ 09:40                    │ "..."                              │
│                          │                                    │
│ MEDIUM                   │ AI TRIAGE RECOMMENDATION           │
│ CARE-1102-LK12           │ CRITICAL                           │
│                          │                                    │
│                          │ Wajib diverifikasi TPPK            │
│                          │                                    │
│                          │ Ringkasan risiko                   │
│                          │ ...                                │
│                          │                                    │
│                          │ Rekomendasi tindakan               │
│                          │ 1. ...                             │
│                          │ 2. ...                             │
│                          │ 3. ...                             │
│                          │                                    │
│                          │ [ Konfirmasi ]                     │
│                          │ [ Ubah Status ▼ ]                  │
└──────────────────────────┴────────────────────────────────────┘

────────

16. AI Recommendation UI

Never present AI as an unquestionable authority.

Use:

AI TRIAGE RECOMMENDATION

Severity: HIGH

Ringkasan:
...

Rekomendasi:
1. ...
2. ...
3. ...

⚠ Rekomendasi ini dihasilkan AI dan harus diverifikasi
  oleh petugas TPPK/BK.

This is a core UX requirement.

────────

17. TPPK Action Controls

Status selector:

[ RECEIVED ▼ ]
[ UNDER_REVIEW ]
[ ACTION_TAKEN ]
[ RESOLVED ]

Before resolving:

Apakah penanganan laporan ini sudah selesai?

[ Batal ] [ Tandai Selesai ]

The interface should prevent accidental status changes.

────────

18. Authentication UX

TPPK:

┌────────────────────────────┐
│ SchoolCare Console         │
│                            │
│ Email / Username           │
│ [.......................]  │
│                            │
│ Password                   │
│ [.......................]  │
│                            │
│ [ Masuk ]                  │
└────────────────────────────┘

No staff dashboard should be publicly accessible.

────────

19. Error States

Invalid Token

Kode tiket tidak valid atau laporan tidak ditemukan.

Periksa kembali kode tiket Anda.

Do not reveal whether another person’s token exists.

Server Error

Laporan belum dapat dimuat.

Coba lagi beberapa saat kemudian.

AI Failure

The report must still be created.

Laporan berhasil diterima.

Analisis AI sedang tidak tersedia.
TPPK tetap dapat meninjau laporan secara manual.

AI failure must never prevent core reporting.

────────

20. Loading States

Use skeleton/loading indicators for:

• dashboard report list;
• report detail;
• chat history.

Submit button:

Mengirim laporan...

Do not allow duplicate submissions while the request is processing.

────────

21. Optimistic Chat

When a message is sent:

pending → sent

If the request fails:

failed
[ Coba lagi ]

Do not assume an SSE event means the original POST succeeded unless the client can correlate the message ID.

────────

22. Accessibility

Target:

> WCAG 2.1 AA-oriented implementation.

Requirements:

• semantic HTML;
• keyboard navigation;
• visible focus;
• screen-reader labels;
• sufficient contrast;
• error messages associated with inputs;
• radio groups with proper semantics;
• buttons with descriptive labels;
• no color-only status communication;
• reduced-motion support.

Do not claim formal WCAG compliance without testing.

────────

23. Responsive Behavior

Mobile

Student:

single column
full-width controls
large touch targets
minimal navigation

Tablet

Maintain single-column form but increase max width.

Desktop

TPPK:

split-pane
left queue
right detail

The dashboard should not use excessive cards.

────────

24. Motion

Only functional animation:

• loading;
• status transition;
• toast;
• connection indicator.

Avoid:

• parallax;
• floating decorations;
• looping gradients;
• excessive entrance animation.

Respect:

prefers-reduced-motion

────────

25. Component Architecture

Suggested:

components/
├── report/
│   ├── ReportForm.tsx
│   ├── ReportCategory.tsx
│   └── TokenSuccess.tsx
│
├── tracking/
│   ├── StatusStepper.tsx
│   ├── ConnectionStatus.tsx
│   └── ChatPanel.tsx
│
├── dashboard/
│   ├── ReportQueue.tsx
│   ├── ReportDetail.tsx
│   ├── AiRecommendation.tsx
│   └── StatusControl.tsx
│
└── ui/
    ├── Button.tsx
    ├── Input.tsx
    ├── Textarea.tsx
    ├── Badge.tsx
    └── Alert.tsx

────────

26. Realtime Client Pattern

Student:

const eventSource = new EventSource(
  `/api/realtime?token=${encodeURIComponent(token)}`
);

eventSource.addEventListener("status_updated", ...);
eventSource.addEventListener("new_message", ...);

The token must never be logged.

TPPK:

new EventSource("/api/realtime?role=counselor");

only after authenticated access.

────────

27. Privacy UX

Use clear language:

Anda tidak perlu mencantumkan nama atau NISN.

Avoid:

100% anonim
tidak mungkin dilacak
pasti aman

unless those claims are technically and operationally proven.

────────

28. Evidence Upload UX

BUKTI OPSIONAL

[ + Pilih Foto ]

JPG / PNG
Maks. 5 MB

Jangan unggah informasi pribadi yang tidak diperlukan.

If upload is unavailable:

Fitur bukti foto belum tersedia pada versi demo.

Do not display a fake upload control that does nothing.

────────

29. Security UX Rules

Never expose:

• database errors;
• API keys;
• internal stack traces;
• server paths;
• raw SQL errors;
• other reports;
• staff credentials.

Token is sensitive and should be treated like a password.

────────

30. Design Definition of Done

Student

☐ Can submit without registration.
☐ Does not require name/NISN.
☐ Receives ticket token.
☐ Can track report.
☐ Can see status.
☐ Receives realtime updates.
☐ Can chat with TPPK.
☐ Has clear connection/error states.

TPPK

☐ Login required.
☐ Can see report queue.
☐ Can open report.
☐ Can see AI recommendation.
☐ AI recommendation is explicitly marked as recommendation.
☐ Can update status.
☐ Can send messages.
☐ Dashboard receives realtime updates.

Accessibility

☐ Keyboard navigation.
☐ Visible focus.
☐ Screen-reader labels.
☐ No color-only communication.
☐ Responsive mobile layout.
☐ Reduced-motion support.

────────

31. Final Design Principle

> **SchoolCare should feel like a serious public-service reporting tool, not a generic AI dashboard.**

The visual hierarchy must always prioritize:

SAFETY
  ↓
CLARITY
  ↓
ACTION
  ↓
INFORMATION
  ↓
DECORATION

Decoration is optional. Clarity is not.