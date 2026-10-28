import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BedDouble, BedSingle, ChevronLeft, ChevronRight, MapPin, Snowflake, Bath, ExternalLink } from 'lucide-react';
import { Photo, Stars } from './ui';
import { inr, WEEKDAYS, todayName } from '../utils/format';
import { googleMapsUrl } from '../utils/geo';

// ---------- Image gallery ----------
export function ImageGallery({ images = [], name }) {
  const [idx, setIdx] = useState(0);
  const list = images.length ? images : [null];
  const go = (d) => setIdx((i) => (i + d + list.length) % list.length);
  return (
    <div>
      <div className="relative overflow-hidden rounded-xl">
        <Photo src={list[idx]} alt={`${name} photo ${idx + 1}`} className="h-64 w-full sm:h-96" />
        {list.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white hover:bg-black/60">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white hover:bg-black/60">
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
              {idx + 1} / {list.length}
            </span>
          </>
        )}
      </div>
      {list.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {list.map((src, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`shrink-0 overflow-hidden rounded-lg ring-2 ${i === idx ? 'ring-primary' : 'ring-transparent opacity-70 hover:opacity-100'}`}>
              <Photo src={src} alt="" className="h-14 w-20" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Room + bed picker ----------
const BED_STYLE = {
  available: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  booked: 'cursor-not-allowed border-amber-200 bg-amber-50 text-amber-600 opacity-80 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  occupied: 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500',
  selected: 'border-primary bg-primary text-white ring-2 ring-primary/30',
};

export function BedLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {[['available', 'Available'], ['selected', 'Selected'], ['booked', 'Booked'], ['occupied', 'Occupied']].map(([k, l]) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className={`size-3.5 rounded border ${BED_STYLE[k]}`} />
          {l}
        </span>
      ))}
    </div>
  );
}

export function RoomCard({ room, selected, onSelectBed, compact }) {
  const free = room.beds.filter((b) => b.status === 'available').length;
  const Icon = room.sharing === 1 ? BedSingle : BedDouble;
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Room {room.roomNo}</span>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">Floor {room.floor}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{room.type}</span>
            {room.ac && <span className="inline-flex items-center gap-1"><Snowflake className="size-3" />AC</span>}
            {room.attachedBathroom && <span className="inline-flex items-center gap-1"><Bath className="size-3" />Attached bath</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-foreground">{inr(room.rentPerBed)}<span className="text-xs font-normal text-muted-foreground">/bed/mo</span></div>
          {room.dailyRentPerBed > 0 && <div className="text-xs text-muted-foreground">{inr(room.dailyRentPerBed)}/bed/day</div>}
          <div className={`text-xs font-medium ${free ? 'text-emerald-600' : 'text-red-500'}`}>{free ? `${free} of ${room.beds.length} beds free` : 'Full'}</div>
        </div>
      </div>
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          {room.beds.map((bed) => {
            const isSel = selected && selected.roomId === room.id && selected.bedNo === bed.bedNo;
            const style = isSel ? BED_STYLE.selected : BED_STYLE[bed.status];
            return (
              <button
                key={bed.bedNo}
                disabled={bed.status !== 'available' || !onSelectBed}
                onClick={() => onSelectBed?.(room, bed)}
                className={`flex w-16 flex-col items-center rounded-lg border-2 px-2 py-2 text-xs font-semibold transition ${style}`}
                title={`Bed ${bed.bedNo} - ${bed.status}`}
              >
                <Icon className="mb-0.5 size-5" />
                Bed {bed.bedNo}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- PG list card ----------
export function PGCard({ pg, stats, rating, distance, active, onHover }) {
  return (
    <div
      onMouseEnter={() => onHover?.(pg.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row ${active ? 'border-primary' : 'border-border/80'}`}
    >
      <Link to={`/pg/${pg.id}`} className="relative sm:w-56 sm:shrink-0">
        <Photo src={pg.images[0]} alt={pg.name} className="h-44 w-full sm:h-full" />
        <span className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{pg.gender}</span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link to={`/pg/${pg.id}`} className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground group-hover:text-primary">{pg.name}</h3>
          {rating.count > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-xs font-semibold text-white">
              {rating.avg.toFixed(1)} ★
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{pg.address}, {pg.city}</span>
        </div>
        </Link>
        <a
          href={googleMapsUrl(pg)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink className="size-3.5" /> View location on Google Maps
        </a>
        <Link to={`/pg/${pg.id}`} className="flex flex-1 flex-col">
        {distance != null && <div className="mt-1 text-xs font-medium text-primary">{distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`} away</div>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pg.amenities.slice(0, 5).map((a) => (
            <span key={a} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{a}</span>
          ))}
          {pg.amenities.length > 5 && <span className="text-[11px] text-muted-foreground">+{pg.amenities.length - 5} more</span>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <div className="text-xs text-muted-foreground">Starts from</div>
            <div className="text-lg font-semibold text-foreground">{inr(stats.minRent)}<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stats.available ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-950/50'}`}>
            {stats.available ? `${stats.available} beds available` : 'Fully occupied'}
          </span>
        </div>
        </Link>
      </div>
    </div>
  );
}

// ---------- Map ----------
const meIcon = L.divIcon({ className: '', html: '<div class="me-marker"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });
const priceIcon = (label, active) =>
  L.divIcon({ className: '', html: `<div class="pg-marker ${active ? 'active' : ''}">${label}</div>`, iconSize: [0, 0] });

function Recenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom ?? map.getZoom());
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

export function PGMap({ center, items = [], activeId, height = 'h-[420px]', zoom = 13, showMe = true }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-border ${height}`}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Recenter center={center} zoom={zoom} />
        {showMe && <Marker position={[center.lat, center.lng]} icon={meIcon}><Popup>{center.name || 'Search location'}</Popup></Marker>}
        {items.map(({ pg, stats }) => (
          <Marker key={pg.id} position={[pg.lat, pg.lng]} icon={priceIcon(inr(stats.minRent), pg.id === activeId)} zIndexOffset={pg.id === activeId ? 1000 : 0}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{pg.name}</div>
                <div className="text-xs text-slate-500">{pg.gender} · {stats.available} beds free</div>
                <a href={`/pg/${pg.id}`} className="text-xs font-semibold text-blue-600">View details →</a>
                <br />
                <a href={googleMapsUrl(pg)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600">Open in Google Maps</a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// ---------- Food menu ----------
export function FoodMenuTable({ menu, highlightToday = true }) {
  const today = todayName();
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className="th">Day</th>
            <th className="th">Breakfast</th>
            <th className="th">Lunch</th>
            <th className="th">Dinner</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {WEEKDAYS.map((d) => (
            <tr key={d} className={highlightToday && d === today ? 'bg-primary/5' : ''}>
              <td className="td font-semibold">
                {d}
                {highlightToday && d === today && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] text-white">TODAY</span>}
              </td>
              <td className="td whitespace-normal">{menu?.[d]?.breakfast || '—'}</td>
              <td className="td whitespace-normal">{menu?.[d]?.lunch || '—'}</td>
              <td className="td whitespace-normal">{menu?.[d]?.dinner || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReviewList({ reviews }) {
  if (!reviews.length) return <p className="text-sm text-muted-foreground">No reviews yet.</p>;
  return (
    <div className="divide-y divide-border/70">
      {reviews.map((r) => (
        <div key={r.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">{r.userName[0]}</span>
              <span className="text-sm font-medium text-foreground">{r.userName}</span>
            </div>
            <Stars value={r.rating} size="size-3.5" />
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p>
        </div>
      ))}
    </div>
  );
}
