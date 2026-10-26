import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2 } from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import { registerUser } from '../../store/db';

export default function OwnerSignup() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', pgName: '', city: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    try {
      registerUser({ ...form, role: 'owner' });
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main className="mx-auto max-w-lg px-4 py-10">
        {done ? (
          <div className="card p-8 text-center">
            <CheckCircle2 className="mx-auto size-14 text-emerald-500" />
            <h1 className="mt-3 text-xl font-bold text-foreground">Registration submitted</h1>
            <p className="mt-2 text-sm text-muted-foreground">The Super Admin will verify and activate your owner account. Once approved, log in to add your PG, rooms and photos.</p>
            <Link to="/login" className="btn-primary mt-6">Go to login</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-owner text-white"><Building2 className="size-5" /></span>
              <div>
                <h1 className="text-xl font-bold text-foreground">List your PG</h1>
                <p className="text-sm text-muted-foreground">Register as a PG owner</p>
              </div>
            </div>
            {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="mt-6 grid gap-4">
              {[['Full name', 'name', 'text'], ['Email', 'email', 'email'], ['Phone', 'phone', 'tel'], ['PG name', 'pgName', 'text'], ['City', 'city', 'text'], ['Password', 'password', 'password']].map(([l, k, t]) => (
                <div key={k}>
                  <label className="label">{l}</label>
                  <input className="input" type={t} value={form[k]} onChange={set(k)} required minLength={k === 'password' ? 6 : undefined} />
                </div>
              ))}
            </div>
            <button className="btn mt-6 w-full bg-owner text-white hover:bg-violet-700" type="submit">Submit for approval</button>
          </form>
        )}
      </main>
    </div>
  );
}
