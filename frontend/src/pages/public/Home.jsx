import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BedDouble, Crosshair, Loader2, MapPin, Search, SlidersHorizontal, Map as MapIcon, List, ShieldCheck, Wallet, Star } from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import { PGCard, PGMap } from '../../components/pg';
import { BrandLogo, EmptyState, Segmented } from '../../components/ui';
import { useDB, pgStats, pgRating, isPgPublic, ensureNearbyDemoPgs, getState } from '../../store/db';
import { DEFAULT_LOCATION, LOCALITIES } from '../../data/seed';
import { distanceKm, geocode, getCurrentPosition, reverseGeocode } from '../../utils/geo';
import { apiGet, apiImageUrl } from '../../api';

const LOC_KEY = 'pgfinder-last-location';
const RADII = [2, 5, 10, 25, 50];

const GENDERS = ['All', 'Boys', 'Girls', 'Co-living'].map((g) => ({ value: g, label: g }));
const SHARING = [
  { value: 'Any', label: 'Any' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
];
const VIEWS = [
  { value: 'list', label: 'List', icon: List },
  { value: 'map', label: 'Map', icon: MapIcon },
];
const CHIP_TONES = [
  'bg-mist-50 text-mist-700 ring-mist-200 hover:bg-mist-100 dark:bg-mist-900/30 dark:text-mist-200 dark:ring-mist-800',
  'bg-ember-50 text-ember-700 ring-ember-200 hover:bg-ember-100 dark:bg-ember-900/30 dark:text-ember-200 dark:ring-ember-800',
  'bg-sage-50 text-sage-700 ring-sage-200 hover:bg-sage-100 dark:bg-sage-900/30 dark:text-sage-200 dark:ring-sage-800',
  'bg-plum-50 text-plum-700 ring-plum-200 hover:bg-plum-100 dark:bg-plum-900/40 dark:text-plum-200 dark:ring-plum-800',
  'bg-coral-50 text-coral-700 ring-coral-200 hover:bg-coral-100 dark:bg-coral-900/30 dark:text-coral-200 dark:ring-coral-800',
  'bg-butter-100 text-butter-700 ring-butter-300 hover:bg-butter-200 dark:bg-butter-700/20 dark:text-butter-200 dark:ring-butter-700',
];
const FEATURES = [
  { title: 'Live beds', text: 'See exactly which beds are free right now.', icon: BedDouble, tone: 'bg-mist-100 text-mist-900 dark:bg-mist-900/60 dark:text-mist-50', iconTone: 'text-mist-600 dark:text-mist-200' },
  { title: 'Verified', text: 'Real photos, approved owners.', icon: ShieldCheck, tone: 'bg-sage-100 text-sage-900 dark:bg-sage-900/60 dark:text-sage-50', iconTone: 'text-sage-600 dark:text-sage-200' },
  { title: 'Pay online', text: 'Book and pay rent in a tap.', icon: Wallet, tone: 'bg-ember-100 text-ember-900 dark:bg-ember-900/60 dark:text-ember-50', iconTone: 'text-ember-600 dark:text-ember-200' },
  { title: 'Honest reviews', text: 'Ratings from residents.', icon: Star, tone: 'bg-plum-100 text-plum-900 dark:bg-plum-900/70 dark:text-plum-50', iconTone: 'text-plum-600 dark:text-plum-200' },
];

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
  const resultsHeadingRef = useRef(null);
  const centerLat = center?.lat;
  const centerLng = center?.lng;

  const scrollToResults = () => {
    window.requestAnimationFrame(() => {
      resultsHeadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

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
        scrollToResults();
        setSearching(false);
        return;
      }
    } catch {
      const hasLocalMatch = db.pgs.some((pg) =>
        isPgPublic(db, pg) && pg.name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (hasLocalMatch) {
        setNameQuery(searchTerm);
        scrollToResults();
        setSearching(false);
        return;
      }
    }

    const hit = await geocode(searchTerm);
    if (hit) {
      setNameQuery('');
      applyCenter({ ...hit, source: 'search' });
      scrollToResults();
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
    <div className="grid grid-cols-2 items-end gap-4 sm:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
      <div className="col-span-2 sm:col-span-3 lg:col-span-1">
        <label className="label">Sharing (beds per room)</label>
        <Segmented ariaLabel="Sharing" value={sharing} onChange={setSharing} options={SHARING} className="w-full" />
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
        <input type="range" min={4000} max={20000} step={500} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="mt-3 w-full" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <section className="relative isolate overflow-hidden">

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div>
            <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-sage-200 bg-sage-50/80 px-3 py-1 text-xs font-semibold text-sage-700 backdrop-blur dark:border-sage-800 dark:bg-sage-900/30 dark:text-sage-300">
              <span className="relative flex size-2"><span className="absolute inset-0 animate-ping rounded-full bg-sage-400 opacity-60" /><span className="relative size-2 rounded-full bg-sage-500" /></span>
              Live bed availability
            </span>
            <h1 className="mt-5 max-w-2xl animate-fade-up font-display text-[40px] font-medium leading-[1.05] tracking-tight text-foreground [animation-delay:60ms] sm:text-6xl lg:text-[68px]">
              Find a PG that feels like{' '}
              <span className="font-bold text-primary">home</span>
              .
            </h1>
            <p className="mt-5 max-w-xl animate-fade-up text-base text-muted-foreground [animation-delay:120ms] sm:text-lg">
              Verified PGs, real photos and live bed availability. Compare, book your bed and pay online in minutes.
            </p>

            <div className="mt-8 max-w-2xl animate-fade-up rounded-[28px] border border-border/70 bg-card/90 p-3 shadow-xl backdrop-blur-xl transition-shadow duration-400 ease-ios [animation-delay:180ms] focus-within:shadow-lg sm:p-4">
              <div className="flex flex-wrap items-center gap-3 px-1 pb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Looking for</span>
                <Segmented size="sm" ariaLabel="PG for" value={gender} onChange={setGender} options={GENDERS} />
              </div>
              <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-2xl bg-muted/70 px-3.5 ring-primary/30 transition-shadow duration-250 focus-within:ring-2">
                  <Search className="size-5 shrink-0 text-primary" />
                  <input
                    list="localities"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="PG name, area or city"
                    aria-label="Search by PG name or area"
                    className="h-12 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/70 sm:text-sm"
                  />
                  <datalist id="localities">{LOCALITIES.map((l) => <option key={l.name} value={l.name} />)}</datalist>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={locateMe} disabled={locating} className="btn-outline h-12 flex-1 rounded-2xl sm:flex-none">
                    {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
                    Near me
                  </button>
                  <button type="submit" disabled={searching} className="btn-primary h-12 flex-1 rounded-2xl px-6 sm:flex-none">
                    {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                    Search
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-5 flex animate-fade-up flex-wrap items-center gap-2 [animation-delay:240ms]">
              <span className="mr-1 text-xs font-medium text-muted-foreground">Popular:</span>
              {LOCALITIES.slice(0, 7).map((l, i) => (
                <button key={l.name} onClick={() => applyCenter({ ...l, source: 'search' })} className={`chip ${CHIP_TONES[i % CHIP_TONES.length]}`}>
                  <MapPin className="size-3" />
                  {l.name.split(',')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="relative hidden animate-fade-up [animation-delay:200ms] lg:block">
            <div className="grid grid-cols-2 gap-4">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className={`group relative overflow-hidden rounded-[28px] p-5 shadow-lg transition-all duration-400 ease-ios hover:-translate-y-1.5 hover:shadow-xl ${f.tone} ${i === 0 ? 'row-span-2 flex flex-col justify-between' : ''} ${i === FEATURES.length - 1 ? 'col-span-2 flex items-center gap-4 [&>div:last-child]:mt-0' : ''}`}
                >
                  <span className="relative flex size-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm transition-transform duration-400 ease-spring group-hover:-rotate-6 group-hover:scale-110 dark:bg-white/15">
                    <f.icon className={`size-5 ${f.iconTone}`} />
                  </span>
                  <div className="relative mt-6">
                    <div className="font-display text-xl font-semibold leading-tight">{f.title}</div>
                    <div className="mt-1 text-sm opacity-75">{f.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute -left-10 top-[30%] flex animate-float items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 pr-5 shadow-xl">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white"><BedDouble className="size-5" /></span>
              <div>
                <div className="text-sm font-bold text-foreground">{results.length} PGs nearby</div>
                <div className="text-xs text-muted-foreground">{center?.name ? center.name.split(',')[0] : 'Finding your area…'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {locError && <div className="mb-4 animate-fade-up rounded-2xl border border-butter-300 bg-butter-100/70 px-4 py-3 text-sm text-butter-700 dark:border-butter-700 dark:bg-butter-700/15 dark:text-butter-200">{locError}</div>}

        <div ref={resultsHeadingRef} className="mb-4 scroll-mt-24 flex flex-wrap items-center justify-between gap-3">
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
            <div className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">{results.length} <span className="text-primary">PGs</span> found</div>
            <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
              <span className={`size-1.5 rounded-full ${apiStatus === 'connected' ? 'bg-sage-500' : apiStatus === 'loading' ? 'animate-pulse bg-butter-400' : 'bg-stone-400'}`} />
              {apiStatus === 'connected' && 'Live listings from backend'}
              {apiStatus === 'loading' && 'Connecting to backend…'}
              {apiStatus === 'offline' && 'Backend unavailable — showing local demo listings'}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline rounded-full lg:hidden" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="size-4" />
              Filters
            </button>
            <Segmented ariaLabel="View" value={view} onChange={setView} options={VIEWS} />
          </div>
        </div>

        <div className={`card mb-6 p-4 sm:p-5 ${showFilters ? 'animate-fade-up' : 'hidden lg:block'}`}>{filters}</div>

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
                  {results.map((r, i) => (
                    <div key={r.pg.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}>
                      <PGCard {...r} active={hoverId === r.pg.id} onHover={setHoverId} />
                    </div>
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

      <footer className="mt-10 border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
          <div>
            <BrandLogo />
            <p className="mt-2 text-sm text-muted-foreground">Comfortable stays, simply found.</p>
          </div>
          <div className="flex items-center gap-1.5" aria-hidden>
            {['bg-ember-500', 'bg-coral-500', 'bg-plum-500', 'bg-mist-400', 'bg-sage-400', 'bg-butter-400'].map((c) => (
              <span key={c} className={`size-2.5 rounded-full ${c}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} PG Finder</p>
        </div>
      </footer>
    </div>
  );
}
