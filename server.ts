import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Lazy initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Fallback heuristic scanner for reliable local demo & failover
function runHeuristicAnalysis(type: 'text' | 'url' | 'upload', content: string, fileName?: string) {
  const lower = content.toLowerCase();
  let score = 5;
  const flags: Array<{
    id: string;
    name: string;
    status: 'PASS' | 'WARNING' | 'CRITICAL_FAIL';
    detail: string;
    quoteEvidence?: string;
  }> = [];

  const risks: Array<{
    id: string;
    title: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: string;
    description: string;
    evidence?: string;
  }> = [];

  // Check 1: Financial Advance / Equipment / Check Cashing
  const checkCashingTerms = ['check', 'cashier', 'deposit this check', 'wire', 'zelle', 'apple cash', 'venmo', 'bitcoin', 'crypto', 'gift card', 'hardware vendor'];
  const matchedCheckTerms = checkCashingTerms.filter(t => lower.includes(t));
  if (matchedCheckTerms.length >= 2) {
    score += 45;
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
  } else {
    flags.push({
      id: 'equipment-payment',
      name: 'Advance Fee & Fake Check Traps',
      status: 'PASS',
      detail: 'No upfront check cashing or equipment procurement payments requested.'
    });
  }

  // Check 2: Off-platform / Unofficial Messaging (Telegram, WhatsApp, Signal)
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
  } else {
    flags.push({
      id: 'comm-channel',
      name: 'Unofficial Communication Channels',
      status: 'PASS',
      detail: 'No suspicious off-platform messaging applications detected.'
    });
  }

  // Check 3: Free Email Provider for Corporate Representation
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
  } else {
    flags.push({
      id: 'sender-domain',
      name: 'Sender Domain Authenticity',
      status: 'PASS',
      detail: 'Sender domain does not exhibit generic webmail impersonation flags.'
    });
  }

  // Check 4: Rental Deposit Traps (Overseas landlord, wire before walkthrough)
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

  // Check 5: High-pressure urgency & premature PII demand
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

  // URL checks if input is URL
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
        
        // Check if spoofing common brand
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
  let threatLevel: 'SAFE' | 'LOW_RISK' | 'SUSPICIOUS' | 'HIGH_THREAT' | 'CRITICAL_SCAM' = 'LOW_RISK';
  if (score >= 80) threatLevel = 'CRITICAL_SCAM';
  else if (score >= 55) threatLevel = 'HIGH_THREAT';
  else if (score >= 30) threatLevel = 'SUSPICIOUS';
  else if (score >= 15) threatLevel = 'LOW_RISK';
  else threatLevel = 'SAFE';

  let targetCategory: 'Job Offer Scam' | 'Rental / Deposit Scam' | 'Phishing Communication' | 'Legitimate Offer' | 'Unverified Offer' = 'Job Offer Scam';
  if (isRental) targetCategory = 'Rental / Deposit Scam';
  else if (type === 'url') targetCategory = 'Phishing Communication';
  else if (threatLevel === 'SAFE') targetCategory = 'Legitimate Offer';

  let verdictSummary = '';
  if (threatLevel === 'CRITICAL_SCAM') {
    verdictSummary = isRental 
      ? 'Critical rental deposit trap detected: demands advance funds via wire or cash apps prior to physical access.'
      : 'Critical scam indicators detected: classic fake check procurement and advance-fee equipment scheme.';
  } else if (threatLevel === 'HIGH_THREAT') {
    verdictSummary = 'High threat risk: communication exhibits deceptive domain spoofing, off-platform interviews, or premature sensitive data collection.';
  } else if (threatLevel === 'SUSPICIOUS') {
    verdictSummary = 'Suspicious elements detected: verify sender identity and avoid transferring any money or providing banking credentials.';
  } else {
    verdictSummary = 'Low risk profile: this communication reflects standard hiring practices with no advance financial traps.';
  }

  const sha256 = crypto.createHash('sha256').update(content || 'empty_scan').digest('hex');
  const reportId = `OG-2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const highlights = risks.slice(0, 3).map(r => ({
    text: r.evidence || r.title,
    reason: r.description,
    severity: (r.severity === 'CRITICAL' ? 'CRITICAL' : r.severity === 'HIGH' ? 'HIGH' : 'MEDIUM') as 'CRITICAL' | 'HIGH' | 'MEDIUM'
  }));
  if (highlights.length === 0) {
    highlights.push({
      text: content.slice(0, 80),
      reason: 'Standard terms evaluated against employment threat heuristics.',
      severity: 'MEDIUM'
    });
  }

  const safeReply = threatLevel === 'SAFE' ? {
    recipientTitle: 'Hiring Team / Talent Acquisition',
    subject: 'Offer Letter Confirmation & Onboarding Steps',
    body: 'Dear Hiring Team,\n\nThank you for extending this offer. I have reviewed the terms and look forward to completing formal onboarding. Please confirm our first check-in time and verify the direct internal contact for our department.\n\nBest regards,\nCandidate',
    strategyRationale: 'Standard professional acknowledgement for legitimate employment communications.'
  } : {
    recipientTitle: 'Alleged Recruiter / Sender',
    subject: 'Verification Request: Employee Requisition & Official Portal Link',
    body: 'Hello,\n\nThank you for reaching out regarding this opportunity. As a security precaution, I do not accept mailed checks or transfer funds to third-party equipment vendors. Please provide:\n\n1. The official job requisition link on your company\'s verified careers portal (e.g. company.com/careers).\n2. Your corporate email address and direct phone extension matching the official domain.\n3. The name and email of your verified HR Operations Director for cross-reference.\n\nOnce verified through official channels, I will gladly proceed.',
    strategyRationale: 'Firmly enforces security boundaries without disclosing banking info or confrontation; fraudulent actors will immediately break contact.'
  };

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

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'OfferGuard API',
    geminiConfigured: !!getGeminiClient(),
  });
});

app.post('/api/scan', async (req: Request, res: Response) => {
  const { type, content, file } = req.body;

  const inputType: 'text' | 'url' | 'upload' = type === 'upload' ? 'upload' : type === 'url' ? 'url' : 'text';
  const trimmed = typeof content === 'string' ? content.trim() : '';

  if (inputType !== 'upload' && trimmed.length === 0) {
    res.status(400).json({ error: 'Content is required for threat scanning.' });
    return;
  }

  if (inputType === 'upload' && (!file || !file.base64)) {
    res.status(400).json({ error: 'Uploaded file data is required.' });
    return;
  }

  const ai = getGeminiClient();
  const sourcePreview = inputType === 'upload'
    ? `Uploaded Document: ${file?.name || 'document'} (${Math.round((file?.size || 0) / 1024)} KB)`
    : trimmed.slice(0, 160) + (trimmed.length > 160 ? '...' : '');

  // Calculate cryptographic sha256 fingerprint
  const rawFingerprintData = inputType === 'upload' ? (file?.base64?.slice(0, 5000) || file?.name || '') : trimmed;
  const sha256 = crypto.createHash('sha256').update(rawFingerprintData).digest('hex');
  const reportId = `OG-2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const auditFingerprint = {
    reportId,
    sha256Fingerprint: sha256,
    timestamp: new Date().toISOString(),
    nodeSigner: 'OfferGuard-ForensicEngine-v2.4'
  };

  // If Gemini is available, run deep security inspection
  if (ai) {
    try {
      const prompt = `Analyze this ${inputType === 'url' ? 'job/rental URL' : inputType === 'upload' ? 'uploaded job offer document / appointment letter / rental agreement' : 'job offer letter / recruiter communication'} for scam indicators, advance-fee equipment check scams, rental deposit traps, lookalike domain spoofing, domain age risks, and social engineering manipulation:

${inputType === 'upload' ? `DOCUMENT FILENAME: ${file?.name || 'unknown'}` : ''}
${trimmed ? `EXTRACTED TEXT:\n"""\n${trimmed.slice(0, 8000)}\n"""` : ''}

Evaluate with high cybersecurity precision:
1. SCAM THREAT INDEX: 0 (completely legitimate) to 100 (irrefutable scam/fraud).
2. THREAT LEVEL: Exactly one of: SAFE, LOW_RISK, SUSPICIOUS, HIGH_THREAT, CRITICAL_SCAM.
3. VERDICT SUMMARY: A sharp 1-2 sentence executive threat summary.
4. TARGET CATEGORY: 'Job Offer Scam', 'Rental / Deposit Scam', 'Phishing Communication', or 'Legitimate Offer'.
5. DOMAIN ANALYSIS:
   - domain: domain name or sender email domain
   - riskLevel: LOW, MODERATE, HIGH, or CRITICAL
   - isFreeOrSuspiciousEmail: boolean (true if corporate recruiter uses gmail, yahoo, outlook, or burner domain)
   - domainAgeRiskAssessment: assessment of domain registration age, typosquatting, impersonation, or mismatched MX/WHOIS indicators
   - spoofedEntity: name of impersonated enterprise/brand, or 'None detected'
6. RED FLAG CHECKS: Check each of these specific security pillars:
   - 'Advance Fee & Fake Check Traps'
   - 'Unofficial Communication Channels' (Telegram/WhatsApp vs official Meet/Zoom)
   - 'Sender Domain Authenticity' (free webmail vs corporate domain)
   - 'Unseen Property Deposit Trap' (rental without physical walkthrough)
   - 'Premature PII & Artificial Urgency' (requesting SSN/bank info upfront, tight hours deadline)
   Provide status (PASS, WARNING, CRITICAL_FAIL), explanation, and exact verbatim quoted text if present.
7. IDENTIFIED RISKS: Detailed array of specific threats with severity (LOW, MEDIUM, HIGH, CRITICAL), category, description, and excerpt evidence.
8. HIGHLIGHTS: Extract 2 to 4 verbatim quotes or phrases from the document/text that triggered red flags, with reason and severity (CRITICAL, HIGH, or MEDIUM).
9. SAFE REPLY: A composed, highly professional verification email the candidate can send to verify legitimacy safely without exposing bank details or PII. Includes recipientTitle, subject, body, and strategyRationale.
10. SAFETY RECOMMENDATIONS: 3 to 5 clear, direct protective actions for job seekers or renters.
11. NEXT STEPS: Specific reporting and escalation instructions (FTC, IC3, corporate abuse teams).`;

      console.log('Sending inspection request to Gemini 3.8 Flash...');

      let contentsPayload: any;
      if (inputType === 'upload' && file?.base64) {
        const cleanBase64 = file.base64.replace(/^data:[^;]+;base64,/, '');
        const validMime = file.mimeType && (file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf')
          ? file.mimeType
          : 'image/png';

        contentsPayload = [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: validMime
            }
          },
          {
            text: prompt
          }
        ];
      } else {
        contentsPayload = prompt;
      }

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          systemInstruction: 'You are OfferGuard, a senior cybersecurity analyst and digital fraud investigator specializing in employment phishing, fake check advance-fee scams, and apartment rental deposit traps. You evaluate job offer letters, recruiter emails, and vacancy URLs with rigorous skepticism, flagging subtle indicators such as Telegram interviews, certified check equipment scams, generic webmail senders, and premature SSN/banking demands.',
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scamThreatIndex: {
                type: Type.INTEGER,
                description: '0 to 100 scam risk index. 0-25 Safe, 26-55 Suspicious, 56-80 High Threat, 81-100 Critical Scam.'
              },
              threatLevel: {
                type: Type.STRING,
                description: 'SAFE, LOW_RISK, SUSPICIOUS, HIGH_THREAT, or CRITICAL_SCAM'
              },
              verdictSummary: {
                type: Type.STRING,
                description: 'Direct executive verdict explaining primary finding'
              },
              targetCategory: {
                type: Type.STRING,
                description: 'Job Offer Scam, Rental / Deposit Scam, Phishing Communication, or Legitimate Offer'
              },
              domainAnalysis: {
                type: Type.OBJECT,
                properties: {
                  domain: { type: Type.STRING },
                  riskLevel: { type: Type.STRING },
                  isFreeOrSuspiciousEmail: { type: Type.BOOLEAN },
                  domainAgeRiskAssessment: { type: Type.STRING },
                  spoofedEntity: { type: Type.STRING }
                },
                required: ['domain', 'riskLevel', 'isFreeOrSuspiciousEmail', 'domainAgeRiskAssessment', 'spoofedEntity']
              },
              redFlagChecks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    status: { type: Type.STRING },
                    detail: { type: Type.STRING },
                    quoteEvidence: { type: Type.STRING }
                  },
                  required: ['id', 'name', 'status', 'detail']
                }
              },
              identifiedRisks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    evidence: { type: Type.STRING }
                  },
                  required: ['id', 'title', 'severity', 'category', 'description']
                }
              },
              highlights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    severity: { type: Type.STRING }
                  },
                  required: ['text', 'reason', 'severity']
                }
              },
              safeReply: {
                type: Type.OBJECT,
                properties: {
                  recipientTitle: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  body: { type: Type.STRING },
                  strategyRationale: { type: Type.STRING }
                },
                required: ['recipientTitle', 'subject', 'body', 'strategyRationale']
              },
              safetyRecommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              nextSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: [
              'scamThreatIndex',
              'threatLevel',
              'verdictSummary',
              'targetCategory',
              'domainAnalysis',
              'redFlagChecks',
              'identifiedRisks',
              'safetyRecommendations',
              'nextSteps'
            ]
          }
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out after 10s')), 10000)
      );

      const response = await Promise.race([geminiPromise, timeoutPromise]);
      console.log('Gemini inspection completed successfully.');

      const rawText = response.text;
      if (rawText) {
        const parsed = JSON.parse(rawText.trim());
        const result = {
          ...parsed,
          scamThreatIndex: Math.min(Math.max(Number(parsed.scamThreatIndex) || 0, 0), 100),
          auditFingerprint,
          analyzedAt: new Date().toISOString(),
          inputType,
          sourcePreview,
          fullSourceText: trimmed || file?.name || '',
          uploadedFileName: file?.name,
          isFallbackEngine: false
        };
        res.json(result);
        return;
      }
    } catch (err: unknown) {
      console.warn('Gemini API inspection failed or timed out, activating heuristic fallback:', err);
    }
  }

  // Fallback heuristic engine
  const fallbackResult = runHeuristicAnalysis(inputType, trimmed || file?.name || 'Uploaded document', file?.name);
  res.json({
    ...fallbackResult,
    auditFingerprint,
    sourcePreview,
    fullSourceText: trimmed || file?.name,
    uploadedFileName: file?.name
  });
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OfferGuard server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
