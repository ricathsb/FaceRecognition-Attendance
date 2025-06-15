# Face Recognition Project

Sistem absensi berbasis pengenalan wajah dengan teknologi full-stack menggunakan Nextjs, Python Flask, dan PostgreSQL.

## Prerequisites

Pastikan sudah terinstall:
- Node.js dan npm
- Python 3.x
- PostgreSQL
- Git

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/muhfadtz/FaceRecognition-Attendance
cd backend
```

### 2. Setup Frontend (Terminal 1)

```bash
npm install
```

### 3. Setup Database PostgreSQL

- Install PostgreSQL (pilih agent dan postgre yg (installed))
- Buat database baru dengan nama `face_recognation`

### 4. Setup Backend (Terminal 2)

```bash
cd backend
```

### 5. Konfigurasi Database Schema

Edit file `prisma/schema.prisma` dengan kode berikut:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model CatatanAbsensi {
  id                Int      @id @default(autoincrement())
  timestamp_absensi DateTime
  status            String
  createdAt         DateTime @default(now())
  karyawanId        Int
  karyawan          Karyawan @relation(fields: [karyawanId], references: [id])

  @@map("CatatanAbsensi")
}

model PengaturanAbsensi {
  id               Int      @id @default(autoincrement())
  waktuMulaiAbsen  String
  batasTepatWaktu  String
  batasTerlambat   String
  hariKerja        String[] // array string PostgreSQL
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@map("PengaturanAbsensi")
}

model Karyawan {
  id             Int              @id @default(autoincrement())
  nama           String
  nip            String           @unique
  foto_filename  String?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  face_embedding String?
  email          String?          @unique
  password       String?
  status         String           @default("Guru") // New status field
  catatanAbsensi CatatanAbsensi[]

  @@map("Karyawan")
}

model HariLibur {
  id          Int      @id @default(autoincrement())
  tanggal     DateTime
  keterangan  String   @default("Hari Libur")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tanggal])
  @@map("HariLibur")
}
```

### 6. Konfigurasi Environment Variables

**File `.env` di luar setara dengan folder (app):**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/face_recognation?schema=public"
```

**File `.env` (setara dengan folder model di (folder backend)):**
```env
DB_HOST=localhost
DB_NAME=face_recognation
DB_USER="username"
DB_PASS="password"
```

> **Note:** Ganti `username` dan `password` dengan kredensial PostgreSQL Anda.

### 7. Setup Prisma dan Database Migration (Terminal 3)

Install dependencies Prisma:
```bash
npm install prisma --save-dev
npm install @prisma/client
```

Initialize Prisma:
```bash
npx prisma init
```

Jalankan migration:
```bash
npx prisma migrate dev --name init
```

### 8. Setup Backend Dependencies

Install semua dependencies Python (Terminal 3):
```bash
pip install -r requirements.txt
```

Install Library PDF (Terminal 3):
```bash
npm install pdf-lib
```

### 10. Menjalankan Aplikasi

**Terminal 2 (Backend):**
```bash
python app.py
```

**Terminal 1 (Frontend):**
```bash
npm run dev
```

### 11. Akses Aplikasi

Buka browser dan akses URL yang ditampilkan di Terminal 1 (biasanya `http://localhost:3000` atau `http://localhost:5173`).

---

## Struktur Project

```
project-root/
├── backend/
│   ├── app.py
│   ├── .env
│   ├── requirements.txt
│   └── ...
├── prisma/
│   └── schema.prisma
├── .env
├── package.json
└── README.md
```

---

## Troubleshooting

### Database Connection Issues
- Pastikan PostgreSQL service berjalan
- Periksa kredensial database di file `.env`
- Pastikan database `face_recognation` sudah dibuat

### Migration Errors
- Pastikan `DATABASE_URL` sudah benar dikonfigurasi
- Jalankan `npx prisma generate` jika ada error client

### Python Dependencies
- Jika error saat install `psycopg2-binary`, coba install PostgreSQL development headers
- Pastikan Python virtual environment aktif (opsional tapi direkomendasikan)

---

## Technologies Used

- **Frontend:** React.js
- **Backend:** Python Flask
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Face Recognition:** Python libraries (sesuai requirements.txt)

---

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request
