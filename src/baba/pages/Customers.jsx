import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Plus, Pencil, Trash2, Phone, MapPin, Search } from 'lucide-react';
import babaApi from '@/baba/api';
import { WORK_TYPES } from '@/baba/constants';
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
  ConfirmDialog,
  useToast,
} from '@/baba/components/ui';
import { PageHeader } from '@/baba/components/Layout';

const EMPTY = { name: '', mobile: '', address: '', siteAddress: '', workType: '' };

export default function Customers() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null); // { mode, data }
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await babaApi.list('customers');
      setCustomers(d.customers || []);
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
      openCreate();
      params.delete('new');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm(EMPTY);
    setModal({ mode: 'create' });
  };
  const openEdit = (c) => {
    setForm({
      name: c.name || '',
      mobile: c.mobile || '',
      address: c.address || '',
      siteAddress: c.siteAddress || '',
      workType: c.workType || '',
    });
    setModal({ mode: 'edit', id: c.id });
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Customer name is required');
    setSaving(true);
    try {
      if (modal.mode === 'edit') {
        await babaApi.update('customers', modal.id, form);
        toast.success('Customer updated');
      } else {
        await babaApi.create('customers', form);
        toast.success('Customer added');
      }
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
      await babaApi.remove('customers', confirm.id);
      toast.success('Customer deleted');
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = customers.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [c.name, c.mobile, c.address, c.workType].filter(Boolean).some((v) => v.toLowerCase().includes(q));
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        hindi="ग्राहक"
        description="Manage your customers and their sites."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customers…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query ? 'No matches' : 'No customers yet'}
          description={query ? 'Try a different search.' : 'Add your first customer to get started.'}
          action={!query && <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Customer</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{c.name}</p>
                  {c.workType && <p className="text-xs font-medium text-teal-600">{c.workType}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setConfirm(c)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                {c.mobile && (
                  <a href={`tel:${c.mobile}`} className="flex items-center gap-2 hover:text-teal-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {c.mobile}
                  </a>
                )}
                {(c.siteAddress || c.address) && (
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="line-clamp-2">{c.siteAddress || c.address}</span>
                  </p>
                )}
              </div>
              <p className="mt-3 text-[11px] text-slate-300">Added {formatDate(c.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit Customer' : 'Add Customer'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Customer Name / ग्राहक का नाम" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ramesh Kumar" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Mobile / मोबाइल नंबर">
              <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="98xxxxxxxx" inputMode="tel" />
            </Field>
            <Field label="Work Type / काम का प्रकार">
              <Select value={form.workType} onChange={(e) => setForm({ ...form, workType: e.target.value })}>
                <option value="">Select…</option>
                {WORK_TYPES.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Address / पता">
            <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Home / billing address" />
          </Field>
          <Field label="Site Address / साइट का पता">
            <Textarea value={form.siteAddress} onChange={(e) => setForm({ ...form, siteAddress: e.target.value })} placeholder="Where the work will be done" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        loading={deleting}
        title="Delete customer?"
        message={`This will permanently remove "${confirm?.name}". Orders and bills will keep their records but lose the link.`}
      />
    </div>
  );
}
