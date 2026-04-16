# Marisa OJ Tracker

Full-stack tracker cho lộ trình luyện code C++ trên marisaoj.com.

- **Backend**: NestJS + Prisma + SQLite
- **Frontend**: HTML / CSS / vanilla JS (static, serve qua NestJS)
- **DB**: SQLite file tại `prisma/dev.db` (không cần setup)

## Cài đặt

```bash
npm install
npx prisma migrate dev --name init    # tạo DB + apply migration
npx ts-node prisma/seed.ts            # seed 3 Mức, 213 bài tập
```

## Chạy

```bash
npm run start:dev                     # dev (watch mode)
npm run build && npm run start:prod   # production
```

Server chạy ở `http://localhost:3000`. Static FE ở `/`, REST API ở `/api/*`.

## API

| Method | Path | Mô tả |
| --- | --- | --- |
| `GET` | `/api/curriculum` | Lộ trình 3 Mức, full tree |
| `GET` | `/api/students` | List học viên kèm thống kê |
| `POST` | `/api/students` | Tạo học viên mới |
| `GET` | `/api/students/:id` | Chi tiết + progress |
| `DELETE` | `/api/students/:id` | Xoá học viên (cascade progress) |
| `PUT` | `/api/students/:id/progress/:problemKey` | Upsert tiến độ (done / date / code) |
| `DELETE` | `/api/students/:id/progress/:problemKey` | Xoá tiến độ 1 bài |

`problemKey` dạng `level0-io-01`, `level1-backtrack-05`, v.v.

## Schema

- **Level** → **Group** → **Category** → **Problem** (curriculum, seed từ `prisma/seed.ts`)
- **Student** (name, parent, username, password, goal)
- **Progress** (studentId, problemId, done, date, code) — unique `(studentId, problemId)`

## ⚠️ Bảo mật

Mật khẩu marisaoj đang lưu **plain text** trong SQLite (phục vụ scraper sau này).
Trước khi deploy thật:
- Mã hoá password với key từ env var (AES-GCM) hoặc dùng GitHub Secrets nếu chạy trên Actions.
- Không commit `prisma/dev.db` (đã có trong `.gitignore`).

## Reset DB

```bash
npm run prisma:reset     # xoá DB + migrate + seed
```
