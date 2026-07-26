import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react';
import babaApi from '@/baba/api';
import { formatMoney, formatDate } from '@/baba/format';
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

const EMPTY = { customerId: '', title: '', materialCost: '', labourCost: '', installationCost: '', discount: '', status: 'Draft' };
const STATUSES = ['Draft', 'Sent', 'Approved', 'Rejected'];
const STATUS_COLORS = {
  Draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  Sent: 'bg-blue-100 text-blue-700 ring-blue-200',
  Approved: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Rejected: 'bg-rose-100 text-rose-700 ring-rose-200',
};

export default function Quotations() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [q, c] = await Promise.all([babaApi.list('quotations'), babaApi.list('customers')]);
      setQuotations(q.quotations || []);
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
      setModal({ mode: 'create' });
      params.delete('new');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(() => {
    const t = (Number(form.materialCost) || 0) + (Number(form.labourCost) || 0) + (Number(form.installationCost) || 0) - (Number(form.discount) || 0);
    return Math.round(t * 100) / 100;
  }, [form]);

  const openEdit = (q) => {
    setForm({
      customerId: q.customerId || '', title: q.title || '',
      materialCost: q.materialCost || '', labourCost: q.labourCost || '',
      installationCost: q.installationCost || '', discount: q.discount || '', status: q.status || 'Draft',
    });
    setModal({ mode: 'edit', id: q.id });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        customerId: form.customerId ? Number(form.customerId) : null,
        title: form.title,
        materialCost: Number(form.materialCost) || 0,
        labourCost: Number(form.labourCost) || 0,
        installationCost: Number(form.installationCost) || 0,
        discount: Number(form.discount) || 0,
        status: form.status,
      };
      if (modal.mode === 'edit') await babaApi.update('quotations', modal.id, payload);
      else await babaApi.create('quotations', payload);
      toast.success('Quotation saved');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await babaApi.remove('quotations', confirm.id);
      toast.success('Deleted');
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Quotations"
        hindi="कोटेशन"
        description="Estimate material, labour and installation for a job."
        action={
          <Button onClick={() => { setForm(EMPTY); setModal({ mode: 'create' }); }}>
            <Plus className="h-4 w-4" /> Create Quotation
          </Button>
        }
      />

      {loading ? (
        <Spinner />
      ) : quotations.length === 0 ? (
        <EmptyState icon={FileText} title="No quotations" description="Create a quotation to share an estimate with a customer." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quotations.map((q) => (
            <Card key={q.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{q.title || `Quotation #${q.id}`}</p>
                  <p className="truncate text-xs text-slate-400">{q.customerName || 'No customer'} · {formatDate(q.createdAt)}</p>
                </div>
                <Badge className={STATUS_COLORS[q.status] || STATUS_COLORS.Draft}>{q.status}</Badge>
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <Row label="Material" value={q.materialCost} />
                <Row label="Labour" value={q.labourCost} />
                <Row label="Installation" value={q.installationCost} />
                {q.discount > 0 && <Row label="Discount" value={-q.discount} />}
              </dl>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm font-medium text-slate-500">Total</span>
                <span className="text-lg font-bold text-slate-900">{formatMoney(q.total)}</span>
              </div>
              <div className="mt-3 flex justify-end gap-1">
                <button onClick={() => openEdit(q)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setConfirm(q)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit Quotation' : 'Create Quotation'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save</Button>
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
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Kitchen profile + 3 windows" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Material Cost (₹) / मटेरियल लागत">
              <Input type="number" value={form.materialCost} onChange={(e) => setForm({ ...form, materialCost: e.target.value })} inputMode="decimal" />
            </Field>
            <Field label="Labour (₹) / मजदूरी">
              <Input type="number" value={form.labourCost} onChange={(e) => setForm({ ...form, labourCost: e.target.value })} inputMode="decimal" />
            </Field>
            <Field label="Installation (₹) / इंस्टॉलेशन">
              <Input type="number" value={form.installationCost} onChange={(e) => setForm({ ...form, installationCost: e.target.value })} inputMode="decimal" />
            </Field>
            <Field label="Discount (₹)">
              <Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} inputMode="decimal" />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-teal-50 px-4 py-3">
            <span className="text-sm font-medium text-teal-700">Total / कुल राशि</span>
            <span className="text-xl font-bold text-teal-800">{formatMoney(total)}</span>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        loading={deleting}
        title="Delete quotation?"
        message={`Remove "${confirm?.title || `#${confirm?.id}`}"?`}
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-slate-600">
      <dt>{label}</dt>
      <dd className="font-medium text-slate-800">{formatMoney(value)}</dd>
    </div>
  );
}
