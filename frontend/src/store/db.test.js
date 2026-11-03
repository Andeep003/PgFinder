import { bookingDeposit, canReviewPg, createBooking, pgDepositAmount, upsertReview, resetDemoData, getState } from './db';

describe('resident PG reviews', () => {
  const residentId = 'resident-1';
  const pgId = 'pg-1';

  beforeAll(() => {
    if (!global.structuredClone) {
      global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
    }
  });

  afterEach(() => {
    resetDemoData();
  });

  it.each(['allocated', 'vacate_requested', 'vacated'])('allows a review after joining (%s)', (status) => {
    const db = { bookings: [{ userId: residentId, pgId, status }] };
    expect(canReviewPg(db, residentId, pgId)).toBe(true);
  });

  it.each(['payment_pending', 'booked', 'cancelled'])('does not allow a review before joining (%s)', (status) => {
    const db = { bookings: [{ userId: residentId, pgId, status }] };
    expect(canReviewPg(db, residentId, pgId)).toBe(false);
  });

  it('rejects reviews for a PG the resident has not joined', () => {
    expect(() => upsertReview({
      pgId,
      userId: residentId,
      userName: 'Resident',
      rating: 5,
      comment: 'Great stay',
    })).toThrow('You can review this PG after the owner allocates your bed.');
    expect(getState().reviews.some((review) => review.userId === residentId)).toBe(false);
  });

  it('makes an eligible resident review available in shared app state', () => {
    const state = getState();
    state.bookings.push({ id: 'booking-1', userId: residentId, pgId, status: 'allocated' });

    upsertReview({ pgId, userId: residentId, userName: 'Resident', rating: 5, comment: 'Great stay' });

    expect(getState().reviews).toContainEqual(expect.objectContaining({
      pgId,
      userId: residentId,
      userName: 'Resident',
      rating: 5,
      comment: 'Great stay',
    }));
  });

  it('waives the security deposit for day-wise bookings under 20 days', () => {
    const state = getState();
    const pg = state.pgs.find((listing) => listing.id === pgId);
    pg.depositAmount = 12345;
    const room = pg.rooms.find((candidate) => candidate.beds.some((bed) => bed.status === 'available'));
    room.dailyRentPerBed = 500;
    const bed = room.beds.find((candidate) => candidate.status === 'available');

    const booking = createBooking({
      userId: residentId,
      pgId,
      roomId: room.id,
      bedNo: bed.bedNo,
      moveInDate: '2099-01-01',
      durationType: 'day',
      durationDays: 2,
    });

    expect(booking.deposit).toBe(0);
  });

  it('charges the fixed INR deposit for day-wise bookings of 20 days or longer', () => {
    const pg = getState().pgs.find((listing) => listing.id === pgId);
    pg.depositAmount = 12345;

    expect(bookingDeposit(pg, 'day', 19)).toBe(0);
    expect(bookingDeposit(pg, 'day', 20)).toBe(12345);
    expect(bookingDeposit(pg, 'month', 30)).toBe(12345);
  });

  it('converts an existing month-based demo deposit to a fixed amount', () => {
    const pg = { depositMonths: 2, rooms: [{ rentPerBed: 8500 }, { rentPerBed: 12000 }] };
    expect(pgDepositAmount(pg)).toBe(17000);
  });
});
