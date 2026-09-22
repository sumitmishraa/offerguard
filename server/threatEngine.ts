import { calculateSha256, generateReportId } from './security';

export type ThreatLevel = 'SAFE' | 'LOW_RISK' | 'SUSPICIOUS' | 'HIGH_THREAT' | 'CRITICAL_SCAM';
export type TargetCategory = 'Job Offer Scam' | 'Rental / Deposit Scam' | 'Phishing Communication' | 'Legitimate Offer' | 'Unverified Offer';

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

export interface HighlightSegment {
  text: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SafeReply {
  recipientTitle: string;
  subject: string;
  body: string;
  strategyRationale: string;
}

export interface DomainAnalysis {
  domain: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  isFreeOrSuspiciousEmail: boolean;
  domainAgeRiskAssessment: string;
  spoofedEntity: string;
}

export interface ThreatReport {
  scamThreatIndex: number;
  threatLevel: ThreatLevel;
  verdictSummary: string;
  targetCategory: TargetCategory;
  domainAnalysis: DomainAnalysis;
  redFlagChecks: RedFlagCheck[];
  identifiedRisks: IdentifiedRisk[];
  highlights: HighlightSegment[];
  safeReply: SafeReply;
  auditFingerprint: {
    reportId: string;
    sha256Fingerprint: string;
    timestamp: string;
    nodeSigner: string;
  };
  safetyRecommendations: string[];
  nextSteps: string[];
  analyzedAt: string;
  inputType: 'text' | 'url' | 'upload';
  sourcePreview: string;
  fullSourceText: string;
  isFallbackEngine: boolean;
}

/**
 * Deterministic Forensic Threat Engine
 * Evaluates suspicious employment offers, recruiter emails, and rental listings across 5 core fraud pillars.
 */
export function runHeuristicAnalysis(
  type: 'text' | 'url' | 'upload',
  content: string,
  fileName?: string
): ThreatReport {
  const lower = content.toLowerCase();
  let score = 5;

  const flags: RedFlagCheck[] = [];
  const risks: IdentifiedRisk[] = [];
  const highlights: HighlightSegment[] = [];

  // Pillar 1: Financial Advance / Fake Cashier Checks / Equipment Procurement Trap
  const checkCashingTerms = [
    'check', 'cashier', 'deposit this check', 'wire', 'zelle', 'apple cash',
    'venmo', 'bitcoin', 'crypto', 'gift card', 'hardware vendor', 'procurement',
    'certified check', 'direct deposit routing'
  ];
  const matchedCheckTerms = checkCashingTerms.filter(t => lower.includes(t));
  const isAdvanceCheckScam = (lower.includes('check') || lower.includes('cashier')) &&
    (lower.includes('vendor') || lower.includes('zelle') || lower.includes('wire') || lower.includes('apple cash') || lower.includes('bitcoin') || lower.includes('equipment'));

  if (isAdvanceCheckScam || matchedCheckTerms.length >= 3) {
    score += 50;
    flags.push({
      id: 'equipment-payment',
      name: 'Advance Fee & Fake Check Traps',
      status: 'CRITICAL_FAIL',
      detail: 'Demands advance check deposits or fund transfers for equipment or fees.',
      quoteEvidence: matchedCheckTerms.slice(0, 3).join(', ')
    });
    risks.push({
      id: 'r-check-fraud',
      title: 'Advance-Fee / Fake Cashier Check Laundering',
      severity: 'CRITICAL',
      category: 'Financial Trap',
      description: 'The sender requests depositing an employer check and transferring funds to a third-party vendor. The initial check will bounce days later, leaving the victim liable for the entire lost balance.',
      evidence: 'Referenced check deposit / wire transfer instructions.'
    });
    highlights.push({
      text: 'Referenced check deposit / wire transfer instructions.',
      reason: 'The sender requests depositing an employer check and transferring funds to a third-party vendor. The initial check will bounce days later, leaving the victim liable for the entire lost balance.',
      severity: 'CRITICAL'
    });
  } else if (matchedCheckTerms.length >= 1 && (lower.includes('fee') || lower.includes('pay') || lower.includes('deposit'))) {
    score += 25;
    flags.push({
      id: 'equipment-payment',
      name: 'Advance Fee & Fake Check Traps',
      status: 'WARNING',
      detail: 'Mentions upfront deposits or payments before employment commences.',
      quoteEvidence: matchedCheckTerms.slice(0, 2).join(', ')
    });
  } else {
    flags.push({
      id: 'equipment-payment',
      name: 'Advance Fee & Fake Check Traps',
      status: 'PASS',
      detail: 'No upfront check cashing or equipment procurement payments requested.'
    });
  }

  // Pillar 2: Unofficial Communication Channels (Telegram, WhatsApp, Signal)
  const chatTerms = ['telegram', 'whatsapp', 'signal', 'hangouts', 'google chat', 'skype'];
  const matchedChat = chatTerms.filter(t => lower.includes(t));
  if (matchedChat.length > 0) {
    score += 25;
    flags.push({
      id: 'comm-channel',
      name: 'Unofficial Communication Channels',
      status: 'CRITICAL_FAIL',
      detail: `Conducting interviews or onboarding via informal messaging channels (${matchedChat.join(', ')}).`,
      quoteEvidence: matchedChat.join(', ')
    });
    risks.push({
      id: 'r-informal-chat',
      title: 'Untraceable Off-Platform Interview',
      severity: 'HIGH',
      category: 'Deceptive Tactics',
      description: 'Legitimate employers conduct formal interviews via verified video tools (Google Meet, Zoom, Teams) or official applicant portals, not anonymous messaging platforms.',
      evidence: matchedChat[0]
    });
    highlights.push({
      text: matchedChat[0],
      reason: 'Legitimate employers conduct formal interviews via verified video tools (Google Meet, Zoom, Teams) or official applicant portals, not anonymous messaging platforms.',
      severity: 'HIGH'
    });
  } else {
    flags.push({
      id: 'comm-channel',
      name: 'Unofficial Communication Channels',
      status: 'PASS',
      detail: 'No suspicious off-platform messaging applications detected.'
    });
  }

  // Pillar 3: Free Email Provider for Corporate Representation
  const freeEmail = lower.includes('@gmail.com') || lower.includes('@yahoo.com') || lower.includes('@hotmail.com') || lower.includes('@outlook.com');
  const claimsCorporate = lower.includes('recruiting') || lower.includes('director') || lower.includes('hr') || lower.includes('operations') || lower.includes('corp') || lower.includes('llc') || lower.includes('inc');
  if (freeEmail && claimsCorporate) {
    score += 20;
    flags.push({
      id: 'sender-domain',
      name: 'Sender Domain Authenticity',
      status: 'WARNING',
      detail: 'Sender uses a public free email domain (Gmail/Yahoo/Outlook) rather than an authenticated corporate domain.'
    });
    risks.push({
      id: 'r-free-webmail',
      title: 'Sender Domain Discrepancy',
      severity: 'HIGH',
      category: 'Domain Impersonation',
      description: 'Formal corporate job offers originate from verified enterprise domains, not personal webmail accounts.'
    });
    highlights.push({
      text: 'Sender Domain Discrepancy',
      reason: 'Formal corporate job offers originate from verified enterprise domains, not personal webmail accounts.',
      severity: 'HIGH'
    });
  } else {
    flags.push({
      id: 'sender-domain',
      name: 'Sender Domain Authenticity',
      status: 'PASS',
      detail: 'Sender domain does not exhibit generic webmail impersonation flags.'
    });
  }

  // Pillar 4: Rental Deposit Traps (Sight-unseen property, wire before walkthrough)
  const rentalSigns = ['condo', 'apartment', 'rent', 'lease', 'tenant', 'deposit', 'keys', 'fedex', 'missionary', 'relocated', 'walkthrough'];
  const matchedRental = rentalSigns.filter(t => lower.includes(t));
  const isRental = matchedRental.length >= 3;
  if (isRental && (lower.includes('wire') || lower.includes('zelle') || lower.includes('apple cash') || lower.includes('fedex') || lower.includes('keys'))) {
    score += 40;
    flags.push({
      id: 'rental-deposit',
      name: 'Unseen Property Deposit Trap',
      status: 'CRITICAL_FAIL',
      detail: 'Demands security deposit or rent payment prior to in-person lease signing or physical walkthrough.'
    });
    risks.push({
      id: 'r-phantom-rental',
      title: 'Phantom Rental Deposit Theft',
      severity: 'CRITICAL',
      category: 'Financial Trap',
      description: 'The alleged owner claims inability to show the unit due to being abroad or out of town, promising to mail keys once a deposit is wired. The property is often not theirs to lease.',
      evidence: 'Keys delivered via courier upon wire receipt.'
    });
  }

  // Pillar 5: High-pressure urgency & premature PII demand
  if (lower.includes('ssn') || lower.includes('social security') || lower.includes('routing number') || lower.includes('within 12 hours') || lower.includes('within 24 hours') || lower.includes('urgent')) {
    score += 15;
    flags.push({
      id: 'urgency-pii',
      name: 'Premature PII & Artificial Urgency',
      status: 'WARNING',
      detail: 'High pressure deadline and sensitive SSN or banking credentials requested prior to formal vetting.'
    });
    risks.push({
      id: 'r-pii-harvest',
      title: 'Premature Identity Harvesting',
      severity: 'MEDIUM',
      category: 'Identity Theft',
      description: 'Candidate is coerced with a tight countdown to surrender government identifiers and direct deposit details.'
    });
  } else {
    flags.push({
      id: 'urgency-pii',
      name: 'Premature PII & Artificial Urgency',
      status: 'PASS',
      detail: 'Standard timeline without aggressive coercion observed.'
    });
  }

  // URL Checks
  let domain = 'text-analysis';
  let spoofedEntity = 'None detected';
  let domainRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  let domainAgeRisk = 'Standard corporate domain or text input.';

  if (type === 'url') {
    try {
      const parsedUrl = new URL(content.startsWith('http') ? content : `https://${content}`);
      domain = parsedUrl.hostname;
      const tld = domain.split('.').pop() || '';
      const suspiciousTlds = ['xyz', 'top', 'live', 'club', 'work', 'click', 'link', 'zip', 'monster'];
      const hasHyphen = domain.includes('-') && (domain.includes('portal') || domain.includes('career') || domain.includes('apply') || domain.includes('jobs') || domain.includes('hr'));

      if (suspiciousTlds.includes(tld) || hasHyphen) {
        score += 35;
        domainRiskLevel = 'HIGH';
        domainAgeRisk = `Newly registered or low-reputation top-level domain (.${tld}) with keyword combination typical of phishing lookalike sites.`;

        const brands = ['stripe', 'google', 'amazon', 'apple', 'microsoft', 'meta', 'netflix'];
        const matchedBrand = brands.find(b => domain.toLowerCase().includes(b));
        if (matchedBrand) {
          spoofedEntity = `Impersonating ${matchedBrand.charAt(0).toUpperCase() + matchedBrand.slice(1)}`;
          score += 25;
          domainRiskLevel = 'CRITICAL';
        }

        risks.push({
          id: 'r-domain-spoof',
          title: 'Lookalike Phishing Domain',
          severity: 'HIGH',
          category: 'Domain Impersonation',
          description: `The URL domain (${domain}) utilizes defensive keyword bundling and alternative TLDs to mimic legitimate corporate job portals.`,
          evidence: domain
        });
      }
    } catch {
      domain = 'invalid-url-format';
      domainRiskLevel = 'MODERATE';
      domainAgeRisk = 'Malformed or non-standard URL structure.';
    }
  }

  score = Math.min(Math.max(score, 4), 98);

  let threatLevel: ThreatLevel = 'LOW_RISK';
  if (score >= 80) threatLevel = 'CRITICAL_SCAM';
  else if (score >= 55) threatLevel = 'HIGH_THREAT';
  else if (score >= 30) threatLevel = 'SUSPICIOUS';
  else if (score >= 15) threatLevel = 'LOW_RISK';
  else threatLevel = 'SAFE';

  let targetCategory: TargetCategory = 'Job Offer Scam';
  if (isRental) targetCategory = 'Rental / Deposit Scam';
  else if (type === 'url') targetCategory = 'Phishing Communication';
  else if (threatLevel === 'SAFE') targetCategory = 'Legitimate Offer';

  let verdictSummary = '';
  if (threatLevel === 'CRITICAL_SCAM') {
    verdictSummary = isRental
      ? 'Critical rental scam indicators detected: sight-unseen property wire transfer request.'
      : 'Critical scam indicators detected: classic fake check procurement and advance-fee equipment scheme.';
  } else if (threatLevel === 'HIGH_THREAT') {
    verdictSummary = 'High threat indicators: unverified recruiter identity, informal communication platform, and premature data harvesting.';
  } else if (threatLevel === 'SUSPICIOUS') {
    verdictSummary = 'Suspicious elements detected: verify sender identity and avoid transferring any money or providing banking credentials.';
  } else {
    verdictSummary = 'No high-risk scam vectors detected. Ensure onboarding contracts are verified via the official company portal.';
  }

  const safeReply: SafeReply = threatLevel === 'CRITICAL_SCAM' || threatLevel === 'HIGH_THREAT'
    ? {
        recipientTitle: 'Alleged Recruiter / Sender',
        subject: 'Verification Request: Employee Requisition & Official Portal Link',
        body: `Hello,\n\nThank you for reaching out regarding this opportunity. As a security precaution, I do not accept mailed checks or transfer funds to third-party equipment vendors. Please provide:\n\n1. The official job requisition link on your company's verified careers portal (e.g. company.com/careers).\n2. Your corporate email address and direct phone extension matching the official domain.\n3. The name and email of your verified HR Operations Director for cross-reference.\n\nOnce verified through official channels, I will gladly proceed.`,
        strategyRationale: 'Firmly enforces security boundaries without disclosing banking info or confrontation; fraudulent actors will immediately break contact.'
      }
    : {
        recipientTitle: 'Hiring Team / HR Contact',
        subject: 'Acknowledgement & Next Steps: Offer Terms Verification',
        body: `Hello,\n\nThank you for extending this offer. I am reviewing the compensation and onboarding paperwork. Please confirm the direct link to the candidate onboarding portal so I can review the benefits documentation.\n\nLooking forward to speaking with the team.`,
        strategyRationale: 'Standard professional acknowledgement confirming details through secure internal portals.'
      };

  const sha256 = calculateSha256(content);
  const reportId = generateReportId();

  return {
    scamThreatIndex: score,
    threatLevel,
    verdictSummary,
    targetCategory,
    domainAnalysis: {
      domain,
      riskLevel: domainRiskLevel,
      isFreeOrSuspiciousEmail: freeEmail,
      domainAgeRiskAssessment: domainAgeRisk,
      spoofedEntity
    },
    redFlagChecks: flags,
    identifiedRisks: risks.length > 0 ? risks : [
      {
        id: 'r-verified-standard',
        title: 'Standard Employment Terms',
        severity: 'LOW',
        category: 'Baseline Check',
        description: 'Standard compensation and onboarding workflow with no equipment purchase or money transfer demands.'
      }
    ],
    highlights,
    safeReply,
    auditFingerprint: {
      reportId,
      sha256Fingerprint: sha256,
      timestamp: new Date().toISOString(),
      nodeSigner: 'OfferGuard-ForensicEngine-v2.4'
    },
    safetyRecommendations: [
      'Never deposit checks sent by an employer to buy hardware from an external vendor.',
      'Verify recruiter identities via the official corporate website careers page or verified LinkedIn profile.',
      'Never wire funds, send Zelle, or purchase gift cards for job equipment or rental reservations.',
      'Conduct all communication through corporate email domains (@company.com), never Telegram or personal webmail.'
    ],
    nextSteps: [
      'Report suspicious job postings to the Federal Trade Commission at ReportFraud.ftc.gov.',
      'Forward phishing emails to the FBI Internet Crime Complaint Center (IC3) at ic3.gov.',
      'Report domain abuse directly to the registrar and hosting provider.'
    ],
    analyzedAt: new Date().toISOString(),
    inputType: type,
    sourcePreview: content.slice(0, 160) + (content.length > 160 ? '...' : ''),
    fullSourceText: content,
    isFallbackEngine: true
  };
}
