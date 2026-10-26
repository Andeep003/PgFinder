import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, CreditCard, Landmark, Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import { EmptyState, toast } from '../../components/ui';
import { Steps } from './BookingRegister';
import { useDB, findPg, findUser, completeBookingPayment } from '../../store/db';
import { useAuth } from '../../store/auth';
import { fmtDate, inr } from '../../utils/format';

const METHODS = [
  { id: 'UPI', label: 'UPI', icon: Smartphone },
  { id: 'Card', label: 'Credit / Debit card', icon: CreditCard },
  { id: 'Net Banking', label: 'Net banking', icon: Landmark },
];
const REDIRECT_SECONDS = 6;

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const db = useDB();
  const { user } = useAuth();
  const booking = db.bookings.find((b) => b.id === bookingId);
  const [method, setMethod] = useState('UPI');
  const [upi, setUpi] = useState('ananya@okhdfc');
  const [card, setCard] = useState({ number: '4111 1111 1111 1111', name: 'ANANYA GUPTA', exp: '12/29', cvv: '123' });
  const [bank, setBank] = useState('HDFC Bank');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const [error, setError] = useState('');

  // After a successful payment: go back to the main page; the resident then logs in with
  // the same credentials to see the booking on their dashboard.
  useEffect(() => {
    if (!receipt) return undefined;
    if (countdown <= 0) {
      toast(user ? 'Booking confirmed! Open your dashboard to see it.' : 'Booking confirmed! Log in with your email & password to view it.');
      navigate('/');
      return undefined;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [receipt, countdown, navigate, user]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <EmptyState title="Booking not found">This payment link is invalid or expired.</EmptyState>
      </div>
    );
  }

  const pg = findPg(db, booking.pgId);
  const resident = findUser(db, booking.userId);
  const total = booking.rent + booking.deposit;

  const pay = (e) => {
    e.preventDefault();
    setError('');
    setProcessing(true);
    setTimeout(() => {
      try {
        setReceipt(completeBookingPayment(booking.id, method));
      } catch (err) {
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    }, 1800);
  };

  if (receipt || booking.status !== 'payment_pending') {
    const r = receipt || db.payments.find((p) => p.bookingId === booking.id);
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <main className="mx-auto max-w-xl px-4 py-10">
          <Steps current={3} />
          <div className="card p-6 text-center">
            <CheckCircle2 className="mx-auto size-16 text-emerald-500" />
            <h1 className="mt-3 text-2xl font-bold text-foreground">Payment successful</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your bed is booked. The PG owner will allocate it to you on move-in.</p>
            <dl className="mt-6 space-y-2 rounded-lg bg-muted/60 p-4 text-left text-sm">
              <Row k="Booking ID" v={booking.id.toUpperCase()} />
              <Row k="Transaction ID" v={r?.txnId} />
              <Row k="PG" v={pg.name} />
              <Row k="Room / Bed" v={`Room ${booking.roomNo} · Bed ${booking.bedNo}`} />
              <Row k="Move-in date" v={fmtDate(booking.moveInDate)} />
              <Row k="Amount paid" v={inr(r?.amount ?? total)} />
              <Row k="Paid via" v={r?.method} />
              <Row k="Login email" v={resident?.email} />
            </dl>
            {receipt && <p className="mt-5 text-sm text-muted-foreground">Redirecting to the home page in <b>{countdown}s</b>…</p>}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button className="btn-outline" onClick={() => navigate('/')}>Go to home</button>
              <button className="btn-primary" onClick={() => navigate(user ? '/user' : `/login?email=${encodeURIComponent(resident?.email || '')}`)}>
                {user ? 'Open dashboard' : 'Login to dashboard'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Steps current={2} />
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form onSubmit={pay} className="card p-5">
            <h2 className="text-base font-semibold text-foreground">Choose payment method</h2>
            <p className="mb-4 text-xs text-muted-foreground">Demo gateway: no real money is charged.</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {METHODS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  className={`flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium ${method === id ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground'}`}
                >
                  <Icon className="size-5" /> {label}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              {method === 'UPI' && (
                <div>
                  <label className="label">UPI ID</label>
                  <input className="input" value={upi} onChange={(e) => setUpi(e.target.value)} pattern=".+@.+" required />
                  <div className="mt-2 flex gap-2 text-xs text-muted-foreground">GPay · PhonePe · Paytm · BHIM</div>
                </div>
              )}
              {method === 'Card' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label">Card number</label>
                    <input className="input" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Name on card</label>
                    <input className="input" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">Expiry</label>
                    <input className="input" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="MM/YY" required />
                  </div>
                  <div>
                    <label className="label">CVV</label>
                    <input className="input" type="password" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} required />
                  </div>
                </div>
              )}
              {method === 'Net Banking' && (
                <div>
                  <label className="label">Select bank</label>
                  <select className="input" value={bank} onChange={(e) => setBank(e.target.value)}>
                    {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank'].map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
              )}
            </div>

            <button type="submit" disabled={processing} className="btn-success mt-6 w-full py-3 text-base">
              {processing ? <><Loader2 className="size-5 animate-spin" /> Processing payment…</> : <>Pay {inr(total)}</>}
            </button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" /> 100% secure demo payment
            </div>
          </form>

          <aside className="card h-fit p-5">
            <h3 className="text-sm font-semibold text-foreground">Booking summary</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <Row k="Resident" v={resident?.name} />
              <Row k="PG" v={pg.name} />
              <Row k="Room / Bed" v={`${booking.roomNo} / ${booking.bedNo}`} />
              <Row k="Move-in" v={fmtDate(booking.moveInDate)} />
              <Row k="1st month rent" v={inr(booking.rent)} />
              <Row k="Security deposit" v={inr(booking.deposit)} />
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                <span>Total</span>
                <span>{inr(total)}</span>
              </div>
            </dl>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium text-foreground">{v}</dd>
    </div>
  );
}
