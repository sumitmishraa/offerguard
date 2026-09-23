import { GoogleGenAI, Type } from '@google/genai';
import {
  validateScanInput,
  calculateSha256,
  generateReportId,
  scanResultCache
} from '../server/security';
import { runHeuristicAnalysis } from '../server/threatEngine';

function sendResponse(res: any, statusCode: number, data: any) {
  try {
    if (typeof res.status === 'function') {
      const resWithStatus = res.status(statusCode);
      if (resWithStatus && typeof resWithStatus.json === 'function') {
        return resWithStatus.json(data);
      }
    }
    if (typeof res.json === 'function') {
      res.statusCode = statusCode;
      return res.json(data);
    }
  } catch {
    // Fall back to low-level ServerResponse methods
  }
  
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  if (typeof res.end === 'function') {
    return res.end(JSON.stringify(data));
  }
}

export default async function handler(req: any, res: any) {
  // CORS & Security headers
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  } catch {
    // Ignore if already sent
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    if (typeof res.end === 'function') return res.end();
    return;
  }

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method Not Allowed' });
  }

  // Parse body safely (Vercel may provide string or object)
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // Keep as-is if unparseable
    }
  }

  // Global bulletproof try-catch: guarantees the server NEVER returns a 500 error
  try {
    const validation = validateScanInput(body);
    if (!validation.valid || !validation.data) {
      return sendResponse(res, 400, { error: validation.error || 'Invalid scan payload.' });
    }

    const { type, content, file } = validation.data;
    const rawFingerprintData = type === 'upload'
      ? (file?.base64?.slice(0, 5000) || file?.name || '')
      : content;

    // Cache Check
    const cacheKey = `${type}:${calculateSha256(rawFingerprintData)}`;
    const cachedResult = scanResultCache.get(cacheKey);
    if (cachedResult) {
      res.setHeader('X-Cache', 'HIT');
      return sendResponse(res, 200, cachedResult);
    }

    res.setHeader('X-Cache', 'MISS');

    const sha256 = calculateSha256(rawFingerprintData);
    const reportId = generateReportId();
    const auditFingerprint = {
      reportId,
      sha256Fingerprint: sha256,
      timestamp: new Date().toISOString(),
      nodeSigner: 'OfferGuard-ForensicEngine-v2.4'
    };

    const sourcePreview = type === 'upload'
      ? `Uploaded Document: ${file?.name || 'document'} (${Math.round((file?.size || 0) / 1024)} KB)`
      : content.slice(0, 160) + (content.length > 160 ? '...' : '');

    // Check Gemini API Availability
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '') {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build-offerguard',
            },
          },
        });

        const prompt = `Analyze this ${type === 'url' ? 'job/rental URL' : type === 'upload' ? 'uploaded job offer document / appointment letter / rental agreement' : 'job offer letter / recruiter communication'} for scam indicators, advance-fee equipment check scams, rental deposit traps, lookalike domain spoofing, domain age risks, and social engineering manipulation:

${type === 'upload' ? `DOCUMENT FILENAME: ${file?.name || 'unknown'}` : ''}
${content ? `EXTRACTED TEXT:\n"""\n${content.slice(0, 8000)}\n"""` : ''}

Evaluate with high cybersecurity precision:
1. SCAM THREAT INDEX: 0 (completely legitimate) to 100 (irrefutable scam/fraud).
2. THREAT LEVEL: Exactly one of: SAFE, LOW_RISK, SUSPICIOUS, HIGH_THREAT, CRITICAL_SCAM.
3. VERDICT SUMMARY: A sharp 1-2 sentence executive threat summary.
4. TARGET CATEGORY: 'Job Offer Scam', 'Rental / Deposit Scam', 'Phishing Communication', or 'Legitimate Offer'.
5. DOMAIN ANALYSIS:
   - domain: domain name or sender email domain
   - riskLevel: LOW, MODERATE, HIGH, or CRITICAL
   - isFreeOrSuspiciousEmail: boolean
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
8. HIGHLIGHTS: Extract 2 to 4 verbatim quotes or phrases that triggered red flags, with reason and severity (CRITICAL, HIGH, or MEDIUM).
9. SAFE REPLY: A composed, highly professional verification email the candidate can send to verify legitimacy safely without exposing bank details or PII. Includes recipientTitle, subject, body, and strategyRationale.
10. SAFETY RECOMMENDATIONS: 3 to 5 clear, direct protective actions for job seekers or renters.
11. NEXT STEPS: Specific reporting and escalation instructions (FTC, IC3, corporate abuse teams).`;

        let contentsPayload: unknown;
        if (type === 'upload' && file?.base64) {
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

        const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
        const geminiPromise = ai.models.generateContent({
          model: modelName,
          contents: contentsPayload as any,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                scamThreatIndex: { type: Type.INTEGER, description: 'Threat score from 0 (safe) to 100 (critical scam)' },
                threatLevel: {
                  type: Type.STRING,
                  enum: ['SAFE', 'LOW_RISK', 'SUSPICIOUS', 'HIGH_THREAT', 'CRITICAL_SCAM']
                },
                verdictSummary: { type: Type.STRING },
                targetCategory: {
                  type: Type.STRING,
                  enum: ['Job Offer Scam', 'Rental / Deposit Scam', 'Phishing Communication', 'Legitimate Offer', 'Unverified Offer']
                },
                domainAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    domain: { type: Type.STRING },
                    riskLevel: { type: Type.STRING, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] },
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
                      status: { type: Type.STRING, enum: ['PASS', 'WARNING', 'CRITICAL_FAIL'] },
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
                      severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
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
                      severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }
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
          setTimeout(() => reject(new Error('Gemini API timeout after 8s')), 8000)
        );

        const response = await Promise.race([geminiPromise, timeoutPromise]);
        const rawText = response.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.trim());
          const result = {
            ...parsed,
            scamThreatIndex: Math.min(Math.max(Number(parsed.scamThreatIndex) || 0, 0), 100),
            auditFingerprint,
            analyzedAt: new Date().toISOString(),
            inputType: type,
            sourcePreview,
            fullSourceText: content || file?.name || '',
            uploadedFileName: file?.name,
            isFallbackEngine: false
          };

          scanResultCache.set(cacheKey, result);
          return sendResponse(res, 200, result);
        }
      } catch (geminiErr: unknown) {
        console.warn('Gemini invocation failed, falling back to heuristic engine:', geminiErr);
      }
    }

    // Heuristic analysis fallback (Runs when Gemini API is unavailable, timed out, or quota exceeded)
    const fallbackResult = runHeuristicAnalysis(type, content || file?.name || 'Inspection payload', file?.name);
    const finalResult = {
      ...fallbackResult,
      auditFingerprint,
      sourcePreview,
      fullSourceText: content || file?.name,
      uploadedFileName: file?.name
    };

    scanResultCache.set(cacheKey, finalResult);
    return sendResponse(res, 200, finalResult);

  } catch (globalErr: unknown) {
    console.error('Unexpected error in /api/scan, invoking emergency heuristic safety net:', globalErr);
    // Emergency Safety Net: NEVER return a 500 error to the client
    const fallback = runHeuristicAnalysis('text', String(body?.content || 'Unverified content'), body?.file?.name);
    const reportId = generateReportId();
    const sha256 = calculateSha256(String(body?.content || 'emergency'));
    
    const emergencyResult = {
      ...fallback,
      auditFingerprint: {
        reportId,
        sha256Fingerprint: sha256,
        timestamp: new Date().toISOString(),
        nodeSigner: 'OfferGuard-SafetyNet'
      },
      sourcePreview: String(body?.content || 'Scan Payload').slice(0, 100),
      fullSourceText: String(body?.content || ''),
      isFallbackEngine: true
    };

    return sendResponse(res, 200, emergencyResult);
  }
}
