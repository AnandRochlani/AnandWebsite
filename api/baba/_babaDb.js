// Baba Glass House (Fabricator ERP) — database layer.
// Reuses the same Neon serverless connection strategy as the rest of the app.
import { neon } from '@neondatabase/serverless';

function getDatabaseUrl() {
  let url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL;

  if (!url) {
    throw new Error(
      'Missing database connection string. Set DATABASE_URL (recommended) or POSTGRES_URL in your env vars.'
    );
  }

  url = String(url).trim();
  if (/^psql\b/i.test(url)) url = url.replace(/^psql\b/i, '').trim();

  const first = url[0];
  const last = url[url.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    url = url.slice(1, -1).trim();
  }

  // eslint-disable-next-line no-new
  new URL(url); // throws early on malformed URLs
  return url;
}

export function getSqlClient() {
  return neon(getDatabaseUrl());
}

// Default stock items so a fresh install is immediately usable.
const DEFAULT_STOCK = [
  { name: 'Aluminium Profile', category: 'Aluminium', unit: 'ft', quantity: 500, unit_cost: 45, low_stock: 100 },
  { name: 'Glass (5mm)', category: 'Glass', unit: 'sqft', quantity: 300, unit_cost: 55, low_stock: 80 },
  { name: 'Silicone', category: 'Consumable', unit: 'pcs', quantity: 120, unit_cost: 250, low_stock: 25 },
  { name: 'Handle', category: 'Hardware', unit: 'pcs', quantity: 80, unit_cost: 180, low_stock: 15 },
  { name: 'Lock', category: 'Hardware', unit: 'pcs', quantity: 60, unit_cost: 220, low_stock: 15 },
  { name: 'Roller', category: 'Hardware', unit: 'pcs', quantity: 200, unit_cost: 35, low_stock: 40 },
  { name: 'Screw', category: 'Consumable', unit: 'box', quantity: 45, unit_cost: 120, low_stock: 10 },
];

let schemaReady = false;

