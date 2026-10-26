import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Building2, ShieldCheck, User } from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import { useAuth, ROLE_HOME } from '../../store/auth';
import { resetDemoData } from '../../store/db';
import { toast } from '../../components/ui';

const DEMO = [
  { role: 'Resident (allocated)', email: 'user@pgfinder.com', password: 'user123', icon: User, tone: 'bg-tenant' },
  { role: 'Resident (awaiting allocation)', email: 'priya@pgfinder.com', password: 'user123', icon: User, tone: 'bg-tenant' },
  { role: 'PG Owner (Admin)', email: 'owner@pgfinder.com', password: 'owner123', icon: Building2, tone: 'bg-owner' },
  { role: 'Super Admin', email: 'admin@pgfinder.com', password: 'admin123', icon: ShieldCheck, tone: 'bg-primary' },
];

export default function Login() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = (e, creds) => {
    e?.preventDefault();
    setError('');
    try {
      const u = login(creds?.email ?? email, creds?.password ?? password);
      toast(`Welcome back, ${u.name.split(' ')[0]}!`);
      const next = params.get('next');
      navigate(next && u.role === 'user' ? next : ROLE_HOME[u.role]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <form onSubmit={submit} className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-foreground">Log in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Residents, PG owners and admins all sign in here.</p>
          {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>
          <button className="btn-primary mt-6 w-full" type="submit"><LogIn className="size-4" /> Log in</button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New here? <Link to="/" className="font-semibold text-primary">Find a PG & book</Link> to create your account, or{' '}
            <Link to="/owner-signup" className="font-semibold text-primary">list your PG</Link>.
          </p>
        </form>

        <div className="card p-6 sm:p-8">
          <h2 className="text-base font-semibold text-foreground">Demo accounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Click one to sign in instantly.</p>
          <div className="mt-4 space-y-2">
            {DEMO.map((d) => (
              <button key={d.email} onClick={() => submit(null, d)} className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted">
                <span className={`flex size-9 items-center justify-center rounded-lg text-white ${d.tone}`}><d.icon className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{d.role}</span>
                  <span className="block truncate text-xs text-muted-foreground">{d.email} · {d.password}</span>
                </span>
              </button>
            ))}
          </div>
          <button
            className="mt-6 text-xs font-medium text-muted-foreground underline hover:text-foreground"
            onClick={() => { resetDemoData(); toast('Demo data reset', 'info'); }}
          >
            Reset all demo data
          </button>
        </div>
      </main>
    </div>
  );
}
