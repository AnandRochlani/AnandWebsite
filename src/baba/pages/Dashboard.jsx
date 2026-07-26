import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Ruler,
  FileText,
  Package,
  Receipt,
  BarChart3,
  ClipboardList,
  IndianRupee,
  Wallet,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import babaApi from '@/baba/api';
import { BRAND, ORDER_STATUS_COLORS, BILL_STATUS_COLORS } from '@/baba/constants';
import { formatMoney, formatDate } from '@/baba/format';
import { Card, Spinner, Badge } from '@/baba/components/ui';
import { PageHeader } from '@/baba/components/Layout';
import { StatCard, DonutChart } from '@/baba/components/Charts';

const QUICK_ACTIONS = [
  { to: '/baba/orders?new=1', label: 'New Order', hindi: 'नया ऑर्डर', icon: ClipboardList, tone: 'bg-blue-50 text-blue-700' },
  { to: '/baba/customers?new=1', label: 'Add Customer', hindi: 'ग्राहक जोड़ें', icon: Users, tone: 'bg-teal-50 text-teal-700' },
  { to: '/baba/measurements?new=1', label: 'Measurement', hindi: 'माप दर्ज करें', icon: Ruler, tone: 'bg-purple-50 text-purple-700' },
  { to: '/baba/quotations?new=1', label: 'Quotation', hindi: 'कोटेशन', icon: FileText, tone: 'bg-amber-50 text-amber-700' },
  { to: '/baba/stock', label: 'View Stock', hindi: 'स्टॉक देखें', icon: Package, tone: 'bg-emerald-50 text-emerald-700' },
  { to: '/baba/billing?new=1', label: 'Create Bill', hindi: 'बिल बनाएं', icon: Receipt, tone: 'bg-rose-50 text-rose-700' },
  { to: '/baba/reports', label: 'Reports', hindi: 'रिपोर्ट', icon: BarChart3, tone: 'bg-slate-100 text-slate-700' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    babaApi
      .dashboard()
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner />;

  const statusData = data?.ordersByStatus
    ? Object.entries(data.ordersByStatus).map(([label, value]) => ({ label, value }))
    : [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        hindi="डैशबोर्ड"
        description={BRAND.tagline}
      />

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Could not load data: {error}. Check that the database (DATABASE_URL) is configured.
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.to}
              to={a.to}
              className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-slate-700">{a.label}</span>
              <span className="text-[10px] text-slate-400">{a.hindi}</span>
            </Link>
          );
        })}
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={IndianRupee} tone="teal" label="Revenue" value={formatMoney(data?.revenue)} sub={`${data?.stock?.total ?? 0} stock items`} />
        <StatCard icon={Wallet} tone="emerald" label="Collected" value={formatMoney(data?.collected)} />
        <StatCard icon={AlertTriangle} tone="rose" label="Outstanding" value={formatMoney(data?.outstanding)} sub="Payment due" />
        <StatCard icon={Users} tone="blue" label="Customers" value={data?.customers ?? 0} sub={`${data?.orders ?? 0} orders`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Orders by status */}
        <Card className="p-5 lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Orders by Status</h3>
          <DonutChart data={statusData} />
        </Card>

        {/* Recent orders */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Recent Orders</h3>
            <Link to="/baba/orders" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
              View all
            </Link>
          </div>
          {(!data?.recentOrders || data.recentOrders.length === 0) ? (
            <p className="py-6 text-center text-sm text-slate-400">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {o.title || o.workType || `Order #${o.id}`}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {o.customerName || 'No customer'} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <Badge className={ORDER_STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}>
                    {o.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recent bills */}
      <Card className="mt-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Recent Bills</h3>
          <Link to="/baba/billing" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
            View all
          </Link>
        </div>
        {(!data?.recentBills || data.recentBills.length === 0) ? (
          <p className="py-6 text-center text-sm text-slate-400">No bills yet.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="pb-2 font-medium">Bill</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                  <th className="pb-2 text-right font-medium">Due</th>
                  <th className="pb-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentBills.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2.5">
                      <span className="font-medium text-slate-700">#{b.id}</span>
                      <span className="ml-1 text-xs text-slate-400">{b.billType}</span>
                    </td>
                    <td className="py-2.5 text-slate-600">{b.customerName || '—'}</td>
                    <td className="py-2.5 text-right font-medium text-slate-800">{formatMoney(b.total)}</td>
                    <td className="py-2.5 text-right text-slate-500">{formatMoney(b.balanceDue)}</td>
                    <td className="py-2.5 text-right">
                      <Badge className={BILL_STATUS_COLORS[b.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}>
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
