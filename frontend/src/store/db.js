// A tiny localStorage-backed "database" standing in for a backend API. Every mutation goes
// through `update`, which persists and notifies subscribers, so all pages re-render with fresh
// data (and changes made as the owner show up when you log back in as the tenant).
import { useSyncExternalStore } from 'react';
import { buildSeed, buildNearbyPgs, isoDaysFromNow, DAY } from '../data/seed';

const DB_KEY = 'pgfinder-db-v1';
const SESSION_KEY = 'pgfinder-session';

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupted / unavailable storage - fall back to a fresh seed
  }
  return buildSeed();
}

function persist() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded (large uploaded images) - state still lives in memory for this session
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function getState() {
  return state;
}

export function update(mutator) {
  const draft = structuredClone(state);
  const result = mutator(draft);
  state = draft;
  persist();
  emit();
  return result;
}

export function resetDemoData() {
  state = buildSeed();
  persist();
  emit();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDB(selector = (s) => s) {
  const snap = useSyncExternalStore(subscribe, getState);
  return selector(snap);
}

// ---------- ids / helpers ----------
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const today = () => isoDaysFromNow(0);
export const addDays = (iso, n) => new Date(new Date(iso).getTime() + n * DAY).toISOString().slice(0, 10);

export const findPg = (s, id) => s.pgs.find((p) => p.id === id);
export const findUser = (s, id) => s.users.find((u) => u.id === id);
export const findRoom = (pg, roomId) => pg?.rooms.find((r) => r.id === roomId);

export function pgStats(pg) {
  const beds = pg.rooms.flatMap((r) => r.beds);
  const available = beds.filter((b) => b.status === 'available').length;
  const rents = pg.rooms.map((r) => r.rentPerBed);
  return {
    totalBeds: beds.length,
    available,
    occupied: beds.filter((b) => b.status === 'occupied').length,
    booked: beds.filter((b) => b.status === 'booked').length,
    minRent: rents.length ? Math.min(...rents) : 0,
    maxRent: rents.length ? Math.max(...rents) : 0,
  };
}

export function pgRating(s, pgId) {
  const rs = s.reviews.filter((r) => r.pgId === pgId);
  if (!rs.length) return { avg: 0, count: 0 };
  return { avg: rs.reduce((a, r) => a + r.rating, 0) / rs.length, count: rs.length };
}

export function isPgPublic(s, pg) {
  const owner = findUser(s, pg.ownerId);
  return pg.status === 'approved' && owner?.status === 'active';
}

// ---------- session ----------
export function getSessionUserId() {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
export function setSessionUserId(id) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

// ---------- actions ----------
export function registerUser(data) {
  return update((s) => {
    const email = data.email.trim().toLowerCase();
    if (s.users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('An account with this email already exists. Please log in instead.');
    }
    const user = { ...data, email, id: uid('u'), status: data.role === 'owner' ? 'pending' : 'active', createdAt: today() };
    s.users.push(user);
    return user;
  });
}

export function updateUser(id, patch) {
  update((s) => {
    Object.assign(findUser(s, id), patch);
  });
}

/** Creates a booking in `payment_pending` and holds the bed until payment completes. */
export function createBooking({ userId, pgId, roomId, bedNo, moveInDate }) {
  return update((s) => {
    const pg = findPg(s, pgId);
    const room = findRoom(pg, roomId);
    const bed = room?.beds.find((b) => b.bedNo === bedNo);
    if (!bed || bed.status !== 'available') throw new Error('Sorry, this bed is no longer available. Please choose another bed.');
    if (s.bookings.some((b) => b.userId === userId && ['booked', 'allocated'].includes(b.status))) {
      throw new Error('You already have an active booking. Log in to see it on your dashboard.');
    }
    // Drop any earlier unpaid attempt by this user so beds don't stay held.
    s.bookings = s.bookings.filter((b) => !(b.userId === userId && b.status === 'payment_pending'));
    const booking = {
      id: uid('bk'),
      userId,
      pgId,
      roomId,
      roomNo: room.roomNo,
      bedNo,
      rent: room.rentPerBed,
      deposit: room.rentPerBed * (pg.depositMonths || 1),
      status: 'payment_pending',
      bookedOn: today(),
      moveInDate,
      allocatedOn: null,
      paidUntil: null,
    };
    s.bookings.push(booking);
    return booking;
  });
}

export function completeBookingPayment(bookingId, method) {
  return update((s) => {
    const bk = s.bookings.find((b) => b.id === bookingId);
    const pg = findPg(s, bk.pgId);
    const bed = findRoom(pg, bk.roomId).beds.find((b) => b.bedNo === bk.bedNo);
    if (bed.status !== 'available' && bed.bookingId !== bk.id) throw new Error('This bed was just booked by someone else.');
    bed.status = 'booked';
    bed.bookingId = bk.id;
    bk.status = 'booked';
    bk.paidUntil = addDays(bk.moveInDate, 30);
    const payment = {
      id: uid('pay'), bookingId: bk.id, userId: bk.userId, pgId: bk.pgId,
      amount: bk.rent + bk.deposit, type: 'Booking (Deposit + 1st month)', method,
      txnId: `TXN${Math.floor(Math.random() * 1e10)}`, date: today(), status: 'success',
    };
    s.payments.push(payment);
    return payment;
  });
}

export function payRent(bookingId, method) {
  return update((s) => {
    const bk = s.bookings.find((b) => b.id === bookingId);
    const payment = {
      id: uid('pay'), bookingId, userId: bk.userId, pgId: bk.pgId, amount: bk.rent,
      type: 'Monthly Rent', method, txnId: `TXN${Math.floor(Math.random() * 1e10)}`, date: today(), status: 'success',
    };
    s.payments.push(payment);
    bk.paidUntil = addDays(bk.paidUntil || today(), 30);
    return payment;
  });
}

export function setBookingStatus(bookingId, status) {
  update((s) => {
    const bk = s.bookings.find((b) => b.id === bookingId);
    const pg = findPg(s, bk.pgId);
    const bed = findRoom(pg, bk.roomId)?.beds.find((b) => b.bedNo === bk.bedNo);
    bk.status = status;
    if (status === 'allocated') {
      bk.allocatedOn = today();
      if (bed) Object.assign(bed, { status: 'occupied', bookingId: bk.id });
    } else if (['cancelled', 'vacated'].includes(status)) {
      if (bed && bed.bookingId === bk.id) Object.assign(bed, { status: 'available', bookingId: null });
    }
  });
}

export function savePg(pg) {
  return update((s) => {
    const idx = s.pgs.findIndex((p) => p.id === pg.id);
    if (idx >= 0) {
      s.pgs[idx] = pg;
      return pg;
    }
    const created = { ...pg, id: `pg-${s.pgs.length + 1}-${Date.now().toString(36)}`, createdAt: today() };
    s.pgs.push(created);
    return created;
  });
}

export function setPgStatus(pgId, status) {
  update((s) => {
    findPg(s, pgId).status = status;
  });
}

export function deletePg(pgId) {
  update((s) => {
    s.pgs = s.pgs.filter((p) => p.id !== pgId);
  });
}

export function setBedStatus(pgId, roomId, bedNo, status) {
  update((s) => {
    const bed = findRoom(findPg(s, pgId), roomId).beds.find((b) => b.bedNo === bedNo);
    bed.status = status;
    if (status === 'available') bed.bookingId = null;
  });
}

export function addComplaint(data) {
  update((s) => {
    s.complaints.push({ ...data, id: uid('cmp'), status: 'open', createdAt: today(), reply: '' });
  });
}

export function updateComplaint(id, patch) {
  update((s) => {
    Object.assign(s.complaints.find((c) => c.id === id), patch);
  });
}

export function upsertReview({ pgId, userId, userName, rating, comment }) {
  update((s) => {
    const existing = s.reviews.find((r) => r.pgId === pgId && r.userId === userId);
    if (existing) Object.assign(existing, { rating, comment, date: today() });
    else s.reviews.push({ id: uid('rv'), pgId, userId, userName, rating, comment, date: today() });
  });
}

export function recordManualPayment(bookingId, amount, method) {
  update((s) => {
    const bk = s.bookings.find((b) => b.id === bookingId);
    s.payments.push({
      id: uid('pay'), bookingId, userId: bk.userId, pgId: bk.pgId, amount: Number(amount),
      type: 'Monthly Rent (Cash/Manual)', method, txnId: `MAN${Date.now().toString().slice(-8)}`, date: today(), status: 'success',
    });
    bk.paidUntil = addDays(bk.paidUntil || today(), 30);
  });
}

export function setSettings(patch) {
  update((s) => {
    Object.assign(s.settings, patch);
  });
}

/** Seeds demo PGs around a real location once (per ~5 km cell) so "near you" is never empty. */
export function ensureNearbyDemoPgs(lat, lng, placeName) {
  const key = `${lat.toFixed(1)},${lng.toFixed(1)}`;
  if (state.meta.nearbySeeds.includes(key)) return;
  update((s) => {
    s.meta.nearbySeeds.push(key);
    s.pgs.push(...buildNearbyPgs(lat, lng, s.pgs.length, placeName));
  });
}
