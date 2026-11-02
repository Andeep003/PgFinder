import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Home, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { ThemeToggle } from './ui';
import useTheme from '../hooks/useTheme';
import { useAuth } from '../store/auth';

// One layout for all three portals, each with its own accent:
// Super Admin = plum (brinjal), Owner (client admin) = ember orange, Tenant (employee) = mist blue.
const THEMES = {
  superadmin: {
    aside: 'bg-[#2A1328] via-[#3F1D3C] to-[#5A2A55]',
    glow: 'bg-coral-500/25',
    muted: 'text-sidebar-muted',
    logo: 'bg-ember-400',
    avatar: 'bg-plum-500',
    label: 'Super Admin',
  },
  owner: {
    aside: 'bg-[#2B1710] via-[#47241A] to-[#6B3322]',
    glow: 'bg-ember-400/30',
    muted: 'text-owner-sidebar-muted',
    logo: 'bg-ember-400',
    avatar: 'bg-ember-500',
    label: 'PG Owner',
  },
  user: {
    aside: 'bg-[#0F2A3A] via-[#163C50] to-[#1D4F5E]',
    glow: 'bg-mist-400/30',
    muted: 'text-tenant-sidebar-muted',
    logo: 'bg-mist-400',
    avatar: 'bg-mist-500',
    label: 'Resident',
  },
};

const navItem = 'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-250 ease-ios active:scale-[0.97]';

export default function DashboardLayout({ role, nav, children }) {
  const t = THEMES[role];
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [theme, toggleTheme] = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const initials = (user?.name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <div
        className={`fixed inset-0 z-40 bg-stone-950/50 backdrop-blur-sm transition-opacity duration-400 ease-ios lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
      />
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden text-white shadow-2xl transition-[transform,width] duration-500 ease-ios lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${t.aside} ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          } ${collapsed ? 'w-[72px]' : 'w-64'}`}
        >

          <div className="relative flex items-center gap-3 px-4 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold shadow-lg ring-1 ring-white/20 ${t.logo}`}>PG</div>
            {!collapsed && (
              <div className="min-w-0 flex-1 animate-fade-in">
                <div className="font-display text-[15px] font-bold leading-tight">PG Finder</div>
                <div className={`text-xs ${t.muted}`}>{t.label}</div>
              </div>
            )}
            <button className={`icon-btn size-8 ${t.muted} hover:bg-white/10 hover:text-white lg:hidden`} onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="size-5" />
            </button>
          </div>

          <nav className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
            {nav.map(({ to, label, icon: Icon, badge, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `${navItem} ${isActive ? 'bg-white/[0.14] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_8px_20px_-8px_rgb(0_0_0/0.45)]' : `${t.muted} hover:translate-x-0.5 hover:bg-white/[0.07] hover:text-white`}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all duration-400 ease-spring ${isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`} />
                    <span className="relative shrink-0">
                      <Icon className={`size-[18px] transition-transform duration-400 ease-spring ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      {collapsed && badge > 0 && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-coral-500 ring-2 ring-white/20" />}
                    </span>
                    {!collapsed && <span className="truncate">{label}</span>}
                    {!collapsed && badge > 0 && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-500 px-1.5 text-[11px] font-bold text-white shadow-md">
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="relative space-y-1 border-t border-white/10 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <NavLink to="/" className={`${navItem} ${t.muted} hover:bg-white/[0.07] hover:text-white`}>
              <Home className="size-[18px] shrink-0" />
              {!collapsed && 'Browse PGs'}
            </NavLink>
            <button onClick={() => setCollapsed((c) => !c)} className={`${navItem} hidden w-full lg:flex ${t.muted} hover:bg-white/[0.07] hover:text-white`}>
              {collapsed ? <ChevronRight className="size-[18px]" /> : <ChevronLeft className="size-[18px]" />}
              {!collapsed && 'Collapse'}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-border/60 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
            <button className="icon-btn -ml-2 text-foreground lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-1.5">
              <ThemeToggle theme={theme} onToggle={toggleTheme} className="hidden sm:inline-flex" />
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card py-1 pl-1 pr-3 shadow-sm transition-all duration-250 ease-ios hover:shadow-md active:scale-95"
                >
                  <span className={`flex size-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${t.avatar}`}>{initials}</span>
                  <span className="hidden max-w-[140px] truncate text-sm font-semibold text-foreground sm:inline">{user?.name}</span>
                  <ChevronDown className={`size-3.5 text-muted-foreground transition-transform duration-400 ease-ios ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />}
                <div
                  className={`absolute right-0 z-20 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-1.5 shadow-xl backdrop-blur-xl transition-all duration-250 ease-ios ${
                    menuOpen ? 'visible scale-100 opacity-100' : 'invisible -translate-y-1 scale-95 opacity-0'
                  }`}
                >
                  <div className="flex items-center gap-3 px-2.5 py-2.5">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${t.avatar}`}>{initials}</span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{user?.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
                    </div>
                  </div>
                  <div className="my-1 h-px bg-border/70" />
                  <button onClick={toggleTheme} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </button>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm font-medium text-coral-600 transition-colors hover:bg-coral-500/10 dark:text-coral-400">
                    <LogOut className="size-4" />
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </header>
          <main key={pathname} className="mx-auto w-full max-w-[1400px] flex-1 animate-fade-up px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
