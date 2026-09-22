import { useState } from 'react';
import { ScanResult } from '../types';
import { Copy, Check, Download, Printer, RotateCcw } from 'lucide-react';

interface ActionBarProps {
  result: ScanResult;
  onRestart: () => void;
}

export function ActionBar({ result, onRestart }: ActionBarProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopyReport = async () => {
    const reportText = `================================================
OFFERGUARD THREAT INSPECTION REPORT
Report ID: ${result.auditFingerprint?.reportId || 'N/A'}
Generated: ${new Date(result.analyzedAt).toLocaleString()}
Target Category: ${result.targetCategory}
================================================

SCAM THREAT INDEX: ${result.scamThreatIndex}% (${result.threatLevel})
VERDICT: ${result.verdictSummary}

INFRASTRUCTURE / SENDER:
- Domain: ${result.domainAnalysis.domain}
- Domain Risk: ${result.domainAnalysis.riskLevel}
- Spoofed Entity: ${result.domainAnalysis.spoofedEntity}
- Domain Notes: ${result.domainAnalysis.domainAgeRiskAssessment}

KEY RED FLAGS DETECTED:
${result.redFlagChecks
  .map(
    (c) =>
      `• [${c.status}] ${c.name}: ${c.detail}${c.quoteEvidence ? ` (Evidence: "${c.quoteEvidence}")` : ''}`
  )
  .join('\n')}

IDENTIFIED RISKS:
${result.identifiedRisks
  .map((r) => `• [${r.severity}] ${r.title} (${r.category}): ${r.description}`)
  .join('\n')}

SAFETY RECOMMENDATIONS:
${result.safetyRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

OFFICIAL REPORTING:
${result.nextSteps.map((s) => `• ${s}`).join('\n')}

================================================
Report inspected via OfferGuard`;

    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = reportText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadJSON = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
      const downloadAnchor = document.createElement('a');
      const filename = `OfferGuard-Report-${result.auditFingerprint?.reportId || Date.now()}.json`;
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error('Failed to download JSON:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="action-bar-card" className="bg-stone-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
      <div>
        <div className="font-semibold text-sm">Need to share or file an official report?</div>
        <div className="text-xs text-stone-300">
          Export this forensic assessment or retain a copy for fraud complaints at ReportFraud.ftc.gov.
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          type="button"
          id="btn-copy-report-bottom"
          onClick={handleCopyReport}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-semibold text-xs transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-stone-700" />
              <span>Copy Report</span>
            </>
          )}
        </button>

        <button
          type="button"
          id="btn-download-json-bottom"
          onClick={handleDownloadJSON}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          {downloaded ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Downloaded</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-stone-300" />
              <span>JSON</span>
            </>
          )}
        </button>

        <button
          type="button"
          id="btn-print-bottom"
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          title="Print or Save as PDF"
        >
          <Printer className="w-3.5 h-3.5 text-stone-300" />
          <span className="hidden sm:inline">PDF</span>
        </button>

        <button
          type="button"
          id="btn-restart-scan"
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 font-semibold text-xs transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  );
}
