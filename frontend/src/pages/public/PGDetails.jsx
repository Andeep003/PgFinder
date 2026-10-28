import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, CheckCircle2, MapPin, Phone, ShieldCheck, Utensils } from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import { BedLegend, FoodMenuTable, ImageGallery, PGMap, ReviewList, RoomCard } from '../../components/pg';
import { Card, EmptyState, Stars } from '../../components/ui';
import { useDB, findPg, pgStats, pgRating, findUser } from '../../store/db';
import { inr } from '../../utils/format';
import { apiGet, apiImageUrl } from '../../api';

export default function PGDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const db = useDB();
  const [apiPg, setApiPg] = useState(null);
  const localPg = findPg(db, id);
  const pg = apiPg ?? localPg;
  const [selected, setSelected] = useState(null);
  const [floor, setFloor] = useState('All');
  const [onlyFree, setOnlyFree] = useState(false);

  useEffect(() => {
    let active = true;
    apiGet(`/api/pgs/${encodeURIComponent(id)}`)
      .then((listing) => {
        if (active) setApiPg({ ...listing, images: (listing.images || []).map(apiImageUrl) });
      })
      .catch(() => {
        if (active) setApiPg(null);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const reviews = useMemo(() => db.reviews.filter((r) => r.pgId === id).sort((a, b) => b.date.localeCompare(a.date)), [db, id]);

  if (!pg) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <EmptyState title="PG not found"><Link to="/" className="text-primary">Back to search</Link></EmptyState>
      </div>
    );
  }

  const stats = pgStats(pg);
  const rating = pgRating(db, pg.id);
  const owner = findUser(db, pg.ownerId);
  const floors = [...new Set(pg.rooms.map((r) => r.floor))];
  const rooms = pg.rooms
    .filter((r) => floor === 'All' || r.floor === Number(floor))
    .filter((r) => !onlyFree || r.beds.some((b) => b.status === 'available'));
  const selRoom = selected && pg.rooms.find((r) => r.id === selected.roomId);

  const bookSlot = () => {
    navigate(`/book/${pg.id}?room=${selected.roomId}&bed=${selected.bedNo}`);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <PublicNavbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to results
        </button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <ImageGallery images={pg.images} name={pg.name} />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{pg.gender} PG</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <ShieldCheck className="size-3.5" /> Verified
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{pg.name}</h1>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" /> {pg.address}, {pg.city}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Stars value={rating.avg} />
                <span className="font-semibold text-foreground">{rating.avg ? rating.avg.toFixed(1) : 'New'}</span>
                <span className="text-muted-foreground">({rating.count} reviews)</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{pg.description}</p>
            </div>

            <Card title="Amenities">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {pg.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="size-4 text-emerald-500" /> {a}
                  </div>
                ))}
              </div>
            </Card>

            <Card
              title={`Rooms & bed availability (${stats.available} of ${stats.totalBeds} beds free)`}
              actions={
                <div className="flex items-center gap-2">
                  <select className="input h-8 w-auto py-0 text-xs" value={floor} onChange={(e) => setFloor(e.target.value)}>
                    <option value="All">All floors</option>
                    {floors.map((f) => <option key={f} value={f}>Floor {f}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} /> Free only
                  </label>
                </div>
              }
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">Select an available bed, then click <b>Book this slot</b>.</p>
                <BedLegend />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {rooms.map((room) => (
                  <RoomCard key={room.id} room={room} selected={selected} onSelectBed={(r, b) => setSelected({ roomId: r.id, bedNo: b.bedNo })} />
                ))}
              </div>
            </Card>

            <Card title={<span className="inline-flex items-center gap-2"><Utensils className="size-4" /> Weekly food menu</span>} bodyClass="p-0">
              <FoodMenuTable menu={pg.foodMenu} />
            </Card>

            <Card title="House rules">
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {pg.rules.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </Card>

            <Card title={`Reviews (${reviews.length})`}>
              <ReviewList reviews={reviews} />
            </Card>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="card p-5">
              <div className="text-xs text-muted-foreground">Rent starts from</div>
              <div className="text-2xl font-bold text-foreground">{inr(stats.minRent)}<span className="text-sm font-normal text-muted-foreground"> /month</span></div>
              <div className="mt-1 text-xs text-muted-foreground">Up to {inr(stats.maxRent)} · Deposit {pg.depositMonths} month rent</div>
              <div className="mt-4 rounded-lg bg-muted/60 p-3 text-sm">
                {selRoom ? (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your selection</div>
                    <div className="mt-1 font-semibold text-foreground">Room {selRoom.roomNo} · Bed {selected.bedNo}</div>
                    <div className="text-xs text-muted-foreground">{selRoom.type}{selRoom.ac ? ' · AC' : ''}</div>
                    <div className="mt-1 font-semibold text-foreground">{inr(selRoom.rentPerBed)}/month</div>
                    {selRoom.dailyRentPerBed > 0 && <div className="text-xs text-muted-foreground">{inr(selRoom.dailyRentPerBed)}/day</div>}
                  </>
                ) : (
                  <span className="text-muted-foreground">No bed selected yet. Pick a green bed from the rooms list.</span>
                )}
              </div>
              <button className="btn-primary mt-4 w-full" disabled={!selected} onClick={bookSlot}>
                <CalendarCheck className="size-4" /> Book this slot
              </button>
              <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                <span className="flex size-9 items-center justify-center rounded-full bg-owner text-sm font-semibold text-white">{owner?.name?.[0]}</span>
                <div className="text-sm">
                  <div className="font-medium text-foreground">{owner?.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="size-3" />{pg.phone}</div>
                </div>
              </div>
            </div>
            <PGMap center={{ lat: pg.lat, lng: pg.lng, name: pg.name }} items={[{ pg, stats }]} height="h-56" zoom={15} showMe={false} />
          </aside>
        </div>
      </main>

      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card p-3 shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-semibold text-foreground">Room {selRoom?.roomNo} · Bed {selected.bedNo}</div>
              <div className="text-xs text-muted-foreground">{inr(selRoom?.rentPerBed)}/month</div>
              {selRoom?.dailyRentPerBed > 0 && <div className="text-xs text-muted-foreground">{inr(selRoom.dailyRentPerBed)}/day</div>}
            </div>
            <button className="btn-primary" onClick={bookSlot}>Book this slot</button>
          </div>
        </div>
      )}
    </div>
  );
}
