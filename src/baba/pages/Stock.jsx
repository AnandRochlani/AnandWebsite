import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import babaApi from '@/baba/api';
import { STOCK_CATEGORIES } from '@/baba/constants';
import { formatMoney, formatNumber } from '@/baba/format';
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

const EMPTY = { name: '', category: 'Aluminium', unit: 'pcs', quantity: 0, unitCost: 0, lowStock: 0 };

export default function Stock() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await babaApi.list('stock');
      setStock(d.stock || []);
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

  const openEdit = (s) => {
    setForm({
      name: s.name, category: s.category || 'Other', unit: s.unit || 'pcs',
      quantity: s.quantity ?? 0, unitCost: s.unitCost ?? 0, lowStock: s.lowStock ?? 0,
    });
    setModal({ mode: 'edit', id: s.id });
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Item name is required');
    setSaving(true);
    try {
      if (modal.mode === 'edit') await babaApi.update('stock', modal.id, form);
      else await babaApi.create('stock', form);
      toast.success('Stock saved');
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
      await babaApi.remove('stock', confirm.id);
      toast.success('Item deleted');
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const totalValue = stock.reduce((s, i) => s + (i.value || 0), 0);
  const lowCount = stock.filter((i) => (i.quantity || 0) <= (i.lowStock || 0)).length;

  return (
    <div>
      <PageHeader
        title="Stock"
        hindi="स्टॉक"
        description="Inventory of profiles, glass, hardware and consumables."
        action={
          <Button onClick={() => { setForm(EMPTY); setModal({ mode: 'create' }); }}>
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard icon={Package} tone="teal" label="Items" value={stock.length} />
        <StatCard icon={Package} tone="blue" label="Stock Value" value={formatMoney(totalValue)} />
        <StatCard icon={AlertTriangle} tone="rose" label="Low Stock" value={lowCount} sub="At / below threshold" />
      </div>

      {loading ? (
        <Spinner />
      ) : stock.length === 0 ? (
        <EmptyState icon={Package} title="No stock items" description="Add your inventory items to track quantity and value." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Quantity</th>
                  <th className="px-4 py-3 text-right font-medium">Unit Cost</th>
                  <th className="px-4 py-3 text-right font-medium">Value</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stock.map((s) => {
                  const low = (s.quantity || 0) <= (s.lowStock || 0);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {s.name}
                        {low && (
                          <Badge className="ml-2 bg-rose-100 text-rose-700 ring-rose-200">Low</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{s.category || '—'}</td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatNumber(s.quantity)} <span className="text-xs text-slate-400">{s.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatMoney(s.unitCost)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{formatMoney(s.value)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setConfirm(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit Item' : 'Add Item'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Item Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Aluminium Profile" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {STOCK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Unit">
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs / ft / sqft / box" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Quantity">
              <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} inputMode="decimal" />
            </Field>
            <Field label="Unit Cost (₹)">
              <Input type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} inputMode="decimal" />
            </Field>
            <Field label="Low Stock At">
              <Input type="number" value={form.lowStock} onChange={(e) => setForm({ ...form, lowStock: e.target.value })} inputMode="decimal" />
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        loading={deleting}
        title="Delete item?"
        message={`Remove "${confirm?.name}" from inventory?`}
      />
    </div>
  );
}
