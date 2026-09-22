import { Shield, Sparkles, ArrowRight, CheckCircle2, ChevronRight, UserX } from 'lucide-react';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios';
import { SampleScenario } from '../types';

interface LandingPageProps {
  onStartDetection: () => void;
  onSelectScenarioAndScan: (scenario: SampleScenario) => void;
}

export function LandingPage({ onStartDetection, onSelectScenarioAndScan }: LandingPageProps) {
  return (
    <div id="landing-page" className="w-full space-y-12 sm:space-y-16 pb-12">
      {/* Hero Section */}
      <section className="pt-4 sm:pt-10 pb-2 max-w-3xl mx-auto text-center space-y-5 px-2">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight leading-[1.2]">
          Detect fake job offers and rental traps before you wire money.
        </h1>

        <p className="text-sm sm:text-base text-stone-600 font-normal max-w-2xl mx-auto leading-relaxed">
          Standard email filters miss advance-fee check laundering, Telegram interviews, and lookalike domains. OfferGuard analyzes the text, link, or document and gives you a clear 0–100% risk assessment.
        </p>

        {/* Primary Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3">
          <button
            type="button"
            id="landing-cta-launch-scanner"
            onClick={onStartDetection}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-medium text-sm transition-all shadow-xs cursor-pointer"
          >
            <span>Launch Threat Workspace</span>
            <ArrowRight className="w-4 h-4 text-stone-300" />
          </button>

          <button
            type="button"
            id="landing-cta-sample-test"
            onClick={() => onSelectScenarioAndScan(SAMPLE_SCENARIOS[0])}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 font-medium text-sm border border-stone-200 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-stone-500" />
            <span>Test Equipment Check Sample</span>
          </button>
        </div>

        {/* Proof metrics - Human, natural numbers (not AI-slop monospace) */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 border-t border-stone-200/80 text-left">
          <div className="p-2 sm:p-3">
            <div className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">$5.2B+</div>
            <div className="text-xs text-stone-500 mt-0.5">Lost to check &amp; rental scams in 2024</div>
          </div>
          <div className="p-2 sm:p-3">
            <div className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">0–100%</div>
            <div className="text-xs text-stone-500 mt-0.5">Calibrated Threat Index</div>
          </div>
          <div className="p-2 sm:p-3">
            <div className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">5 Vectors</div>
            <div className="text-xs text-stone-500 mt-0.5">Advance fee, chat, and domain checks</div>
          </div>
          <div className="p-2 sm:p-3">
            <div className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Instant</div>
            <div className="text-xs text-stone-500 mt-0.5">Forensic evaluation &amp; safe reply</div>
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="max-w-4xl mx-auto space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-2xl font-bold text-stone-900 tracking-tight">
            Why traditional filters fail
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-lg mx-auto">
            Scammers now send realistic appointment letters and clean job postings from clean email domains.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200 space-y-3">
            <div className="flex items-center gap-2 text-stone-500 font-semibold text-xs uppercase tracking-wider">
              <UserX className="w-4 h-4 text-stone-400" />
              <span>Standard Spam Filter</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-stone-600">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>Passes legitimate-looking Gmail accounts that have valid SPF/DKIM</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>Cannot recognize that an "Apple Equipment Check" is a laundering trap</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span>Misses off-platform pivots ("Interview with HR on Telegram")</span>
              </li>
            </ul>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-stone-900 text-stone-100 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>OfferGuard Threat Inspection</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-stone-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Fake Check Traps:</strong> Flags cashier checks sent to purchase gear through third-party vendors</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Typosquatting &amp; TLDs:</strong> Catches lookalike domains such as <code>careers-stripe-recruitment.xyz</code></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Safe Reply:</strong> 1-click counter-response asking for verified corporate career links</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3 Steps */}
      <section className="max-w-4xl mx-auto space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-2xl font-bold text-stone-900 tracking-tight">
            How it works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 space-y-1.5">
            <div className="text-xs font-bold text-stone-400 uppercase">Step 01</div>
            <h3 className="font-semibold text-sm text-stone-900">Provide Input</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Paste email text, drop a job link, or upload an appointment letter PDF or screenshot.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 space-y-1.5">
            <div className="text-xs font-bold text-stone-400 uppercase">Step 02</div>
            <h3 className="font-semibold text-sm text-stone-900">Inspect Vectors</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Checks for advance checks, off-platform chat interviews, rental deposit traps, and urgent PII demands.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 space-y-1.5">
            <div className="text-xs font-bold text-stone-400 uppercase">Step 03</div>
            <h3 className="font-semibold text-sm text-stone-900">Review &amp; Reply</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              See your 0–100% risk index, flagged excerpts, and a safe counter-response to verify legitimate identity.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Interactive Presets */}
      <section className="max-w-4xl mx-auto p-4 sm:p-6 rounded-2xl bg-white border border-stone-200 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Interactive Test Scenarios
            </h2>
            <p className="text-xs text-stone-500">
              Click any scenario to see how OfferGuard analyzes scam indicators:
            </p>
          </div>

          <button
            type="button"
            onClick={onStartDetection}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-800 hover:text-black cursor-pointer self-start sm:self-auto"
          >
            <span>Open Workspace</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {SAMPLE_SCENARIOS.map((scenario) => (
            <div
              key={scenario.id}
              onClick={() => onSelectScenarioAndScan(scenario)}
              className="p-3.5 rounded-xl border border-stone-200 hover:border-stone-400 transition-all bg-stone-50/40 hover:bg-white cursor-pointer space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-900">
                  {scenario.title}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    scenario.threatExpected === 'Critical'
                      ? 'bg-red-100 text-red-800'
                      : scenario.threatExpected === 'High'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {scenario.threatExpected}
                </span>
              </div>
              <p className="text-xs text-stone-500 line-clamp-2">
                {scenario.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
