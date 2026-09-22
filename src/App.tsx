import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { ScanInput } from './components/ScanInput';
import { ThreatIndexMeter } from './components/ThreatIndexMeter';
import { AuditFingerprintBadge } from './components/AuditFingerprintBadge';
import { VisualHighlightViewer } from './components/VisualHighlightViewer';
import { SafeReplyGenerator } from './components/SafeReplyGenerator';
import { DomainRiskCard } from './components/DomainRiskCard';
import { RedFlagsBreakdown } from './components/RedFlagsBreakdown';
import { IdentifiedRisksList } from './components/IdentifiedRisksList';
import { SafetyRecommendations } from './components/SafetyRecommendations';
import { ReportHeaderActions } from './components/ReportHeaderActions';
import { ActionBar } from './components/ActionBar';
import { ScanInputType, ScanResult, SampleScenario, UploadedFile } from './types';
import { SAMPLE_SCENARIOS } from './data/sampleScenarios';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

export function App() {
  const [view, setView] = useState<'landing' | 'scanner'>('landing');
  const [inputType, setInputType] = useState<ScanInputType>('text');
  const [content, setContent] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleStartDetection = () => {
    setView('scanner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectScenarioAndScan = (scenario: SampleScenario) => {
    setView('scanner');
    setInputType(scenario.type);
    setContent(scenario.content);
    setUploadedFile(null);
    setSelectedScenarioId(scenario.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Auto-trigger scan
    setTimeout(() => {
      triggerScan(scenario.type, scenario.content, null);
    }, 150);
  };

  const handleSelectScenario = (scenario: SampleScenario) => {
    setInputType(scenario.type);
    setContent(scenario.content);
    setUploadedFile(null);
    setSelectedScenarioId(scenario.id);
  };

  const triggerScan = async (
    typeToScan: ScanInputType,
    textToScan: string,
    fileToScan: UploadedFile | null
  ) => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const payload: {
        type: ScanInputType;
        content?: string;
        file?: UploadedFile;
      } = {
        type: typeToScan,
      };

      if (typeToScan === 'upload' && fileToScan) {
        payload.file = fileToScan;
        payload.content = textToScan || fileToScan.name;
      } else {
        payload.content = textToScan;
      }

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with code ${res.status}`);
      }

      const data: ScanResult = await res.json();
      setScanResult(data);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to inspect threat vectors. Please verify your input and try again.';
      setError(errorMsg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScan = () => {
    triggerScan(inputType, content, uploadedFile);
  };

  const handleReset = () => {
    setContent('');
    setUploadedFile(null);
    setScanResult(null);
    setError(null);
    setSelectedScenarioId(null);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 flex flex-col font-sans selection:bg-stone-200">
      {/* Skip to Main Content Link for Screen Readers & Keyboard Nav */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-stone-900 focus:text-white focus:rounded-lg focus:shadow-lg focus:text-xs focus:font-bold"
      >
        Skip to main content
      </a>

      {/* Sticky Header with Navigation Switcher */}
      <Header currentView={view} onNavigate={setView} />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 focus:outline-hidden">
        <AnimatePresence mode="wait">
          {view === 'landing' ? (
            <motion.div
              key="landing-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <LandingPage
                onStartDetection={handleStartDetection}
                onSelectScenarioAndScan={handleSelectScenarioAndScan}
              />
            </motion.div>
          ) : (
            <motion.div
              key="scanner-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Top Navigation & Workspace Header */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setView('landing')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </button>

                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                    Offer Threat Detection Workspace
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                    Inspect offer letters, job listings, and rental communications for fraud patterns.
                  </p>
                </div>
              </div>

              {/* 3-Mode Input Card: Text / URL / Upload */}
              <section id="inspection-input-section">
                <ScanInput
                  inputType={inputType}
                  setInputType={(type) => {
                    setInputType(type);
                    setSelectedScenarioId(null);
                  }}
                  content={content}
                  setContent={(val) => {
                    setContent(val);
                    setSelectedScenarioId(null);
                  }}
                  uploadedFile={uploadedFile}
                  setUploadedFile={(file) => {
                    setUploadedFile(file);
                    setSelectedScenarioId(null);
                  }}
                  isScanning={isScanning}
                  onScan={handleScan}
                  onReset={handleReset}
                  selectedScenarioId={selectedScenarioId}
                  onSelectScenario={handleSelectScenario}
                />
              </section>

              {/* Error message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Loading State Animation */}
              {isScanning && (
                <div className="p-10 rounded-2xl bg-white border border-stone-200 shadow-2xs text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center mx-auto">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-stone-900">
                      Analyzing threat vectors...
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Checking for advance-fee checks, fake recruiters, domain impersonation, and rental escrow traps.
                    </p>
                  </div>
                </div>
              )}

              {/* Results View */}
              {scanResult && !isScanning && (
                <div ref={resultsRef} className="space-y-6 pt-2">
                  {/* Report Header: Category and Top Actions (Download JSON, Copy, PDF, New Scan) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200/80">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        Forensic Threat Inspection Report
                      </h3>
                      <p className="text-xs text-stone-500">
                        {scanResult.targetCategory} • Source: {scanResult.inputType === 'upload' ? 'Uploaded Document' : scanResult.inputType === 'url' ? 'URL' : 'Text'}
                      </p>
                    </div>

                    {/* Top Action Bar right next to report */}
                    <ReportHeaderActions
                      result={scanResult}
                      onRestart={() => {
                        handleReset();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  </div>

                  {/* 1. Scam Threat Index Meter */}
                  <ThreatIndexMeter
                    score={scanResult.scamThreatIndex}
                    threatLevel={scanResult.threatLevel}
                    verdictSummary={scanResult.verdictSummary}
                    targetCategory={scanResult.targetCategory}
                    analyzedAt={scanResult.analyzedAt}
                    isFallback={scanResult.isFallbackEngine}
                  />

                  {/* 2. Visual Red-Flag Highlight Inspector */}
                  <VisualHighlightViewer
                    sourceText={scanResult.fullSourceText}
                    sourcePreview={scanResult.sourcePreview}
                    highlights={scanResult.highlights}
                    threatLevel={scanResult.threatLevel}
                  />

                  {/* 3. Safe Verification Counter-Response Generator */}
                  {scanResult.safeReply && (
                    <SafeReplyGenerator
                      safeReply={scanResult.safeReply}
                      threatLevel={scanResult.threatLevel}
                    />
                  )}

                  {/* 4. Domain & Infrastructure Risk Card */}
                  <DomainRiskCard domainAnalysis={scanResult.domainAnalysis} />

                  {/* 5. Red Flag Security Pillars Checklist */}
                  <RedFlagsBreakdown checks={scanResult.redFlagChecks} />

                  {/* 6. Identified Threat Risks List */}
                  <IdentifiedRisksList risks={scanResult.identifiedRisks} />

                  {/* 7. Safety Recommendations & Official Next Steps */}
                  <SafetyRecommendations
                    recommendations={scanResult.safetyRecommendations}
                    nextSteps={scanResult.nextSteps}
                  />

                  {/* 8. Cryptographic Forensic Audit Seal */}
                  {scanResult.auditFingerprint && (
                    <AuditFingerprintBadge
                      audit={scanResult.auditFingerprint}
                      threatLevel={scanResult.threatLevel}
                    />
                  )}

                  {/* 9. Bottom Export & Sharing Bar */}
                  <ActionBar
                    result={scanResult}
                    onRestart={() => {
                      handleReset();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-6 mt-12 text-xs text-stone-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-stone-900">OfferGuard</span> — Built by{' '}
            <strong className="text-stone-900">Sumit Kumar Mishra</strong>.
          </div>
          <div className="text-[11px] text-stone-400">
            PromptWars × GEN AI Club · Fake Offer Letter & Phishing Inspector
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
