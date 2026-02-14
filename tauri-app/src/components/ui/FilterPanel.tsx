import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ALL_GENRES, SEASONS, FORMATS, AIRING_STATUSES, type CatalogFilters } from "../../types";
import { cn } from "../../lib/utils";

interface Props {
  filters: CatalogFilters;
  onChange: (filters: CatalogFilters) => void;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => currentYear - i);

export default function FilterPanel({ filters, onChange }: Props) {
  return (
    <aside className="w-56 space-y-1 shrink-0">
      {/* Year */}
      <FilterSection title="Year" defaultOpen>
        <div className="flex flex-wrap gap-1.5">
          {YEARS.slice(0, 10).map(y => (
            <button
              key={y}
              onClick={() => onChange({ ...filters, year: filters.year === y ? undefined : y })}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-bold transition-all duration-200 border",
                filters.year === y
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-white/60 border-white/5 hover:border-white/20 hover:text-white",
              )}
            >
              {y}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Season */}
      <FilterSection title="Season" defaultOpen>
        <div className="space-y-1">
          {SEASONS.map(s => (
            <CheckItem
              key={s}
              label={s[0] + s.slice(1).toLowerCase()}
              checked={filters.season === s}
              onChange={() => onChange({ ...filters, season: filters.season === s ? undefined : s })}
            />
          ))}
        </div>
      </FilterSection>

      {/* Genres */}
      <FilterSection title="Genres" defaultOpen>
        <GenreList filters={filters} onChange={onChange} />
      </FilterSection>

      {/* Format */}
      <FilterSection title="Format">
        <div className="space-y-1">
          {FORMATS.map(f => (
            <CheckItem
              key={f.value}
              label={f.label}
              checked={filters.format === f.value}
              onChange={() => onChange({ ...filters, format: filters.format === f.value ? undefined : f.value })}
            />
          ))}
        </div>
      </FilterSection>

      {/* Airing Status */}
      <FilterSection title="Airing Status">
        <div className="space-y-1">
          {AIRING_STATUSES.map(s => (
            <CheckItem
              key={s.value}
              label={s.label}
              checked={filters.status === s.value}
              onChange={() => onChange({ ...filters, status: filters.status === s.value ? undefined : s.value })}
            />
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}

// ─── Sub-components ───────────────────────────────
function FilterSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5 pb-3 mb-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-2 text-sm font-bold text-white/90 hover:text-white transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        open ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0",
      )}>
        {children}
      </div>
    </div>
  );
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label onClick={onChange} className="flex items-center gap-2.5 cursor-pointer group py-0.5">
      <div className={cn(
        "w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200",
        checked ? "bg-white border-white" : "border-white/20 group-hover:border-white/40",
      )}>
        {checked && <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </div>
      <span className={cn("text-xs font-medium transition-colors", checked ? "text-white" : "text-white/50 group-hover:text-white/70")}>{label}</span>
    </label>
  );
}

function GenreList({ filters, onChange }: Props) {
  const [showAll, setShowAll] = useState(false);
  const genres = showAll ? ALL_GENRES : ALL_GENRES.slice(0, 5);
  const selected = filters.genres ?? [];

  const toggle = (g: string) => {
    const next = selected.includes(g) ? selected.filter(x => x !== g) : [...selected, g];
    onChange({ ...filters, genres: next.length ? next : undefined });
  };

  return (
    <div className="space-y-1">
      {genres.map(g => (
        <CheckItem key={g} label={g} checked={selected.includes(g)} onChange={() => toggle(g)} />
      ))}
      <button
        onClick={() => setShowAll(v => !v)}
        className="text-[11px] font-bold text-white/30 hover:text-white/60 transition-colors mt-1"
      >
        {showAll ? "Show Less" : "View All ↓"}
      </button>
    </div>
  );
}
