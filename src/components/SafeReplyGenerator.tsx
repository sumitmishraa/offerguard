import { useState } from 'react';
import { SafeVerificationReply } from '../types';
import { Mail, Check, Copy } from 'lucide-react';

interface SafeReplyGeneratorProps {
  safeReply?: SafeVerificationReply;
  threatLevel: string;
}

export function SafeReplyGenerator({ safeReply, threatLevel }: SafeReplyGeneratorProps) {
  const [copied, setCopied] = useState(false);

  if (!safeReply) return null;

  const isCritical = threatLevel === 'CRITICAL_SCAM' || threatLevel === 'HIGH_THREAT';

  const handleCopy = () => {
    const fullText = `Subject: ${safeReply.subject}\n\n${safeReply.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="safe-reply-generator-card"
      className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-3 sm:space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-stone-700 shrink-0" />
            <h3 className="text-sm font-bold text-stone-900">
              {isCritical ? 'Safe Verification Counter-Response' : 'Professional Follow-up Draft'}
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {isCritical
              ? 'Send this pre-drafted response to demand verification without surrendering money or personal info'
              : 'Pre-drafted confirmation acknowledging formal employment terms and onboarding verification'}
          </p>
        </div>

        <button
          type="button"
          id="btn-copy-safe-reply"
          onClick={handleCopy}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-medium transition-all shadow-2xs cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-stone-300" />
              <span>Copy Response</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-2">
        <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs">
          <span className="font-semibold text-stone-600">Subject: </span>
          <span className="font-medium text-stone-900">{safeReply.subject}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-stone-50/70 border border-stone-200 text-xs text-stone-800 leading-relaxed whitespace-pre-wrap font-mono select-all">
          {safeReply.body}
        </div>

        {safeReply.strategyRationale && (
          <p className="text-[11px] text-stone-500 italic px-1">
            Strategy: {safeReply.strategyRationale}
          </p>
        )}
      </div>
    </div>
  );
}
