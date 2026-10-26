import { LOCALITIES } from '../data/seed';

export function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}

/** Resolve a typed place name: known demo localities first, then OpenStreetMap Nominatim. */
export async function geocode(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const local = LOCALITIES.find((l) => l.name.toLowerCase().includes(q));
  if (local) return local;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json' },
    });
    const [hit] = await res.json();
    if (hit) return { name: hit.display_name.split(',').slice(0, 2).join(','), lat: Number(hit.lat), lng: Number(hit.lon) };
  } catch {
    // offline / rate limited - caller falls back to text filtering
  }
  return null;
}

export async function reverseGeocode({ lat, lng }) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=14&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    const a = data.address || {};
    return a.suburb || a.neighbourhood || a.city_district || a.town || a.city || a.village || 'Your location';
  } catch {
    return 'Your location';
  }
}
