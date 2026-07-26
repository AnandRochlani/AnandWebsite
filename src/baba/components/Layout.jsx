import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, GlassWater } from 'lucide-react';
import { BRAND, NAV_ITEMS } from '@/baba/constants';
import { useBabaAuth } from '@/baba/BabaAuthContext';
import { Button } from '@/baba/components/ui';

export function Layout({ children }) {
  const { user, logout } = useBabaAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/baba/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm">
              <GlassWater className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">{BRAND.name}</p>
              <p className="hidden text-[11px] text-slate-400 sm:block">Fabricator ERP</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user?.username ? `Hi, ${user.username}` : ''}
            </span>
            <Button variant="secondary" onClick={onLogout} className="px-3 py-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-slate-200 bg-white px-3 py-4 md:block">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-10">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <BottomNavItem key={item.to} item={item} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavItem({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      <Icon className="h-5 w-5" />
      <span>{item.label}</span>
      <span className="ml-auto text-[11px] text-slate-300">{item.hindi}</span>
    </NavLink>
  );
}

function BottomNavItem({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
          isActive ? 'text-teal-700' : 'text-slate-400'
        }`
      }
    >
      <Icon className="h-5 w-5" />
      <span>{item.label}</span>
    </NavLink>
  );
}

// Reusable page header
export function PageHeader({ title, hindi, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {title} {hindi && <span className="text-base font-medium text-slate-400">/ {hindi}</span>}
        </h1>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export default Layout;
