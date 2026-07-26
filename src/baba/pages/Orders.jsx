import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import babaApi from '@/baba/api';
import { WORK_TYPES, ORDER_STATUSES, ORDER_STATUS_COLORS } from '@/baba/constants';
import { formatDate } from '@/baba/format';
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
  Modal,
  Spinner,
  EmptyState,
  Badge,
  ConfirmDialog,
  useToast,
} from '@/baba/components/ui';
import { PageHeader } from '@/baba/components/Layout';

const EMPTY = { customerId: '', title: '', workType: '', status: 'New Order', notes: '' };

export default function Orders() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [o, c] = await Promise.all([babaApi.list('orders'), babaApi.list('customers')]);
      setOrders(o.orders || []);
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

  const openEdit = (o) => {
    setForm({
      customerId: o.customerId || '', title: o.title || '', workType: o.workType || '',
      status: o.status || 'New Order', notes: o.notes || '',
    });
    setModal({ mode: 'edit', id: o.id });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, customerId: form.customerId ? Number(form.customerId) : null };
      if (modal.mode === 'edit') await babaApi.update('orders', modal.id, payload);
      else await babaApi.create('orders', payload);
      toast.success('Order saved');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const advance = async (o) => {
    const idx = ORDER_STATUSES.indexOf(o.status);
    const next = ORDER_STATUSES[Math.min(idx + 1, ORDER_STATUSES.length - 1)];
    if (next === o.status) return;
    try {
      await babaApi.update('orders', o.id, {
        customerId: o.customerId, title: o.title, workType: o.workType, status: next, notes: o.notes,
      });
      toast.success(`Moved to "${next}"`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await babaApi.remove('orders', confirm.id);
      toast.success('Order deleted');
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = filter === 'All' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <PageHeader
        title="Orders"
        hindi="ऑर्डर"
        description="Track jobs from new order to completed installation."
        action={
          <Button onClick={() => { setForm(EMPTY); setModal({ mode: 'create' }); }}>
            <Plus className="h-4 w-4" /> New Order
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {['All', ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === s ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders" description="Create a new order to start tracking a job." />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((o) => {
            const isDone = o.status === 'Completed';
            return (
              <Card key={o.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{o.title || o.workType || `Order #${o.id}`}</p>
                    <p className="truncate text-xs text-slate-400">
                      {o.customerName || 'No customer'}{o.workType ? ` · ${o.workType}` : ''} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => openEdit(o)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setConfirm(o)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {o.notes && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{o.notes}</p>}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Badge className={ORDER_STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}>
                    {o.status}
                  </Badge>
                  {!isDone && (
                    <button onClick={() => advance(o)} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700">
                      Advance <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit Order' : 'New Order'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Customer / ग्राहक">
            <Select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              <option value="">— Select customer —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.mobile ? ` (${c.mobile})` : ''}</option>)}
            </Select>
          </Field>
          <Field label="Title / Job Description">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 2 sliding windows + partition" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Work Type / काम का प्रकार">
              <Select value={form.workType} onChange={(e) => setForm({ ...form, workType: e.target.value })}>
                <option value="">Select…</option>
                {WORK_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any details…" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        loading={deleting}
        title="Delete order?"
        message={`Remove order "${confirm?.title || confirm?.workType || `#${confirm?.id}`}"?`}
      />
    </div>
  );
}
