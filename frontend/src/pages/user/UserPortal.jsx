import React, { useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import {
  BedDouble, CalendarClock, CheckCircle2, Clock, CreditCard, Home, IndianRupee, LayoutDashboard, LogOut as Vacate,
  Lock, MessageSquareWarning, Phone, Plus, Star, User, Utensils, Wallet, MapPin,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, EmptyState, Modal, PageHeader, StatTile, StatusBadge, Stars, Table, Photo, toast } from '../../components/ui';
import { FoodMenuTable, ReviewList } from '../../components/pg';
import { useAuth } from '../../store/auth';
import { useDB, findPg, findUser, findRoom, payRent, addComplaint, upsertReview, updateUser, pgRating, requestVacate } from '../../store/db';
import { daysBetween, fmtDate, inr, todayIso, todayName } from '../../utils/format';

// The resident's current booking: an active one if any, else the latest.
function useMyBooking() {
  const { user } = useAuth();
  const db = useDB();
  return useMemo(() => {
    const mine = db.bookings.filter((b) => b.userId === user.id && b.status !== 'payment_pending');
    const booking = mine.find((b) => ['allocated', 'booked', 'vacate_requested'].includes(b.status)) || mine[mine.length - 1] || null;
    const pg = booking && findPg(db, booking.pgId);
    const room = booking && findRoom(pg, booking.roomId);
    const payments = booking ? db.payments.filter((p) => p.bookingId === booking.id).sort((a, b) => b.date.localeCompare(a.date)) : [];
    const complaints = booking ? db.complaints.filter((c) => c.bookingId === booking.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
    return { db, user, booking, pg, room, payments, complaints };
  }, [db, user]);
}

export function dueInfo(paidUntil) {
  if (!paidUntil) return { status: 'pending', days: 0 };
  const days = daysBetween(todayIso(), paidUntil);
  return { days, status: days < 0 ? 'overdue' : days <= 5 ? 'due-soon' : 'paid' };
}

export default function UserPortal() {
  const { booking, complaints } = useMyBooking();
  const openComplaints = complaints.filter((c) => c.status !== 'resolved').length;
  const nav = [
    { to: '/user', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/user/payments', label: 'Fees & Payments', icon: Wallet },
    { to: '/user/food', label: 'Food Menu', icon: Utensils },
    { to: '/user/complaints', label: 'Complaints', icon: MessageSquareWarning, badge: openComplaints },
    { to: '/user/ratings', label: 'Ratings & Reviews', icon: Star },
    { to: '/user/profile', label: 'My Profile', icon: User },
  ];
  const allocated = ['allocated', 'vacate_requested'].includes(booking?.status);
  return (
    <DashboardLayout role="user" nav={nav}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="payments" element={booking ? <Payments /> : <NoBooking />} />
        <Route path="food" element={allocated ? <Food /> : <Locked />} />
        <Route path="complaints" element={allocated ? <Complaints /> : <Locked />} />
        <Route path="ratings" element={allocated ? <Ratings /> : <Locked />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/user" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

function NoBooking() {
  return (
    <div className="card">
      <EmptyState icon={Home} title="You don't have a booking yet">
        Find a PG near you, pick a bed and book it online.
        <div className="mt-4"><Link to="/" className="btn-primary">Browse PGs</Link></div>
      </EmptyState>
    </div>
  );
}

function Locked() {
  const { booking } = useMyBooking();
  if (!booking) return <NoBooking />;
  return (
    <div className="card">
      <EmptyState icon={Lock} title="Available after bed allocation">
        This section unlocks once the PG owner marks your bed as <b>allocated</b> (usually on your move-in day, {fmtDate(booking.moveInDate)}).
      </EmptyState>
    </div>
  );
}

// ------------------------------------------------------------------ Overview
function Overview() {
  const { user, booking, pg, room, payments, complaints, db } = useMyBooking();
  const [payOpen, setPayOpen] = useState(false);
  const first = user.name.split(' ')[0];

  if (!booking) {
    return (
      <>
        <PageHeader title={`Hi ${first} 👋`} subtitle="Welcome to PG Finder" />
        <NoBooking />
      </>
    );
  }

  const owner = findUser(db, pg.ownerId);
  const lastPayment = payments[0];
  const due = dueInfo(booking.paidUntil);
  const allocated = ['allocated', 'vacate_requested'].includes(booking.status);
  const today = pg.foodMenu?.[todayName()];

  if (!allocated) {
    const steps = [
      { label: 'Bed selected', done: true, date: booking.bookedOn },
      { label: 'Registration complete', done: true, date: booking.bookedOn },
      { label: 'Payment successful', done: booking.status === 'booked', date: lastPayment?.date },
      { label: 'Bed allocated by owner', done: false, date: null },
    ];
    return (
      <>
        <PageHeader title={`Hi ${first} 👋`} subtitle="Here are your booking details" />
        {['cancelled', 'vacated'].includes(booking.status) ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            This booking was <b>{booking.status}</b>. <Link to="/" className="font-semibold underline">Find another PG</Link>
          </div>
        ) : (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <Clock className="mt-0.5 size-5 shrink-0" />
            <div>
              <div className="font-semibold">Booking confirmed · awaiting bed allocation</div>
              The PG owner will allocate your bed on or before your move-in date. After that, your room, food menu, fees and complaints will appear here.
            </div>
          </div>
        )}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card title="Booking details" actions={<StatusBadge status={booking.status} />}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Photo src={pg.images[0]} alt={pg.name} className="h-32 w-full rounded-lg sm:w-48" />
              <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Info k="Booking ID" v={booking.id.toUpperCase()} />
                <Info k="PG" v={pg.name} />
                <Info k="Room / Bed" v={`Room ${booking.roomNo} · Bed ${booking.bedNo}`} />
                <Info k="Room type" v={`${room?.type}${room?.ac ? ' · AC' : ''}`} />
                <Info k="Booked on" v={fmtDate(booking.bookedOn)} />
                <Info k="Move-in date" v={fmtDate(booking.moveInDate)} />
                <Info k="Monthly rent" v={inr(booking.rent)} />
                <Info k="Amount paid" v={inr(lastPayment?.amount)} />
              </dl>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" />{pg.address}, {pg.city}</div>
          </Card>
          <Card title="Booking progress">
            <ol className="space-y-4">
              {steps.map((s) => (
                <li key={s.label} className="flex gap-3">
                  {s.done ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" /> : <Clock className="size-5 shrink-0 text-amber-500" />}
                  <div>
                    <div className={`text-sm font-medium ${s.done ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.date ? fmtDate(s.date) : 'Pending'}</div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-5 border-t border-border pt-4 text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Owner contact</div>
              <div className="mt-1 font-medium text-foreground">{owner?.name}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="size-3" />{pg.phone}</div>
            </div>
          </Card>
        </div>
      </>
    );
  }

  const openC = complaints.filter((c) => c.status !== 'resolved');
  const myReview = db.reviews.find((r) => r.pgId === pg.id && r.userId === user.id);
  const rating = pgRating(db, pg.id);

  return (
    <>
      <PageHeader
        title={`Hi ${first} 👋`}
        subtitle={`${pg.name} · ${pg.locality}, ${pg.city}`}
        actions={<div className="flex flex-wrap gap-2">
          {booking.status === 'allocated' ? (
            <button
              className="btn-outline text-red-600"
              onClick={() => {
                if (!window.confirm('Send a vacancy request to the PG owner? The bed will remain assigned until the owner confirms you have moved out.')) return;
                requestVacate(booking.id, user.id);
                toast('Vacancy request sent to the PG owner');
              }}
            ><Vacate className="size-4" /> Vacate</button>
          ) : (
            <StatusBadge status="vacate_requested" />
          )}
          <button className="btn bg-tenant text-white hover:bg-cyan-600" onClick={() => setPayOpen(true)}><CreditCard className="size-4" /> Pay rent</button>
        </div>}
      />

      {booking.status === 'vacate_requested' && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Your vacancy request has been sent to the PG owner. The bed will be made available to another resident after the owner confirms you have moved out.
        </div>
      )}

      {due.status !== 'paid' && (
        <div className={`mb-5 rounded-xl border p-4 text-sm ${due.status === 'overdue' ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200' : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'}`}>
          {due.status === 'overdue' ? `Rent of ${inr(booking.rent)} is overdue by ${-due.days} days.` : `Rent of ${inr(booking.rent)} is due in ${due.days} days (${fmtDate(booking.paidUntil)}).`}{' '}
          <button className="font-semibold underline" onClick={() => setPayOpen(true)}>Pay now</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Room / Bed" value={`${booking.roomNo} · ${booking.bedNo}`} hint={`${room?.type}${room?.ac ? ' · AC' : ''}`} icon={BedDouble} />
        <StatTile label="Monthly fee" value={inr(booking.rent)} hint={`Deposit ${inr(booking.deposit)}`} icon={IndianRupee} tone="purple" />
        <StatTile label="Last paid" value={inr(lastPayment?.amount)} hint={fmtDate(lastPayment?.date)} icon={CheckCircle2} tone="good" />
        <StatTile label="Next due date" value={fmtDate(booking.paidUntil)} hint={due.status === 'overdue' ? `Overdue by ${-due.days} days` : `In ${due.days} days`} icon={CalendarClock} tone={due.status === 'overdue' ? 'bad' : due.status === 'due-soon' ? 'warn' : 'default'} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title="Today's food menu" actions={<Link to="/user/food" className="text-xs font-semibold text-primary">Full week →</Link>} className="lg:col-span-1">
          {['breakfast', 'lunch', 'dinner'].map((m) => (
            <div key={m} className="flex items-start justify-between gap-3 border-b border-border/70 py-2.5 first:pt-0 last:border-0 last:pb-0">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{m}</span>
              <span className="text-right text-sm text-foreground">{today?.[m] || '—'}</span>
            </div>
          ))}
        </Card>

        <Card title="My stay" className="lg:col-span-1">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Info k="Status" v={<StatusBadge status="allocated" />} />
            <Info k="Allocated on" v={fmtDate(booking.allocatedOn)} />
            <Info k="Move-in" v={fmtDate(booking.moveInDate)} />
            <Info k="Floor" v={room?.floor} />
            <Info k="Owner" v={findUser(db, pg.ownerId)?.name} />
            <Info k="Contact" v={pg.phone} />
          </dl>
        </Card>

        <Card title="Complaints" actions={<Link to="/user/complaints" className="text-xs font-semibold text-primary">View all →</Link>}>
          {openC.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open complaints 🎉</p>
          ) : (
            <ul className="space-y-3">
              {openC.slice(0, 3).map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.category} · {fmtDate(c.createdAt)}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent payments" actions={<Link to="/user/payments" className="text-xs font-semibold text-primary">History →</Link>} className="lg:col-span-2" bodyClass="p-0">
          <PaymentTable rows={payments.slice(0, 4)} />
        </Card>

        <Card title="Your rating" actions={<Link to="/user/ratings" className="text-xs font-semibold text-primary">{myReview ? 'Edit' : 'Rate now'} →</Link>}>
          <div className="text-sm text-muted-foreground">PG average</div>
          <div className="flex items-center gap-2"><span className="text-2xl font-semibold text-foreground">{rating.avg.toFixed(1)}</span><Stars value={rating.avg} /></div>
          <div className="mt-3 text-sm text-muted-foreground">Your rating</div>
          {myReview ? (
            <>
              <Stars value={myReview.rating} />
              <p className="mt-1 text-sm text-foreground">“{myReview.comment}”</p>
            </>
          ) : (
            <p className="text-sm text-foreground">You haven't rated this PG yet.</p>
          )}
        </Card>
      </div>

      <PayRentModal open={payOpen} onClose={() => setPayOpen(false)} booking={booking} />
    </>
  );
}

function Info({ k, v }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{k}</dt>
      <dd className="mt-0.5 truncate font-medium text-foreground">{v ?? '—'}</dd>
    </div>
  );
}

function PaymentTable({ rows }) {
  return (
    <Table
      rows={rows}
      empty="No payments yet"
      columns={[
        { label: 'Date', render: (p) => fmtDate(p.date) },
        { label: 'Type', key: 'type' },
        { label: 'Amount', render: (p) => <span className="font-semibold">{inr(p.amount)}</span> },
        { label: 'Method', key: 'method' },
        { label: 'Txn ID', render: (p) => <span className="font-mono text-xs">{p.txnId}</span> },
        { label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
      ]}
    />
  );
}

function PayRentModal({ open, onClose, booking }) {
  const [method, setMethod] = useState('UPI');
  const [busy, setBusy] = useState(false);
  const pay = () => {
    setBusy(true);
    setTimeout(() => {
      payRent(booking.id, method);
      setBusy(false);
      onClose();
      toast(`Rent of ${inr(booking.rent)} paid successfully`);
    }, 1200);
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pay monthly rent"
      footer={
        <>
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-success" disabled={busy} onClick={pay}>{busy ? 'Processing…' : `Pay ${inr(booking.rent)}`}</button>
        </>
      }
    >
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Rent period</dt><dd className="font-medium text-foreground">{fmtDate(booking.paidUntil)} – 30 days</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Amount</dt><dd className="font-semibold text-foreground">{inr(booking.rent)}</dd></div>
      </dl>
      <label className="label mt-4">Payment method</label>
      <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
        <option>UPI</option>
        <option>Card</option>
        <option>Net Banking</option>
      </select>
      <p className="mt-3 text-xs text-muted-foreground">Demo payment: nothing is charged.</p>
    </Modal>
  );
}

// ------------------------------------------------------------------ Payments
function Payments() {
  const { booking, payments } = useMyBooking();
  const [payOpen, setPayOpen] = useState(false);
  const total = payments.reduce((a, p) => a + p.amount, 0);
  const due = dueInfo(booking.paidUntil);
  const allocated = booking.status === 'allocated';
  return (
    <>
      <PageHeader
        title="Fees & Payments"
        subtitle="Your rent, deposit and full payment history"
        actions={allocated && <button className="btn bg-tenant text-white hover:bg-cyan-600" onClick={() => setPayOpen(true)}><CreditCard className="size-4" /> Pay rent</button>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Monthly rent" value={inr(booking.rent)} icon={IndianRupee} />
        <StatTile label="Security deposit" value={inr(booking.deposit)} hint="Refundable" tone="purple" />
        <StatTile label="Previous payment" value={inr(payments[0]?.amount)} hint={fmtDate(payments[0]?.date)} tone="good" />
        <StatTile label="Next due" value={fmtDate(booking.paidUntil)} hint={<StatusBadge status={due.status} />} tone={due.status === 'overdue' ? 'bad' : 'warn'} />
      </div>
      <Card title={`Payment history · Total paid ${inr(total)}`} className="mt-5" bodyClass="p-0">
        <PaymentTable rows={payments} />
      </Card>
      <PayRentModal open={payOpen} onClose={() => setPayOpen(false)} booking={booking} />
    </>
  );
}

// ------------------------------------------------------------------ Food
function Food() {
  const { pg } = useMyBooking();
  return (
    <>
      <PageHeader title="Food Menu" subtitle={`Weekly menu at ${pg.name}. Today is highlighted.`} />
      <Card bodyClass="p-0"><FoodMenuTable menu={pg.foodMenu} /></Card>
      <p className="mt-3 text-xs text-muted-foreground">Timings: Breakfast 7:30–9:30 AM · Lunch 12:30–2:00 PM · Dinner 8:00–10:00 PM</p>
    </>
  );
}

// ------------------------------------------------------------------ Complaints
const CATEGORIES = ['Wi-Fi / Internet', 'Food', 'Plumbing', 'Electrical', 'Housekeeping', 'Security', 'Roommate', 'Other'];

function Complaints() {
  const { user, booking, complaints } = useMyBooking();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: CATEGORIES[0], title: '', description: '' });
  const submit = (e) => {
    e.preventDefault();
    addComplaint({ ...form, bookingId: booking.id, userId: user.id, pgId: booking.pgId });
    setForm({ category: CATEGORIES[0], title: '', description: '' });
    setOpen(false);
    toast('Complaint raised. The owner has been notified.');
  };
  return (
    <>
      <PageHeader
        title="Complaints"
        subtitle="Raise an issue and track its status"
        actions={<button className="btn bg-tenant text-white hover:bg-cyan-600" onClick={() => setOpen(true)}><Plus className="size-4" /> Raise complaint</button>}
      />
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Open" value={complaints.filter((c) => c.status === 'open').length} tone="bad" />
        <StatTile label="In progress" value={complaints.filter((c) => c.status === 'in-progress').length} tone="warn" />
        <StatTile label="Resolved" value={complaints.filter((c) => c.status === 'resolved').length} tone="good" />
      </div>
      <div className="mt-5 space-y-3">
        {complaints.length === 0 && <div className="card"><EmptyState icon={MessageSquareWarning} title="No complaints raised" /></div>}
        {complaints.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-foreground">{c.title}</div>
                <div className="text-xs text-muted-foreground">{c.category} · Raised {fmtDate(c.createdAt)} · #{c.id.toUpperCase()}</div>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
            {c.reply && (
              <div className="mt-3 rounded-lg border-l-4 border-owner bg-muted/60 px-3 py-2 text-sm">
                <span className="font-semibold text-foreground">Owner: </span>
                <span className="text-muted-foreground">{c.reply}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Raise a complaint"
        footer={<><button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary" form="cmp-form">Submit</button></>}
      >
        <form id="cmp-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
        </form>
      </Modal>
    </>
  );
}

// ------------------------------------------------------------------ Ratings
function Ratings() {
  const { user, pg, db } = useMyBooking();
  const mine = db.reviews.find((r) => r.pgId === pg.id && r.userId === user.id);
  const [rating, setRating] = useState(mine?.rating || 0);
  const [comment, setComment] = useState(mine?.comment || '');
  const all = db.reviews.filter((r) => r.pgId === pg.id).sort((a, b) => b.date.localeCompare(a.date));
  const avg = pgRating(db, pg.id);
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: all.filter((r) => r.rating === n).length }));

  const submit = (e) => {
    e.preventDefault();
    if (!rating) return toast('Please select a star rating', 'error');
    upsertReview({ pgId: pg.id, userId: user.id, userName: user.name, rating, comment });
    toast('Thanks for your feedback!');
  };

  return (
    <>
      <PageHeader title="Ratings & Reviews" subtitle={`Rate your stay at ${pg.name}`} />
      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card title="Overall rating">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-foreground">{avg.avg.toFixed(1)}</div>
              <div><Stars value={avg.avg} /><div className="text-xs text-muted-foreground">{avg.count} reviews</div></div>
            </div>
            <div className="mt-4 space-y-1.5">
              {dist.map(({ n, c }) => (
                <div key={n} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-3">{n}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-amber-400" style={{ width: `${all.length ? (c / all.length) * 100 : 0}%` }} /></div>
                  <span className="w-4 text-right">{c}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title={mine ? 'Update your review' : 'Write a review'}>
            <form onSubmit={submit} className="space-y-3">
              <Stars value={rating} size="size-7" onChange={setRating} />
              <textarea className="input" rows={4} placeholder="How is the food, cleanliness, Wi-Fi, staff…" value={comment} onChange={(e) => setComment(e.target.value)} required />
              <button className="btn bg-tenant text-white hover:bg-cyan-600">{mine ? 'Update review' : 'Submit review'}</button>
            </form>
          </Card>
        </div>
        <Card title="What residents say"><ReviewList reviews={all} /></Card>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Profile
function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', occupation: user.occupation || '', company: user.company || '', address: user.address || '', emergencyName: user.emergencyName || '', emergencyPhone: user.emergencyPhone || '' });
  const [pw, setPw] = useState({ current: '', next: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = (e) => {
    e.preventDefault();
    updateUser(user.id, form);
    toast('Profile updated');
  };
  const changePw = (e) => {
    e.preventDefault();
    if (pw.current !== user.password) return toast('Current password is incorrect', 'error');
    if (pw.next.length < 6) return toast('New password must be at least 6 characters', 'error');
    updateUser(user.id, { password: pw.next });
    setPw({ current: '', next: '' });
    toast('Password changed');
  };
  const fields = [['Full name', 'name'], ['Phone', 'phone'], ['Occupation', 'occupation'], ['Company / College', 'company'], ['Emergency contact', 'emergencyName'], ['Emergency phone', 'emergencyPhone']];
  return (
    <>
      <PageHeader title="My Profile" subtitle={user.email} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card title="Personal details">
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {fields.map(([l, k]) => (
              <div key={k}><label className="label">{l}</label><input className="input" value={form[k]} onChange={set(k)} /></div>
            ))}
            <div className="sm:col-span-2"><label className="label">Address</label><textarea className="input" rows={2} value={form.address} onChange={set('address')} /></div>
            <div className="text-xs text-muted-foreground sm:col-span-2">ID proof: {user.idType} · {user.idNumber} (verified)</div>
            <div><button className="btn bg-tenant text-white hover:bg-cyan-600">Save changes</button></div>
          </form>
        </Card>
        <Card title="Change password">
          <form onSubmit={changePw} className="space-y-3">
            <div><label className="label">Current password</label><input type="password" className="input" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></div>
            <div><label className="label">New password</label><input type="password" className="input" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></div>
            <button className="btn-outline">Update password</button>
          </form>
        </Card>
      </div>
    </>
  );
}
