import React, { useMemo, useState } from 'react';
import { Navigate, Route, Routes, Link } from 'react-router-dom';
import {
  BedDouble, Building2, CalendarCheck, Crosshair, ImagePlus, IndianRupee, LayoutDashboard, MessageSquareWarning,
  Pencil, Plus, Star, Trash2, Users, Utensils, Wallet, X, CheckCircle2, XCircle, LogOut as Vacate,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, EmptyState, Modal, PageHeader, Photo, StatTile, StatusBadge, Table, toast } from '../../components/ui';
import { BedLegend, ReviewList } from '../../components/pg';
import { useAuth } from '../../store/auth';
import {
  useDB, findUser, findPg, pgStats, pgRating, savePg, deletePg, setBookingStatus, setBedStatus,
  updateComplaint, recordManualPayment,
} from '../../store/db';
import { AMENITIES, DEFAULT_FOOD_MENU } from '../../data/seed';
import { compressImage, fmtDate, inr, WEEKDAYS } from '../../utils/format';
import { getCurrentPosition } from '../../utils/geo';
import { dueInfo } from '../user/UserPortal';

function useOwnerData() {
  const { user } = useAuth();
  const db = useDB();
  return useMemo(() => {
    const pgs = db.pgs.filter((p) => p.ownerId === user.id);
    const ids = new Set(pgs.map((p) => p.id));
    const bookings = db.bookings.filter((b) => ids.has(b.pgId) && b.status !== 'payment_pending');
    const payments = db.payments.filter((p) => ids.has(p.pgId)).sort((a, b) => b.date.localeCompare(a.date));
    const complaints = db.complaints.filter((c) => ids.has(c.pgId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const reviews = db.reviews.filter((r) => ids.has(r.pgId)).sort((a, b) => b.date.localeCompare(a.date));
    return { db, user, pgs, bookings, payments, complaints, reviews };
  }, [db, user]);
}

export default function OwnerPortal() {
  const { bookings, complaints } = useOwnerData();
  const nav = [
    { to: '/owner', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/owner/pgs', label: 'My PGs', icon: Building2 },
    { to: '/owner/rooms', label: 'Rooms & Beds', icon: BedDouble },
    { to: '/owner/bookings', label: 'Bookings', icon: CalendarCheck, badge: bookings.filter((b) => b.status === 'booked').length },
    { to: '/owner/tenants', label: 'Residents', icon: Users },
    { to: '/owner/payments', label: 'Payments', icon: Wallet },
    { to: '/owner/complaints', label: 'Complaints', icon: MessageSquareWarning, badge: complaints.filter((c) => c.status === 'open').length },
    { to: '/owner/food', label: 'Food Menu', icon: Utensils },
    { to: '/owner/reviews', label: 'Reviews', icon: Star },
  ];
  return (
    <DashboardLayout role="owner" nav={nav}>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="pgs" element={<MyPGs />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="payments" element={<Payments />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="food" element={<FoodMenu />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="*" element={<Navigate to="/owner" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

const ownerBtn = 'btn bg-owner text-white hover:bg-violet-700';

function PgFilter({ pgs, value, onChange, allowAll = true }) {
  return (
    <select className="input w-auto min-w-[200px]" value={value} onChange={(e) => onChange(e.target.value)}>
      {allowAll && <option value="all">All PGs</option>}
      {pgs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}

// ------------------------------------------------------------------ Dashboard
function Dashboard() {
  const { db, user, pgs, bookings, payments, complaints } = useOwnerData();
  const totals = pgs.reduce(
    (a, p) => {
      const s = pgStats(p);
      return { beds: a.beds + s.totalBeds, occ: a.occ + s.occupied, free: a.free + s.available, booked: a.booked + s.booked };
    },
    { beds: 0, occ: 0, free: 0, booked: 0 },
  );
  const month = new Date().toISOString().slice(0, 7);
  const monthRevenue = payments.filter((p) => p.date.startsWith(month)).reduce((a, p) => a + p.amount, 0);
  const pending = bookings.filter((b) => b.status === 'booked');
  const overdue = bookings.filter((b) => b.status === 'allocated' && dueInfo(b.paidUntil).status === 'overdue');
  const occPct = totals.beds ? Math.round(((totals.occ + totals.booked) / totals.beds) * 100) : 0;

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(' ')[0]}`} subtitle="Overview of all your PGs" actions={<Link to="/owner/pgs" className={ownerBtn}><Plus className="size-4" /> Add PG</Link>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="PGs" value={pgs.length} hint={`${pgs.filter((p) => p.status === 'pending').length} pending approval`} icon={Building2} tone="purple" />
        <StatTile label="Occupancy" value={`${occPct}%`} hint={`${totals.occ + totals.booked} of ${totals.beds} beds`} icon={BedDouble} />
        <StatTile label="Available beds" value={totals.free} icon={BedDouble} tone="good" />
        <StatTile label="Revenue this month" value={inr(monthRevenue)} icon={IndianRupee} tone="good" />
        <StatTile label="Pending allocations" value={pending.length} tone="warn" icon={CalendarCheck} />
        <StatTile label="Rent overdue" value={overdue.length} tone="bad" icon={Wallet} />
        <StatTile label="Open complaints" value={complaints.filter((c) => c.status !== 'resolved').length} tone="bad" icon={MessageSquareWarning} />
        <StatTile label="Residents" value={bookings.filter((b) => b.status === 'allocated').length} icon={Users} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="New bookings awaiting allocation" actions={<Link to="/owner/bookings" className="text-xs font-semibold text-owner">Manage →</Link>} bodyClass="p-0">
          <Table
            rows={pending}
            empty="No pending bookings"
            columns={[
              { label: 'Resident', render: (b) => findUser(db, b.userId)?.name },
              { label: 'PG', render: (b) => findPg(db, b.pgId)?.name },
              { label: 'Room/Bed', render: (b) => `${b.roomNo} / ${b.bedNo}` },
              { label: 'Move-in', render: (b) => fmtDate(b.moveInDate) },
              { label: '', render: (b) => <button className="btn-success h-8 px-3 text-xs" onClick={() => { setBookingStatus(b.id, 'allocated'); toast('Bed allocated'); }}>Allocate</button> },
            ]}
          />
        </Card>
        <Card title="PG occupancy">
          <div className="space-y-4">
            {pgs.map((p) => {
              const s = pgStats(p);
              const pct = s.totalBeds ? ((s.occupied + s.booked) / s.totalBeds) * 100 : 0;
              return (
                <div key={p.id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="text-muted-foreground">{s.occupied + s.booked}/{s.totalBeds} beds</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-owner" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {pgs.length === 0 && <p className="text-sm text-muted-foreground">Add your first PG to get started.</p>}
          </div>
        </Card>
        <Card title="Recent complaints" actions={<Link to="/owner/complaints" className="text-xs font-semibold text-owner">View all →</Link>} bodyClass="p-0">
          <Table
            rows={complaints.slice(0, 5)}
            columns={[
              { label: 'Title', key: 'title' },
              { label: 'Resident', render: (c) => findUser(db, c.userId)?.name },
              { label: 'Date', render: (c) => fmtDate(c.createdAt) },
              { label: 'Status', render: (c) => <StatusBadge status={c.status} /> },
            ]}
          />
        </Card>
        <Card title="Recent payments" actions={<Link to="/owner/payments" className="text-xs font-semibold text-owner">View all →</Link>} bodyClass="p-0">
          <Table
            rows={payments.slice(0, 5)}
            columns={[
              { label: 'Date', render: (p) => fmtDate(p.date) },
              { label: 'Resident', render: (p) => findUser(db, p.userId)?.name },
              { label: 'Type', key: 'type' },
              { label: 'Amount', render: (p) => <b>{inr(p.amount)}</b> },
            ]}
          />
        </Card>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ My PGs
const blankPg = (ownerId) => ({
  ownerId, name: '', gender: 'Boys', address: '', locality: '', city: '', lat: 17.4486, lng: 78.3908, phone: '',
  description: '', amenities: ['Wi-Fi', 'Food'], rules: ['Gate closes at 11:00 PM'], images: [], depositMonths: 1,
  foodMenu: structuredClone(DEFAULT_FOOD_MENU), status: 'pending', rooms: [],
});

function MyPGs() {
  const { db, user, pgs } = useOwnerData();
  const [editing, setEditing] = useState(null);
  return (
    <>
      <PageHeader title="My PGs" subtitle="Add PGs, upload photos and update details" actions={<button className={ownerBtn} onClick={() => setEditing(blankPg(user.id))}><Plus className="size-4" /> Add PG</button>} />
      {pgs.length === 0 && <div className="card"><EmptyState icon={Building2} title="No PGs yet">Click “Add PG” to list your first property.</EmptyState></div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pgs.map((p) => {
          const s = pgStats(p);
          const r = pgRating(db, p.id);
          return (
            <div key={p.id} className="card overflow-hidden">
              <div className="relative">
                <Photo src={p.images[0]} alt={p.name} className="h-40 w-full" />
                <span className="absolute left-2 top-2"><StatusBadge status={p.status} /></span>
                <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">{p.images.length} photos</span>
              </div>
              <div className="p-4">
                <div className="font-semibold text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.gender} · {p.locality}, {p.city}</div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted/70 p-2"><div className="font-semibold text-foreground">{p.rooms.length}</div>Rooms</div>
                  <div className="rounded-lg bg-muted/70 p-2"><div className="font-semibold text-foreground">{s.available}/{s.totalBeds}</div>Free beds</div>
                  <div className="rounded-lg bg-muted/70 p-2"><div className="font-semibold text-foreground">{r.avg ? r.avg.toFixed(1) : '–'}★</div>Rating</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="btn-outline h-8 flex-1 px-3 text-xs" onClick={() => setEditing(structuredClone(p))}><Pencil className="size-3.5" /> Edit</button>
                  <Link to={`/pg/${p.id}`} className="btn-outline h-8 flex-1 px-3 text-xs">View public page</Link>
                  <button
                    className="btn-outline h-8 px-2 text-xs text-red-600"
                    title="Delete"
                    onClick={() => {
                      if (db.bookings.some((b) => b.pgId === p.id && ['booked', 'allocated'].includes(b.status))) return toast('This PG has active residents and cannot be deleted', 'error');
                      if (window.confirm(`Delete ${p.name}?`)) deletePg(p.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {editing && <PgForm pg={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function PgForm({ pg: initial, onClose }) {
  const [pg, setPg] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const isNew = !initial.id;
  const set = (k) => (e) => setPg({ ...pg, [k]: e.target.value });

  const upload = async (e) => {
    const files = [...e.target.files];
    setUploading(true);
    try {
      const imgs = await Promise.all(files.map((f) => compressImage(f)));
      setPg((p) => ({ ...p, images: [...p.images, ...imgs] }));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  const locate = async () => {
    try {
      const pos = await getCurrentPosition();
      setPg((p) => ({ ...p, lat: pos.lat, lng: pos.lng }));
      toast('Location captured');
    } catch {
      toast('Could not get location', 'error');
    }
  };
  const save = (e) => {
    e.preventDefault();
    if (!pg.images.length) return toast('Please upload at least one photo', 'error');
    savePg({ ...pg, lat: Number(pg.lat), lng: Number(pg.lng), depositMonths: Number(pg.depositMonths) });
    toast(isNew ? 'PG submitted for Super Admin approval' : 'PG updated');
    onClose();
  };
  const toggleAmenity = (a) => setPg({ ...pg, amenities: pg.amenities.includes(a) ? pg.amenities.filter((x) => x !== a) : [...pg.amenities, a] });

  return (
    <Modal open wide title={isNew ? 'Add new PG' : `Edit ${initial.name}`} onClose={onClose} footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button form="pg-form" className={ownerBtn}>{isNew ? 'Submit for approval' : 'Save changes'}</button></>}>
      <form id="pg-form" onSubmit={save} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">PG name</label><input className="input" value={pg.name} onChange={set('name')} required /></div>
          <div>
            <label className="label">PG for</label>
            <select className="input" value={pg.gender} onChange={set('gender')}><option>Boys</option><option>Girls</option><option>Co-living</option></select>
          </div>
          <div className="sm:col-span-2"><label className="label">Address</label><input className="input" value={pg.address} onChange={set('address')} required /></div>
          <div><label className="label">Locality</label><input className="input" value={pg.locality} onChange={set('locality')} required /></div>
          <div><label className="label">City</label><input className="input" value={pg.city} onChange={set('city')} required /></div>
          <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 sm:col-span-2">
            <div><label className="label">Latitude</label><input className="input" type="number" step="any" value={pg.lat} onChange={set('lat')} required /></div>
            <div><label className="label">Longitude</label><input className="input" type="number" step="any" value={pg.lng} onChange={set('lng')} required /></div>
            <button type="button" className="btn-outline" onClick={locate} title="Use current location"><Crosshair className="size-4" /></button>
          </div>
          <div><label className="label">Contact phone</label><input className="input" value={pg.phone} onChange={set('phone')} required /></div>
          <div><label className="label">Deposit (months of rent)</label><input className="input" type="number" min={0} max={6} value={pg.depositMonths} onChange={set('depositMonths')} /></div>
          <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input" rows={3} value={pg.description} onChange={set('description')} /></div>
        </div>

        <div>
          <label className="label">Photos ({pg.images.length})</label>
          <div className="flex flex-wrap gap-2">
            {pg.images.map((src, i) => (
              <div key={i} className="group relative">
                <Photo src={src} alt="" className="h-20 w-28 rounded-lg" />
                <button type="button" onClick={() => setPg({ ...pg, images: pg.images.filter((_, k) => k !== i) })} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white">
                  <X className="size-3.5" />
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-owner px-1 text-[10px] text-white">Cover</span>}
              </div>
            ))}
            <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:border-owner hover:text-owner">
              <ImagePlus className="size-5" />
              {uploading ? 'Uploading…' : 'Upload'}
              <input type="file" accept="image/*" multiple hidden onChange={upload} />
            </label>
          </div>
        </div>

        <div>
          <label className="label">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button type="button" key={a} onClick={() => toggleAmenity(a)} className={`rounded-full border px-3 py-1 text-xs font-medium ${pg.amenities.includes(a) ? 'border-owner bg-owner text-white' : 'border-border text-muted-foreground'}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">House rules (one per line)</label>
          <textarea className="input" rows={3} value={pg.rules.join('\n')} onChange={(e) => setPg({ ...pg, rules: e.target.value.split('\n') })} />
        </div>
      </form>
    </Modal>
  );
}

// ------------------------------------------------------------------ Rooms & beds
function Rooms() {
  const { db, pgs } = useOwnerData();
  const [pgId, setPgId] = useState(pgs[0]?.id);
  const [roomForm, setRoomForm] = useState(null);
  const [bedMenu, setBedMenu] = useState(null);
  const pg = pgs.find((p) => p.id === pgId) || pgs[0];
  if (!pg) return <div className="card"><EmptyState icon={BedDouble} title="Add a PG first" /></div>;
  const s = pgStats(pg);

  const saveRoom = (e) => {
    e.preventDefault();
    const f = roomForm;
    const sharing = Number(f.sharing);
    const rooms = [...pg.rooms];
    const existing = rooms.findIndex((r) => r.id === f.id);
    const types = { 1: 'Single Sharing', 2: 'Double Sharing', 3: 'Triple Sharing', 4: 'Four Sharing' };
    if (existing < 0 && rooms.some((r) => r.roomNo === f.roomNo)) return toast('Room number already exists', 'error');
    const prevBeds = existing >= 0 ? rooms[existing].beds : [];
    const beds = ['A', 'B', 'C', 'D'].slice(0, sharing).map((bedNo) => prevBeds.find((b) => b.bedNo === bedNo) || { bedNo, status: 'available', bookingId: null });
    if (prevBeds.slice(sharing).some((b) => b.status !== 'available')) return toast('Cannot remove beds that are booked/occupied', 'error');
    const room = { id: f.id || `room-${pg.id}-${f.roomNo}-${Date.now().toString(36)}`, roomNo: f.roomNo, floor: Number(f.floor), sharing, type: types[sharing], ac: f.ac, attachedBathroom: f.attachedBathroom, rentPerBed: Number(f.rentPerBed), beds };
    if (existing >= 0) rooms[existing] = room;
    else rooms.push(room);
    savePg({ ...pg, rooms });
    setRoomForm(null);
    toast('Room saved');
  };
  const removeRoom = (room) => {
    if (room.beds.some((b) => b.status !== 'available')) return toast('Room has booked/occupied beds', 'error');
    if (window.confirm(`Delete room ${room.roomNo}?`)) savePg({ ...pg, rooms: pg.rooms.filter((r) => r.id !== room.id) });
  };

  const bedStyle = { available: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', booked: 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', occupied: 'border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' };

  return (
    <>
      <PageHeader
        title="Rooms & Beds"
        subtitle="Manage rooms, rent and bed availability"
        actions={<><PgFilter pgs={pgs} value={pg.id} onChange={setPgId} allowAll={false} /><button className={ownerBtn} onClick={() => setRoomForm({ roomNo: '', floor: 1, sharing: 2, ac: false, attachedBathroom: true, rentPerBed: 8000 })}><Plus className="size-4" /> Add room</button></>}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total beds" value={s.totalBeds} />
        <StatTile label="Available" value={s.available} tone="good" />
        <StatTile label="Booked" value={s.booked} tone="warn" />
        <StatTile label="Occupied" value={s.occupied} tone="purple" />
      </div>
      <div className="mb-3"><BedLegend /></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pg.rooms.map((room) => (
          <div key={room.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-foreground">Room {room.roomNo}</div>
                <div className="text-xs text-muted-foreground">Floor {room.floor} · {room.type}{room.ac ? ' · AC' : ''} · {inr(room.rentPerBed)}/bed</div>
              </div>
              <div className="flex gap-1">
                <button className="rounded p-1.5 text-muted-foreground hover:bg-muted" onClick={() => setRoomForm({ ...room })}><Pencil className="size-3.5" /></button>
                <button className="rounded p-1.5 text-red-500 hover:bg-muted" onClick={() => removeRoom(room)}><Trash2 className="size-3.5" /></button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {room.beds.map((b) => {
                const bk = b.bookingId && db.bookings.find((x) => x.id === b.bookingId);
                const who = bk && findUser(db, bk.userId);
                return (
                  <button key={b.bedNo} onClick={() => setBedMenu({ room, bed: b, who })} className={`rounded-lg border-2 px-1 py-2 text-center text-xs font-semibold ${bedStyle[b.status]}`} title={who?.name || b.status}>
                    <BedDouble className="mx-auto size-4" />
                    {b.bedNo}
                    <div className="truncate text-[10px] font-normal">{who ? who.name.split(' ')[0] : b.status}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {pg.rooms.length === 0 && <div className="card"><EmptyState icon={BedDouble} title="No rooms yet">Add rooms so residents can book beds.</EmptyState></div>}

      {roomForm && (
        <Modal open title={roomForm.id ? `Edit room ${roomForm.roomNo}` : 'Add room'} onClose={() => setRoomForm(null)} footer={<><button className="btn-outline" onClick={() => setRoomForm(null)}>Cancel</button><button form="room-form" className={ownerBtn}>Save</button></>}>
          <form id="room-form" onSubmit={saveRoom} className="grid grid-cols-2 gap-4">
            <div><label className="label">Room no</label><input className="input" value={roomForm.roomNo} onChange={(e) => setRoomForm({ ...roomForm, roomNo: e.target.value })} required disabled={!!roomForm.id} /></div>
            <div><label className="label">Floor</label><input type="number" className="input" value={roomForm.floor} onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })} required /></div>
            <div>
              <label className="label">Sharing (beds)</label>
              <select className="input" value={roomForm.sharing} onChange={(e) => setRoomForm({ ...roomForm, sharing: e.target.value })}>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div><label className="label">Rent per bed (₹)</label><input type="number" className="input" value={roomForm.rentPerBed} onChange={(e) => setRoomForm({ ...roomForm, rentPerBed: e.target.value })} required /></div>
            <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={roomForm.ac} onChange={(e) => setRoomForm({ ...roomForm, ac: e.target.checked })} /> AC</label>
            <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={roomForm.attachedBathroom} onChange={(e) => setRoomForm({ ...roomForm, attachedBathroom: e.target.checked })} /> Attached bathroom</label>
          </form>
        </Modal>
      )}

      {bedMenu && (
        <Modal open title={`Room ${bedMenu.room.roomNo} · Bed ${bedMenu.bed.bedNo}`} onClose={() => setBedMenu(null)}>
          <div className="mb-4 flex items-center gap-2 text-sm">Current status: <StatusBadge status={bedMenu.bed.status} /></div>
          {bedMenu.bed.bookingId ? (
            <p className="text-sm text-muted-foreground">
              Linked to booking of <b className="text-foreground">{bedMenu.who?.name}</b>. Manage it from{' '}
              <Link to="/owner/bookings" className="font-semibold text-owner">Bookings</Link> or <Link to="/owner/tenants" className="font-semibold text-owner">Residents</Link>.
            </p>
          ) : (
            <div className="flex gap-2">
              {['available', 'occupied'].map((st) => (
                <button key={st} disabled={bedMenu.bed.status === st} className="btn-outline flex-1 capitalize" onClick={() => { setBedStatus(pg.id, bedMenu.room.id, bedMenu.bed.bedNo, st); setBedMenu(null); toast(`Bed marked ${st}`); }}>
                  Mark {st}
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Use “occupied” for offline residents who did not book through the app.</p>
        </Modal>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Bookings
function Bookings() {
  const { db, pgs, bookings } = useOwnerData();
  const [pgId, setPgId] = useState('all');
  const [status, setStatus] = useState('booked');
  const [view, setView] = useState(null);
  const rows = bookings
    .filter((b) => pgId === 'all' || b.pgId === pgId)
    .filter((b) => status === 'all' || b.status === status)
    .sort((a, b) => b.bookedOn.localeCompare(a.bookedOn));
  const counts = (st) => bookings.filter((b) => b.status === st).length;
  return (
    <>
      <PageHeader title="Bookings" subtitle="Allocate beds to residents after their booking payment" actions={<PgFilter pgs={pgs} value={pgId} onChange={setPgId} />} />
      <div className="mb-4 flex flex-wrap gap-2">
        {[['booked', 'Awaiting allocation'], ['allocated', 'Allocated'], ['cancelled', 'Cancelled'], ['vacated', 'Vacated'], ['all', 'All']].map(([k, l]) => (
          <button key={k} onClick={() => setStatus(k)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${status === k ? 'border-owner bg-owner text-white' : 'border-border bg-card text-muted-foreground'}`}>
            {l} {k !== 'all' && `(${counts(k)})`}
          </button>
        ))}
      </div>
      <Card bodyClass="p-0">
        <Table
          rows={rows}
          empty="No bookings in this view"
          columns={[
            { label: 'Booking', render: (b) => <button className="font-mono text-xs font-semibold text-owner" onClick={() => setView(b)}>{b.id.toUpperCase()}</button> },
            { label: 'Resident', render: (b) => { const u = findUser(db, b.userId); return <div><div className="font-medium">{u?.name}</div><div className="text-xs text-muted-foreground">{u?.phone}</div></div>; } },
            { label: 'PG', render: (b) => findPg(db, b.pgId)?.name },
            { label: 'Room / Bed', render: (b) => `${b.roomNo} / ${b.bedNo}` },
            { label: 'Booked on', render: (b) => fmtDate(b.bookedOn) },
            { label: 'Move-in', render: (b) => fmtDate(b.moveInDate) },
            { label: 'Rent', render: (b) => inr(b.rent) },
            { label: 'Status', render: (b) => <StatusBadge status={b.status} label={b.status === 'booked' ? 'Booked' : undefined} /> },
            {
              label: 'Actions',
              render: (b) =>
                b.status === 'booked' ? (
                  <div className="flex gap-1.5">
                    <button className="btn-success h-8 px-3 text-xs" onClick={() => { setBookingStatus(b.id, 'allocated'); toast('Bed allocated. Resident dashboard is now unlocked.'); }}><CheckCircle2 className="size-3.5" /> Allocate</button>
                    <button className="btn-outline h-8 px-3 text-xs text-red-600" onClick={() => window.confirm('Cancel this booking and free the bed?') && setBookingStatus(b.id, 'cancelled')}><XCircle className="size-3.5" /> Cancel</button>
                  </div>
                ) : (
                  <button className="btn-outline h-8 px-3 text-xs" onClick={() => setView(b)}>View</button>
                ),
            },
          ]}
        />
      </Card>
      {view && <ResidentModal booking={view} onClose={() => setView(null)} />}
    </>
  );
}

function ResidentModal({ booking, onClose }) {
  const db = useDB();
  const u = findUser(db, booking.userId);
  const pays = db.payments.filter((p) => p.bookingId === booking.id);
  const rows = [
    ['Name', u?.name], ['Email', u?.email], ['Phone', u?.phone], ['Gender', u?.gender], ['DOB', fmtDate(u?.dob)],
    ['Occupation', `${u?.occupation || ''}${u?.company ? ` · ${u.company}` : ''}`], ['ID proof', `${u?.idType} · ${u?.idNumber}`], ['Address', u?.address],
    ['Emergency contact', `${u?.emergencyName} · ${u?.emergencyPhone}`], ['PG', findPg(db, booking.pgId)?.name], ['Room / Bed', `${booking.roomNo} / ${booking.bedNo}`],
    ['Move-in', fmtDate(booking.moveInDate)], ['Rent / Deposit', `${inr(booking.rent)} / ${inr(booking.deposit)}`], ['Paid until', fmtDate(booking.paidUntil)],
    ['Total paid', inr(pays.reduce((a, p) => a + p.amount, 0))],
  ];
  return (
    <Modal open wide title={`Booking ${booking.id.toUpperCase()}`} onClose={onClose}>
      <div className="mb-3"><StatusBadge status={booking.status} /></div>
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{k}</dt><dd className="font-medium text-foreground">{v || '—'}</dd></div>
        ))}
      </dl>
    </Modal>
  );
}

// ------------------------------------------------------------------ Residents
function Tenants() {
  const { db, pgs, bookings } = useOwnerData();
  const [pgId, setPgId] = useState('all');
  const [payFor, setPayFor] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [view, setView] = useState(null);
  const rows = bookings.filter((b) => b.status === 'allocated' && (pgId === 'all' || b.pgId === pgId));
  return (
    <>
      <PageHeader title="Residents" subtitle="Allocated residents, rent status and dues" actions={<PgFilter pgs={pgs} value={pgId} onChange={setPgId} />} />
      <Card bodyClass="p-0">
        <Table
          rows={rows}
          empty="No allocated residents"
          columns={[
            { label: 'Resident', render: (b) => { const u = findUser(db, b.userId); return <button className="text-left" onClick={() => setView(b)}><div className="font-medium text-owner">{u?.name}</div><div className="text-xs text-muted-foreground">{u?.phone}</div></button>; } },
            { label: 'PG', render: (b) => findPg(db, b.pgId)?.name },
            { label: 'Room / Bed', render: (b) => `${b.roomNo} / ${b.bedNo}` },
            { label: 'Rent', render: (b) => inr(b.rent) },
            { label: 'Last paid', render: (b) => { const p = db.payments.filter((x) => x.bookingId === b.id).sort((x, y) => y.date.localeCompare(x.date))[0]; return p ? `${inr(p.amount)} · ${fmtDate(p.date)}` : '—'; } },
            { label: 'Next due', render: (b) => fmtDate(b.paidUntil) },
            { label: 'Status', render: (b) => <StatusBadge status={dueInfo(b.paidUntil).status} /> },
            {
              label: 'Actions',
              render: (b) => (
                <div className="flex gap-1.5">
                  <button className="btn-outline h-8 px-3 text-xs" onClick={() => { setPayFor(b); setAmount(b.rent); }}><IndianRupee className="size-3.5" /> Record payment</button>
                  <button className="btn-outline h-8 px-3 text-xs text-red-600" onClick={() => window.confirm('Mark this resident as vacated and free the bed?') && setBookingStatus(b.id, 'vacated')}><Vacate className="size-3.5" /> Vacate</button>
                </div>
              ),
            },
          ]}
        />
      </Card>
      {payFor && (
        <Modal open title={`Record payment · ${findUser(db, payFor.userId)?.name}`} onClose={() => setPayFor(null)} footer={<><button className="btn-outline" onClick={() => setPayFor(null)}>Cancel</button><button className="btn-success" onClick={() => { recordManualPayment(payFor.id, amount, method); setPayFor(null); toast('Payment recorded, due date extended by 30 days'); }}>Save</button></>}>
          <div className="space-y-4">
            <div><label className="label">Amount</label><input type="number" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div><label className="label">Method</label><select className="input" value={method} onChange={(e) => setMethod(e.target.value)}><option>Cash</option><option>UPI</option><option>Bank Transfer</option></select></div>
          </div>
        </Modal>
      )}
      {view && <ResidentModal booking={view} onClose={() => setView(null)} />}
    </>
  );
}

// ------------------------------------------------------------------ Payments
function Payments() {
  const { db, pgs, payments } = useOwnerData();
  const [pgId, setPgId] = useState('all');
  const rows = payments.filter((p) => pgId === 'all' || p.pgId === pgId);
  const total = rows.reduce((a, p) => a + p.amount, 0);
  const month = new Date().toISOString().slice(0, 7);
  return (
    <>
      <PageHeader title="Payments" subtitle="All rent and booking payments received" actions={<PgFilter pgs={pgs} value={pgId} onChange={setPgId} />} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label="Total collected" value={inr(total)} tone="good" />
        <StatTile label="This month" value={inr(rows.filter((p) => p.date.startsWith(month)).reduce((a, p) => a + p.amount, 0))} />
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
          ]}
        />
      </Card>
    </>
  );
}

// ------------------------------------------------------------------ Complaints
function Complaints() {
  const { db, pgs, complaints } = useOwnerData();
  const [pgId, setPgId] = useState('all');
  const [status, setStatus] = useState('all');
  const [replies, setReplies] = useState({});
  const rows = complaints.filter((c) => (pgId === 'all' || c.pgId === pgId) && (status === 'all' || c.status === status));
  return (
    <>
      <PageHeader
        title="Complaints"
        subtitle="Respond to residents and update status"
        actions={
          <>
            <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option><option value="open">Open</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option>
            </select>
            <PgFilter pgs={pgs} value={pgId} onChange={setPgId} />
          </>
        }
      />
      <div className="space-y-3">
        {rows.length === 0 && <div className="card"><EmptyState icon={MessageSquareWarning} title="No complaints" /></div>}
        {rows.map((c) => {
          const u = findUser(db, c.userId);
          const bk = db.bookings.find((b) => b.id === c.bookingId);
          return (
            <div key={c.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-foreground">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.category} · {u?.name} · Room {bk?.roomNo}/{bk?.bedNo} · {findPg(db, c.pgId)?.name} · {fmtDate(c.createdAt)}</div>
                </div>
                <select className="input h-8 w-auto text-xs" value={c.status} onChange={(e) => { updateComplaint(c.id, { status: e.target.value }); toast('Status updated'); }}>
                  <option value="open">Open</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option>
                </select>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
              <div className="mt-3 flex gap-2">
                <input className="input h-9" placeholder={c.reply || 'Write a reply to the resident…'} value={replies[c.id] ?? ''} onChange={(e) => setReplies({ ...replies, [c.id]: e.target.value })} />
                <button className={`${ownerBtn} h-9`} disabled={!replies[c.id]} onClick={() => { updateComplaint(c.id, { reply: replies[c.id], status: c.status === 'open' ? 'in-progress' : c.status }); setReplies({ ...replies, [c.id]: '' }); toast('Reply sent'); }}>Reply</button>
              </div>
              {c.reply && <div className="mt-2 text-xs text-muted-foreground">Last reply: <span className="text-foreground">{c.reply}</span></div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Food menu
function FoodMenu() {
  const { pgs } = useOwnerData();
  const [pgId, setPgId] = useState(pgs[0]?.id);
  const pg = pgs.find((p) => p.id === pgId) || pgs[0];
  const [menu, setMenu] = useState(pg ? structuredClone(pg.foodMenu) : null);
  if (!pg) return <div className="card"><EmptyState icon={Utensils} title="Add a PG first" /></div>;
  const change = (id) => {
    setPgId(id);
    setMenu(structuredClone(pgs.find((p) => p.id === id).foodMenu));
  };
  return (
    <>
      <PageHeader
        title="Food Menu"
        subtitle="Residents see this menu on their dashboard"
        actions={<><PgFilter pgs={pgs} value={pg.id} onChange={change} allowAll={false} /><button className={ownerBtn} onClick={() => { savePg({ ...pg, foodMenu: menu }); toast('Menu saved'); }}>Save menu</button></>}
      />
      <Card bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50"><tr><th className="th">Day</th><th className="th">Breakfast</th><th className="th">Lunch</th><th className="th">Dinner</th></tr></thead>
            <tbody className="divide-y divide-border/70">
              {WEEKDAYS.map((d) => (
                <tr key={d}>
                  <td className="td font-semibold">{d}</td>
                  {['breakfast', 'lunch', 'dinner'].map((m) => (
                    <td key={m} className="px-2 py-2">
                      <input className="input min-w-[180px]" value={menu[d]?.[m] || ''} onChange={(e) => setMenu({ ...menu, [d]: { ...menu[d], [m]: e.target.value } })} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ------------------------------------------------------------------ Reviews
function Reviews() {
  const { db, pgs, reviews } = useOwnerData();
  const [pgId, setPgId] = useState('all');
  const rows = reviews.filter((r) => pgId === 'all' || r.pgId === pgId);
  return (
    <>
      <PageHeader title="Reviews & Ratings" subtitle="What residents say about your PGs" actions={<PgFilter pgs={pgs} value={pgId} onChange={setPgId} />} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {pgs.slice(0, 4).map((p) => {
          const r = pgRating(db, p.id);
          return <StatTile key={p.id} label={p.name} value={`${r.avg.toFixed(1)} ★`} hint={`${r.count} reviews`} tone="warn" />;
        })}
      </div>
      <Card><ReviewList reviews={rows} /></Card>
    </>
  );
}
