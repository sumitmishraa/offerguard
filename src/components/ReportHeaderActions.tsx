import { useState } from 'react';
import { ScanResult } from '../types';
import { Copy, Check, Download, Printer, RotateCcw } from 'lucide-react';

interface ReportHeaderActionsProps {
  result: ScanResult;
  onRestart: () => void;
}

export function ReportHeaderActions({ result, onRestart }: ReportHeaderActionsProps) {
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

INFRASTRUCTURE / SENDER ANALYSIS:
- Domain / Source: ${result.domainAnalysis.domain}
- Domain Risk: ${result.domainAnalysis.riskLevel}
- Spoofed Entity: ${result.domainAnalysis.spoofedEntity}
- Domain Notes: ${result.domainAnalysis.domainAgeRiskAssessment}

KEY THREAT CHECKS:
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

ESCALATION & REPORTING:
${result.nextSteps.map((s) => `• ${s}`).join('\n')}

================================================
OfferGuard Threat Inspection`;

    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = reportText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    <div
      id="report-top-actions"
      className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
    >
      <button
        type="button"
        id="btn-copy-report-top"
        onClick={handleCopyReport}
        title="Copy plain-text report to clipboard"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 text-stone-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-stone-500" />
            <span>Copy Report</span>
          </>
        )}
      </button>

      <button
        type="button"
        id="btn-download-json-top"
        onClick={handleDownloadJSON}
        title="Download complete report as JSON"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 text-stone-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
      >
        {downloaded ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700">Saved!</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Download JSON</span>
          </>
        )}
      </button>

      <button
        type="button"
        id="btn-print-report-top"
        onClick={handlePrint}
        title="Print or Save as PDF"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 text-stone-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
      >
        <Printer className="w-3.5 h-3.5 text-stone-500" />
        <span>Print / PDF</span>
      </button>

      <button
        type="button"
        id="btn-new-scan-top"
        onClick={onRestart}
        title="Reset and start a new scan"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer ml-auto sm:ml-0"
      >
        <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
        <span>New Scan</span>
      </button>
    </div>
  );
}
