import { ThreatLevel } from '../types';
import { AlertOctagon, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ThreatIndexMeterProps {
  score: number;
  threatLevel: ThreatLevel;
  verdictSummary: string;
  targetCategory: string;
  analyzedAt: string;
  isFallback?: boolean;
}

export function ThreatIndexMeter({
  score,
  threatLevel,
  verdictSummary,
  targetCategory,
  analyzedAt,
  isFallback,
}: ThreatIndexMeterProps) {
  const getLevelConfig = () => {
    switch (threatLevel) {
      case 'CRITICAL_SCAM':
        return {
          label: 'Critical Scam',
          bgBadge: 'bg-red-600 text-white',
          borderBox: 'border-red-200 bg-red-50/20',
          textColor: 'text-red-700',
          scoreColor: 'text-red-600',
          barColor: 'bg-red-600',
          icon: AlertOctagon,
          summaryBg: 'bg-red-50 text-red-950 border-red-200'
        };
      case 'HIGH_THREAT':
        return {
          label: 'High Threat',
          bgBadge: 'bg-amber-600 text-white',
          borderBox: 'border-amber-200 bg-amber-50/20',
          textColor: 'text-amber-800',
          scoreColor: 'text-amber-600',
          barColor: 'bg-amber-500',
          icon: ShieldAlert,
          summaryBg: 'bg-amber-50 text-amber-950 border-amber-200'
        };
      case 'SUSPICIOUS':
        return {
          label: 'Suspicious',
          bgBadge: 'bg-yellow-500 text-stone-900',
          borderBox: 'border-yellow-200 bg-yellow-50/20',
          textColor: 'text-yellow-800',
          scoreColor: 'text-yellow-600',
          barColor: 'bg-yellow-500',
          icon: AlertTriangle,
          summaryBg: 'bg-yellow-50 text-yellow-950 border-yellow-200'
        };
      case 'LOW_RISK':
      case 'SAFE':
      default:
        return {
          label: 'Verified Safe',
          bgBadge: 'bg-emerald-600 text-white',
          borderBox: 'border-emerald-200 bg-emerald-50/20',
          textColor: 'text-emerald-800',
          scoreColor: 'text-emerald-600',
          barColor: 'bg-emerald-500',
          icon: CheckCircle2,
          summaryBg: 'bg-emerald-50 text-emerald-950 border-emerald-200'
        };
    }
  };

  const config = getLevelConfig();
  const Icon = config.icon;

  const formattedTime = new Date(analyzedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      id="threat-index-card"
      className={`border rounded-2xl p-4 sm:p-6 shadow-2xs bg-white ${config.borderBox}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/70">
        {/* Left: Classification */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              id="threat-level-badge"
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${config.bgBadge}`}
            >
              {config.label}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
              {targetCategory}
            </span>
            {isFallback && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                Rule Engine
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Icon className={`w-5 h-5 shrink-0 ${config.textColor}`} />
            <span>Inspection Threat Assessment</span>
          </h2>
          <p className="text-xs text-stone-500">
            Completed at {formattedTime}
          </p>
        </div>

        {/* Right: Natural Clean Number Score */}
        <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-stone-200 shadow-2xs shrink-0 self-start sm:self-auto">
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              Threat Index
            </div>
            <div className="text-[11px] text-stone-400">0% Safe · 100% Scam</div>
          </div>
          <div className="h-7 w-px bg-stone-200" />
          <div className="flex items-baseline gap-0.5">
            <span id="threat-score-number" className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${config.scoreColor}`}>
              {score}
            </span>
            <span className="text-sm font-semibold text-stone-400">%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="py-4 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-stone-500">
          <span>Safe (0–25%)</span>
          <span className="hidden sm:inline">Suspicious (26–55%)</span>
          <span className="hidden sm:inline">High Threat (56–80%)</span>
          <span>Critical (81–100%)</span>
        </div>
        <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200/80 p-0.5">
          <div
            id="threat-index-bar"
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Scam Threat Index: ${score} percent`}
            style={{ width: `${Math.max(score, 4)}%` }}
            className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
          />
        </div>
      </div>

      {/* Verdict Summary */}
      <div id="verdict-summary-box" className={`p-4 rounded-xl border text-xs sm:text-sm font-normal leading-relaxed ${config.summaryBg}`}>
        <strong className="text-[11px] uppercase tracking-wider block mb-1 font-semibold">
          Executive Verdict:
        </strong>
        {verdictSummary}
      </div>
    </div>
  );
}
