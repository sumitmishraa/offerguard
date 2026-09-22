import { RedFlagCheck } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Quote } from 'lucide-react';

interface RedFlagsBreakdownProps {
  checks: RedFlagCheck[];
}

export function RedFlagsBreakdown({ checks }: RedFlagsBreakdownProps) {
  return (
    <div id="red-flags-breakdown-card" className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
      <div className="pb-3 sm:pb-4 border-b border-stone-100">
        <h3 className="text-sm font-bold text-stone-900">
          Core Security Verification Checks
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Screened against fake checks, unverified messaging channels, domain spoofing, and advance fee vectors
        </p>
      </div>

      <div className="divide-y divide-stone-100">
        {checks.map((check) => {
          const isCritical = check.status === 'CRITICAL_FAIL';
          const isWarning = check.status === 'WARNING';

          return (
            <div key={check.id} className="py-3.5 sm:py-4 flex items-start gap-3 sm:gap-3.5">
              <div className="mt-0.5 shrink-0">
                {isCritical ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : isWarning ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                  <span className="font-semibold text-stone-900 text-xs sm:text-sm">
                    {check.name}
                  </span>
                  <span
                    className={`inline-self-start self-start sm:self-auto text-[10px] font-semibold px-2 py-0.5 rounded ${
                      isCritical
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : isWarning
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {check.status === 'CRITICAL_FAIL'
                      ? 'Critical Flag'
                      : check.status === 'WARNING'
                      ? 'Warning'
                      : 'Passed'}
                  </span>
                </div>

                <p className="text-stone-600 text-xs leading-relaxed">
                  {check.detail}
                </p>

                {check.quoteEvidence && check.quoteEvidence.trim().length > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-mono text-[11px] max-w-full overflow-hidden">
                    <Quote className="w-3 h-3 text-stone-400 shrink-0" />
                    <span className="truncate">"{check.quoteEvidence}"</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
