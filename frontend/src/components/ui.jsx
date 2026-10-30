import React, { useEffect, useState } from 'react';
import { Star, X, ImageOff, Inbox } from 'lucide-react';

const TONE_BAR = {
  default: 'from-primary/60 to-primary/15',
  good: 'from-emerald-500/70 to-emerald-500/15',
  bad: 'from-red-500/70 to-red-500/15',
  warn: 'from-amber-500/70 to-amber-500/15',
  purple: 'from-violet-500/70 to-violet-500/15',
};

export function StatTile({ label, value, hint, icon: Icon, tone = 'default' }) {
  return (
    <div className="card relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${TONE_BAR[tone] || TONE_BAR.default}`} />
      <div className="flex items-start justify-between gap-2 px-4 py-3.5">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{label}</div>
          <div className="mt-1.5 truncate text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</div>
          {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
        </div>
        {Icon && <Icon className="size-5 shrink-0 text-muted-foreground/70" />}
      </div>
    </div>
  );
}

const TONES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  danger: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
  purple: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300',
  neutral: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
};
const DOTS = { success: 'bg-emerald-500', danger: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-blue-500', purple: 'bg-violet-500', neutral: 'bg-slate-400' };

const STATUS_MAP = {
  active: ['success', 'Active'],
  approved: ['success', 'Approved'],
  allocated: ['success', 'Allocated'],
  vacate_requested: ['warning', 'Vacate requested'],
  resolved: ['success', 'Resolved'],
  success: ['success', 'Paid'],
  available: ['success', 'Available'],
  paid: ['success', 'Paid'],
  booked: ['warning', 'Booked · Awaiting allocation'],
  pending: ['warning', 'Pending'],
  open: ['danger', 'Open'],
  'in-progress': ['info', 'In progress'],
  payment_pending: ['neutral', 'Payment pending'],
  occupied: ['purple', 'Occupied'],
  overdue: ['danger', 'Overdue'],
  'due-soon': ['warning', 'Due soon'],
  disabled: ['danger', 'Disabled'],
  rejected: ['danger', 'Rejected'],
  cancelled: ['danger', 'Cancelled'],
  vacated: ['neutral', 'Vacated'],
};

export function StatusBadge({ status, label }) {
  const [tone, text] = STATUS_MAP[status] || ['neutral', status];
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[11px] font-semibold tracking-wide ${TONES[tone]}`}>
      <span className={`size-1.5 rounded-full ${DOTS[tone]}`} />
      {label || text}
    </span>
  );
}

export function Stars({ value = 0, size = 'size-4', onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className="inline-flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= Math.round(shown) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'} ${onChange ? 'cursor-pointer' : ''}`}
          onMouseEnter={() => onChange && setHover(n)}
          onClick={() => onChange?.(n)}
        />
      ))}
    </span>
  );
}

export function Modal({ open, title, onClose, children, footer, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="backdrop-enter fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`modal-enter flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-lg sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {children && <div className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '', bodyClass = 'p-5' }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 border-b border-border/80 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {actions}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

/** <img> that falls back to a neutral placeholder if the remote photo fails to load. */
export function Photo({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400 dark:from-slate-700 dark:to-slate-800 ${className}`}>
        <ImageOff className="size-8" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`bg-muted object-cover ${className}`} />;
}

export function Table({ columns, rows, empty = 'No records found' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="border-b border-border bg-muted/50">
          <tr>{columns.map((c) => <th key={c.key || c.label} className="th">{c.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted-foreground">{empty}</td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-muted/40">
                {columns.map((c) => <td key={c.key || c.label} className="td">{c.render ? c.render(row) : row[c.key]}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---- toast ----
let pushToast = () => {};
export const toast = (message, tone = 'success') => pushToast({ message, tone, id: Math.random() });

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    pushToast = (t) => {
      setItems((xs) => [...xs, t]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), 3800);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[2000] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            t.tone === 'error' ? 'bg-red-600' : t.tone === 'info' ? 'bg-slate-800' : 'bg-emerald-600'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
