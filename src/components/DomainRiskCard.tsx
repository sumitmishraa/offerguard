import { DomainAnalysis } from '../types';
import { Globe, Building2, Mail } from 'lucide-react';

interface DomainRiskCardProps {
  domainAnalysis: DomainAnalysis;
}

export function DomainRiskCard({ domainAnalysis }: DomainRiskCardProps) {
  const isHighRisk = domainAnalysis.riskLevel === 'HIGH' || domainAnalysis.riskLevel === 'CRITICAL';

  return (
    <div id="domain-risk-card" className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-stone-700 shrink-0" />
          <h3 className="text-sm font-bold text-stone-900">
            Domain &amp; Sender Infrastructure
          </h3>
        </div>
        <span
          className={`text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded border ${
            isHighRisk
              ? 'bg-red-50 text-red-700 border-red-200'
              : domainAnalysis.riskLevel === 'MODERATE'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {domainAnalysis.riskLevel === 'CRITICAL' ? 'Critical Risk' : domainAnalysis.riskLevel === 'HIGH' ? 'High Risk' : domainAnalysis.riskLevel === 'MODERATE' ? 'Moderate Risk' : 'Low Risk'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3 text-xs">
        {/* Domain name & Spoof check */}
        <div className="p-3.5 rounded-xl bg-stone-50/50 border border-stone-200 space-y-1">
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide block">
            Target Hostname / Sender
          </span>
          <div className="font-mono text-stone-900 font-semibold truncate text-xs sm:text-sm">
            {domainAnalysis.domain || 'N/A'}
          </div>
          {domainAnalysis.spoofedEntity && domainAnalysis.spoofedEntity !== 'None detected' && (
            <div className="mt-2 pt-2 border-t border-stone-200 flex items-center gap-1.5 text-red-700 font-medium text-xs">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>{domainAnalysis.spoofedEntity}</span>
            </div>
          )}
        </div>

        {/* Sender Channel Legitimacy */}
        <div className="p-3.5 rounded-xl bg-stone-50/50 border border-stone-200 space-y-1">
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide block">
            Email &amp; Domain Verification
          </span>
          <div className="flex items-center gap-2">
            {domainAnalysis.isFreeOrSuspiciousEmail ? (
              <div className="flex items-start gap-1.5 text-amber-800 text-xs">
                <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Free webmail (Gmail/Yahoo) used for formal corporate offer</span>
              </div>
            ) : (
              <span className="text-stone-700 text-xs">
                {domainAnalysis.domainAgeRiskAssessment}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
