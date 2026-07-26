// Baba Glass House (Fabricator ERP) — single catch-all API router.
// Kept as ONE serverless function (routes by URL segments) to stay well within
// hosting function limits. All routes require an authenticated admin session,
// reusing the app's existing JWT cookie auth.
import { requireAdmin } from '../admin/_requireAdmin.js';
import {
  getBabaSql,
  customerDto,
  stockDto,
  orderDto,
  measurementDto,
  quotationDto,
  billDto,
  paymentDto,
} from './_babaDb.js';

const ORDER_STATUSES = [
  'New Order',
  'Material Ready',
  'Fabrication Started',
  'Installation Pending',
  'Completed',
];

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const toNum = (v) => (v === undefined || v === null || v === '' ? 0 : Number(v) || 0);

function paymentStatus(total, paid) {
  const t = round2(total);
  const p = round2(paid);
  if (p <= 0) return 'Due';
  if (p >= t) return 'Paid';
  return 'Partial';
}

export default async function handler(req, res) {
  const user = await requireAdmin(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const segments = Array.isArray(req.query?.path) ? req.query.path : [];
  const resource = segments[0] || '';
  const id = segments[1] ? Number(segments[1]) : null;
  const body = req.body || {};

  try {
    const sql = await getBabaSql();

    switch (resource) {
      case 'dashboard':
        return await handleDashboard(req, res, sql);
      case 'reports':
        return await handleReports(req, res, sql);
      case 'customers':
        return await handleCustomers(req, res, sql, id, body);
      case 'stock':
        return await handleStock(req, res, sql, id, body);
      case 'orders':
        return await handleOrders(req, res, sql, id, body);
      case 'measurements':
        return await handleMeasurements(req, res, sql, id, body);
      case 'quotations':
        return await handleQuotations(req, res, sql, id, body);
      case 'bills':
        return await handleBills(req, res, sql, id, body);
      case 'payments':
        return await handlePayments(req, res, sql, id, body);
      default:
        return res.status(404).json({ error: `Unknown resource: ${resource || '(none)'}` });
    }
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}

// ------------------------------------------------------------------ Customers
async function handleCustomers(req, res, sql, id, body) {
  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM baba_customers ORDER BY created_at DESC;`;
    return res.status(200).json({ customers: rows.map(customerDto) });
  }
  if (req.method === 'POST') {
    if (!body.name) return res.status(400).json({ error: 'Name is required' });
    const rows = await sql`
      INSERT INTO baba_customers (name, mobile, address, site_address, work_type)
      VALUES (${body.name}, ${body.mobile || null}, ${body.address || null}, ${body.siteAddress || null}, ${body.workType || null})
      RETURNING *;`;
    return res.status(200).json({ customer: customerDto(rows[0]) });
  }
  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const rows = await sql`
      UPDATE baba_customers SET
        name = ${body.name},
        mobile = ${body.mobile || null},
        address = ${body.address || null},
        site_address = ${body.siteAddress || null},
        work_type = ${body.workType || null},
        updated_at = NOW()
      WHERE id = ${id} RETURNING *;`;
    if (!rows[0]) return res.status(404).json({ error: 'Customer not found' });
    return res.status(200).json({ customer: customerDto(rows[0]) });
  }
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    await sql`DELETE FROM baba_customers WHERE id = ${id};`;
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ---------------------------------------------------------------------- Stock
async function handleStock(req, res, sql, id, body) {
  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM baba_stock ORDER BY name ASC;`;
    return res.status(200).json({ stock: rows.map(stockDto) });
  }
  if (req.method === 'POST') {
    if (!body.name) return res.status(400).json({ error: 'Name is required' });
    const rows = await sql`
      INSERT INTO baba_stock (name, category, unit, quantity, unit_cost, low_stock)
      VALUES (${body.name}, ${body.category || null}, ${body.unit || 'pcs'},
              ${toNum(body.quantity)}, ${toNum(body.unitCost)}, ${toNum(body.lowStock)})
      RETURNING *;`;
    return res.status(200).json({ item: stockDto(rows[0]) });
  }
  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const rows = await sql`
      UPDATE baba_stock SET
        name = ${body.name},
        category = ${body.category || null},
        unit = ${body.unit || 'pcs'},
        quantity = ${toNum(body.quantity)},
        unit_cost = ${toNum(body.unitCost)},
        low_stock = ${toNum(body.lowStock)},
        updated_at = NOW()
      WHERE id = ${id} RETURNING *;`;
    if (!rows[0]) return res.status(404).json({ error: 'Item not found' });
    return res.status(200).json({ item: stockDto(rows[0]) });
  }
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    await sql`DELETE FROM baba_stock WHERE id = ${id};`;
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// --------------------------------------------------------------------- Orders
async function handleOrders(req, res, sql, id, body) {
  if (req.method === 'GET') {
    const rows = await sql`
      SELECT o.*, c.name AS customer_name
      FROM baba_orders o
      LEFT JOIN baba_customers c ON c.id = o.customer_id
      ORDER BY o.created_at DESC;`;
    return res.status(200).json({ orders: rows.map(orderDto), statuses: ORDER_STATUSES });
  }
  if (req.method === 'POST') {
    const status = ORDER_STATUSES.includes(body.status) ? body.status : 'New Order';
    const rows = await sql`
      INSERT INTO baba_orders (customer_id, title, work_type, status, notes)
      VALUES (${body.customerId || null}, ${body.title || null}, ${body.workType || null}, ${status}, ${body.notes || null})
      RETURNING *;`;
    return res.status(200).json({ order: orderDto(rows[0]) });
  }
  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const status = ORDER_STATUSES.includes(body.status) ? body.status : 'New Order';
    const rows = await sql`
      UPDATE baba_orders SET
        customer_id = ${body.customerId || null},
        title = ${body.title || null},
        work_type = ${body.workType || null},
        status = ${status},
        notes = ${body.notes || null},
        updated_at = NOW()
      WHERE id = ${id} RETURNING *;`;
    if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
    return res.status(200).json({ order: orderDto(rows[0]) });
  }
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    await sql`DELETE FROM baba_orders WHERE id = ${id};`;
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// --------------------------------------------------------------- Measurements
async function handleMeasurements(req, res, sql, id, body) {
  if (req.method === 'GET') {
    const orderId = req.query?.orderId ? Number(req.query.orderId) : null;
    const rows = orderId
      ? await sql`SELECT * FROM baba_measurements WHERE order_id = ${orderId} ORDER BY created_at DESC;`
      : await sql`SELECT * FROM baba_measurements ORDER BY created_at DESC;`;
    return res.status(200).json({ measurements: rows.map(measurementDto) });
  }
  if (req.method === 'POST') {
    const width = toNum(body.widthFt);
    const height = toNum(body.heightFt);
    const qty = body.qty ? Number(body.qty) : 1;
    const area = round2(width * height * qty);
    const rate = toNum(body.rate);
    const amount = round2(area * rate);
    const rows = await sql`
      INSERT INTO baba_measurements (order_id, customer_id, work_type, width_ft, height_ft, qty, area_sqft, rate, amount, note)
      VALUES (${body.orderId || null}, ${body.customerId || null}, ${body.workType || null},
              ${width}, ${height}, ${qty}, ${area}, ${rate}, ${amount}, ${body.note || null})
      RETURNING *;`;
    return res.status(200).json({ measurement: measurementDto(rows[0]) });
  }
  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const width = toNum(body.widthFt);
    const height = toNum(body.heightFt);
    const qty = body.qty ? Number(body.qty) : 1;
    const area = round2(width * height * qty);
    const rate = toNum(body.rate);
    const amount = round2(area * rate);
    const rows = await sql`
      UPDATE baba_measurements SET
        work_type = ${body.workType || null},
        width_ft = ${width}, height_ft = ${height}, qty = ${qty},
        area_sqft = ${area}, rate = ${rate}, amount = ${amount}, note = ${body.note || null}
      WHERE id = ${id} RETURNING *;`;
    if (!rows[0]) return res.status(404).json({ error: 'Measurement not found' });
    return res.status(200).json({ measurement: measurementDto(rows[0]) });
  }
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    await sql`DELETE FROM baba_measurements WHERE id = ${id};`;
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ----------------------------------------------------------------- Quotations
async function handleQuotations(req, res, sql, id, body) {
  if (req.method === 'GET') {
    const rows = await sql`
      SELECT q.*, c.name AS customer_name
      FROM baba_quotations q
      LEFT JOIN baba_customers c ON c.id = q.customer_id
      ORDER BY q.created_at DESC;`;
    return res.status(200).json({ quotations: rows.map(quotationDto) });
  }
  const material = toNum(body.materialCost);
  const labour = toNum(body.labourCost);
  const install = toNum(body.installationCost);
  const discount = toNum(body.discount);
  const total = round2(material + labour + install - discount);
  const items = body.items ? JSON.stringify(body.items) : null;

  if (req.method === 'POST') {
    const rows = await sql`
      INSERT INTO baba_quotations (customer_id, order_id, title, material_cost, labour_cost, installation_cost, discount, total, status, items)
      VALUES (${body.customerId || null}, ${body.orderId || null}, ${body.title || null},
              ${material}, ${labour}, ${install}, ${discount}, ${total}, ${body.status || 'Draft'}, ${items})
      RETURNING *;`;
    return res.status(200).json({ quotation: quotationDto(rows[0]) });
  }
  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const rows = await sql`
      UPDATE baba_quotations SET
        customer_id = ${body.customerId || null}, order_id = ${body.orderId || null}, title = ${body.title || null},
        material_cost = ${material}, labour_cost = ${labour}, installation_cost = ${install},
        discount = ${discount}, total = ${total}, status = ${body.status || 'Draft'}, items = ${items}, updated_at = NOW()
      WHERE id = ${id} RETURNING *;`;
    if (!rows[0]) return res.status(404).json({ error: 'Quotation not found' });
    return res.status(200).json({ quotation: quotationDto(rows[0]) });
  }
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    await sql`DELETE FROM baba_quotations WHERE id = ${id};`;
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ---------------------------------------------------------------------- Bills
function computeBill(body) {
  const items = Array.isArray(body.items) ? body.items : [];
  const itemsSubtotal = items.reduce((sum, it) => sum + toNum(it.amount), 0);
  const subtotal = body.subtotal !== undefined ? toNum(body.subtotal) : round2(itemsSubtotal);
  const discount = toNum(body.discount);
  const gstPercent = toNum(body.gstPercent);
  const taxable = Math.max(0, subtotal - discount);
  const gstAmount = round2((taxable * gstPercent) / 100);
  const total = round2(taxable + gstAmount);
  const cost = toNum(body.costAmount);
  return { subtotal: round2(subtotal), discount, gstPercent, gstAmount, total, cost };
}

async function handleBills(req, res, sql, id, body) {
  if (req.method === 'GET') {
    if (id) {
      const rows = await sql`
        SELECT b.*, c.name AS customer_name
        FROM baba_bills b LEFT JOIN baba_customers c ON c.id = b.customer_id
        WHERE b.id = ${id};`;
      if (!rows[0]) return res.status(404).json({ error: 'Bill not found' });
      const payments = await sql`SELECT * FROM baba_payments WHERE bill_id = ${id} ORDER BY paid_at DESC;`;
      return res.status(200).json({ bill: billDto(rows[0]), payments: payments.map(paymentDto) });
    }
    const rows = await sql`
      SELECT b.*, c.name AS customer_name
      FROM baba_bills b LEFT JOIN baba_customers c ON c.id = b.customer_id
      ORDER BY b.created_at DESC;`;
    return res.status(200).json({ bills: rows.map(billDto) });
  }

  if (req.method === 'POST') {
    const c = computeBill(body);
    const paid = toNum(body.amountPaid);
    const status = paymentStatus(c.total, paid);
    const items = body.items ? JSON.stringify(body.items) : null;
    const rows = await sql`
      INSERT INTO baba_bills (customer_id, order_id, bill_type, subtotal, discount, gst_percent, gst_amount, total, cost_amount, amount_paid, status, items)
      VALUES (${body.customerId || null}, ${body.orderId || null}, ${body.billType || 'Estimate'},
              ${c.subtotal}, ${c.discount}, ${c.gstPercent}, ${c.gstAmount}, ${c.total}, ${c.cost}, ${paid}, ${status}, ${items})
      RETURNING *;`;
    // Record an initial payment row when created already paid, for the ledger.
    if (paid > 0) {
      await sql`INSERT INTO baba_payments (bill_id, amount, method, note) VALUES (${rows[0].id}, ${paid}, ${body.paymentMethod || 'Cash'}, ${'Initial payment'});`;
    }
    return res.status(200).json({ bill: billDto(rows[0]) });
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const c = computeBill(body);
    // Preserve already-recorded payments; recompute status against current total.
    const existing = await sql`SELECT amount_paid FROM baba_bills WHERE id = ${id};`;
    if (!existing[0]) return res.status(404).json({ error: 'Bill not found' });
    const paid = toNum(existing[0].amount_paid);
    const status = paymentStatus(c.total, paid);
    const items = body.items ? JSON.stringify(body.items) : null;
    const rows = await sql`
      UPDATE baba_bills SET
        customer_id = ${body.customerId || null}, order_id = ${body.orderId || null}, bill_type = ${body.billType || 'Estimate'},
        subtotal = ${c.subtotal}, discount = ${c.discount}, gst_percent = ${c.gstPercent}, gst_amount = ${c.gstAmount},
        total = ${c.total}, cost_amount = ${c.cost}, status = ${status}, items = ${items}, updated_at = NOW()
      WHERE id = ${id} RETURNING *;`;
    return res.status(200).json({ bill: billDto(rows[0]) });
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    await sql`DELETE FROM baba_bills WHERE id = ${id};`;
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ------------------------------------------------------------------- Payments
async function handlePayments(req, res, sql, id, body) {
  if (req.method === 'GET') {
    const billId = req.query?.billId ? Number(req.query.billId) : null;
    const rows = billId
      ? await sql`SELECT * FROM baba_payments WHERE bill_id = ${billId} ORDER BY paid_at DESC;`
      : await sql`SELECT * FROM baba_payments ORDER BY paid_at DESC;`;
    return res.status(200).json({ payments: rows.map(paymentDto) });
  }
  if (req.method === 'POST') {
    const billId = body.billId ? Number(body.billId) : null;
    const amount = toNum(body.amount);
    if (!billId || amount <= 0) return res.status(400).json({ error: 'billId and positive amount are required' });
    const billRows = await sql`SELECT total, amount_paid FROM baba_bills WHERE id = ${billId};`;
    if (!billRows[0]) return res.status(404).json({ error: 'Bill not found' });
    const newPaid = round2(toNum(billRows[0].amount_paid) + amount);
    const status = paymentStatus(billRows[0].total, newPaid);
    const rows = await sql`
      INSERT INTO baba_payments (bill_id, amount, method, note)
      VALUES (${billId}, ${amount}, ${body.method || 'Cash'}, ${body.note || null}) RETURNING *;`;
    await sql`UPDATE baba_bills SET amount_paid = ${newPaid}, status = ${status}, updated_at = NOW() WHERE id = ${billId};`;
    return res.status(200).json({ payment: paymentDto(rows[0]), amountPaid: newPaid, status });
  }
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const pay = await sql`SELECT bill_id, amount FROM baba_payments WHERE id = ${id};`;
    await sql`DELETE FROM baba_payments WHERE id = ${id};`;
    if (pay[0]?.bill_id) {
      const billId = Number(pay[0].bill_id);
      const agg = await sql`SELECT COALESCE(SUM(amount),0) AS paid FROM baba_payments WHERE bill_id = ${billId};`;
      const billRows = await sql`SELECT total FROM baba_bills WHERE id = ${billId};`;
      const newPaid = round2(Number(agg[0].paid));
      const status = paymentStatus(billRows[0]?.total || 0, newPaid);
      await sql`UPDATE baba_bills SET amount_paid = ${newPaid}, status = ${status}, updated_at = NOW() WHERE id = ${billId};`;
    }
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ------------------------------------------------------------------ Dashboard
async function handleDashboard(req, res, sql) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const [customers, orders, bills, stock, ordersByStatus, recentOrders, recentBills] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM baba_customers;`,
    sql`SELECT COUNT(*)::int AS count FROM baba_orders;`,
    sql`SELECT COALESCE(SUM(total),0) AS revenue, COALESCE(SUM(amount_paid),0) AS paid FROM baba_bills;`,
    sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE quantity <= low_stock)::int AS low FROM baba_stock;`,
    sql`SELECT status, COUNT(*)::int AS count FROM baba_orders GROUP BY status;`,
    sql`SELECT o.*, c.name AS customer_name FROM baba_orders o LEFT JOIN baba_customers c ON c.id = o.customer_id ORDER BY o.created_at DESC LIMIT 5;`,
    sql`SELECT b.*, c.name AS customer_name FROM baba_bills b LEFT JOIN baba_customers c ON c.id = b.customer_id ORDER BY b.created_at DESC LIMIT 5;`,
  ]);

  const revenue = Number(bills[0].revenue);
  const paid = Number(bills[0].paid);
  return res.status(200).json({
    customers: customers[0].count,
    orders: orders[0].count,
    revenue,
    collected: paid,
    outstanding: round2(revenue - paid),
    stock: { total: stock[0].total, low: stock[0].low },
    ordersByStatus: ordersByStatus.reduce((acc, r) => ({ ...acc, [r.status]: r.count }), {}),
    recentOrders: recentOrders.map(orderDto),
    recentBills: recentBills.map(billDto),
  });
}

// -------------------------------------------------------------------- Reports
async function handleReports(req, res, sql) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const [totals, byMonth, byDay, byWorkType, topCustomers, statusCounts] = await Promise.all([
    sql`SELECT COALESCE(SUM(total),0) AS revenue, COALESCE(SUM(amount_paid),0) AS paid, COALESCE(SUM(cost_amount),0) AS cost, COUNT(*)::int AS bills FROM baba_bills;`,
    sql`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS period,
             COALESCE(SUM(total),0) AS revenue, COALESCE(SUM(amount_paid),0) AS paid
      FROM baba_bills
      WHERE created_at >= (NOW() - INTERVAL '12 months')
      GROUP BY 1 ORDER BY 1;`,
    sql`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS period,
             COALESCE(SUM(total),0) AS revenue, COALESCE(SUM(amount_paid),0) AS paid
      FROM baba_bills
      WHERE created_at >= (NOW() - INTERVAL '30 days')
      GROUP BY 1 ORDER BY 1;`,
    sql`SELECT COALESCE(work_type,'Other') AS work_type, COUNT(*)::int AS count FROM baba_orders GROUP BY 1 ORDER BY 2 DESC;`,
    sql`
      SELECT c.name AS customer, COALESCE(SUM(b.total),0) AS revenue
      FROM baba_bills b JOIN baba_customers c ON c.id = b.customer_id
      GROUP BY c.name ORDER BY 2 DESC LIMIT 5;`,
    sql`SELECT status, COUNT(*)::int AS count FROM baba_orders GROUP BY status;`,
  ]);

  const revenue = Number(totals[0].revenue);
  const paid = Number(totals[0].paid);
  const cost = Number(totals[0].cost);
  return res.status(200).json({
    totals: {
      revenue,
      collected: paid,
      outstanding: round2(revenue - paid),
      cost,
      profit: round2(revenue - cost),
      bills: totals[0].bills,
    },
    salesByMonth: byMonth.map((r) => ({ period: r.period, revenue: Number(r.revenue), paid: Number(r.paid) })),
    salesByDay: byDay.map((r) => ({ period: r.period, revenue: Number(r.revenue), paid: Number(r.paid) })),
    workTypeBreakdown: byWorkType.map((r) => ({ label: r.work_type, count: r.count })),
    topCustomers: topCustomers.map((r) => ({ label: r.customer, revenue: Number(r.revenue) })),
    ordersByStatus: statusCounts.reduce((acc, r) => ({ ...acc, [r.status]: r.count }), {}),
  });
}
