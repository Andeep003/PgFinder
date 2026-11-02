import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BedDouble, Building2, CheckCircle2, Eye, EyeOff, Lock, Mail, MapPin, Search, ShieldCheck, Wallet } from 'lucide-react';
import { useAuth, ROLE_HOME } from '../../store/auth';
import useTheme from '../../hooks/useTheme';
import { BrandLogo, Switch, ThemeToggle, toast } from '../../components/ui';

const REMEMBER_KEY = 'pgfinder-remember-email';

function readRemembered() {
  try {
    return localStorage.getItem(REMEMBER_KEY) || '';
  } catch {
    return '';
  }
}

const PERKS = [
  { icon: BedDouble, text: 'Live bed availability', tone: 'bg-mist-300/25 text-mist-100' },
  { icon: ShieldCheck, text: 'Verified owners & real photos', tone: 'bg-sage-300/25 text-sage-100' },
  { icon: Wallet, text: 'Book and pay rent online', tone: 'bg-butter-300/25 text-butter-100' },
];

function ArtPanel() {
  return (
    <aside className="relative isolate hidden overflow-hidden bg-plum-800 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">

      <BrandLogo light />

      <div className="relative my-10">
        {/* floating preview cards */}
        <div className="relative h-64">
          <div className="absolute left-0 top-4 w-64 animate-float rounded-3xl border border-white/20 bg-white/95 p-4 text-stone-800 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.5)]">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-mist-500 text-white"><BedDouble className="size-5" /></span>
              <div>
                <div className="text-sm font-bold">Twin sharing</div>
                <div className="flex items-center gap-1 text-xs text-stone-500"><MapPin className="size-3" /> Madhapur</div>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div className="font-display text-2xl font-semibold">₹7,500<span className="text-xs font-normal text-stone-500">/mo</span></div>
              <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-bold text-sage-700">2 beds free</span>
            </div>
          </div>
          <div className="absolute right-0 top-32 w-56 animate-float rounded-3xl border border-white/20 bg-white/95 p-4 text-stone-800 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.5)] [animation-delay:-3s]">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-sage-500 text-white"><CheckCircle2 className="size-5" /></span>
              <div>
                <div className="text-sm font-bold">Rent paid</div>
                <div className="text-xs text-stone-500">Receipt sent instantly</div>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full w-full rounded-full bg-sage-400" />
            </div>
          </div>
        </div>

        <h2 className="mt-8 max-w-md font-display text-4xl font-medium leading-[1.12] xl:text-5xl">
          A room that feels like <span className="font-bold text-butter-300">home</span>, a few taps away.
        </h2>
        <ul className="mt-6 space-y-3">
          {PERKS.map((p) => (
            <li key={p.text} className="flex items-center gap-3 text-sm text-white/85">
              <span className={`flex size-8 items-center justify-center rounded-xl backdrop-blur ${p.tone}`}><p.icon className="size-4" /></span>
              {p.text}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-white/55">© {new Date().getFullYear()} PG Finder</p>
    </aside>
  );
}

export default function Login() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(() => params.get('email') || readRemembered());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(() => Boolean(readRemembered()));
  const [error, setError] = useState('');
  const [theme, toggleTheme] = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    setError('');
    try {
      const u = login(email, password);
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        // ignore
      }
      toast(`Welcome back, ${u.name.split(' ')[0]}!`);
      const next = params.get('next');
      navigate(next && u.role === 'user' ? next : ROLE_HOME[u.role]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <ArtPanel />

      <div className="relative flex flex-col">

        <div className="relative flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10">
          <div className="lg:invisible"><BrandLogo /></div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[420px] animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" /> Residents · Owners · Admins
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold text-foreground sm:text-[44px]">Welcome back</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">Sign in to manage your stay, your PG, or the platform.</p>

            {error && (
              <div role="alert" className="mt-6 animate-fade-up rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-700 dark:border-coral-900 dark:bg-coral-950/40 dark:text-coral-300">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input id="email" className="input h-12 rounded-2xl pl-10" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    className="input h-12 rounded-2xl px-10"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Switch id="remember" checked={remember} onChange={setRemember} label="Remember my email" />

              <button className="btn-primary group h-12 w-full rounded-2xl text-[15px]" type="submit">
                Log in
                <ArrowRight className="size-4 transition-transform duration-300 ease-ios group-hover:translate-x-1" />
              </button>
            </form>

            <div className="my-8 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> New to PG Finder? <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/" className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm transition-all duration-300 ease-ios hover:-translate-y-0.5 hover:border-mist-300 hover:shadow-lg active:scale-[0.98] dark:hover:border-mist-700">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mist-500 text-white shadow-sm transition-transform duration-400 ease-spring group-hover:-rotate-6 group-hover:scale-110"><Search className="size-4" /></span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">Find a PG</span>
                  <span className="block text-xs text-muted-foreground">Book a bed to join</span>
                </span>
              </Link>
              <Link to="/owner-signup" className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm transition-all duration-300 ease-ios hover:-translate-y-0.5 hover:border-ember-300 hover:shadow-lg active:scale-[0.98] dark:hover:border-ember-700">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember-500 text-white shadow-sm transition-transform duration-400 ease-spring group-hover:-rotate-6 group-hover:scale-110"><Building2 className="size-4" /></span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">List your PG</span>
                  <span className="block text-xs text-muted-foreground">For PG owners</span>
                </span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
