import React, { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BedDouble, Sparkles, UserPlus, Lock } from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import { BedLegend, RoomCard } from '../../components/pg';
import { Card, EmptyState, Modal, Photo, toast } from '../../components/ui';
import { useDB, findPg, findRoom, registerUser, createBooking, calculatePeriodRent } from '../../store/db';
import { useAuth } from '../../store/auth';
import { inr } from '../../utils/format';
import { isoDaysFromNow } from '../../data/seed';

const SAMPLE = {
  name: 'Ananya Gupta',
  email: `ananya${Math.floor(Math.random() * 900 + 100)}@example.com`,
  phone: '+91 9876543210',
  password: 'user123',
  confirm: 'user123',
  gender: 'Female',
  dob: '2000-03-15',
  occupation: 'Software Engineer',
  company: 'Wipro',
  idType: 'Aadhaar',
  idNumber: '1234 5678 9012',
  address: '12-3-45, Gandhi Nagar, Vijayawada, AP',
  emergencyName: 'Rajesh Gupta',
  emergencyPhone: '+91 9123456780',
};

const EMPTY = Object.fromEntries(Object.keys(SAMPLE).map((k) => [k, '']));

export default function BookingRegister() {
  const { pgId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const db = useDB();
  const { user } = useAuth();
  const pg = findPg(db, pgId);

  const [sel, setSel] = useState({ roomId: params.get('room'), bedNo: params.get('bed') });
  const [picker, setPicker] = useState(false);
  const [moveIn, setMoveIn] = useState(isoDaysFromNow(3));
  const [durationType, setDurationType] = useState('month');
  const [durationDays, setDurationDays] = useState('1');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => (user && user.role === 'user' ? { ...EMPTY, ...user, confirm: '' } : EMPTY));

  if (!pg) return <EmptyState title="PG not found" />;
  const room = findRoom(pg, sel.roomId);
  const bed = room?.beds.find((b) => b.bedNo === sel.bedNo);
  const loggedInTenant = user && user.role === 'user';

  if (user && user.role !== 'user') {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <EmptyState title="Bookings are for residents only">You are logged in as {user.role}. Log out to book a bed as a resident.</EmptyState>
      </div>
    );
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!room || !bed) throw new Error('Please select a bed.');
      if (bed.status !== 'available') throw new Error('This bed is no longer available. Please pick another.');
      if (durationType === 'day') {
        if (!Number.isSafeInteger(Number(durationDays)) || Number(durationDays) < 1) {
          throw new Error('Please enter a valid number of days.');
        }
        if (!Number.isSafeInteger(room.dailyRentPerBed) || room.dailyRentPerBed < 1) {
          throw new Error('Daily rent is not set for this room. Please contact the PG owner.');
        }
      }
      if (!agree) throw new Error('Please accept the house rules and terms.');
      let userId = user?.id;
      if (!loggedInTenant) {
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (form.password !== form.confirm) throw new Error('Passwords do not match.');
        const data = { ...form };
        delete data.confirm;
        userId = registerUser({ ...data, role: 'user' }).id;
        toast('Account created. Complete payment to confirm your bed.');
      }
      const booking = createBooking({
        userId, pgId: pg.id, roomId: room.id, bedNo: bed.bedNo, moveInDate: moveIn,
        durationType, durationDays: durationType === 'day' ? Number(durationDays) : 30,
      });
      navigate(`/payment/${booking.id}`);
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const bind = (k) => ({ value: form[k] || '', onChange: set(k) });

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link to={`/pg/${pg.id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to {pg.name}
        </Link>

        <Steps current={1} />

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</div>}

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Card
              title={loggedInTenant ? `Booking as ${user.name}` : 'Resident registration'}
              actions={
                !loggedInTenant && (
                  <button type="button" className="btn-outline h-8 px-3 text-xs" onClick={() => setForm({ ...SAMPLE, email: `ananya${Math.floor(Math.random() * 9000 + 100)}@example.com` })}>
                    <Sparkles className="size-3.5" /> Fill sample data
                  </button>
                )
              }
            >
              {!loggedInTenant && (
                <p className="mb-4 text-sm text-muted-foreground">
                  Already registered? <Link to={`/login?next=${encodeURIComponent(`/book/${pg.id}?room=${sel.roomId}&bed=${sel.bedNo}`)}`} className="font-semibold text-primary">Log in</Link> to book faster.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" {...bind('name')} />
                <Field label="Mobile number" {...bind('phone')} type="tel" />
                <Field label="Email (login id)" {...bind('email')} type="email" disabled={loggedInTenant} />
                <div>
                  <label className="label">Gender</label>
                  <select className="input" value={form.gender} onChange={set('gender')} required>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <Field label="Date of birth" {...bind('dob')} type="date" />
                <Field label="Occupation" {...bind('occupation')} />
                <Field label="Company / College" {...bind('company')} />
                <div className="grid grid-cols-[110px_1fr] gap-2">
                  <div>
                    <label className="label">ID proof</label>
                    <select className="input" value={form.idType} onChange={set('idType')} required>
                      <option value="">Type</option>
                      <option>Aadhaar</option>
                      <option>PAN</option>
                      <option>Passport</option>
                      <option>Driving License</option>
                    </select>
                  </div>
                  <Field label="ID number" {...bind('idNumber')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Permanent address</label>
                  <textarea className="input" rows={2} value={form.address || ''} onChange={set('address')} required />
                </div>
                <Field label="Emergency contact name" {...bind('emergencyName')} />
                <Field label="Emergency contact phone" {...bind('emergencyPhone')} type="tel" />
              </div>
            </Card>

            {!loggedInTenant && (
              <Card title={<span className="inline-flex items-center gap-2"><Lock className="size-4" /> Create login password</span>}>
                <p className="mb-3 text-sm text-muted-foreground">You will use this email and password to log in and see your booking dashboard.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Password" {...bind('password')} type="password" minLength={6} />
                  <Field label="Confirm password" {...bind('confirm')} type="password" minLength={6} />
                </div>
              </Card>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="card overflow-hidden">
              <Photo src={pg.images[0]} alt={pg.name} className="h-32 w-full" />
              <div className="p-5">
                <div className="font-semibold text-foreground">{pg.name}</div>
                <div className="text-xs text-muted-foreground">{pg.locality}, {pg.city}</div>

                <div className="mt-4 flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <BedDouble className="size-5 text-primary" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{room ? `Room ${room.roomNo} · Bed ${sel.bedNo}` : 'No bed selected'}</div>
                      {room && <div className="text-xs text-muted-foreground">{room.type}{room.ac ? ' · AC' : ''} · Floor {room.floor}</div>}
                    </div>
                  </div>
                  <button type="button" className="text-xs font-semibold text-primary" onClick={() => setPicker(true)}>Change</button>
                </div>

                <div className="mt-4">
                  <label className="label">Move-in date</label>
                  <input type="date" className="input" min={isoDaysFromNow(0)} value={moveIn} onChange={(e) => setMoveIn(e.target.value)} required />
                </div>

                <div className="mt-4">
                  <label className="label">Booking duration</label>
                  <select className="input" value={durationType} onChange={(e) => setDurationType(e.target.value)}>
                    <option value="day">Day-wise</option>
                    <option value="month">Monthly</option>
                  </select>
                </div>

                {durationType === 'day' && (
                  <div className="mt-4">
                    <label className="label" htmlFor="booking-days">Number of days</label>
                    <input
                      id="booking-days"
                      type="number"
                      className="input"
                      min="1"
                      step="1"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      required
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {room?.dailyRentPerBed ? `Daily rate: ${inr(room.dailyRentPerBed)}.` : 'Daily rate has not been set by the PG owner.'}
                    </p>
                  </div>
                )}

                {room && (
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-muted-foreground">Monthly rent</dt><dd className="font-medium text-foreground">{inr(room.rentPerBed)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">{durationType === 'day' ? `Rent (${durationDays || 0} days)` : 'Rent (1 month)'}</dt><dd className="font-medium text-foreground">{inr(calculatePeriodRent(room.rentPerBed, durationType, Number(durationDays), room.dailyRentPerBed))}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Security deposit (refundable)</dt><dd className="font-medium text-foreground">{inr(durationType === 'day' ? 0 : room.rentPerBed * pg.depositMonths)}</dd></div>
                    <div className="flex justify-between border-t border-border pt-2 text-base"><dt className="font-semibold text-foreground">Pay now</dt><dd className="font-bold text-foreground">{inr(calculatePeriodRent(room.rentPerBed, durationType, Number(durationDays), room.dailyRentPerBed) + (durationType === 'day' ? 0 : room.rentPerBed * pg.depositMonths))}</dd></div>
                  </dl>
                )}

                <label className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" className="mt-0.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                  I agree to the house rules and the 1-month notice / refund policy.
                </label>

                <button type="submit" className="btn-primary mt-4 w-full">
                  <UserPlus className="size-4" /> {loggedInTenant ? 'Continue to payment' : 'Register & continue to payment'}
                </button>
              </div>
            </div>
          </aside>
        </form>
      </main>

      <Modal open={picker} title="Choose your bed" onClose={() => setPicker(false)} wide>
        <div className="mb-3"><BedLegend /></div>
        <div className="grid gap-3 md:grid-cols-2">
          {pg.rooms.map((r) => (
            <RoomCard key={r.id} room={r} selected={sel} onSelectBed={(rm, b) => { setSel({ roomId: rm.id, bedNo: b.bedNo }); setPicker(false); }} />
          ))}
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, type = 'text', ...rest }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} required {...rest} />
    </div>
  );
}

export function Steps({ current }) {
  const steps = ['Select bed', 'Register', 'Payment', 'Confirmed'];
  return (
    <ol className="mb-6 flex items-center gap-2 overflow-x-auto text-xs font-semibold sm:text-sm">
      {steps.map((s, i) => (
        <li key={s} className="flex shrink-0 items-center gap-2">
          <span className={`flex size-6 items-center justify-center rounded-full ${i <= current ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
          <span className={i <= current ? 'text-foreground' : 'text-muted-foreground'}>{s}</span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border sm:w-12" />}
        </li>
      ))}
    </ol>
  );
}
