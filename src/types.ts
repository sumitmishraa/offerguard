export type ScanInputType = 'text' | 'url' | 'upload';

export type ThreatLevel = 'SAFE' | 'LOW_RISK' | 'SUSPICIOUS' | 'HIGH_THREAT' | 'CRITICAL_SCAM';

export interface RedFlagCheck {
  id: string;
  name: string;
  status: 'PASS' | 'WARNING' | 'CRITICAL_FAIL';
  detail: string;
  quoteEvidence?: string;
}

export interface IdentifiedRisk {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  description: string;
  evidence?: string;
}

export interface DomainAnalysis {
  domain: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  isFreeOrSuspiciousEmail: boolean;
  domainAgeRiskAssessment: string;
  spoofedEntity: string;
}

export interface HighlightSegment {
  text: string;
  reason: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface SafeVerificationReply {
  recipientTitle: string;
  subject: string;
  body: string;
  strategyRationale: string;
}

export interface AuditFingerprint {
  reportId: string;
  sha256Fingerprint: string;
  timestamp: string;
  nodeSigner: string;
}

export interface UploadedFile {
  name: string;
  size: number;
  mimeType: string;
  base64: string;
  previewUrl?: string;
}

export interface ScanResult {
  scamThreatIndex: number; // 0 to 100
  threatLevel: ThreatLevel;
  verdictSummary: string;
  targetCategory: 'Job Offer Scam' | 'Rental / Deposit Scam' | 'Phishing Communication' | 'Legitimate Offer' | 'Unverified Offer';
  domainAnalysis: DomainAnalysis;
  redFlagChecks: RedFlagCheck[];
  identifiedRisks: IdentifiedRisk[];
  highlights?: HighlightSegment[];
  safeReply?: SafeVerificationReply;
  auditFingerprint: AuditFingerprint;
  safetyRecommendations: string[];
  nextSteps: string[];
  analyzedAt: string;
  inputType: ScanInputType;
  sourcePreview: string;
  fullSourceText?: string;
  uploadedFileName?: string;
  isFallbackEngine?: boolean;
}

export interface SampleScenario {
  id: string;
  title: string;
  category: 'Job Offer' | 'Rental Trap' | 'Legitimate';
  threatExpected: 'Critical' | 'High' | 'Safe';
  type: ScanInputType;
  content: string;
  description: string;
}

