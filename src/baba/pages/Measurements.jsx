import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ruler, Plus, Trash2, Pencil } from 'lucide-react';
import babaApi from '@/baba/api';
import { WORK_TYPES } from '@/baba/constants';
import { formatMoney, formatNumber, toFeet } from '@/baba/format';
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Modal,
  Spinner,
  EmptyState,
  ConfirmDialog,
  useToast,
} from '@/baba/components/ui';
import { PageHeader } from '@/baba/components/Layout';

const EMPTY = {
  orderId: '', customerId: '', workType: 'Aluminium Window',
  widthFtWhole: '', widthIn: '', heightFtWhole: '', heightIn: '', qty: 1, rate: '', note: '',
};

export default function Measurements() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [measurements, setMeasurements] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [m, c, o] = await Promise.all([
        babaApi.list('measurements'),
        babaApi.list('customers'),
        babaApi.list('orders'),
      ]);
      setMeasurements(m.measurements || []);
      setCustomers(c.customers || []);
      setOrders(o.orders || []);
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

  const widthFt = toFeet(form.widthFtWhole, form.widthIn);
  const heightFt = toFeet(form.heightFtWhole, form.heightIn);
  const qty = Number(form.qty) || 0;
  const area = useMemo(() => Math.round(widthFt * heightFt * qty * 100) / 100, [widthFt, heightFt, qty]);
  const amount = useMemo(() => Math.round(area * (Number(form.rate) || 0) * 100) / 100, [area, form.rate]);

  const openEdit = (m) => {
    setForm({
      orderId: m.orderId || '', customerId: m.customerId || '', workType: m.workType || 'Aluminium Window',
      widthFtWhole: Math.floor(m.widthFt || 0), widthIn: Math.round(((m.widthFt || 0) % 1) * 12),
      heightFtWhole: Math.floor(m.heightFt || 0), heightIn: Math.round(((m.heightFt || 0) % 1) * 12),
      qty: m.qty || 1, rate: m.rate || '', note: m.note || '',
    });
    setModal({ mode: 'edit', id: m.id });
  };

  const save = async () => {
    if (widthFt <= 0 || heightFt <= 0) return toast.error('Enter valid width and height');
    setSaving(true);
    try {
      const payload = {
        orderId: form.orderId ? Number(form.orderId) : null,
        customerId: form.customerId ? Number(form.customerId) : null,
        workType: form.workType,
        widthFt, heightFt, qty: Number(form.qty) || 1, rate: Number(form.rate) || 0, note: form.note,
      };
      if (modal.mode === 'edit') await babaApi.update('measurements', modal.id, payload);
      else await babaApi.create('measurements', payload);
      toast.success('Measurement saved');
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
      await babaApi.remove('measurements', confirm.id);
      toast.success('Deleted');
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const totalArea = measurements.reduce((s, m) => s + (m.areaSqft || 0), 0);

  return (
    <div>
      <PageHeader
        title="Measurements"
        hindi="माप"
        description="Record site measurements. Area = width × height × qty (sq.ft)."
        action={
          <Button onClick={() => { setForm(EMPTY); setModal({ mode: 'create' }); }}>
            <Plus className="h-4 w-4" /> Add Measurement
          </Button>
        }
      />

      {loading ? (
        <Spinner />
      ) : measurements.length === 0 ? (
        <EmptyState icon={Ruler} title="No measurements" description="Add width, height and quantity to auto-calculate area." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Work Type</th>
                  <th className="px-4 py-3 text-right font-medium">W (ft)</th>
                  <th className="px-4 py-3 text-right font-medium">H (ft)</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Area (sqft)</th>
                  <th className="px-4 py-3 text-right font-medium">Rate</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {measurements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {m.workType || '—'}
                      {m.note && <span className="block text-xs font-normal text-slate-400">{m.note}</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatNumber(m.widthFt)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatNumber(m.heightFt)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{m.qty}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatNumber(m.areaSqft)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{m.rate ? formatMoney(m.rate) : '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{m.amount ? formatMoney(m.amount) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(m)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirm(m)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  <td className="px-4 py-3" colSpan={4}>Total Area</td>
                  <td className="px-4 py-3 text-right">{formatNumber(totalArea)} sqft</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit Measurement' : 'Add Measurement'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Work Type / काम चुनें">
              <Select value={form.workType} onChange={(e) => setForm({ ...form, workType: e.target.value })}>
                {WORK_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
              </Select>
            </Field>
            <Field label="Customer (optional)">
              <Select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                <option value="">— None —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Width / चौड़ाई (ft + inch)</p>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" value={form.widthFtWhole} onChange={(e) => setForm({ ...form, widthFtWhole: e.target.value })} placeholder="feet" inputMode="numeric" />
              <Input type="number" value={form.widthIn} onChange={(e) => setForm({ ...form, widthIn: e.target.value })} placeholder="inch" inputMode="numeric" />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Height / ऊँचाई (ft + inch)</p>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" value={form.heightFtWhole} onChange={(e) => setForm({ ...form, heightFtWhole: e.target.value })} placeholder="feet" inputMode="numeric" />
              <Input type="number" value={form.heightIn} onChange={(e) => setForm({ ...form, heightIn: e.target.value })} placeholder="inch" inputMode="numeric" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity / संख्या">
              <Input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} inputMode="numeric" min="1" />
            </Field>
            <Field label="Rate per sqft (₹)">
              <Input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} inputMode="decimal" placeholder="optional" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl bg-teal-50 p-4 text-center">
            <div>
              <p className="text-xs font-medium uppercase text-teal-700">Area</p>
              <p className="text-lg font-bold text-teal-800">{formatNumber(area)} sqft</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-teal-700">Amount</p>
              <p className="text-lg font-bold text-teal-800">{formatMoney(amount)}</p>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        loading={deleting}
        title="Delete measurement?"
        message="This measurement will be removed."
      />
    </div>
  );
}
