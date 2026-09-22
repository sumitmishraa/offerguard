import { useState } from 'react';
import { AuditFingerprint } from '../types';
import { Check, Fingerprint, Copy } from 'lucide-react';

interface AuditFingerprintBadgeProps {
  audit: AuditFingerprint;
  threatLevel: string;
}

export function AuditFingerprintBadge({ audit }: AuditFingerprintBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(
      `OfferGuard Audit Report ID: ${audit.reportId}\nSHA-256 Fingerprint: ${audit.sha256Fingerprint}\nTimestamp: ${audit.timestamp}\nSigner: ${audit.nodeSigner}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="audit-fingerprint-badge"
      className="bg-stone-900 text-stone-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-stone-200">
            Forensic Audit Hash
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
            SHA-256
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyHash}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-stone-400" />
              <span>Copy Hash</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-stone-950/60 border border-stone-800">
          <span className="text-[10px] text-stone-500 block uppercase font-medium">Report ID</span>
          <span className="text-stone-200 font-semibold">{audit.reportId}</span>
        </div>

        <div className="p-2.5 rounded-lg bg-stone-950/60 border border-stone-800 sm:col-span-2">
          <span className="text-[10px] text-stone-500 block uppercase font-medium">Content Fingerprint</span>
          <span className="text-stone-300 font-mono text-[11px] break-all select-all">
            {audit.sha256Fingerprint}
          </span>
        </div>
      </div>
    </div>
  );
}
