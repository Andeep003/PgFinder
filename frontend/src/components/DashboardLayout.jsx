import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Home, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import useTheme from '../hooks/useTheme';
import { useAuth } from '../store/auth';

// One layout for all three portals, colored per role exactly like the HRMS shells:
// Super Admin = blue, Owner (client admin) = purple, Tenant (employee) = cyan.
const THEMES = {
  superadmin: { aside: 'bg-sidebar', muted: 'text-sidebar-muted', active: 'bg-sidebar-accent text-white', hover: 'hover:bg-sidebar-accent/60', avatar: 'bg-primary', label: 'Super Admin' },
  owner: { aside: 'bg-owner-sidebar', muted: 'text-owner-sidebar-muted', active: 'bg-owner-sidebar-accent text-white', hover: 'hover:bg-owner-sidebar-accent/60', avatar: 'bg-owner', label: 'PG Owner' },
  user: { aside: 'bg-tenant-sidebar', muted: 'text-tenant-sidebar-muted', active: 'bg-tenant-sidebar-accent text-white', hover: 'hover:bg-tenant-sidebar-accent/60', avatar: 'bg-tenant', label: 'Resident' },
};

export default function DashboardLayout({ role, nav, children }) {
  const t = THEMES[role];
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, toggleTheme] = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const initials = (user?.name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {mobileOpen && <div className="backdrop-enter fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col text-white transition-all duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${t.aside} ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          } ${collapsed ? 'w-16' : 'w-60'}`}
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">PG</div>
            {!collapsed && (
              <div className="flex-1">
                <div className="text-sm font-semibold leading-tight">PG Finder</div>
                <div className={`text-xs ${t.muted}`}>{t.label}</div>
              </div>
            )}
            <button className={`${t.muted} lg:hidden`} onClick={() => setMobileOpen(false)}>
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2">
            {nav.map(({ to, label, icon: Icon, badge, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive ? t.active : `${t.muted} ${t.hover} hover:text-white`
                  }`
                }
              >
                <span className="relative shrink-0">
                  <Icon className="size-4" />
                  {collapsed && badge > 0 && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-red-500" />}
                </span>
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && badge > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                    {badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="space-y-1 border-t border-white/10 px-2 py-3">
            <NavLink to="/" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${t.muted} ${t.hover} hover:text-white`}>
              <Home className="size-4 shrink-0" />
              {!collapsed && 'Browse PGs'}
            </NavLink>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={`hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium lg:flex ${t.muted} ${t.hover} hover:text-white`}
            >
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
              {!collapsed && 'Collapse'}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/80 bg-card/85 px-4 py-3 backdrop-blur sm:px-6">
            <button className="text-foreground lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" />
            </button>
            <div className="hidden lg:block" />
            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5">
                <span className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold text-white ${t.avatar}`}>{initials}</span>
                <span className="max-w-[140px] truncate text-sm font-medium text-foreground">{user?.name}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="menu-enter absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                    <div className="border-b border-border px-3 py-2.5">
                      <div className="truncate text-sm font-medium text-foreground">{user?.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
                    </div>
                    <button onClick={toggleTheme} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted">
                      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    </button>
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
                      <LogOut className="size-4" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
