import { coordinatesFromGoogleMapsUrl, googleMapsUrl, isGoogleMapsUrl } from './geo';

test('accepts HTTPS Google Maps share links and rejects other hosts', () => {
  expect(isGoogleMapsUrl('https://maps.app.goo.gl/example')).toBe(true);
  expect(isGoogleMapsUrl('https://www.google.com/maps/place/Example')).toBe(true);
  expect(isGoogleMapsUrl('http://www.google.com/maps/place/Example')).toBe(false);
  expect(isGoogleMapsUrl('https://example.com/maps/place/Example')).toBe(false);
});

test('reads coordinates from common Google Maps URL formats', () => {
  expect(coordinatesFromGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=17.44,78.39'))
    .toEqual({ lat: 17.44, lng: 78.39 });
  expect(coordinatesFromGoogleMapsUrl('https://www.google.com/maps/place/Example/@17.44,78.39,17z'))
    .toEqual({ lat: 17.44, lng: 78.39 });
  expect(coordinatesFromGoogleMapsUrl('https://www.google.com/maps/place/Example/data=!3d17.44!4d78.39'))
    .toEqual({ lat: 17.44, lng: 78.39 });
  expect(coordinatesFromGoogleMapsUrl('https://maps.app.goo.gl/example')).toBeNull();
});

test('creates a Google Maps link from coordinates when no share link exists', () => {
  expect(googleMapsUrl({ lat: 17.44, lng: 78.39 }))
    .toBe('https://www.google.com/maps/search/?api=1&query=17.44%2C78.39');
});
