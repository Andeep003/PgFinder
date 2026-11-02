import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, X, ImageOff, Inbox, CheckCircle2, AlertCircle, Info, Sun, Moon } from 'lucide-react';

/** Keeps an element mounted for `ms` after `open` turns false so it can animate out. */
export function usePresence(open, ms = 380) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      let raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(t);
  }, [open, ms]);
  return [mounted, visible];
}

const TONE_ICON = {
  default: 'bg-primary/15 text-primary',
  good: 'bg-sage-400/25 text-sage-600 dark:text-sage-300',
  bad: 'bg-coral-400/20 text-coral-600 dark:text-coral-300',
  warn: 'bg-butter-400/30 text-butter-700 dark:text-butter-300',
  purple: 'bg-plum-400/20 text-plum-600 dark:text-plum-300',
};

export function StatTile({ label, value, hint, icon: Icon, tone = 'default' }) {
  return (
    <div className="card group relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
          <div className="mt-2 truncate font-display text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-[28px]">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        {Icon && (
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-400 ease-spring group-hover:rotate-[-6deg] group-hover:scale-110 ${TONE_ICON[tone] || TONE_ICON.default}`}>
            <Icon className="size-5" />
          </span>
        )}
      </div>
    </div>
  );
}

const TONES = {
  success: 'bg-sage-500/10 text-sage-700 ring-sage-500/25 dark:text-sage-300',
  danger: 'bg-coral-500/10 text-coral-700 ring-coral-500/20 dark:text-coral-300',
  warning: 'bg-butter-400/20 text-butter-700 ring-butter-500/30 dark:text-butter-300',
  info: 'bg-mist-500/10 text-mist-700 ring-mist-500/25 dark:text-mist-300',
  purple: 'bg-plum-500/10 text-plum-700 ring-plum-500/20 dark:text-plum-300',
  neutral: 'bg-stone-500/10 text-stone-600 ring-stone-500/20 dark:text-stone-300',
};
const DOTS = { success: 'bg-sage-500', danger: 'bg-coral-500', warning: 'bg-butter-500', info: 'bg-mist-500', purple: 'bg-plum-500', neutral: 'bg-stone-400' };

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
    <span className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset ${TONES[tone]}`}>
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
          className={`${size} transition-all duration-250 ease-spring ${n <= Math.round(shown) ? 'fill-butter-400 text-butter-400' : 'text-stone-300 dark:text-stone-600'} ${
            onChange ? 'cursor-pointer hover:scale-125 active:scale-90' : ''
          }`}
          onMouseEnter={() => onChange && setHover(n)}
          onClick={() => onChange?.(n)}
        />
      ))}
    </span>
  );
}

