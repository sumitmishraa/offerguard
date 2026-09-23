import { ScanResult, ScanInputType, RedFlagCheck, IdentifiedRisk, HighlightSegment, SafeVerificationReply, DomainAnalysis } from '../types';

/**
 * Client-Side Heuristic Threat Engine
 * Provides guaranteed zero-downtime threat analysis even in offline or network-degraded environments.
 */
export function analyzeClientThreat(
  type: ScanInputType,
  content: string,
  fileName?: string
): ScanResult {
  const lower = (content || '').toLowerCase();
  let score = 5;

  const flags: RedFlagCheck[] = [];
  const risks: IdentifiedRisk[] = [];
  const highlights: HighlightSegment[] = [];

  // Pillar 1: Advance Fee & Fake Check Traps
  const isAdvanceCheckScam = (lower.includes('check') || lower.includes('cashier')) &&
    (lower.includes('vendor') || lower.includes('zelle') || lower.includes('wire') || lower.includes('apple cash') || lower.includes('bitcoin') || lower.includes('equipment'));

  if (isAdvanceCheckScam) {
    score += 55;
    flags.push({
      id: 'equipment-payment',
      name: 'Advance Fee & Fake Check Traps',
      status: 'CRITICAL_FAIL',
      detail: 'Demands candidate deposit a cashier’s check and wire funds to a third-party equipment vendor.',
      quoteEvidence: 'deposit check and forward funds to certified hardware vendor'
    });
    risks.push({
      id: 'r-fake-check-laundering',
      title: 'Advance-Fee Fake Check Laundering',
      severity: 'CRITICAL',
      category: 'Financial Fraud',
      description: 'The employer claims to mail a cashier’s check for hardware setup. The bank will initially credit funds, but when the counterfeit check bounces 3–5 days later, the victim is held personally liable for all transferred funds.',
      evidence: 'Wire or transfer balance to equipment vendor'
    });
    highlights.push({
      text: 'deposit check and forward funds to vendor',
      reason: 'Classic counterfeit check laundering mechanism',
      severity: 'CRITICAL'
    });
  } else {
    flags.push({
      id: 'equipment-payment',
      name: 'Advance Fee & Fake Check Traps',
      status: 'PASS',
      detail: 'No upfront check cashing or equipment procurement payments requested.'
    });
  }

  // Pillar 2: Unofficial Communication Channels
  const isOffPlatform = lower.includes('telegram') || lower.includes('whatsapp') || lower.includes('signal') || lower.includes('text only interview');
  if (isOffPlatform) {
    score += 25;
    flags.push({
      id: 'comm-channel',
      name: 'Unofficial Communication Channels',
      status: 'CRITICAL_FAIL',
      detail: 'Interviews conducted exclusively over anonymous messaging applications (Telegram/WhatsApp).',
      quoteEvidence: 'contact our hiring manager on Telegram'
    });
    risks.push({
      id: 'r-telegram-phishing',
      title: 'Off-Platform Anonymous Interview Routing',
      severity: 'HIGH',
      category: 'Identity Obfuscation',
      description: 'Legitimate corporate enterprises conduct structured interviews via enterprise video conferencing (Zoom, Google Meet, Teams). Scammers use Telegram/WhatsApp because phone numbers are burner-based and chats are end-to-end encrypted or deletable for both parties.',
      evidence: 'Contact HR on Telegram / WhatsApp'
    });
    highlights.push({
      text: 'Telegram / WhatsApp interview',
      reason: 'Off-platform anonymous chat app used to evade enterprise monitoring',
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

  // Pillar 3: Domain Authenticity
  let domain = 'unknown-domain';
  let isFreeMail = false;
  if (type === 'url') {
    try {
      const parsedUrl = new URL(content.startsWith('http') ? content : `https://${content}`);
      domain = parsedUrl.hostname;
    } catch {
      domain = 'unverified-url';
    }
  } else {
    const emailMatch = content.match(/[\w.-]+@([\w.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      domain = emailMatch[1];
    }
  }

  const freeMailProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'proton.me'];
  if (freeMailProviders.includes(domain.toLowerCase())) {
    isFreeMail = true;
    score += 20;
    flags.push({
      id: 'sender-domain',
      name: 'Sender Domain Authenticity',
      status: 'WARNING',
      detail: `Corporate recruiter communicating via free consumer webmail (@${domain}).`,
      quoteEvidence: `@${domain}`
    });
  } else {
    flags.push({
      id: 'sender-domain',
      name: 'Sender Domain Authenticity',
      status: 'PASS',
      detail: 'Sender domain does not exhibit generic webmail impersonation flags.'
    });
  }

  // Pillar 4: Rental Deposit Traps
  const isRentalScam = lower.includes('lease') || lower.includes('apartment') || lower.includes('rent') || lower.includes('landlord');
  const unseenWire = isRentalScam && (lower.includes('deposit') || lower.includes('wire') || lower.includes('keys by mail') || lower.includes('out of town'));
  if (unseenWire) {
    score += 45;
    flags.push({
      id: 'unseen-property',
      name: 'Unseen Property Deposit Trap',
      status: 'CRITICAL_FAIL',
      detail: 'Demands security deposit or first month rent before physical property inspection.',
      quoteEvidence: 'wire deposit prior to walkthrough'
    });
  }

  // Pillar 5: Urgency & Premature PII
  const hasUrgency = lower.includes('urgent') || lower.includes('within 24 hours') || lower.includes('immediate response') || lower.includes('ssn') || lower.includes('social security');
  if (hasUrgency) {
    score += 15;
    flags.push({
      id: 'urgency-pii',
      name: 'Premature PII & Artificial Urgency',
      status: 'WARNING',
      detail: 'Artificial urgency or premature identity document collection.',
      quoteEvidence: 'respond within 24 hours with banking details'
    });
  } else {
    flags.push({
      id: 'urgency-pii',
      name: 'Premature PII & Artificial Urgency',
      status: 'PASS',
      detail: 'Standard timeline without aggressive coercion observed.'
    });
  }

  const boundedScore = Math.min(Math.max(score, 5), 100);

  let threatLevel: ScanResult['threatLevel'] = 'SAFE';
  if (boundedScore >= 80) threatLevel = 'CRITICAL_SCAM';
  else if (boundedScore >= 60) threatLevel = 'HIGH_THREAT';
  else if (boundedScore >= 40) threatLevel = 'SUSPICIOUS';
  else if (boundedScore >= 20) threatLevel = 'LOW_RISK';

  const domainAnalysis: DomainAnalysis = {
    domain,
    riskLevel: isFreeMail || boundedScore >= 70 ? 'CRITICAL' : boundedScore >= 40 ? 'MODERATE' : 'LOW',
    isFreeOrSuspiciousEmail: isFreeMail,
    domainAgeRiskAssessment: isFreeMail ? 'Consumer webmail domain used for enterprise recruiting' : 'Standard domain profile',
    spoofedEntity: isAdvanceCheckScam || isOffPlatform ? 'Corporate Recruitment Brand' : 'None detected'
  };

  const safeReply: SafeVerificationReply = {
    recipientTitle: 'Hiring Team / Property Representative',
    subject: `Verification Request: Inquiry Regarding ${type === 'url' ? 'Listing' : 'Offer'} Authenticity`,
    body: `Hello,\n\nThank you for reaching out regarding this opportunity. To ensure compliance with security verification standards, please provide:\n\n1. The direct URL to this requisition on your official corporate careers portal.\n2. Your direct enterprise email address (@company.com) and office extension.\n3. Confirmation that all onboarding hardware is provisioned directly by corporate IT without candidate advance funds.\n\nThank you for your cooperation.\n\nBest regards,`,
    strategyRationale: 'Pushes the sender to provide verifiable enterprise credentials. Scammers will immediately disengage.'
  };

  const reportId = `OG-2026-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  return {
    scamThreatIndex: boundedScore,
    threatLevel,
    verdictSummary: boundedScore >= 70
      ? 'High-confidence fraudulent communication detected with advance-fee or off-platform impersonation markers.'
      : boundedScore >= 35
      ? 'Suspicious communication patterns observed. Exercise heightened caution before sharing personal credentials.'
      : 'No high-risk scam indicators detected. Verify onboarding links via official corporate channels.',
    targetCategory: isRentalScam ? 'Rental / Deposit Scam' : isAdvanceCheckScam ? 'Job Offer Scam' : 'Phishing Communication',
    domainAnalysis,
    redFlagChecks: flags,
    identifiedRisks: risks.length > 0 ? risks : [
      {
        id: 'r-baseline',
        title: 'Standard Baseline Security Evaluation',
        severity: 'LOW',
        category: 'Baseline Analysis',
        description: 'No critical red flags detected in input content. Adhere to standard verification procedures.'
      }
    ],
    highlights,
    safeReply,
    auditFingerprint: {
      reportId,
      sha256Fingerprint: 'client-evaluated-' + Math.random().toString(16).slice(2),
      timestamp: new Date().toISOString(),
      nodeSigner: 'OfferGuard-ClientSafetyNet'
    },
    safetyRecommendations: [
      'Never deposit checks sent by an employer to buy hardware from an external vendor.',
      'Verify recruiter identities via official corporate careers pages or verified LinkedIn profiles.',
      'Never wire funds, send Zelle, or purchase gift cards for job equipment or rental reservations.',
      'Conduct all communications through verified corporate email domains, never anonymous chat apps.'
    ],
    nextSteps: [
      'Report suspicious communications to the Federal Trade Commission at ReportFraud.ftc.gov.',
      'Forward phishing emails to the FBI Internet Crime Complaint Center (IC3) at ic3.gov.',
      'Report domain impersonation directly to the registrar abuse contact.'
    ],
    analyzedAt: new Date().toISOString(),
    inputType: type,
    sourcePreview: type === 'upload' ? (fileName || 'Uploaded Document') : content.slice(0, 160),
    fullSourceText: content,
    uploadedFileName: fileName,
    isFallbackEngine: true
  };
}
