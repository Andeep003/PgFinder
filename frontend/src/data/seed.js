// Dummy data for the demo. Dates are computed relative to "today" so the demo always looks
// current (rent due dates, recent payments, etc.).

export const DAY = 24 * 60 * 60 * 1000;
export const isoDaysFromNow = (n) => new Date(Date.now() + n * DAY).toISOString().slice(0, 10);

const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=70`;
const PHOTOS = [
  IMG('photo-1522708323590-d24dbb6b0267'),
  IMG('photo-1505693416388-ac5ce068fe85'),
  IMG('photo-1560448204-e02f11c3d0e2'),
  IMG('photo-1502672260266-1c1ef2d93688'),
  IMG('photo-1493809842364-78817add7ffb'),
  IMG('photo-1555854877-bab0e564b8d5'),
  IMG('photo-1586023492125-27b2c045efd7'),
  IMG('photo-1540518614846-7eded433c457'),
  IMG('photo-1598928506311-c55ded91a20c'),
  IMG('photo-1631049307264-da0ec9d70304'),
  IMG('photo-1484154218962-a197022b5858'),
  IMG('photo-1556909114-f6e7ad7d3136'),
  IMG('photo-1600585154340-be6161a56a0c'),
  IMG('photo-1568605114967-8130f3a36994'),
  IMG('photo-1512917774080-9991f1c4c750'),
];
export const pickPhotos = (i, n = 5) => Array.from({ length: n }, (_, k) => PHOTOS[(i * 3 + k) % PHOTOS.length]);

// Localities the search box can resolve without a network call.
export const LOCALITIES = [
  { name: 'Madhapur, Hyderabad', lat: 17.4486, lng: 78.3908 },
  { name: 'Gachibowli, Hyderabad', lat: 17.4401, lng: 78.3489 },
  { name: 'Kondapur, Hyderabad', lat: 17.4622, lng: 78.3568 },
  { name: 'Hitech City, Hyderabad', lat: 17.4504, lng: 78.381 },
  { name: 'Ameerpet, Hyderabad', lat: 17.4375, lng: 78.4483 },
  { name: 'SR Nagar, Hyderabad', lat: 17.4417, lng: 78.443 },
  { name: 'Kukatpally, Hyderabad', lat: 17.4948, lng: 78.3996 },
  { name: 'Koramangala, Bangalore', lat: 12.9352, lng: 77.6245 },
  { name: 'HSR Layout, Bangalore', lat: 12.9116, lng: 77.6474 },
  { name: 'BTM Layout, Bangalore', lat: 12.9166, lng: 77.6101 },
  { name: 'Whitefield, Bangalore', lat: 12.9698, lng: 77.75 },
  { name: 'Electronic City, Bangalore', lat: 12.8452, lng: 77.6602 },
];

// Fallback when the browser denies / doesn't support geolocation.
export const DEFAULT_LOCATION = { name: 'Madhapur, Hyderabad', lat: 17.4486, lng: 78.3908 };

export const AMENITIES = [
  'Wi-Fi', 'AC', 'Food', 'Laundry', 'Power Backup', 'CCTV', 'Housekeeping',
  'Hot Water', 'Parking', 'Gym', 'TV', 'Fridge', 'RO Water', 'Lift', 'Security Guard',
];

export const DEFAULT_FOOD_MENU = {
  Monday: { breakfast: 'Idli, Sambar, Chutney', lunch: 'Rice, Dal, Aloo Fry, Curd', dinner: 'Chapati, Paneer Curry, Rice' },
  Tuesday: { breakfast: 'Poha, Tea', lunch: 'Rice, Sambar, Beans Curry, Papad', dinner: 'Chapati, Mixed Veg, Rice, Rasam' },
  Wednesday: { breakfast: 'Upma, Chutney, Coffee', lunch: 'Veg Biryani, Raita', dinner: 'Chapati, Egg Curry / Dal Fry' },
  Thursday: { breakfast: 'Dosa, Chutney, Sambar', lunch: 'Rice, Rajma, Cabbage Fry, Curd', dinner: 'Pulao, Kurma, Sweet' },
  Friday: { breakfast: 'Puri, Aloo Curry', lunch: 'Rice, Dal Tadka, Bhindi Fry', dinner: 'Chapati, Chana Masala, Rice' },
  Saturday: { breakfast: 'Pongal, Vada', lunch: 'Lemon Rice, Curd Rice, Pickle', dinner: 'Fried Rice, Manchurian' },
  Sunday: { breakfast: 'Aloo Paratha, Curd', lunch: 'Chicken Biryani / Veg Biryani', dinner: 'Chapati, Dal, Rice, Ice Cream' },
};

// Deterministic pseudo-random so every fresh seed looks the same.
function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const SHARING = {
  1: { type: 'Single Sharing', base: 12000 },
  2: { type: 'Double Sharing', base: 8500 },
  3: { type: 'Triple Sharing', base: 7000 },
  4: { type: 'Four Sharing', base: 6000 },
};
const BED_LETTERS = ['A', 'B', 'C', 'D'];

export function makeRooms(pgIndex, floors, roomsPerFloor, priceFactor = 1, occupancy = 0.55) {
  const rand = rng(pgIndex * 7919 + 13);
  const rooms = [];
  for (let f = 1; f <= floors; f++) {
    for (let r = 1; r <= roomsPerFloor; r++) {
      const sharing = 1 + Math.floor(rand() * 4);
      const ac = rand() > 0.5;
      const rent = Math.round((SHARING[sharing].base * priceFactor + (ac ? 1500 : 0)) / 100) * 100;
      const roomNo = `${f}0${r}`;
      rooms.push({
        id: `room-${pgIndex}-${roomNo}`,
        roomNo,
        floor: f,
        sharing,
        type: SHARING[sharing].type,
        ac,
        attachedBathroom: rand() > 0.3,
        rentPerBed: rent,
        beds: BED_LETTERS.slice(0, sharing).map((bedNo) => ({
          bedNo,
          status: rand() < occupancy ? 'occupied' : 'available',
          bookingId: null,
        })),
      });
    }
  }
  return rooms;
}

const PG_DEFS = [
  { name: 'Sri Sai Comfort PG', loc: 0, gender: 'Boys', owner: 'u-owner1', floors: 3, rpf: 3, pf: 1.1, addr: 'Plot 42, Ayyappa Society, Madhapur', amen: [0, 1, 2, 3, 4, 5, 6, 7, 12] },
  { name: 'Lotus Ladies Hostel', loc: 1, gender: 'Girls', owner: 'u-owner1', floors: 2, rpf: 4, pf: 1.15, addr: 'Near DLF Cyber City, Gachibowli', amen: [0, 2, 3, 4, 5, 6, 7, 12, 14] },
  { name: 'Green Nest Co-Living', loc: 2, gender: 'Co-living', owner: 'u-owner1', floors: 3, rpf: 2, pf: 1.3, addr: 'Botanical Garden Rd, Kondapur', amen: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13] },
  { name: 'Hitech Executive Stay', loc: 3, gender: 'Boys', owner: 'u-owner2', floors: 4, rpf: 2, pf: 1.25, addr: 'Opp. Cyber Towers, Hitech City', amen: [0, 1, 2, 4, 5, 6, 7, 8, 10, 13] },
  { name: 'Ameerpet Students PG', loc: 4, gender: 'Boys', owner: 'u-owner2', floors: 2, rpf: 3, pf: 0.8, addr: 'Lane 3, Mythrivanam, Ameerpet', amen: [0, 2, 4, 7, 12] },
  { name: 'Annapurna Womens PG', loc: 5, gender: 'Girls', owner: 'u-owner2', floors: 2, rpf: 3, pf: 0.9, addr: 'Main Rd, SR Nagar', amen: [0, 2, 3, 4, 5, 7, 12, 14] },
  { name: 'Metro View PG', loc: 6, gender: 'Boys', owner: 'u-owner1', floors: 3, rpf: 2, pf: 0.95, addr: 'Near KPHB Metro, Kukatpally', amen: [0, 2, 4, 5, 7, 8, 12] },
  { name: 'Zolo Style Koramangala', loc: 7, gender: 'Co-living', owner: 'u-owner2', floors: 3, rpf: 3, pf: 1.35, addr: '5th Block, Koramangala', amen: [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 13] },
  { name: 'HSR Girls Residency', loc: 8, gender: 'Girls', owner: 'u-owner2', floors: 2, rpf: 3, pf: 1.2, addr: 'Sector 2, HSR Layout', amen: [0, 1, 2, 3, 4, 5, 6, 7, 12, 14] },
  { name: 'BTM Budget Stay', loc: 9, gender: 'Boys', owner: 'u-owner3', floors: 2, rpf: 3, pf: 0.85, addr: '2nd Stage, BTM Layout', amen: [0, 2, 4, 7], status: 'pending' },
  { name: 'Whitefield Tech Homes', loc: 10, gender: 'Co-living', owner: 'u-owner1', floors: 3, rpf: 2, pf: 1.2, addr: 'ITPL Main Rd, Whitefield', amen: [0, 1, 2, 3, 4, 5, 6, 7, 8, 13] },
  { name: 'E-City Comfort PG', loc: 11, gender: 'Boys', owner: 'u-owner2', floors: 2, rpf: 3, pf: 0.9, addr: 'Phase 1, Electronic City', amen: [0, 2, 4, 5, 7, 8] },
];

function buildPg(def, i) {
  const loc = LOCALITIES[def.loc];
  const rand = rng(i * 31 + 7);
  const id = `pg-${i + 1}`;
  return {
    id,
    ownerId: def.owner,
    name: def.name,
    gender: def.gender,
    address: def.addr,
    locality: loc.name.split(',')[0],
    city: loc.name.split(',')[1].trim(),
    lat: loc.lat + (rand() - 0.5) * 0.012,
    lng: loc.lng + (rand() - 0.5) * 0.012,
    phone: `+91 9${Math.floor(100000000 + rand() * 899999999)}`,
    description: `${def.name} is a well-maintained ${def.gender.toLowerCase()} PG in ${loc.name}, close to IT parks, metro and markets. Homely food, 24x7 security and regular housekeeping make it a comfortable place to stay.`,
    amenities: def.amen.map((a) => AMENITIES[a]),
    rules: ['Gate closes at 11:00 PM', 'No smoking / alcohol inside premises', 'Visitors allowed till 8:00 PM', '1 month notice before vacating'],
    images: pickPhotos(i),
    foodMenu: JSON.parse(JSON.stringify(DEFAULT_FOOD_MENU)),
    depositMonths: 1,
    status: def.status || 'approved',
    createdAt: isoDaysFromNow(-200 + i * 9),
    rooms: makeRooms(i + 1, def.floors, def.rpf, def.pf),
  };
}

export function buildSeed() {
  const users = [
    { id: 'u-super', role: 'superadmin', name: 'Platform Admin', email: 'admin@pgfinder.com', password: 'admin123', phone: '+91 9000000001', status: 'active', createdAt: isoDaysFromNow(-400) },
    { id: 'u-owner1', role: 'owner', name: 'Ravi Kumar', email: 'owner@pgfinder.com', password: 'owner123', phone: '+91 9848011111', status: 'active', createdAt: isoDaysFromNow(-300) },
    { id: 'u-owner2', role: 'owner', name: 'Lakshmi Reddy', email: 'owner2@pgfinder.com', password: 'owner123', phone: '+91 9848022222', status: 'active', createdAt: isoDaysFromNow(-250) },
    { id: 'u-owner3', role: 'owner', name: 'Suresh Gowda', email: 'owner3@pgfinder.com', password: 'owner123', phone: '+91 9848033333', status: 'pending', createdAt: isoDaysFromNow(-5) },
    { id: 'u-user1', role: 'user', name: 'Rahul Sharma', email: 'user@pgfinder.com', password: 'user123', phone: '+91 9876500001', gender: 'Male', dob: '1999-04-12', occupation: 'Software Engineer', company: 'Infosys', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-4521', emergencyName: 'Suresh Sharma', emergencyPhone: '+91 9876500099', address: 'Jaipur, Rajasthan', status: 'active', createdAt: isoDaysFromNow(-75) },
    { id: 'u-user2', role: 'user', name: 'Priya Nair', email: 'priya@pgfinder.com', password: 'user123', phone: '+91 9876500002', gender: 'Female', dob: '2000-08-21', occupation: 'Analyst', company: 'Deloitte', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-7788', emergencyName: 'Ramesh Nair', emergencyPhone: '+91 9876500098', address: 'Kochi, Kerala', status: 'active', createdAt: isoDaysFromNow(-3) },
    { id: 'u-user3', role: 'user', name: 'Arjun Verma', email: 'arjun@pgfinder.com', password: 'user123', phone: '+91 9876500003', gender: 'Male', dob: '1998-01-05', occupation: 'Student', company: 'JNTU', idType: 'PAN', idNumber: 'ABCPV1234K', emergencyName: 'Anil Verma', emergencyPhone: '+91 9876500097', address: 'Nagpur, Maharashtra', status: 'active', createdAt: isoDaysFromNow(-120) },
    { id: 'u-user4', role: 'user', name: 'Kiran Rao', email: 'kiran@pgfinder.com', password: 'user123', phone: '+91 9876500004', gender: 'Male', dob: '2001-11-30', occupation: 'Intern', company: 'TCS', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-1290', emergencyName: 'Mohan Rao', emergencyPhone: '+91 9876500096', address: 'Vijayawada, AP', status: 'active', createdAt: isoDaysFromNow(-1) },
    { id: 'u-user5', role: 'user', name: 'Sneha Iyer', email: 'sneha@pgfinder.com', password: 'user123', phone: '+91 9876500005', gender: 'Female', dob: '1997-06-18', occupation: 'Designer', company: 'Swiggy', idType: 'Aadhaar', idNumber: 'XXXX-XXXX-3344', emergencyName: 'Lata Iyer', emergencyPhone: '+91 9876500095', address: 'Chennai, TN', status: 'active', createdAt: isoDaysFromNow(-160) },
  ];

  const pgs = PG_DEFS.map(buildPg);
  const pg = (id) => pgs.find((p) => p.id === id);

  // [bookingId, userId, pgId, roomIndex, bedNo, status, moveInDaysAgo, monthsPaid]
  const BOOKINGS = [
    ['bk-1001', 'u-user1', 'pg-1', 0, 'A', 'allocated', 70, 3],
    ['bk-1002', 'u-user3', 'pg-1', 1, 'A', 'allocated', 100, 3], // overdue
    ['bk-1003', 'u-user5', 'pg-3', 0, 'A', 'allocated', 150, 5],
    ['bk-1004', 'u-user2', 'pg-2', 1, 'A', 'booked', -4, 1], // awaiting allocation
    ['bk-1005', 'u-user4', 'pg-1', 3, 'A', 'booked', -6, 1], // awaiting allocation
  ];

  const bookings = [];
  const payments = [];
  for (const [id, userId, pgId, roomIdx, bedNo, status, ago, months] of BOOKINGS) {
    const p = pg(pgId);
    const room = p.rooms[roomIdx];
    const bed = room.beds.find((b) => b.bedNo === bedNo) || room.beds[0];
    bed.status = status === 'allocated' ? 'occupied' : 'booked';
    bed.bookingId = id;
    const moveIn = isoDaysFromNow(-ago);
    const bookedOn = isoDaysFromNow(-Math.max(ago + 2, 2));
    const paidUntil = new Date(new Date(moveIn).getTime() + months * 30 * DAY).toISOString().slice(0, 10);
    bookings.push({
      id, userId, pgId, roomId: room.id, roomNo: room.roomNo, bedNo: bed.bedNo,
      rent: room.rentPerBed, deposit: room.rentPerBed * p.depositMonths,
      status, bookedOn, moveInDate: moveIn,
      allocatedOn: status === 'allocated' ? moveIn : null,
      paidUntil,
    });
    payments.push({
      id: `pay-${id}-0`, bookingId: id, userId, pgId,
      amount: room.rentPerBed + room.rentPerBed * p.depositMonths,
      type: 'Booking (Deposit + 1st month)', method: 'UPI', txnId: `TXN${Math.floor(Math.random() * 1e10)}`,
      date: bookedOn, status: 'success',
    });
    for (let m = 1; m < months; m++) {
      payments.push({
        id: `pay-${id}-${m}`, bookingId: id, userId, pgId,
        amount: room.rentPerBed, type: 'Monthly Rent', method: m % 2 ? 'Card' : 'UPI',
        txnId: `TXN${Math.floor(Math.random() * 1e10)}`,
        date: new Date(new Date(moveIn).getTime() + (m * 30 - 2) * DAY).toISOString().slice(0, 10), status: 'success',
      });
    }
  }

  const complaints = [
    { id: 'cmp-1', bookingId: 'bk-1001', userId: 'u-user1', pgId: 'pg-1', category: 'Wi-Fi / Internet', title: 'Wi-Fi very slow on 1st floor', description: 'Speed drops below 1 Mbps after 8 PM. Unable to work from home.', status: 'in-progress', createdAt: isoDaysFromNow(-3), reply: 'Technician visiting tomorrow to install a new router.' },
    { id: 'cmp-2', bookingId: 'bk-1001', userId: 'u-user1', pgId: 'pg-1', category: 'Plumbing', title: 'Bathroom tap leaking', description: 'Tap in room 101 bathroom is leaking continuously.', status: 'resolved', createdAt: isoDaysFromNow(-20), reply: 'Tap replaced on ' + isoDaysFromNow(-18) },
    { id: 'cmp-3', bookingId: 'bk-1002', userId: 'u-user3', pgId: 'pg-1', category: 'Food', title: 'Dinner served cold', description: 'Dinner has been served cold for the last 3 days.', status: 'open', createdAt: isoDaysFromNow(-1), reply: '' },
    { id: 'cmp-4', bookingId: 'bk-1003', userId: 'u-user5', pgId: 'pg-3', category: 'Housekeeping', title: 'Room not cleaned', description: 'Room not cleaned for 2 days.', status: 'open', createdAt: isoDaysFromNow(-2), reply: '' },
  ];

  const REVIEW_TEXT = [
    [5, 'Very clean rooms and tasty food. Owner is very supportive.'],
    [4, 'Good location, close to office. Wi-Fi could be better.'],
    [4, 'Value for money. Housekeeping is regular.'],
    [3, 'Decent stay, food is average on weekdays.'],
    [5, 'Feels like home! Highly recommended.'],
    [4, 'Safe and secure, CCTV everywhere.'],
  ];
  const REVIEWERS = ['Vikram', 'Anjali', 'Rohit', 'Meghana', 'Sai Teja', 'Divya', 'Naveen', 'Pooja'];
  const reviews = [];
  pgs.forEach((p, i) => {
    const count = 2 + (i % 3);
    for (let k = 0; k < count; k++) {
      const [rating, comment] = REVIEW_TEXT[(i + k) % REVIEW_TEXT.length];
      reviews.push({ id: `rv-${p.id}-${k}`, pgId: p.id, userId: null, userName: REVIEWERS[(i * 2 + k) % REVIEWERS.length], rating, comment, date: isoDaysFromNow(-(10 + k * 17 + i)) });
    }
  });
  reviews.push({ id: 'rv-user1', pgId: 'pg-1', userId: 'u-user1', userName: 'Rahul Sharma', rating: 4, comment: 'Good food and friendly staff. Wi-Fi needs improvement.', date: isoDaysFromNow(-15) });

  return {
    version: 1,
    users,
    pgs,
    bookings,
    payments,
    complaints,
    reviews,
    settings: { commissionPercent: 5 },
    meta: { nearbySeeds: [] },
  };
}

// Extra PGs generated around the visitor's real location, so "near you" always has results
// in the demo no matter where it's opened from.
const NEARBY_NAMES = ['Comfort Inn PG', 'Royal Residency PG', 'Sunrise Co-Living', 'Pearl Womens Hostel', 'Urban Nest PG'];
const NEARBY_GENDERS = ['Boys', 'Boys', 'Co-living', 'Girls', 'Boys'];

export function buildNearbyPgs(lat, lng, startIndex, placeName = 'your area') {
  return NEARBY_NAMES.map((name, k) => {
    const i = startIndex + k;
    const rand = rng(i * 97 + 11);
    const dLat = (rand() - 0.5) * 0.06;
    const dLng = (rand() - 0.5) * 0.06;
    return {
      id: `pg-${i + 1}`,
      ownerId: 'u-owner1',
      name,
      gender: NEARBY_GENDERS[k],
      address: `${Math.floor(rand() * 200) + 1}, Main Road, ${placeName}`,
      locality: placeName,
      city: placeName,
      lat: lat + dLat,
      lng: lng + dLng,
      phone: '+91 9848011111',
      description: `${name} is a ${NEARBY_GENDERS[k].toLowerCase()} PG near ${placeName} with homely food, Wi-Fi and 24x7 security.`,
      amenities: AMENITIES.filter((_, a) => rand() > 0.35),
      rules: ['Gate closes at 11:00 PM', 'No smoking / alcohol inside premises', '1 month notice before vacating'],
      images: pickPhotos(i),
      foodMenu: JSON.parse(JSON.stringify(DEFAULT_FOOD_MENU)),
      depositMonths: 1,
      status: 'approved',
      createdAt: isoDaysFromNow(-30),
      rooms: makeRooms(i + 1, 2, 3, 0.9 + rand() * 0.4),
    };
  });
}
