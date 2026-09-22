import { IdentifiedRisk } from '../types';
import { ShieldAlert } from 'lucide-react';

interface IdentifiedRisksListProps {
  risks: IdentifiedRisk[];
}

export function IdentifiedRisksList({ risks }: IdentifiedRisksListProps) {
  if (!risks || risks.length === 0) return null;

  return (
    <div id="identified-risks-card" className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
      <div className="pb-3 border-b border-stone-100 mb-4">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-stone-700 shrink-0" />
          <span>Identified Threat Vectors ({risks.length})</span>
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Detailed breakdown of specific fraud mechanics and deceptive patterns
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {risks.map((risk) => {
          const isCritical = risk.severity === 'CRITICAL';
          const isHigh = risk.severity === 'HIGH';

          return (
            <div
              key={risk.id}
              className={`p-3.5 sm:p-4 rounded-xl border text-xs flex flex-col justify-between space-y-2.5 ${
                isCritical
                  ? 'border-red-200 bg-red-50/20'
                  : isHigh
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-stone-200 bg-stone-50/40'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                    {risk.category}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      isCritical
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : isHigh
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {risk.severity === 'CRITICAL' ? 'Critical' : risk.severity === 'HIGH' ? 'High' : 'Moderate'}
                  </span>
                </div>

                <h4 className="font-semibold text-stone-900 text-xs sm:text-sm">
                  {risk.title}
                </h4>

                <p className="text-stone-600 text-xs leading-relaxed">
                  {risk.description}
                </p>
              </div>

              {risk.evidence && (
                <div className="pt-2 border-t border-stone-200/60 text-[11px] font-mono text-stone-700">
                  <span className="font-medium text-stone-500 block text-[10px] uppercase mb-0.5">Evidence:</span>
                  <span className="bg-white p-1.5 rounded block border border-stone-200 truncate">
                    "{risk.evidence}"
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
