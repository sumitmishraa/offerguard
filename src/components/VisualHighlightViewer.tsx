import { useState } from 'react';
import { HighlightSegment } from '../types';
import { Search } from 'lucide-react';

interface VisualHighlightViewerProps {
  sourceText?: string;
  sourcePreview: string;
  highlights?: HighlightSegment[];
  threatLevel: string;
}

export function VisualHighlightViewer({
  sourceText,
  sourcePreview,
  highlights = [],
  threatLevel,
}: VisualHighlightViewerProps) {
  const [selectedHighlight, setSelectedHighlight] = useState<HighlightSegment | null>(
    highlights.length > 0 ? highlights[0] : null
  );

  const displayText = sourceText || sourcePreview;
  const isSafe = threatLevel === 'SAFE' || threatLevel === 'LOW_RISK';

  return (
    <div
      id="visual-highlight-card"
      className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-3 sm:space-y-4"
    >
      <div className="pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-stone-700 shrink-0" />
          <h3 className="text-sm font-bold text-stone-900">
            Flagged Excerpts &amp; Fraud Markers
          </h3>
        </div>
        <p className="text-xs text-stone-500 mt-0.5">
          Tap any highlighted indicator to inspect the underlying deception mechanic:
        </p>
      </div>

      {/* Flagged Chips / Quick Selector */}
      {highlights.length > 0 && !isSafe ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {highlights.map((h, i) => {
              const isSelected = selectedHighlight?.text === h.text;
              const isCrit = h.severity === 'CRITICAL';
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedHighlight(h)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? isCrit
                        ? 'bg-red-50 border-red-300 text-red-900 ring-1 ring-red-300 font-medium'
                        : 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-300 font-medium'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <span className="font-semibold">{h.severity === 'CRITICAL' ? '⚠️ Critical' : '⚡ Flag'}:</span>{' '}
                  <span className="truncate max-w-[200px] inline-block align-bottom">"{h.text}"</span>
                </button>
              );
            })}
          </div>

          {/* Active Flag Explanation Banner */}
          {selectedHighlight && (
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 ${
                selectedHighlight.severity === 'CRITICAL'
                  ? 'bg-red-50/50 border-red-200 text-red-950'
                  : 'bg-amber-50/50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="font-semibold flex items-center justify-between gap-2">
                <span>Why this is a red flag:</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/80 border border-stone-200">
                  {selectedHighlight.severity} Severity
                </span>
              </div>
              <p className="text-stone-800">{selectedHighlight.reason}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900">
          No manipulative phrases or advance fee traps detected in this text.
        </div>
      )}

      {/* Source Excerpt Card */}
      <div className="space-y-1">
        <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
          Inspected Content:
        </div>
        <div className="p-3.5 sm:p-4 rounded-xl bg-stone-50/70 border border-stone-200 text-xs text-stone-800 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-all font-mono">
          {displayText}
        </div>
      </div>
    </div>
  );
}
