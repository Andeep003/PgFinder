import React, { useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { BedDouble, Building2, CalendarCheck, IndianRupee, LayoutDashboard, MessageSquareWarning, Settings, UserCog, Users, Wallet } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, EmptyState, Modal, PageHeader, Photo, StatTile, StatusBadge, Table, toast } from '../../components/ui';
import { useDB, findUser, findPg, pgStats, pgRating, updateUser, setPgStatus, setSettings, resetDemoData } from '../../store/db';
import { fmtDate, inr } from '../../utils/format';

export default function SuperAdminPortal() {
  const db = useDB();
  const pendingOwners = db.users.filter((u) => u.role === 'owner' && u.status === 'pending').length;
  const pendingPgs = db.pgs.filter((p) => p.status === 'pending').length;
  const nav = [
    { to: '/super-admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/super-admin/owners', label: 'PG Owners', icon: UserCog, badge: pendingOwners },
    { to: '/super-admin/pgs', label: 'PG Listings', icon: Building2, badge: pendingPgs },
    { to: '/super-admin/residents', label: 'Residents', icon: Users },
    { to: '/super-admin/bookings', label: 'Bookings', icon: CalendarCheck },
    { to: '/super-admin/payments', label: 'Payments', icon: Wallet },
    { to: '/super-admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
    { to: '/super-admin/settings', label: 'Settings', icon: Settings },
  ];
  return (
    <DashboardLayout role="superadmin" nav={nav}>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="owners" element={<Owners />} />
        <Route path="pgs" element={<PGs />} />
        <Route path="residents" element={<Residents />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="payments" element={<Payments />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/super-admin" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

function Dashboard() {
  const db = useDB();
  const owners = db.users.filter((u) => u.role === 'owner');
  const residents = db.users.filter((u) => u.role === 'user');
  const beds = db.pgs.reduce((a, p) => { const s = pgStats(p); return { t: a.t + s.totalBeds, o: a.o + s.occupied + s.booked }; }, { t: 0, o: 0 });
  const gmv = db.payments.reduce((a, p) => a + p.amount, 0);
  const commission = Math.round((gmv * db.settings.commissionPercent) / 100);
  const byCity = Object.entries(db.pgs.reduce((acc, p) => ({ ...acc, [p.city]: (acc[p.city] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const maxCity = Math.max(1, ...byCity.map(([, n]) => n));
  const recent = [...db.bookings].filter((b) => b.status !== 'payment_pending').sort((a, b) => b.bookedOn.localeCompare(a.bookedOn)).slice(0, 6);

  // Last 6 months of collections, for a simple bar chart.
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    const key = d.toISOString().slice(0, 7);
    return { key, label: d.toLocaleString('en-IN', { month: 'short' }), amount: db.payments.filter((p) => p.date.startsWith(key)).reduce((a, p) => a + p.amount, 0) };
  });
  const maxM = Math.max(1, ...months.map((m) => m.amount));

  return (
    <>
      <PageHeader title="Platform overview" subtitle="All owners, PGs, residents and transactions" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="PG owners" value={owners.length} hint={`${owners.filter((o) => o.status === 'pending').length} pending approval`} icon={UserCog} />
        <StatTile label="PG listings" value={db.pgs.length} hint={`${db.pgs.filter((p) => p.status === 'pending').length} pending review`} icon={Building2} tone="purple" />
        <StatTile label="Residents" value={residents.length} hint={`${db.bookings.filter((b) => b.status === 'allocated').length} currently staying`} icon={Users} tone="good" />
        <StatTile label="Bed occupancy" value={`${beds.t ? Math.round((beds.o / beds.t) * 100) : 0}%`} hint={`${beds.o} of ${beds.t} beds`} icon={BedDouble} tone="warn" />
        <StatTile label="Total collections (GMV)" value={inr(gmv)} icon={IndianRupee} tone="good" />
        <StatTile label={`Platform commission (${db.settings.commissionPercent}%)`} value={inr(commission)} icon={Wallet} tone="good" />
        <StatTile label="Bookings" value={db.bookings.filter((b) => b.status !== 'payment_pending').length} icon={CalendarCheck} />
        <StatTile label="Open complaints" value={db.complaints.filter((c) => c.status !== 'resolved').length} icon={MessageSquareWarning} tone="bad" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title="Collections · last 6 months" className="lg:col-span-2">
          <div className="flex h-48 items-end gap-3">
            {months.map((m) => (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{m.amount ? `₹${Math.round(m.amount / 1000)}k` : ''}</span>
                <div className="w-full max-w-[48px] rounded-t-md bg-primary" style={{ height: `${Math.max(2, (m.amount / maxM) * 150)}px` }} />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="PGs by city">
          <div className="space-y-3">
            {byCity.map(([city, n]) => (
              <div key={city}>
                <div className="flex justify-between text-sm"><span className="text-foreground">{city}</span><span className="tabular-nums text-muted-foreground">{n}</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(n / maxCity) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Latest bookings" className="lg:col-span-3" actions={<Link to="/super-admin/bookings" className="text-xs font-semibold text-primary">View all →</Link>} bodyClass="p-0">
          <BookingTable rows={recent} />
        </Card>
      </div>
    </>
  );
}

function BookingTable({ rows }) {
  const db = useDB();
  return (
    <Table
      rows={rows}
      columns={[
        { label: 'Booking', render: (b) => <span className="font-mono text-xs">{b.id.toUpperCase()}</span> },
        { label: 'Resident', render: (b) => findUser(db, b.userId)?.name },
        { label: 'PG', render: (b) => findPg(db, b.pgId)?.name },
        { label: 'Owner', render: (b) => findUser(db, findPg(db, b.pgId)?.ownerId)?.name },
        { label: 'Room / Bed', render: (b) => `${b.roomNo} / ${b.bedNo}` },
        { label: 'Booked', render: (b) => fmtDate(b.bookedOn) },
        { label: 'Rent', render: (b) => inr(b.rent) },
        { label: 'Status', render: (b) => <StatusBadge status={b.status} label={b.status === 'booked' ? 'Booked' : undefined} /> },
      ]}
    />
  );
}

function Owners() {
  const db = useDB();
  const [filter, setFilter] = useState('all');
  const owners = db.users.filter((u) => u.role === 'owner' && (filter === 'all' || u.status === filter));
  return (
    <>
      <PageHeader
        title="PG Owners"
        subtitle="Approve new owners and manage access"
        actions={<select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All</option><option value="pending">Pending</option><option value="active">Active</option><option value="disabled">Disabled</option></select>}
      />
      <Card bodyClass="p-0">
        <Table
          rows={owners}
          columns={[
            { label: 'Owner', render: (u) => <div><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></div> },
            { label: 'Phone', key: 'phone' },
            { label: 'PGs', render: (u) => db.pgs.filter((p) => p.ownerId === u.id).length },
            { label: 'Beds', render: (u) => db.pgs.filter((p) => p.ownerId === u.id).reduce((a, p) => a + pgStats(p).totalBeds, 0) },
            { label: 'Collections', render: (u) => { const ids = new Set(db.pgs.filter((p) => p.ownerId === u.id).map((p) => p.id)); return inr(db.payments.filter((p) => ids.has(p.pgId)).reduce((a, p) => a + p.amount, 0)); } },
            { label: 'Joined', render: (u) => fmtDate(u.createdAt) },
            { label: 'Status', render: (u) => <StatusBadge status={u.status} /> },
            {
              label: 'Actions',
              render: (u) => (
                <div className="flex gap-1.5">
                  {u.status !== 'active' && <button className="btn-success h-8 px-3 text-xs" onClick={() => { updateUser(u.id, { status: 'active' }); toast(`${u.name} activated`); }}>{u.status === 'pending' ? 'Approve' : 'Enable'}</button>}
                  {u.status !== 'disabled' && <button className="btn-outline h-8 px-3 text-xs text-red-600" onClick={() => { updateUser(u.id, { status: 'disabled' }); toast(`${u.name} disabled`, 'info'); }}>{u.status === 'pending' ? 'Reject' : 'Disable'}</button>}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}

function PGs() {
  const db = useDB();
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState(null);
  const rows = db.pgs.filter((p) => filter === 'all' || p.status === filter);
  return (
    <>
      <PageHeader
        title="PG Listings"
        subtitle="Review and approve listings before they go public"
        actions={<select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>}
      />
      <Card bodyClass="p-0">
        <Table
          rows={rows}
          columns={[
            { label: 'PG', render: (p) => <button className="flex items-center gap-3 text-left" onClick={() => setView(p)}><Photo src={p.images[0]} alt="" className="h-10 w-14 rounded-md" /><div><div className="font-medium text-primary">{p.name}</div><div className="text-xs text-muted-foreground">{p.gender} · {p.locality}, {p.city}</div></div></button> },
            { label: 'Owner', render: (p) => findUser(db, p.ownerId)?.name },
            { label: 'Rooms', render: (p) => p.rooms.length },
            { label: 'Beds (free)', render: (p) => { const s = pgStats(p); return `${s.totalBeds} (${s.available})`; } },
            { label: 'Rent', render: (p) => { const s = pgStats(p); return s.totalBeds ? `${inr(s.minRent)} – ${inr(s.maxRent)}` : '—'; } },
            { label: 'Rating', render: (p) => { const r = pgRating(db, p.id); return r.count ? `${r.avg.toFixed(1)} ★ (${r.count})` : '—'; } },
            { label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
            {
              label: 'Actions',
              render: (p) => (
                <div className="flex gap-1.5">
                  {p.status !== 'approved' && <button className="btn-success h-8 px-3 text-xs" onClick={() => { setPgStatus(p.id, 'approved'); toast(`${p.name} is now live`); }}>Approve</button>}
                  {p.status !== 'rejected' && <button className="btn-outline h-8 px-3 text-xs text-red-600" onClick={() => { setPgStatus(p.id, 'rejected'); toast(`${p.name} hidden from search`, 'info'); }}>{p.status === 'approved' ? 'Suspend' : 'Reject'}</button>}
                </div>
              ),
            },
          ]}
        />
      </Card>
      {view && (
        <Modal open wide title={view.name} onClose={() => setView(null)}>
          <div className="grid grid-cols-3 gap-2">{view.images.slice(0, 6).map((src, i) => <Photo key={i} src={src} alt="" className="h-24 w-full rounded-lg" />)}</div>
          <p className="mt-4 text-sm text-muted-foreground">{view.description}</p>
          <div className="mt-3 text-sm"><b>Address:</b> {view.address}, {view.locality}, {view.city}</div>
          <div className="mt-1 text-sm"><b>Amenities:</b> {view.amenities.join(', ')}</div>
          <div className="mt-1 text-sm"><b>Owner:</b> {findUser(db, view.ownerId)?.name} · {view.phone}</div>
          <Link to={`/pg/${view.id}`} className="btn-outline mt-4">Open public page</Link>
        </Modal>
      )}
    </>
  );
}

function Residents() {
  const db = useDB();
  const [q, setQ] = useState('');
  const rows = db.users.filter((u) => u.role === 'user' && `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Residents" subtitle="Everyone who has registered on the platform" actions={<input className="input w-64" placeholder="Search name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} />} />
      <Card bodyClass="p-0">
        <Table
          rows={rows}
          columns={[
            { label: 'Resident', render: (u) => <div><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></div> },
            { label: 'Phone', key: 'phone' },
            { label: 'Occupation', render: (u) => `${u.occupation || '—'}${u.company ? ` · ${u.company}` : ''}` },
            { label: 'Current PG', render: (u) => { const b = db.bookings.find((x) => x.userId === u.id && ['booked', 'allocated'].includes(x.status)); return b ? `${findPg(db, b.pgId)?.name} (${b.roomNo}/${b.bedNo})` : '—'; } },
            { label: 'Booking', render: (u) => { const b = db.bookings.find((x) => x.userId === u.id && ['booked', 'allocated'].includes(x.status)); return b ? <StatusBadge status={b.status} label={b.status === 'booked' ? 'Booked' : undefined} /> : '—'; } },
            { label: 'Joined', render: (u) => fmtDate(u.createdAt) },
            { label: 'Account', render: (u) => <button onClick={() => updateUser(u.id, { status: u.status === 'active' ? 'disabled' : 'active' })} title="Toggle"><StatusBadge status={u.status} /></button> },
          ]}
        />
      </Card>
    </>
  );
}

function Bookings() {
  const db = useDB();
  const [status, setStatus] = useState('all');
  const rows = db.bookings.filter((b) => b.status !== 'payment_pending' && (status === 'all' || b.status === status)).sort((a, b) => b.bookedOn.localeCompare(a.bookedOn));
  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="All bookings across the platform"
        actions={<select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All</option><option value="booked">Awaiting allocation</option><option value="allocated">Allocated</option><option value="cancelled">Cancelled</option><option value="vacated">Vacated</option></select>}
      />
      <Card bodyClass="p-0"><BookingTable rows={rows} /></Card>
    </>
  );
}

function Payments() {
  const db = useDB();
  const rows = [...db.payments].sort((a, b) => b.date.localeCompare(a.date));
  const gmv = rows.reduce((a, p) => a + p.amount, 0);
  const pct = db.settings.commissionPercent;
  return (
    <>
      <PageHeader title="Payments" subtitle="All transactions and platform commission" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label="Total GMV" value={inr(gmv)} tone="good" />
        <StatTile label={`Commission (${pct}%)`} value={inr(Math.round((gmv * pct) / 100))} />
        <StatTile label="Transactions" value={rows.length} tone="purple" />
      </div>
      <Card bodyClass="p-0">
        <Table
          rows={rows}
          columns={[
            { label: 'Date', render: (p) => fmtDate(p.date) },
            { label: 'Resident', render: (p) => findUser(db, p.userId)?.name },
            { label: 'PG', render: (p) => findPg(db, p.pgId)?.name },
            { label: 'Type', key: 'type' },
            { label: 'Method', key: 'method' },
            { label: 'Txn ID', render: (p) => <span className="font-mono text-xs">{p.txnId}</span> },
            { label: 'Amount', render: (p) => <b>{inr(p.amount)}</b> },
            { label: 'Commission', render: (p) => inr(Math.round((p.amount * pct) / 100)) },
          ]}
        />
      </Card>
    </>
  );
}

function Complaints() {
  const db = useDB();
  const rows = [...db.complaints].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Complaints" subtitle="Monitor complaint resolution across all PGs" />
      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatTile label="Open" value={rows.filter((c) => c.status === 'open').length} tone="bad" />
        <StatTile label="In progress" value={rows.filter((c) => c.status === 'in-progress').length} tone="warn" />
        <StatTile label="Resolved" value={rows.filter((c) => c.status === 'resolved').length} tone="good" />
      </div>
      <Card bodyClass="p-0">
        {rows.length === 0 ? <EmptyState title="No complaints" /> : (
          <Table
            rows={rows}
            columns={[
              { label: 'Date', render: (c) => fmtDate(c.createdAt) },
              { label: 'Title', render: (c) => <div className="max-w-xs whitespace-normal"><div className="font-medium">{c.title}</div><div className="text-xs text-muted-foreground">{c.category}</div></div> },
              { label: 'Resident', render: (c) => findUser(db, c.userId)?.name },
              { label: 'PG', render: (c) => findPg(db, c.pgId)?.name },
              { label: 'Owner', render: (c) => findUser(db, findPg(db, c.pgId)?.ownerId)?.name },
              { label: 'Status', render: (c) => <StatusBadge status={c.status} /> },
            ]}
          />
        )}
      </Card>
    </>
  );
}

function SettingsPage() {
  const db = useDB();
  const [pct, setPct] = useState(db.settings.commissionPercent);
  return (
    <>
      <PageHeader title="Settings" subtitle="Platform configuration" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Commission">
          <label className="label">Platform commission on payments (%)</label>
          <div className="flex gap-2">
            <input type="number" min={0} max={30} className="input w-32" value={pct} onChange={(e) => setPct(e.target.value)} />
            <button className="btn-primary" onClick={() => { setSettings({ commissionPercent: Number(pct) }); toast('Settings saved'); }}>Save</button>
          </div>
        </Card>
        <Card title="Demo data">
          <p className="mb-3 text-sm text-muted-foreground">Restore all sample PGs, users, bookings and payments to their original state.</p>
          <button className="btn-danger" onClick={() => { if (window.confirm('Reset all demo data?')) { resetDemoData(); toast('Demo data reset', 'info'); } }}>Reset demo data</button>
        </Card>
      </div>
    </>
  );
}
