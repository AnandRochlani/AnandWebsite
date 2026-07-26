# Baba Glass House — Fabricator ERP

A self-contained business-management app for **Baba Glass House**
(Glass • Aluminium • Kitchen Profile • Mirror • PVC Door • SS Work),
mounted inside this site at **`/baba`**.

It is fully database-backed (Neon / Postgres), protected by a login, and
built mobile-first so it works well on a phone at the shop or on site.

## Features

| Screen | Route | What it does |
| --- | --- | --- |
| **Login** | `/baba/login` | Staff sign-in (reuses the app's JWT session). |
| **Dashboard** | `/baba` | Quick actions (New Order, Add Customer, Measurement, Quotation, Stock, Bill, Reports), KPIs, orders-by-status, recent orders & bills. |
| **Customers** | `/baba/customers` | Name, mobile, address, site address, work type. Search, add, edit, delete. |
| **Measurements** | `/baba/measurements` | Work type + width/height (ft + inch) + qty → live **area (sq.ft)** and amount. |
| **Quotations** | `/baba/quotations` | Material + labour + installation − discount → total, with status. |
| **Stock** | `/baba/stock` | Aluminium Profile, Glass, Silicone, Handle, Lock, Roller, Screw… with quantity, unit cost, value and low-stock alerts. |
| **Orders** | `/baba/orders` | Status workflow: New Order → Material Ready → Fabrication Started → Installation Pending → Completed. |
| **Billing** | `/baba/billing` | Estimate / GST Invoice with line items, GST %, discount, payments ledger, **print** and **WhatsApp share**. |
| **Reports** | `/baba/reports` | Daily & monthly sales, outstanding dues, profit, top customers, work-type & status breakdowns. |

## Architecture

- **Frontend:** React + React Router (lazy-loaded), Tailwind CSS, lucide-react
  icons. All code under `src/baba/`. Charts are dependency-free inline SVG
  (`src/baba/components/Charts.jsx`).
- **Backend:** a single Vercel serverless function
  `api/baba/[...path].js` routes every resource
  (`customers`, `stock`, `orders`, `measurements`, `quotations`,
  `bills`, `payments`, `dashboard`, `reports`) to keep well within
  serverless function limits. Schema + seed live in `api/baba/_babaDb.js`.
- **Auth:** reuses the existing admin JWT cookie
  (`api/admin/login`, `/me`, `/logout`). Every `/api/baba/*` call
  requires a valid session.
- **Database:** Neon / Postgres. Tables (`baba_*`) are created on first
  request; default stock items are seeded automatically.

## Configuration

Set these environment variables (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon/Postgres connection string (also accepts `POSTGRES_URL`). |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Login credentials. |
| `ADMIN_JWT_SECRET` | Secret used to sign the session cookie. |

On Vercel, add these under **Project → Settings → Environment Variables**.

## Local development

```bash
npm install
# Frontend only:
npm run dev
# Full stack (serverless API + DB) needs the Vercel CLI:
vercel dev
```

Then open `http://localhost:3000/baba` and sign in with your
`ADMIN_USERNAME` / `ADMIN_PASSWORD`.

## Notes / future scope (from the original spec)

Site photo upload, Google Maps location, cloud backup and staff
management are natural next additions; the data model and routing are
structured to accommodate them.
