import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Receipt, Plus, Trash2, Eye, Printer, MessageCircle, IndianRupee, Wallet, AlertTriangle } from 'lucide-react';
import babaApi from '@/baba/api';
import { BRAND, BILL_TYPES, BILL_STATUS_COLORS, PAYMENT_METHODS } from '@/baba/constants';
import { formatMoney, formatDate, formatDateTime } from '@/baba/format';
import { buildInvoiceHtml, buildWhatsAppText } from '@/baba/invoice';
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Modal,
  Spinner,
  EmptyState,
  Badge,
  ConfirmDialog,
  useToast,
} from '@/baba/components/ui';
import { PageHeader } from '@/baba/components/Layout';
import { StatCard } from '@/baba/components/Charts';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const emptyItem = () => ({ description: '', qty: 1, rate: '', amount: 0 });
const EMPTY = {
  customerId: '', billType: 'Estimate', gstPercent: '', discount: '', costAmount: '',
  amountPaid: '', paymentMethod: 'Cash', items: [emptyItem()],
};

export default function Billing() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null); // { bill, payments }
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([babaApi.list('bills'), babaApi.list('customers')]);
      setBills(b.bills || []);
      setCustomers(c.customers || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (params.get('new') === '1') {
      setForm(EMPTY);
      setCreateOpen(true);
      params.delete('new');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- create form derived totals ----
  const items = form.items;
  const subtotal = useMemo(() => round2(items.reduce((s, it) => s + (Number(it.amount) || 0), 0)), [items]);
  const discount = Number(form.discount) || 0;
  const gstPercent = Number(form.gstPercent) || 0;
  const taxable = Math.max(0, subtotal - discount);
  const gstAmount = round2((taxable * gstPercent) / 100);
  const total = round2(taxable + gstAmount);

  const updateItem = (idx, patch) => {
    setForm((f) => {
      const next = f.items.map((it, i) => {
        if (i !== idx) return it;
        const merged = { ...it, ...patch };
        merged.amount = round2((Number(merged.qty) || 0) * (Number(merged.rate) || 0));
        return merged;
      });
      return { ...f, items: next };
    });
  };
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const save = async () => {
    const cleanItems = items.filter((it) => it.description.trim() || Number(it.amount) > 0);
    if (cleanItems.length === 0) return toast.error('Add at least one line item');
    setSaving(true);
    try {
      await babaApi.create('bills', {
        customerId: form.customerId ? Number(form.customerId) : null,
        billType: form.billType,
        items: cleanItems.map((it) => ({
          description: it.description, qty: Number(it.qty) || 0, rate: Number(it.rate) || 0, amount: Number(it.amount) || 0,
        })),
        subtotal, discount, gstPercent,
        costAmount: Number(form.costAmount) || 0,
        amountPaid: Number(form.amountPaid) || 0,
        paymentMethod: form.paymentMethod,
      });
      toast.success('Bill created');
      setCreateOpen(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (id) => {
    try {
      const d = await babaApi.get('bills', id);
      setDetail(d);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await babaApi.remove('bills', confirm.id);
      toast.success('Bill deleted');
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const totals = bills.reduce(
    (acc, b) => ({
      revenue: acc.revenue + (b.total || 0),
      collected: acc.collected + (b.amountPaid || 0),
      due: acc.due + (b.balanceDue || 0),
    }),
    { revenue: 0, collected: 0, due: 0 }
  );

  return (
    <div>
      <PageHeader
        title="Billing"
        hindi="बिल"
        description="Create estimates & GST invoices, and track payments."
        action={
          <Button onClick={() => { setForm(EMPTY); setCreateOpen(true); }}>
            <Plus className="h-4 w-4" /> Create Bill
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={IndianRupee} tone="teal" label="Billed" value={formatMoney(totals.revenue)} />
        <StatCard icon={Wallet} tone="emerald" label="Collected" value={formatMoney(totals.collected)} />
        <StatCard icon={AlertTriangle} tone="rose" label="Due" value={formatMoney(totals.due)} />
      </div>

      {loading ? (
        <Spinner />
      ) : bills.length === 0 ? (
        <EmptyState icon={Receipt} title="No bills yet" description="Create your first estimate or GST invoice." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Bill</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Paid</th>
                  <th className="px-4 py-3 text-right font-medium">Due</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">#{b.id}</span>
                      <span className="ml-1 text-xs text-slate-400">{b.billType}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.customerName || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(b.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatMoney(b.total)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{formatMoney(b.amountPaid)}</td>
                    <td className="px-4 py-3 text-right text-rose-600">{formatMoney(b.balanceDue)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={BILL_STATUS_COLORS[b.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}>{b.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openDetail(b.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-600" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirm(b)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create bill modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Bill"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save Bill</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Customer">
              <Select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                <option value="">— Select —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Bill Type">
              <Select value={form.billType} onChange={(e) => setForm({ ...form, billType: e.target.value })}>
                {BILL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
          </div>

          {/* Line items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Items</p>
              <button onClick={addItem} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700">
                <Plus className="h-3.5 w-3.5" /> Add row
              </button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-12 sm:col-span-6"
                    placeholder="Description (e.g. Sliding window 5x4)"
                    value={it.description}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                  />
                  <Input
                    className="col-span-3 sm:col-span-2"
                    type="number" inputMode="decimal" placeholder="Qty/sqft"
                    value={it.qty}
                    onChange={(e) => updateItem(idx, { qty: e.target.value })}
                  />
                  <Input
                    className="col-span-4 sm:col-span-2"
                    type="number" inputMode="decimal" placeholder="Rate"
                    value={it.rate}
                    onChange={(e) => updateItem(idx, { rate: e.target.value })}
                  />
                  <div className="col-span-4 sm:col-span-1 flex items-center justify-end text-sm font-medium text-slate-700">
                    {formatMoney(it.amount)}
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="rounded p-1 text-slate-300 hover:text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Discount (₹)">
              <Input type="number" inputMode="decimal" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
            </Field>
            <Field label="GST %">
              <Input type="number" inputMode="decimal" value={form.gstPercent} onChange={(e) => setForm({ ...form, gstPercent: e.target.value })} placeholder={form.billType === 'GST Invoice' ? '18' : '0'} />
            </Field>
            <Field label="Cost (₹)" hint="For profit report">
              <Input type="number" inputMode="decimal" value={form.costAmount} onChange={(e) => setForm({ ...form, costAmount: e.target.value })} />
            </Field>
            <Field label="Paid now (₹)">
              <Input type="number" inputMode="decimal" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
            </Field>
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <SummaryRow label="Subtotal" value={subtotal} />
            {discount > 0 && <SummaryRow label="Discount" value={-discount} />}
            {gstPercent > 0 && <SummaryRow label={`GST (${gstPercent}%)`} value={gstAmount} />}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <BillDetail detail={detail} onClose={() => setDetail(null)} onChanged={() => { openDetail(detail.bill.id); load(); }} />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        loading={deleting}
        title="Delete bill?"
        message={`Delete bill #${confirm?.id}? This also removes its payment records.`}
      />
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span className="font-medium text-slate-800">{formatMoney(value)}</span>
    </div>
  );
}

// ------------------------------------------------------------- Bill detail
function BillDetail({ detail, onClose, onChanged }) {
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [saving, setSaving] = useState(false);
  if (!detail) return null;
  const { bill, payments } = detail;
  const customer = bill.customerName;

  const record = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    setSaving(true);
    try {
      await babaApi.create('payments', { billId: bill.id, amount: amt, method });
      toast.success('Payment recorded');
      setAmount('');
      onChanged();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const print = () => {
    const html = buildInvoiceHtml(bill, payments);
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return toast.error('Allow pop-ups to print');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const whatsapp = () => {
    const text = encodeURIComponent(buildWhatsAppText(bill));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Modal
      open={!!detail}
      onClose={onClose}
      title={`${bill.billType} #${bill.id}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={whatsapp}><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
          <Button variant="secondary" onClick={print}><Printer className="h-4 w-4" /> Print</Button>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-slate-500">Customer</p>
            <p className="font-semibold text-slate-900">{customer || '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">{formatDate(bill.createdAt)}</p>
            <Badge className={BILL_STATUS_COLORS[bill.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}>{bill.status}</Badge>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[400px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Rate</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(bill.items || []).map((it, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-slate-700">{it.description}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{it.qty}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{formatMoney(it.rate)}</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-800">{formatMoney(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto max-w-xs space-y-1 text-sm">
          <SummaryRow label="Subtotal" value={bill.subtotal} />
          {bill.discount > 0 && <SummaryRow label="Discount" value={-bill.discount} />}
          {bill.gstPercent > 0 && <SummaryRow label={`GST (${bill.gstPercent}%)`} value={bill.gstAmount} />}
          <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold text-slate-900">
            <span>Total</span><span>{formatMoney(bill.total)}</span>
          </div>
          <SummaryRow label="Paid" value={bill.amountPaid} />
          <div className="flex justify-between font-semibold text-rose-600">
            <span>Balance Due</span><span>{formatMoney(bill.balanceDue)}</span>
          </div>
        </div>

        {/* Payments */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Payments</p>
          {payments && payments.length > 0 ? (
            <ul className="mb-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-slate-600">{formatDateTime(p.paidAt)} · {p.method}</span>
                  <span className="font-medium text-emerald-600">{formatMoney(p.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-slate-400">No payments recorded yet.</p>
          )}

          {bill.balanceDue > 0 && (
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Amount" className="flex-1">
                <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`${bill.balanceDue}`} />
              </Field>
              <Field label="Method">
                <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
              </Field>
              <Button onClick={record} loading={saving}>Record</Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