/** Bottom sheet on phones, centered dialog on larger screens; both animate in and out. */
export function Modal({ open, title, onClose, children, footer, wide }) {
  const [mounted, visible] = usePresence(open, 420);
  // Keep the last content while animating out, in case the parent clears the data it came from.
  const last = useRef({ title, children, footer });
  if (open) last.current = { title, children, footer };
  const content = last.current;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4" onClick={onClose}>
      <div className={`absolute inset-0 bg-stone-950/45 backdrop-blur-[6px] transition-opacity duration-400 ease-ios ${visible ? 'opacity-100' : 'opacity-0'}`} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-card shadow-xl transition-all duration-400 ease-ios sm:rounded-3xl ${
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
        } ${visible ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-full opacity-100 sm:translate-y-4 sm:scale-95 sm:opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-muted-foreground/25" />
        </div>
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-3 sm:px-6 sm:pt-5">
          <h3 className="text-lg font-bold text-foreground">{content.title}</h3>
          <button onClick={onClose} className="icon-btn size-8 bg-muted/70" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-1 sm:px-6">{content.children}</div>
        {content.footer && (
          <div className="flex justify-end gap-2 border-t border-border/70 bg-muted/30 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-3.5">
            {content.footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, children }) {
  return (
    <div className="flex animate-fade-up flex-col items-center justify-center px-6 py-14 text-center">
      <div className="relative mb-4">
        <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
          <Icon className="size-6 text-primary" />
        </div>
      </div>
      <div className="font-display text-base font-bold text-foreground">{title}</div>
      {children && <div className="mt-1.5 max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '', bodyClass = 'p-5' }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-5 py-4">
          <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
          {actions}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

/** <img> that fades in once loaded and falls back to a neutral placeholder if the photo fails. */
export function Photo({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-ember-50 text-ember-300 dark:bg-stone-800 dark:text-stone-600 ${className}`}>
        <ImageOff className="size-8" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`bg-muted object-cover transition-[opacity,transform,filter] duration-600 ease-ios ${loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'} ${className}`}
    />
  );
}

export function Table({ columns, rows, empty = 'No records found' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="border-b border-border/70 bg-muted/40">
          <tr>{columns.map((c) => <th key={c.key || c.label} className="th">{c.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted-foreground">{empty}</td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row.id || i} className="transition-colors duration-250 hover:bg-accent/50">
                {columns.map((c) => <td key={c.key || c.label} className="td">{c.render ? c.render(row) : row[c.key]}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** iOS-style segmented control: a pill slides under the selected option. */
export function Segmented({ options, value, onChange, size = 'md', className = '', ariaLabel }) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`relative inline-grid rounded-full border border-border/70 bg-muted/80 p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-full bg-card shadow-md ring-1 ring-black/[0.03] transition-transform duration-400 ease-ios dark:bg-stone-700/70"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-colors duration-250 ${pad} ${
              on ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {o.icon && <o.icon className="size-4" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** On/off toggle switch. */
export function Switch({ checked, onChange, label, id }) {
  return (
    <span className="inline-flex select-none items-center gap-2.5 text-sm font-medium text-foreground">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-300 ease-ios ${checked ? 'bg-primary' : 'bg-stone-300 dark:bg-stone-600'}`}
      >
        <span className={`inline-block size-5 rounded-full bg-white shadow-md transition-transform duration-400 ease-spring ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </button>
      {label && <label htmlFor={id} className="cursor-pointer">{label}</label>}
    </span>
  );
}

/** Light/dark toggle: a sun/moon knob that slides across a track. */
export function ThemeToggle({ theme, onToggle, className = '' }) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={onToggle}
      className={`relative inline-flex h-9 w-[68px] shrink-0 items-center rounded-full border border-border/70 bg-muted/80 px-1 transition-colors duration-400 ease-ios hover:border-primary/30 ${className}`}
    >
      <Sun className={`absolute left-2.5 size-3.5 text-muted-foreground transition-opacity duration-300 ${dark ? 'opacity-100' : 'opacity-0'}`} />
      <Moon className={`absolute right-2.5 size-3.5 text-muted-foreground transition-opacity duration-300 ${dark ? 'opacity-0' : 'opacity-100'}`} />
      <span
        className={`relative flex size-7 items-center justify-center rounded-full text-white shadow-md transition-all duration-500 ease-spring ${
          dark ? 'translate-x-[30px] bg-plum-500' : 'translate-x-0 bg-butter-400'
        }`}
      >
        {dark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
      </span>
    </button>
  );
}

/** PG Finder wordmark. */
export function BrandLogo({ to = '/', light = false }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5">
      <span className="relative flex size-10 items-center justify-center rounded-2xl bg-ember-500 shadow-glow transition-transform duration-400 ease-spring group-hover:rotate-[-8deg] group-hover:scale-105 group-active:scale-95">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path d="M4 11.2 12 4.5l8 6.7V20H4z" fill="#FAF8F4" />
          <rect x="10" y="14" width="4" height="6" rx="1" fill="#6E3468" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-sage-400 ring-2 ring-background" />
      </span>
      <span className={`font-display text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-foreground'}`}>
        PG <span className="text-primary">Finder</span>
      </span>
    </Link>
  );
}

// ---- toast ----
let pushToast = () => {};
export const toast = (message, tone = 'success') => pushToast({ message, tone, id: Math.random() });

const TOAST_ICON = {
  success: <CheckCircle2 className="size-5 text-sage-400" />,
  error: <AlertCircle className="size-5 text-coral-400" />,
  info: <Info className="size-5 text-mist-400" />,
};

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    pushToast = (t) => {
      setItems((xs) => [...xs, t]);
      setTimeout(() => setItems((xs) => xs.map((x) => (x.id === t.id ? { ...x, leaving: true } : x))), 3500);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), 3850);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[2000] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full border border-white/10 bg-stone-900/90 py-2.5 pl-3 pr-5 text-sm font-medium text-white shadow-xl backdrop-blur-xl ${
            t.leaving ? 'animate-toast-out' : 'animate-toast-in'
          }`}
        >
          {TOAST_ICON[t.tone] || TOAST_ICON.success}
          {t.message}
        </div>
      ))}
    </div>
  );
}
