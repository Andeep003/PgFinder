import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Crosshair, Loader2, MapPin, Search, SlidersHorizontal, Map as MapIcon, List } from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import { PGCard, PGMap } from '../../components/pg';
import { EmptyState } from '../../components/ui';
import { useDB, pgStats, pgRating, isPgPublic, ensureNearbyDemoPgs, getState } from '../../store/db';
import { DEFAULT_LOCATION, LOCALITIES } from '../../data/seed';
import { distanceKm, geocode, getCurrentPosition, reverseGeocode } from '../../utils/geo';
import { apiGet, apiImageUrl } from '../../api';

const LOC_KEY = 'pgfinder-last-location';
const RADII = [2, 5, 10, 25, 50];

export default function Home() {
  const db = useDB();
  const [center, setCenter] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(LOC_KEY)) || null;
    } catch {
      return null;
    }
  });
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [query, setQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [gender, setGender] = useState('All');
  const [sharing, setSharing] = useState('Any');
  const [budget, setBudget] = useState(20000);
  const [radius, setRadius] = useState(10);
  const [sort, setSort] = useState('distance');
  const [view, setView] = useState('list');
  const [hoverId, setHoverId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [apiPgs, setApiPgs] = useState(null);
  const [apiStatus, setApiStatus] = useState('loading');
  const centerLat = center?.lat;
  const centerLng = center?.lng;

  useEffect(() => {
    if (centerLat == null || centerLng == null) return undefined;
    let active = true;
    const params = new URLSearchParams({
      lat: String(centerLat),
      lng: String(centerLng),
      sort: sort === 'price' ? 'price' : 'distance',
    });
    if (radius !== 'any' && !nameQuery) params.set('radiusKm', String(radius));
    if (nameQuery) params.set('name', nameQuery);
    if (gender !== 'All') params.set('gender', gender);
    if (sharing !== 'Any') params.set('sharing', sharing);
    params.set('maxRent', String(budget));

    setApiStatus('loading');
    apiGet(`/api/pgs?${params}`)
      .then((listings) => {
        if (!active) return;
        setApiPgs(listings.map((pg) => ({
          ...pg,
          images: (pg.images || []).map(apiImageUrl),
        })));
        setApiStatus('connected');
      })
      .catch(() => {
        if (!active) return;
        setApiPgs(null);
        setApiStatus('offline');
      });

    return () => {
      active = false;
    };
  }, [centerLat, centerLng, radius, gender, sharing, budget, sort, nameQuery]);

  const applyCenter = useCallback((c) => {
    setCenter(c);
    try {
      sessionStorage.setItem(LOC_KEY, JSON.stringify(c));
    } catch {
      // ignore
    }
  }, []);

  const locateMe = useCallback(async () => {
    setLocating(true);
    setLocError('');
    try {
      const pos = await getCurrentPosition();
      const name = await reverseGeocode(pos);
      // Make sure the demo has PGs around wherever the visitor actually is.
      const s = getState();
      const hasNearby = s.pgs.some((p) => isPgPublic(s, p) && distanceKm(pos, p) < 15);
      if (!hasNearby) ensureNearbyDemoPgs(pos.lat, pos.lng, name);
      applyCenter({ ...pos, name, source: 'gps' });
    } catch {
      setLocError('Location access was denied or unavailable, so we are showing PGs near the default location. Search for any area above.');
      applyCenter({ ...DEFAULT_LOCATION, source: 'default' });
    } finally {
      setLocating(false);
    }
  }, [applyCenter]);

  // Default behaviour: search around the visitor's current location.
  useEffect(() => {
    if (!center) locateMe();
  }, [center, locateMe]);

  const onSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    const searchTerm = query.trim();
    setSearching(true);
    setLocError('');

    try {
      const matches = await apiGet(`/api/pgs?name=${encodeURIComponent(searchTerm)}`);
      const hasLocalMatch = db.pgs.some((pg) =>
        isPgPublic(db, pg) && pg.name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (matches.length > 0 || hasLocalMatch) {
        setNameQuery(searchTerm);
        setSearching(false);
        return;
      }
    } catch {
      const hasLocalMatch = db.pgs.some((pg) =>
        isPgPublic(db, pg) && pg.name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (hasLocalMatch) {
        setNameQuery(searchTerm);
        setSearching(false);
        return;
      }
    }

    const hit = await geocode(searchTerm);
    if (hit) {
      setNameQuery('');
      applyCenter({ ...hit, source: 'search' });
    } else {
      setNameQuery(searchTerm);
      setLocError(`No PG name or location matched "${searchTerm}". Try another name, area, locality, or city.`);
    }
    setSearching(false);
  };

  const results = useMemo(() => {
    if (!center) return [];
    const localListings = db.pgs.filter((pg) => isPgPublic(db, pg));
    const apiIds = new Set((apiPgs ?? []).map((pg) => pg.id));
    const listings = [...new Map([...localListings, ...(apiPgs ?? [])].map((pg) => [pg.id, pg])).values()];
    return listings
      .map((pg) => ({
        pg,
        stats: pg.stats ?? pgStats(pg),
        rating: pgRating(db, pg.id),
        distance: pg.distanceKm ?? distanceKm(center, pg),
        localOnly: !apiIds.has(pg.id),
      }))
      .filter((r) => !nameQuery || r.pg.name.toLowerCase().includes(nameQuery.toLowerCase()))
      .filter((r) => !r.localOnly || nameQuery || radius === 'any' || r.distance <= radius)
      .filter((r) => !r.localOnly || gender === 'All' || r.pg.gender === gender)
      .filter((r) => !r.localOnly || r.stats.minRent <= budget)
      .filter((r) => !r.localOnly || sharing === 'Any' || r.pg.rooms.some((room) => room.sharing === Number(sharing) && room.beds.some((b) => b.status === 'available')))
      .sort((a, b) =>
        sort === 'price' ? a.stats.minRent - b.stats.minRent : sort === 'rating' ? b.rating.avg - a.rating.avg : a.distance - b.distance,
      );
  }, [db, apiPgs, center, radius, gender, budget, sharing, sort, nameQuery]);

  const filters = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div>
        <label className="label">PG for</label>
        <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
          {['All', 'Boys', 'Girls', 'Co-living'].map((g) => <option key={g}>{g}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Sharing</label>
        <select className="input" value={sharing} onChange={(e) => setSharing(e.target.value)}>
          <option value="Any">Any</option>
          <option value="1">Single</option>
          <option value="2">Double</option>
          <option value="3">Triple</option>
          <option value="4">Four</option>
        </select>
      </div>
      <div>
        <label className="label">Within</label>
        <select className="input" value={radius} onChange={(e) => setRadius(e.target.value === 'any' ? 'any' : Number(e.target.value))}>
          {RADII.map((r) => <option key={r} value={r}>{r} km</option>)}
          <option value="any">Anywhere</option>
        </select>
      </div>
      <div>
        <label className="label">Sort by</label>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="distance">Nearest first</option>
          <option value="price">Price: low to high</option>
          <option value="rating">Top rated</option>
        </select>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <label className="label">Max rent: ₹{budget.toLocaleString('en-IN')}</label>
        <input type="range" min={4000} max={20000} step={500} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="mt-3 w-full accent-blue-600" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-violet-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Find a PG near you</h1>
          <p className="mt-2 max-w-xl text-sm text-blue-100 sm:text-base">Verified PGs, real photos, live bed availability. Book your bed online in minutes.</p>
          <form onSubmit={onSearch} className="mt-6 flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-lg sm:flex-row">
            <div className="flex flex-1 items-center gap-2 px-2">
              <Search className="size-5 shrink-0 text-slate-400" />
              <input
                list="localities"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by PG name or area (e.g. Pakka Telangana, Madhapur)"
                className="h-11 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <datalist id="localities">{LOCALITIES.map((l) => <option key={l.name} value={l.name} />)}</datalist>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={locateMe} disabled={locating} className="btn flex-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 sm:flex-none">
                {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
                Near me
              </button>
              <button type="submit" disabled={searching} className="btn-primary flex-1 sm:flex-none">
                {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Search
              </button>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {LOCALITIES.slice(0, 7).map((l) => (
              <button key={l.name} onClick={() => applyCenter({ ...l, source: 'search' })} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white hover:bg-white/25">
                {l.name.split(',')[0]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {locError && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{locError}</div>}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary" />
              {center ? (
                <>
                  {center.source === 'gps' ? 'Near your current location' : 'Showing PGs near'} · <span className="font-semibold text-foreground">{center.name}</span>
                </>
              ) : (
                'Detecting your location…'
              )}
            </div>
            <div className="mt-0.5 text-lg font-semibold text-foreground">{results.length} PGs found</div>
            <div className="mt-1 text-xs text-muted-foreground" role="status">
              {apiStatus === 'connected' && 'Live listings from backend'}
              {apiStatus === 'loading' && 'Connecting to backend…'}
              {apiStatus === 'offline' && 'Backend unavailable — showing local demo listings'}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline lg:hidden" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="size-4" />
              Filters
            </button>
            <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
              <button onClick={() => setView('list')} className={`btn px-3 py-1.5 ${view === 'list' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                <List className="size-4" /> List
              </button>
              <button onClick={() => setView('map')} className={`btn px-3 py-1.5 ${view === 'map' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                <MapIcon className="size-4" /> Map
              </button>
            </div>
          </div>
        </div>

        <div className={`card mb-5 p-4 ${showFilters ? '' : 'hidden lg:block'}`}>{filters}</div>

        {!center ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" /> Finding PGs around you…
          </div>
        ) : (
          <div className={`grid gap-5 ${view === 'map' ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : ''}`}>
            <div className={`${view === 'map' ? 'order-2 lg:order-1' : ''}`}>
              {results.length === 0 ? (
                <div className="card">
                  <EmptyState icon={MapPin} title="No PGs match your filters">
                    Try increasing the distance, raising your budget, or searching another area.
                    <div className="mt-3">
                      <button className="btn-outline" onClick={() => setRadius('any')}>Search anywhere</button>
                    </div>
                  </EmptyState>
                </div>
              ) : (
                <div className={`grid gap-4 ${view === 'list' ? 'xl:grid-cols-2' : ''}`}>
                  {results.map((r) => (
                    <PGCard key={r.pg.id} {...r} active={hoverId === r.pg.id} onHover={setHoverId} />
                  ))}
                </div>
              )}
            </div>
            {view === 'map' && (
              <div className="order-1 lg:order-2">
                <div className="lg:sticky lg:top-20">
                  <PGMap center={center} items={results} activeId={hoverId} height="h-[320px] lg:h-[calc(100vh-7rem)]" zoom={radius === 'any' || radius > 10 ? 11 : 13} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
