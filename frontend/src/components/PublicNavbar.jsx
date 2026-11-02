import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogIn, LogOut, Building2, Search } from 'lucide-react';
import useTheme from '../hooks/useTheme';
import { useAuth, ROLE_HOME } from '../store/auth';
import { BrandLogo, ThemeToggle } from './ui';

const tab = ({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`;

export default function PublicNavbar() {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const navigate = useNavigate();
  return (
    <header className="glass sticky top-0 z-40 border-b border-border/50 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <BrandLogo />
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={tab}><Search className="size-4" /> Find a PG</NavLink>
          {!user && <NavLink to="/owner-signup" className={tab}><Building2 className="size-4" /> List your PG</NavLink>}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          {user ? (
            <>
              <button className="btn-outline rounded-full px-3 sm:px-4" onClick={() => navigate(ROLE_HOME[user.role])}>
                <LayoutDashboard className="size-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button className="btn-ghost rounded-full px-3 sm:px-4" onClick={() => { logout(); navigate('/'); }}>
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary rounded-full px-5">
              <LogIn className="size-4" />
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
