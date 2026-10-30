import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogIn, LogOut, Moon, Sun, Building2 } from 'lucide-react';
import useTheme from '../hooks/useTheme';
import { useAuth, ROLE_HOME } from '../store/auth';

export default function PublicNavbar() {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white shadow-sm transition duration-200 group-hover:scale-105">PG</span>
          <span className="text-base font-semibold text-foreground">PG Finder</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" title="Toggle theme">
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          {user ? (
            <>
              <button className="btn-outline" onClick={() => navigate(ROLE_HOME[user.role])}>
                <LayoutDashboard className="size-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button className="btn-outline" onClick={() => { logout(); navigate('/'); }}>
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/owner-signup" className="btn-outline hidden sm:inline-flex">
                <Building2 className="size-4" />
                List your PG
              </Link>
              <Link to="/login" className="btn-primary">
                <LogIn className="size-4" />
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
