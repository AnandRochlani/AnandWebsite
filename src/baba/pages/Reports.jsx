import React, { useEffect, useState } from 'react';
import { IndianRupee, Wallet, AlertTriangle, TrendingUp } from 'lucide-react';
import babaApi from '@/baba/api';
import { formatMoney, monthLabel, dayLabel } from '@/baba/format';
import { Card, Spinner } from '@/baba/components/ui';
import { PageHeader } from '@/baba/components/Layout';
import { StatCard, GroupedBarChart, LineChart, HBarChart, DonutChart } from '@/baba/components/Charts';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    babaApi
      .reports()
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div>
        <PageHeader title="Reports" hindi="रिपोर्ट" />
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">Could not load reports: {error}</div>
      </div>
    );
  }

  const t = data?.totals || {};
  const monthData = (data?.salesByMonth || []).map((r) => ({ label: monthLabel(r.period), a: r.revenue, b: r.paid }));
  const dayData = (data?.salesByDay || []).map((r) => ({ label: dayLabel(r.period), value: r.revenue }));
  const workType = (data?.workTypeBreakdown || []).map((r) => ({ label: r.label, value: r.count }));
  const topCustomers = (data?.topCustomers || []).map((r) => ({ label: r.label, value: r.revenue }));
  const statusData = data?.ordersByStatus
    ? Object.entries(data.ordersByStatus).map(([label, value]) => ({ label, value }))
    : [];

  return (
    <div>
      <PageHeader title="Reports & Analytics" hindi="रिपोर्ट" description="Sales, collections, dues and profit." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={IndianRupee} tone="teal" label="Total Revenue" value={formatMoney(t.revenue)} sub={`${t.bills || 0} bills`} />
        <StatCard icon={Wallet} tone="emerald" label="Collected" value={formatMoney(t.collected)} />
        <StatCard icon={AlertTriangle} tone="rose" label="Outstanding" value={formatMoney(t.outstanding)} />
        <StatCard icon={TrendingUp} tone="blue" label="Profit" value={formatMoney(t.profit)} sub={`Cost ${formatMoney(t.cost)}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Monthly Sales / मासिक बिक्री</h3>
          <GroupedBarChart data={monthData} seriesA="Revenue" seriesB="Collected" />
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Daily Sales (30 days) / दैनिक बिक्री</h3>
          <LineChart data={dayData} />
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Top Customers</h3>
          <HBarChart data={topCustomers} />
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Orders by Work Type</h3>
          <DonutChart data={workType} />
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Orders by Status</h3>
          <DonutChart data={statusData} />
        </Card>
      </div>
    </div>
  );
}
