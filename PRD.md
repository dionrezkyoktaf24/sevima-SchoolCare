Product Requirement Document (PRD)

Project: SchoolCare

Version: 2.1.0 — Hackathon MVP
Target: SEVIMA SEMESTA 8 — Empowering Youth for a Sustainable Future: Build with AI
Architecture: Next.js App Router + TypeScript + Prisma ORM + Pure PostgreSQL + Native SSE + Google Gemini API
Primary Alignment: SDG 4 — Quality Education
Regulatory Reference: Permendikbudristek No. 46 Tahun 2023 (PPKSP)

────────

1. Product Overview

SchoolCare adalah sistem pelaporan kekerasan di lingkungan sekolah yang memungkinkan siswa membuat laporan tanpa registrasi dan tanpa wajib memberikan identitas pribadi.

Sistem menyediakan:

1. Pelaporan cepat melalui QR Code sekolah.
2. Secret ticket token untuk memantau laporan tanpa akun.
3. AI-assisted triage untuk memberikan rekomendasi tingkat keparahan.
4. Rekomendasi tindakan untuk membantu TPPK/BK.
5. Monitoring status secara realtime menggunakan Server-Sent Events (SSE).
6. Komunikasi dua arah antara pelapor dan TPPK.
7. Dashboard workstation untuk TPPK/BK.

Prinsip utama

> **AI membantu TPPK mengambil keputusan; AI tidak mengambil keputusan final.**

────────

2. Problem Statement

Siswa dapat mengalami atau menyaksikan kekerasan, bullying, pemalakan, intimidasi, pelecehan, maupun bentuk kekerasan lain di lingkungan sekolah.

Hambatan yang ingin dikurangi SchoolCare:

• takut identitas diketahui;
• proses pelaporan terlalu panjang;
• harus membuat akun sebelum melapor;
• pelapor tidak mengetahui perkembangan laporan;
• TPPK harus melakukan triase awal secara manual;
• komunikasi antara pelapor dan petugas tidak terdokumentasi dengan baik.

SchoolCare dirancang untuk mengurangi friksi tersebut melalui kanal pelaporan sederhana dan monitoring berbasis secret token.

────────

3. Product Vision

> Menyediakan kanal pelaporan sekolah yang cepat, privat, mudah digunakan, dan transparan dengan bantuan AI untuk mendukung triase serta penanganan awal oleh TPPK.

SchoolCare tidak menjanjikan anonimitas absolut. Sistem hanya menjamin bahwa identitas pribadi tidak menjadi field wajib dalam formulir pelaporan dan data identitas yang memang tidak diperlukan tidak disimpan oleh aplikasi.

────────

4. Goals

4.1 MVP Goals

• Siswa dapat membuat laporan dalam kurang dari 45 detik setelah memahami form.
• Siswa tidak perlu membuat akun.
• Sistem menghasilkan secret ticket token.
• TPPK dapat melihat laporan masuk.
• AI memberikan rekomendasi severity dan ringkasan risiko.
• TPPK dapat mengubah status laporan.
• Perubahan status diterima siswa melalui SSE tanpa refresh.
• Siswa dan TPPK dapat mengirim pesan.
• Semua data inti tersimpan di PostgreSQL.

4.2 Non-Goals

Tidak termasuk MVP:

• E2E encryption.
• Mobile native application.
• Distributed realtime infrastructure.
• Advanced analytics.
• Automated law/regulation enforcement.
• AI yang mengambil keputusan final.
• Facial recognition.
• Automatic identification of perpetrators.
• Automatic emergency dispatch.

────────

5. Success Metrics

|Metric                 |MVP Target                                  |
|-----------------------|-------------------------------------------:|
|Time-to-report         |< 45 detik                                  |
|Report creation success|> 95% pada demo                             |
|SSE status propagation |< 1 detik pada single-instance deployment   |
|AI triage response     |< 5 detik target demo                       |
|Required student fields|Tanpa nama/NISN                             |
|Core flow              |Submit → Token → Track → TPPK → Update → SSE|
|Database persistence   |100% untuk data inti                        |

Latency adalah target engineering untuk MVP, bukan SLA produksi.

────────

6. Personas

6.1 Student Reporter

Membutuhkan:

• akses cepat;
• tidak perlu registrasi;
• privasi;
• secret token;
• kemampuan melihat perkembangan;
• kemampuan berkomunikasi dengan TPPK.

6.2 Counselor / TPPK

Membutuhkan:

• antrean laporan;
• prioritas triase;
• detail laporan;
• rekomendasi AI;
• perubahan status;
• komunikasi dengan pelapor;
• histori tindakan.

────────

7. End-to-End User Flow

QR School
   ↓
/lapor?school_id=...
   ↓
Isi laporan
   ↓
POST /api/reports
   ↓
Validate input
   ↓
Generate cryptographically random token
   ↓