export async function ensureBabaSchema(sql) {
  // Idempotent — safe to call on every request; cached per warm lambda.
  if (schemaReady) return;

  await sql`
    CREATE TABLE IF NOT EXISTS baba_customers (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      mobile TEXT,
      address TEXT,
      site_address TEXT,
      work_type TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS baba_stock (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      unit TEXT DEFAULT 'pcs',
      quantity NUMERIC(12,2) DEFAULT 0,
      unit_cost NUMERIC(12,2) DEFAULT 0,
      low_stock NUMERIC(12,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS baba_orders (
      id BIGSERIAL PRIMARY KEY,
      customer_id BIGINT REFERENCES baba_customers(id) ON DELETE SET NULL,
      title TEXT,
      work_type TEXT,
      status TEXT DEFAULT 'New Order',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS baba_measurements (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT REFERENCES baba_orders(id) ON DELETE CASCADE,
      customer_id BIGINT REFERENCES baba_customers(id) ON DELETE SET NULL,
      work_type TEXT,
      width_ft NUMERIC(10,3) DEFAULT 0,
      height_ft NUMERIC(10,3) DEFAULT 0,
      qty INTEGER DEFAULT 1,
      area_sqft NUMERIC(12,3) DEFAULT 0,
      rate NUMERIC(12,2) DEFAULT 0,
      amount NUMERIC(14,2) DEFAULT 0,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS baba_quotations (
      id BIGSERIAL PRIMARY KEY,
      customer_id BIGINT REFERENCES baba_customers(id) ON DELETE SET NULL,
      order_id BIGINT REFERENCES baba_orders(id) ON DELETE SET NULL,
      title TEXT,
      material_cost NUMERIC(14,2) DEFAULT 0,
      labour_cost NUMERIC(14,2) DEFAULT 0,
      installation_cost NUMERIC(14,2) DEFAULT 0,
      discount NUMERIC(14,2) DEFAULT 0,
      total NUMERIC(14,2) DEFAULT 0,
      status TEXT DEFAULT 'Draft',
      items JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS baba_bills (
      id BIGSERIAL PRIMARY KEY,
      customer_id BIGINT REFERENCES baba_customers(id) ON DELETE SET NULL,
      order_id BIGINT REFERENCES baba_orders(id) ON DELETE SET NULL,
      bill_type TEXT DEFAULT 'Estimate',
      subtotal NUMERIC(14,2) DEFAULT 0,
      discount NUMERIC(14,2) DEFAULT 0,
      gst_percent NUMERIC(6,2) DEFAULT 0,
      gst_amount NUMERIC(14,2) DEFAULT 0,
      total NUMERIC(14,2) DEFAULT 0,
      cost_amount NUMERIC(14,2) DEFAULT 0,
      amount_paid NUMERIC(14,2) DEFAULT 0,
      status TEXT DEFAULT 'Due',
      items JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS baba_payments (
      id BIGSERIAL PRIMARY KEY,
      bill_id BIGINT REFERENCES baba_bills(id) ON DELETE CASCADE,
      amount NUMERIC(14,2) DEFAULT 0,
      method TEXT DEFAULT 'Cash',
      note TEXT,
      paid_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Seed default stock only when the table is empty.
  const stockCount = await sql`SELECT COUNT(*)::int AS count FROM baba_stock;`;
  if ((stockCount?.[0]?.count ?? 0) === 0) {
    for (const s of DEFAULT_STOCK) {
      await sql`
        INSERT INTO baba_stock (name, category, unit, quantity, unit_cost, low_stock)
        VALUES (${s.name}, ${s.category}, ${s.unit}, ${s.quantity}, ${s.unit_cost}, ${s.low_stock});
      `;
    }
  }

  schemaReady = true;
}

export async function getBabaSql() {
  const sql = getSqlClient();
  await ensureBabaSchema(sql);
  return sql;
}

// ---- DTO mappers (snake_case rows -> camelCase JSON) ----
const num = (v) => (v === null || v === undefined ? null : Number(v));

export function customerDto(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    name: r.name,
    mobile: r.mobile,
    address: r.address,
    siteAddress: r.site_address,
    workType: r.work_type,
    createdAt: r.created_at,
  };
}

export function stockDto(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    name: r.name,
    category: r.category,
    unit: r.unit,
    quantity: num(r.quantity),
    unitCost: num(r.unit_cost),
    lowStock: num(r.low_stock),
    value: num(r.quantity) * num(r.unit_cost),
    updatedAt: r.updated_at,
  };
}

export function orderDto(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    customerId: r.customer_id ? Number(r.customer_id) : null,
    customerName: r.customer_name || null,
    title: r.title,
    workType: r.work_type,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function measurementDto(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    orderId: r.order_id ? Number(r.order_id) : null,
    customerId: r.customer_id ? Number(r.customer_id) : null,
    workType: r.work_type,
    widthFt: num(r.width_ft),
    heightFt: num(r.height_ft),
    qty: r.qty !== null && r.qty !== undefined ? Number(r.qty) : null,
    areaSqft: num(r.area_sqft),
    rate: num(r.rate),
    amount: num(r.amount),
    note: r.note,
    createdAt: r.created_at,
  };
}

export function quotationDto(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    customerId: r.customer_id ? Number(r.customer_id) : null,
    customerName: r.customer_name || null,
    orderId: r.order_id ? Number(r.order_id) : null,
    title: r.title,
    materialCost: num(r.material_cost),
    labourCost: num(r.labour_cost),
    installationCost: num(r.installation_cost),
    discount: num(r.discount),
    total: num(r.total),
    status: r.status,
    items: r.items || [],
    createdAt: r.created_at,
  };
}

export function billDto(r) {
  if (!r) return null;
  const total = num(r.total) || 0;
  const paid = num(r.amount_paid) || 0;
  return {
    id: Number(r.id),
    customerId: r.customer_id ? Number(r.customer_id) : null,
    customerName: r.customer_name || null,
    orderId: r.order_id ? Number(r.order_id) : null,
    billType: r.bill_type,
    subtotal: num(r.subtotal),
    discount: num(r.discount),
    gstPercent: num(r.gst_percent),
    gstAmount: num(r.gst_amount),
    total,
    costAmount: num(r.cost_amount),
    amountPaid: paid,
    balanceDue: Math.max(0, total - paid),
    status: r.status,
    items: r.items || [],
    createdAt: r.created_at,
  };
}

export function paymentDto(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    billId: r.bill_id ? Number(r.bill_id) : null,
    amount: num(r.amount),
    method: r.method,
    note: r.note,
    paidAt: r.paid_at,
  };
}
