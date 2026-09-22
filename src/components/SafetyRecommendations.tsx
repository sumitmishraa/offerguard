import { ShieldCheck, ExternalLink, AlertOctagon } from 'lucide-react';

interface SafetyRecommendationsProps {
  recommendations: string[];
  nextSteps: string[];
}

export function SafetyRecommendations({
  recommendations,
  nextSteps,
}: SafetyRecommendationsProps) {
  return (
    <div id="safety-recommendations-card" className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-5">
      {/* Safety Instructions */}
      <div>
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <h3 className="text-sm font-bold text-stone-900">
            Recommended Protective Actions
          </h3>
        </div>

        <ul className="mt-3 space-y-2 text-xs text-stone-700">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
              <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                {idx + 1}
              </span>
              <span className="font-normal leading-relaxed">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Official Reporting Agencies & Next Actions */}
      <div className="pt-2 border-t border-stone-100">
        <div className="flex items-center gap-2 pb-2">
          <AlertOctagon className="w-4 h-4 text-stone-700 shrink-0" />
          <h4 className="text-xs font-bold text-stone-900">
            Official Reporting &amp; Fraud Channels
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          {nextSteps.map((step, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-700">
              <div className="leading-snug">{step}</div>
            </div>
          ))}
        </div>

        {/* Quick Link Portals */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <a
            href="https://reportfraud.ftc.gov"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium transition-colors"
          >
            <span>FTC ReportFraud.ftc.gov</span>
            <ExternalLink className="w-3 h-3 text-stone-500" />
          </a>
          <a
            href="https://www.ic3.gov"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium transition-colors"
          >
            <span>FBI IC3 Complaint Center</span>
            <ExternalLink className="w-3 h-3 text-stone-500" />
          </a>
        </div>
      </div>
    </div>
  );
}
