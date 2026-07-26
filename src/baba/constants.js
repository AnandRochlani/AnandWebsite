// Shared domain constants for the Baba Glass House ERP.
import {
  LayoutDashboard,
  Users,
  Ruler,
  FileText,
  Package,
  ClipboardList,
  Receipt,
  BarChart3,
} from 'lucide-react';

export const BRAND = {
  name: 'Baba Glass House',
  tagline: 'Glass • Aluminium • Kitchen Profile • Mirror • PVC Door • SS Work',
};

export const WORK_TYPES = [
  'Aluminium Window',
  'Sliding Window',
  'Domal Window',
  'Kitchen Profile',
  'Glass Partition',
  'Mirror',
  'PVC Door',
  'SS Railing',
];

export const ORDER_STATUSES = [
  'New Order',
  'Material Ready',
  'Fabrication Started',
  'Installation Pending',
  'Completed',
];

export const ORDER_STATUS_COLORS = {
  'New Order': 'bg-slate-100 text-slate-700 ring-slate-200',
  'Material Ready': 'bg-amber-100 text-amber-800 ring-amber-200',
  'Fabrication Started': 'bg-blue-100 text-blue-800 ring-blue-200',
  'Installation Pending': 'bg-purple-100 text-purple-800 ring-purple-200',
  Completed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
};

export const BILL_TYPES = ['Estimate', 'GST Invoice'];

export const BILL_STATUS_COLORS = {
  Paid: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  Partial: 'bg-amber-100 text-amber-800 ring-amber-200',
  Due: 'bg-rose-100 text-rose-800 ring-rose-200',
};

export const STOCK_CATEGORIES = ['Aluminium', 'Glass', 'Hardware', 'Consumable', 'Other'];

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];

// Sidebar / bottom navigation. `base` links resolve under /baba.
export const NAV_ITEMS = [
  { to: '/baba', label: 'Dashboard', hindi: 'डैशबोर्ड', icon: LayoutDashboard, end: true },
  { to: '/baba/customers', label: 'Customers', hindi: 'ग्राहक', icon: Users },
  { to: '/baba/measurements', label: 'Measurements', hindi: 'माप', icon: Ruler },
  { to: '/baba/quotations', label: 'Quotations', hindi: 'कोटेशन', icon: FileText },
  { to: '/baba/stock', label: 'Stock', hindi: 'स्टॉक', icon: Package },
  { to: '/baba/orders', label: 'Orders', hindi: 'ऑर्डर', icon: ClipboardList },
  { to: '/baba/billing', label: 'Billing', hindi: 'बिल', icon: Receipt },
  { to: '/baba/reports', label: 'Reports', hindi: 'रिपोर्ट', icon: BarChart3 },
];
