// Builds a printable invoice HTML document and a WhatsApp text summary.
import { BRAND } from '@/baba/constants';
import { formatMoney, formatDate } from '@/baba/format';

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildInvoiceHtml(bill, payments = []) {
  const items = bill.items || [];
  const rows = items
    .map(
      (it) => `
      <tr>
        <td>${escapeHtml(it.description)}</td>
        <td class="r">${escapeHtml(String(it.qty ?? ''))}</td>
        <td class="r">${formatMoney(it.rate)}</td>
        <td class="r">${formatMoney(it.amount)}</td>
      </tr>`
    )
    .join('');

  const paymentRows = (payments || [])
    .map((p) => `<tr><td>${formatDate(p.paidAt)}</td><td>${escapeHtml(p.method || '')}</td><td class="r">${formatMoney(p.amount)}</td></tr>`)
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(bill.billType)} #${bill.id} — ${escapeHtml(BRAND.name)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 32px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0d9488; padding-bottom: 16px; }
    .brand { font-size: 22px; font-weight: 800; color: #0d9488; }
    .tag { font-size: 12px; color: #64748b; margin-top: 2px; }
    .meta { text-align: right; font-size: 13px; color: #475569; }
    h2 { font-size: 15px; margin: 24px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #64748b; }
    .r { text-align: right; }
    .totals { width: 260px; margin-left: auto; margin-top: 12px; font-size: 13px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .grand { border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 8px; font-size: 16px; font-weight: 800; }
    .due { color: #e11d48; font-weight: 700; }
    .foot { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <div class="head">
    <div>
      <div class="brand">${escapeHtml(BRAND.name)}</div>
      <div class="tag">${escapeHtml(BRAND.tagline)}</div>
    </div>
    <div class="meta">
      <div><strong>${escapeHtml(bill.billType)}</strong> #${bill.id}</div>
      <div>${formatDate(bill.createdAt)}</div>
      <div>Status: ${escapeHtml(bill.status)}</div>
    </div>
  </div>

  <h2>Bill To</h2>
  <div style="font-size:14px;font-weight:600;">${escapeHtml(bill.customerName || 'Customer')}</div>

  <h2>Items</h2>
  <table>
    <thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4">No items</td></tr>'}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${formatMoney(bill.subtotal)}</span></div>
    ${bill.discount > 0 ? `<div><span>Discount</span><span>- ${formatMoney(bill.discount)}</span></div>` : ''}
    ${bill.gstPercent > 0 ? `<div><span>GST (${bill.gstPercent}%)</span><span>${formatMoney(bill.gstAmount)}</span></div>` : ''}
    <div class="grand"><span>Total</span><span>${formatMoney(bill.total)}</span></div>
    <div><span>Paid</span><span>${formatMoney(bill.amountPaid)}</span></div>
    <div class="due"><span>Balance Due</span><span>${formatMoney(bill.balanceDue)}</span></div>
  </div>

  ${paymentRows ? `<h2>Payments</h2><table><thead><tr><th>Date</th><th>Method</th><th class="r">Amount</th></tr></thead><tbody>${paymentRows}</tbody></table>` : ''}

  <div class="foot">Thank you for your business • ${escapeHtml(BRAND.name)}</div>
</body>
</html>`;
}

export function buildWhatsAppText(bill) {
  const lines = [
    `*${BRAND.name}*`,
    `${bill.billType} #${bill.id}`,
    bill.customerName ? `Customer: ${bill.customerName}` : null,
    '',
    ...(bill.items || []).map((it) => `• ${it.description} — ${formatMoney(it.amount)}`),
    '',
    `Total: ${formatMoney(bill.total)}`,
    `Paid: ${formatMoney(bill.amountPaid)}`,
    `Balance Due: ${formatMoney(bill.balanceDue)}`,
    '',
    'Thank you!',
  ].filter((l) => l !== null);
  return lines.join('\n');
}