Save report → PostgreSQL
   ↓
AI triage recommendation
   ↓
Save AI result
   ↓
Return secret token
   ↓
/lacak?token=...
   ↓
Verify token
   ↓
Resolve report
   ↓
Open authenticated SSE stream
   ↓
Student monitors status/chat

TPPK:

/dashboard/login
       ↓
Authenticated session
       ↓
/dashboard
       ↓
Receive report
       ↓
Review AI recommendation
       ↓
Human verification
       ↓
Change status / send message
       ↓
PostgreSQL
       ↓
SSE event
       ↓
Student UI updates

────────

8. Report Form

Required:

• school_id
• category
• incident_location
• description

Optional:

• incident_time
• evidence

Minimum description length:

20 characters

No required:

• name;
• NISN;
• phone number;
• email;
• social media account.

────────

9. Secret Ticket Token

Format UX:

CARE-8F2A-99BC

Token generation MUST use a cryptographically secure random generator.

Do not use Math.random().

Recommended approach:

crypto.randomBytes(...)

or Web Crypto API.

The token functions as a bearer credential.

Therefore:

• never expose it in server logs;
• never include it in analytics;
• do not store unnecessary copies;
• rate-limit token-based endpoints;
• consider storing a hash of the token in production.

For the hackathon MVP, storing the token directly may be acceptable if access controls and logging rules are properly configured.

────────

10. Privacy Model

SchoolCare uses:

> **No-registration reporting with minimal personal-data collection.**

The application should not intentionally collect:

• name;
• NISN;
• email;
• phone number;
• account identity.

However, infrastructure such as hosting providers, reverse proxies, or standard server logging may process technical metadata.

Therefore the UI must not claim:

> “100% anonymous.”

Recommended wording:

> “Anda tidak perlu mencantumkan nama atau identitas pribadi untuk membuat laporan.”

────────

11. AI Agent

11.1 AI Role

AI performs:

1. Severity recommendation.
2. Risk summary.
3. Suggested action plan.
4. Draft empathetic response.

AI output is a recommendation.

Final decisions remain with authorized TPPK/BK personnel.

11.2 Severity

LOW
MEDIUM
HIGH
CRITICAL

AI should return:

{
  "severity": "HIGH",
  "confidence": 0.82,
  "risk_summary": "...",
  "action_plans": [
    "...",
    "...",
    "..."
  ],
  "draft_response": "..."
}

confidence is informational and must not be presented as a guarantee of correctness.

11.3 Human Review

Dashboard must clearly display:

> AI TRIAGE RECOMMENDATION  
> Wajib diverifikasi oleh TPPK/BK.

TPPK can override the recommendation.

Recommended fields:

ai_severity
human_severity
ai_reviewed
reviewed_by
reviewed_at

For the 6-hour MVP, human_severity may be deferred if necessary, but the UI should still require explicit human confirmation before action.

────────

12. AI Safety Rules

The AI must not:

• identify a perpetrator as fact without evidence;
• invent events;
• claim legal conclusions;
• automatically declare a case resolved;
• automatically contact external authorities;
• automatically punish a student;
• provide dangerous instructions;
• replace human TPPK judgment.

Action plans must be presented as recommendations.

Where possible, the system prompt should instruct the model to rely on the supplied school SOP/regulatory reference rather than inventing procedures.

────────

13. Real-Time Architecture

13.1 MVP

Use:

Next.js Route Handler
       ↓
In-memory SSE Hub
       ↓
EventSource

This is suitable for a single Node.js instance.

13.2 Important Limitation

The in-memory SSE Hub is process-local.

It is NOT a distributed event bus.

If multiple application instances are deployed, each instance has separate SSE state.

For production scaling, use:

PostgreSQL LISTEN/NOTIFY

or a dedicated pub/sub system.

This is intentionally outside the 6-hour MVP scope.

────────

14. Secure SSE

Student:

GET /api/realtime?token=CARE-XXXX-XXXX

Server:

token
 ↓
validate
 ↓
resolve reportId
 ↓
authorize subscription
 ↓
open SSE stream

The client should not be allowed to subscribe merely by supplying an arbitrary reportId.

TPPK:

GET /api/realtime?role=counselor

requires an authenticated TPPK session.

────────

15. SSE Events

Supported:

status_updated
new_message

Example:

event: status_updated
data: {
  "reportId": "...",
  "status": "ACTION_TAKEN"
}

Heartbeat:

: ping

every approximately 15 seconds.

Browser EventSource automatically attempts reconnection.

Fallback polling may call:

GET /api/reports/track?token=...

when SSE is unavailable.

────────

16. Database Architecture

School
  │
  └── Report
         │
         └── ReportMessage

Core tables:

• schools
• reports
• report_messages

Recommended future tables:

• audit_logs
• staff_users
• school_settings
• evidence_files

