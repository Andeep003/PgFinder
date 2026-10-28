import { LOCALITIES } from '../data/seed';

export function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isGoogleMapsUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    if (['maps.app.goo.gl', 'maps.google.com'].includes(url.hostname)) return true;
    return ['goo.gl', 'google.com', 'www.google.com'].includes(url.hostname)
      && url.pathname.startsWith('/maps');
  } catch {
    return false;
  }
}

export function googleMapsUrl(pg) {
  if (isGoogleMapsUrl(pg.googleMapsUrl)) return pg.googleMapsUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pg.lat},${pg.lng}`)}`;
}

export function coordinatesFromGoogleMapsUrl(value) {
  if (!isGoogleMapsUrl(value)) return null;
  const url = new URL(value);
  const direct = [url.searchParams.get('query'), url.searchParams.get('q'), url.searchParams.get('ll')]
    .find((coordinate) => coordinate && /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(coordinate));
  const match = direct?.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)
    || url.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
    || url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
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
