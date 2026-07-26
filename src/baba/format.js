// Formatting helpers for the Baba Glass House ERP.

export function formatMoney(value, { withSymbol = true } = {}) {
  const n = Number(value) || 0;
  const formatted = n.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return withSymbol ? `₹${formatted}` : formatted;
}

export function formatNumber(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Convert feet + inches inputs into decimal feet (e.g. 4 ft 6 in -> 4.5).
export function toFeet(feet, inches) {
  return (Number(feet) || 0) + (Number(inches) || 0) / 12;
}

export function monthLabel(period) {
  // period is 'YYYY-MM'
  if (!period) return '';
  const [y, m] = period.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

export function dayLabel(period) {
  // period is 'YYYY-MM-DD'
  if (!period) return '';
  const d = new Date(period);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