────────

17. PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE schools (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE severity_level AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE report_status AS ENUM (
    'RECEIVED',
    'UNDER_REVIEW',
    'ACTION_TAKEN',
    'RESOLVED'
);

CREATE TYPE sender_role AS ENUM (
    'STUDENT',
    'COUNSELOR'
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    secret_token VARCHAR(20) UNIQUE NOT NULL,

    category VARCHAR(50) NOT NULL,
    incident_location VARCHAR(150) NOT NULL,
    incident_time VARCHAR(100),
    description TEXT NOT NULL,

    evidence_url TEXT,

    status report_status NOT NULL DEFAULT 'RECEIVED',

    ai_severity severity_level NOT NULL DEFAULT 'MEDIUM',
    ai_confidence NUMERIC(4,3),
    ai_risk_summary TEXT,
    ai_action_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_draft_response TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_school_status
ON reports(school_id, status);

CREATE INDEX idx_reports_school_severity
ON reports(school_id, ai_severity);

CREATE TABLE report_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    sender sender_role NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_report_created
ON report_messages(report_id, created_at ASC);

Note: UNIQUE(secret_token) already creates a unique index, so no duplicate standalone index is required.

────────

18. API Contract

|Method|Route                         |Auth      |Function     |
|------|------------------------------|----------|-------------|
|POST  |`/api/reports`                |Public    |Create report|
|GET   |`/api/reports/track?token=`   |Token     |Read report  |
|PATCH |`/api/reports/status`         |TPPK      |Update status|
|GET   |`/api/chat?token=`            |Token     |Read messages|
|POST  |`/api/chat`                   |Token/TPPK|Send message |
|GET   |`/api/realtime?token=`        |Token     |Student SSE  |
|GET   |`/api/realtime?role=counselor`|TPPK      |Dashboard SSE|

────────

19. Authentication

Student authentication:

Secret token

TPPK authentication:

Session-based authentication

All privileged mutations must be server-side authorized.

The client UI must never be treated as the security boundary.

────────

20. Evidence Upload

MVP:

• optional;
• JPG/PNG;
• maximum 5 MB;
• object storage recommended.

Architecture:

Browser
   ↓
Upload API
   ↓
Object Storage
   ↓
evidence_url/reference
   ↓
PostgreSQL

If storage integration threatens the 6-hour timeline, evidence upload may be disabled in the first demo and represented as a future-ready field.

────────

21. Security Requirements

Minimum:

• HTTPS in deployment.
• Input validation using Zod.
• Parameterized queries through Prisma.
• Rate limiting on public endpoints.
• Token endpoint protection.
• No token logging.
• Server-side authorization for TPPK mutations.
• File MIME/type validation.
• File size validation.
• XSS-safe message rendering.
• No raw AI output rendered as HTML.
• Secrets only in environment variables.

────────

22. 6-Hour Implementation Scope

Priority P0

1. PostgreSQL
2. Prisma
3. Report form
4. Report creation
5. Secret token
6. Track page
7. TPPK dashboard
8. Status update
9. SSE
10. Gemini triage

Priority P1

11. Chat
12. TPPK authentication
13. Fallback polling
14. Evidence upload

Priority P2

15. LISTEN/NOTIFY
16. Advanced audit logs
17. Advanced analytics
18. PWA installability
19. Multi-school administration

If time becomes limited, P2 features must be dropped before compromising the core flow.

────────

23. Recommended Demo Flow

1. Open SchoolCare
2. Scan/open school QR
3. Submit anonymous report
4. Show generated CARE token
5. Open tracking page
6. Open TPPK dashboard
7. Show AI recommendation
8. TPPK verifies recommendation
9. TPPK changes status
10. Student screen updates without refresh
11. TPPK sends message
12. Student receives message live
13. Show PostgreSQL persisted record

This demonstrates the complete product loop.

────────

24. Environment Variables

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/schoolcare?schema=public"

GEMINI_API_KEY="your_api_key"
GEMINI_MODEL="your_configured_model"

NEXT_PUBLIC_APP_URL="http://localhost:3000"

SESSION_SECRET="your_secure_session_secret"

Never commit .env or API keys.

────────

25. Definition of Done

MVP is complete when:

☐ PostgreSQL connects.
☐ Prisma migration succeeds.
☐ Student can submit report.
☐ Token is generated securely.
☐ Report persists.
☐ AI recommendation is stored.
☐ TPPK can review report.
☐ TPPK can update status.
☐ Student receives status through SSE.
☐ Chat persists.
☐ Chat updates through SSE.
☐ Student cannot access another report without valid token.
☐ TPPK endpoints require authorization.
☐ No secrets are committed.
☐ Core demo can run from a clean environment.

────────

26. Product Principle

> **SchoolCare does not replace TPPK. It gives TPPK better information, faster triage, and a safer communication channel for students.**