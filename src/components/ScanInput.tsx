import React, { useRef, useState } from 'react';
import { ScanInputType, SampleScenario, UploadedFile } from '../types';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios';
import { FileText, Link2, Upload, ArrowRight, Loader2, Sparkles, X, FileCheck, Image as ImageIcon } from 'lucide-react';

interface ScanInputProps {
  inputType: ScanInputType;
  setInputType: (type: ScanInputType) => void;
  content: string;
  setContent: (val: string) => void;
  uploadedFile: UploadedFile | null;
  setUploadedFile: (file: UploadedFile | null) => void;
  isScanning: boolean;
  onScan: () => void;
  onReset: () => void;
  selectedScenarioId: string | null;
  onSelectScenario: (scenario: SampleScenario) => void;
}

export function ScanInput({
  inputType,
  setInputType,
  content,
  setContent,
  uploadedFile,
  setUploadedFile,
  isScanning,
  onScan,
  onReset,
  selectedScenarioId,
  onSelectScenario,
}: ScanInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isScanning) return;
    if (inputType === 'upload' && uploadedFile) {
      onScan();
    } else if (content.trim()) {
      onScan();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isScanning && (content.trim() || uploadedFile)) {
        onScan();
      }
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedFile({
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        base64,
      });
      setContent(`[Document Attached: ${file.name}]`);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isSubmitDisabled =
    isScanning || (inputType === 'upload' ? !uploadedFile : !content.trim());

  return (
    <div id="scan-input-card" className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Segmented Tabs: Spacious, clean, no congestion */}
      <div className="border-b border-stone-200/80 bg-stone-50/50 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Controller */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-stone-200/60 rounded-xl w-full sm:w-auto sm:inline-flex">
            <button
              type="button"
              id="tab-input-text"
              onClick={() => setInputType('text')}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                inputType === 'text'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Paste Text</span>
            </button>

            <button
              type="button"
              id="tab-input-url"
              onClick={() => setInputType('url')}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                inputType === 'url'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              <span>Link / URL</span>
            </button>

            <button
              type="button"
              id="tab-input-upload"
              onClick={() => setInputType('upload')}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                inputType === 'upload'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span>Upload File</span>
            </button>
          </div>

          {/* Quick preset selector - discreet and non-intrusive */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-stone-400" />
              Presets:
            </span>
            <div className="flex items-center gap-1">
              {SAMPLE_SCENARIOS.slice(0, 3).map((scenario) => {
                const isSelected = selectedScenarioId === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => onSelectScenario(scenario)}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white font-semibold'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                    }`}
                  >
                    {scenario.threatExpected === 'Critical' ? 'Equipment Check' : scenario.threatExpected === 'High' ? 'Fake Recruiter' : 'Legit Offer'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Input Canvas */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        {inputType === 'text' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="scan-text-input" className="text-xs font-semibold text-stone-600">
                Email content, appointment letter, or interview message
              </label>
              {content.length > 0 && (
                <span className="text-[11px] text-stone-400 font-mono">
                  {content.length.toLocaleString()} characters
                </span>
              )}
            </div>
            <textarea
              id="scan-text-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={7}
              placeholder="Paste offer letter, recruiter email, or rental message here..."
              className="w-full p-4 rounded-xl border border-stone-200 bg-stone-50/30 text-stone-900 font-mono text-xs sm:text-sm placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-800 focus:border-stone-800 focus:bg-white transition-all resize-y"
            />
          </div>
        )}

        {inputType === 'url' && (
          <div className="space-y-2">
            <label htmlFor="scan-url-input" className="text-xs font-semibold text-stone-600 block">
              Job listing or apartment vacancy link
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                id="scan-url-input"
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://company-careers.example.com/apply/operations"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/30 text-stone-900 font-mono text-xs sm:text-sm placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-800 focus:border-stone-800 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[11px] text-stone-500">
              Evaluates domain age, typosquatting risk, lookalike recruiter domains, and certificate validity.
            </p>
          </div>
        )}

        {inputType === 'upload' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-600">
                Upload offer PDF or screenshot image
              </label>
              <span className="text-[11px] text-stone-400">PDF, PNG, JPG</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
            />

            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-stone-800 bg-stone-100/60'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/40 hover:bg-stone-50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-600 mb-2.5">
                  <Upload className="w-5 h-5 text-stone-600" />
                </div>
                <div className="text-sm font-semibold text-stone-900">
                  Click to browse or drop document here
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Supports job offer PDFs, appointment letters, or email screenshots
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
                    {uploadedFile.mimeType.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-xs sm:text-sm text-stone-900 truncate">
                      {uploadedFile.name}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {Math.round(uploadedFile.size / 1024)} KB • Ready for inspection
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-200 transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Action Bar: Clean & Uncongested */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(content.length > 0 || uploadedFile) && (
              <button
                type="button"
                id="btn-clear-input"
                onClick={onReset}
                className="text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer py-1 px-2"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            id="btn-run-threat-inspection"
            disabled={isSubmitDisabled}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-white font-semibold text-sm hover:bg-black active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none transition-all shadow-xs cursor-pointer"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-300" />
                <span>Inspecting Offer...</span>
              </>
            ) : (
              <>
                <span>Run Threat Inspection</span>
                <ArrowRight className="w-4 h-4 text-stone-300" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
