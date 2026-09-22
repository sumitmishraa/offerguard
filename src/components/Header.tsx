import { ArrowLeft, ArrowRight } from 'lucide-react';

interface HeaderProps {
  currentView: 'landing' | 'scanner';
  onNavigate: (view: 'landing' | 'scanner') => void;
}

export function Header({ currentView, onNavigate }: HeaderProps) {
  return (
    <header className="border-b border-stone-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Minimal Transparent Brand / Logo */}
        <div
          id="header-brand-logo"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          {/* Transparent minimal vector emblem */}
          <div className="w-8 h-8 flex items-center justify-center shrink-0 text-stone-900 group-hover:scale-105 transition-transform">
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" strokeWidth="2.2" className="text-emerald-600 stroke-emerald-600" />
            </svg>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-stone-900 tracking-tight text-lg">
              OfferGuard
            </span>
            <span className="text-[11px] font-medium text-stone-500 hidden sm:inline">
              Threat Inspector
            </span>
          </div>
        </div>

        {/* View Switcher / Actions */}
        <div className="flex items-center gap-3">
          {currentView === 'scanner' ? (
            <button
              type="button"
              id="header-nav-overview"
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
          ) : (
            <button
              type="button"
              id="header-nav-launch"
              onClick={() => onNavigate('scanner')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
            >
              <span>Inspect Offer</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-300" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
