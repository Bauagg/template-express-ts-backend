# be-asmi-express

Backend REST API menggunakan TypeScript, Express 5, Sequelize, dan PostgreSQL.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express 5
- **ORM**: Sequelize 6
- **Database**: PostgreSQL
- **Auth**: JWT (access token 15m + refresh token 7d)
- **Upload**: Multer (memoryStorage)
- **Logger**: Winston + Morgan
- **Password**: bcrypt

## Struktur Folder

```
be-asmi-express/
├── src/
│   ├── index.ts                        # Entry point
│   ├── databases/
│   │   └── index.ts                    # Koneksi Sequelize, auto-detect model, sync tabel
│   ├── config/
│   │   ├── logger.ts                   # Winston logger
│   │   └── multer.ts                   # Konfigurasi upload file
│   ├── middlewares/
│   │   ├── authenticate.ts             # Verifikasi JWT Bearer token
│   │   └── http-logger.ts              # Morgan stream ke Winston
│   ├── router/
│   │   └── indext.ts                   # Agregasi semua route service
│   ├── utils/
│   │   ├── api-response.ts             # Helper response (sendSuccess, sendCreated, dll)
│   │   ├── app-error.ts                # Custom error class + handler Sequelize
│   │   ├── bcrypt.ts                   # hashPassword, comparePassword
│   │   ├── generate-username.ts        # Auto generate username dari full name
│   │   └── jwt.ts                      # signToken, verifyToken, generateTokenPair, dll
│   └── services/
│       ├── users/
│       │   ├── model.ts                # Model User (UUID, username, email, phone, role)
│       │   ├── repository.ts           # Query DB layer
│       │   ├── service.ts              # Business logic register & login
│       │   ├── controller.ts           # Handler HTTP request
│       │   ├── route.ts                # Definisi endpoint
│       │   └── types.ts                # RegisterInput, LoginInput
│       ├── documents/
│       │   ├── model.ts                # Model File (tableName: files)
│       │   ├── repository.ts           # CRUD + bulk operations
│       │   ├── service.ts              # Upload/update/delete file ke disk + DB
│       │   ├── controller.ts           # Handler HTTP request
│       │   ├── route.ts                # Definisi endpoint
│       │   └── types.ts                # UploadDocumentInput, UpdateDocumentInput
│       ├── flex-params/
│       │   ├── model.ts                # Model FlexParam (master data, SKU, role, dll)
│       │   ├── repository.ts           # CRUD + filter by type/header
│       │   ├── service.ts              # Business logic + integrasi documents
│       │   ├── controller.ts           # Handler HTTP request
│       │   └── route.ts                # Definisi endpoint
│       └── naming-series/
│           ├── model.ts                # Model NamingSeries (auto increment per prefix/year/company)
│           ├── repository.ts           # find + increment seq dengan row lock
│           └── service.ts              # generateSerialNumber
├── logs/                               # Output log (dibuat otomatis)
│   ├── combined.log
│   └── error.log
├── files/                              # File upload (dibuat otomatis)
├── .env                                # Environment variables
├── .env.example                        # Template env
├── .gitignore
├── package.json
└── tsconfig.json
```

## Environment Variables

Salin `.env.example` ke `.env` lalu sesuaikan nilainya.

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=asmi_dev
DB_USER=postgres
DB_PASSWORD=your_password

# Upload
PATH_FILE_UPLOAD=files

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=4000
BASE_URL=http://localhost:4000
```

> Untuk production, ganti `BASE_URL` dengan domain server — semua `file_url` yang baru diupload otomatis pakai domain tersebut.

## Menjalankan Aplikasi

```bash
# Install dependencies
npm install

# Development (auto-reload)
npm run dev

# Build production
npm run build

# Jalankan production
npm start
```

Tabel di database dibuat/diupdate otomatis saat server start (`sequelize.sync({ alter: true })`). Tidak perlu migration manual.

## Endpoint

### Users
| Method | URL | Auth | Keterangan |
|--------|-----|------|-----------|
| POST | `/api/users/register` | - | Registrasi user baru |
| POST | `/api/users/login` | - | Login, return access + refresh token |
| POST | `/api/users/refresh-token` | - | Perbarui access token |

### Documents
| Method | URL | Auth | Keterangan |
|--------|-----|------|-----------|
| POST | `/api/documents/upload` | Bearer | Upload 1 file |
| POST | `/api/documents/bulk-upload` | Bearer | Upload banyak file |
| POST | `/api/documents/bulk-upsert` | Bearer | Upload banyak file, ada id → update, tidak ada → create |
| PUT | `/api/documents/bulk-update` | Bearer | Update banyak dokumen |
| GET | `/api/documents/:id` | Bearer | Detail dokumen |
| PUT | `/api/documents/:id` | Bearer | Update dokumen |
| DELETE | `/api/documents/:id` | Bearer | Hapus dokumen (soft delete) |

### Flex Params
| Method | URL | Auth | Keterangan |
|--------|-----|------|-----------|
| POST | `/api/flex-params` | Bearer | Buat flex param, opsional upload photo |
| GET | `/api/flex-params` | - | List semua, filter `?type_param=` |
| GET | `/api/flex-params/type/:type_param` | - | List by type |
| GET | `/api/flex-params/header/:header_id` | - | List by header id |
| GET | `/api/flex-params/:id` | Bearer | Detail by id |
| PUT | `/api/flex-params/:id` | Bearer | Update, opsional ganti photo |
| DELETE | `/api/flex-params/:id` | Bearer | Hapus + hapus photo jika ada |

## Naming Series

Digunakan untuk generate nomor dokumen/SKU otomatis dengan format:

```
PREFIX/YEAR/COMPANY_CODE/0000001
```

Contoh: `PRO/2026/1111/0000001`

- Setiap kombinasi `prefix + year + company_code` punya counter sendiri
- Ganti tahun → counter reset ke `0000001` otomatis
- Aman untuk transaksi bersamaan (row-level lock)

```ts
import { generateSerialNumber } from '../naming-series/service';

const noDoc = await generateSerialNumber('PRO', 2026, '1111', t);
// → PRO/2026/1111/0000001
```

## Auth

Semua endpoint yang butuh auth menggunakan Bearer token di header:

```
Authorization: Bearer <access_token>
```

Access token expired (15m) → gunakan refresh token untuk dapat access token baru.
