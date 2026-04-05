# CanteenConnect

A multi-tenant canteen food ordering platform built with Next.js and PostgreSQL. Supports three role-based dashboards: **USER** (order food), **ADMIN** (manage canteen), and **DEV** (system administration).

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, PostgreSQL, raw SQL (`pg`)
- **Auth**: bcrypt password hashing, JWT sessions (`jose`), HttpOnly cookies
- **Real-time**: Server-Sent Events (SSE) for live dashboard updates
- **Tooling**: pnpm, Biome (lint/format), GitHub Actions CI

## Architecture

```
┌──────────┐   ┌──────────┐   ┌──────────┐
│   USER   │   │  ADMIN   │   │   DEV    │
│ Dashboard│   │ Dashboard│   │ Dashboard│
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                    │ SSE + REST
              ┌─────┴──────┐
              │  Next.js   │
              │ API Routes │
              │  (JWT Auth)│
              └─────┬──────┘
              ┌─────┴──────┐
              │ PostgreSQL │
              └────────────┘
```

### Role System

| Role | Access | Description |
|------|--------|-------------|
| **USER** | `/` `/orders` `/profile` `/help` | Browse menus, add to cart, place orders |
| **ADMIN** | `/admin/*` | Manage food items and orders for their company |
| **DEV** | `/dev/*` | Global system admin — manage all companies and users |

- Only **one DEV account** exists in the system (enforced at API level).
- Each role has its own login portal (`/login`, `/admin/login`, `/dev/login`).

## Setup

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 14+

### 1. Clone & Install

```bash
git clone https://github.com/nakultt/canteen.git
cd canteen
pnpm install
```

### 2. Database Setup

```bash
# Create the database
createdb canteen

# Run schema
psql -d canteen -f db/schema.sql

# Seed data (bcrypt-hashed passwords)
psql -d canteen -f db/seed.sql
```

### 3. Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local with your database URL and generate a JWT secret:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Random secret for JWT signing (min 32 characters)

### 4. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default Accounts

| Role | Email | Password |
|------|-------|----------|
| DEV | `dev@canteen.com` | `devpass123` |
| ADMIN | `admin@techcampus.com` | `admin123` |
| USER | `nakul@example.com` | `password123` |

## API Security

All API routes enforce:

- **JWT Authentication** — Every request must include a valid JWT (via HttpOnly cookie or `Authorization: Bearer` header).
- **Role-based Authorization** — Admin routes require `ADMIN`/`DEV`, Dev routes require `DEV`.
- **Ownership Checks** — Users can only access their own data (cart, orders, profile).
- **Company Scoping** — ADMIN users can only manage their own company's data.
- **Password Hashing** — All passwords stored as bcrypt hashes (12 rounds).

## Live Updates

All three dashboards receive real-time updates via Server-Sent Events (SSE):

- **User Dashboard** — Cart and order status updates
- **Admin Dashboard** — New orders, food item changes
- **DEV Dashboard** — User/company changes, global order activity

## Scripts

```bash
pnpm dev       # Start development server
pnpm build     # Production build
pnpm start     # Start production server
pnpm lint      # Run Biome linter
pnpm format    # Auto-format code
```

## License

GPL-3.0 — see [LICENSE](LICENSE).
