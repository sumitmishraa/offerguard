import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  securityHeadersMiddleware,
  rateLimiterMiddleware,
  scanResultCache,
  validateScanInput,
  calculateSha256,
  generateReportId
} from './server/security';
import { runHeuristicAnalysis } from './server/threatEngine';

dotenv.config();

const app = express();
const PORT = 3000;

// Apply OWASP Top 10 Security Headers
app.use(securityHeadersMiddleware);

// Body Parsers with strict size limits
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
          'User-Agent': 'aistudio-build-offerguard',
        },
      },
    });
  }
  return aiClient;
}

// Health & Readiness Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'OfferGuard Threat Inspection API',
    version: '1.0.0',
    geminiConfigured: !!getGeminiClient(),
    cacheEntries: scanResultCache.size(),
    timestamp: new Date().toISOString()
  });
});

// Threat Scan Endpoint with Rate Limiting and Caching
app.post('/api/scan', rateLimiterMiddleware, async (req: Request, res: Response) => {
  const validation = validateScanInput(req.body);
  if (!validation.valid || !validation.data) {
    res.status(400).json({ error: validation.error || 'Invalid scan payload.' });
    return;
  }

  const { type, content, file } = validation.data;
  const rawFingerprintData = type === 'upload'
    ? (file?.base64?.slice(0, 5000) || file?.name || '')
    : content;

  // Cache Check: sub-millisecond retrieval on identical repeat checks
  const cacheKey = `${type}:${calculateSha256(rawFingerprintData)}`;
  const cachedResult = scanResultCache.get(cacheKey);
  if (cachedResult) {
    res.setHeader('X-Cache', 'HIT');
    res.json(cachedResult);
    return;
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

  const ai = getGeminiClient();

  // If Gemini is available, run deep forensic LLM inspection
  if (ai) {
    try {
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
          inputType: type,
          sourcePreview,
          fullSourceText: content || file?.name || '',
          uploadedFileName: file?.name,
          isFallbackEngine: false
        };

        // Cache successful inspection result
        scanResultCache.set(cacheKey, result);

        res.json(result);
        return;
      }
    } catch (err: unknown) {
      console.warn('Gemini API inspection failed or timed out, activating heuristic fallback:', err);
    }
  }

  // Fallback heuristic engine
  const fallbackResult = runHeuristicAnalysis(type, content || file?.name || 'Uploaded document', file?.name);
  const finalResult = {
    ...fallbackResult,
    auditFingerprint,
    sourcePreview,
    fullSourceText: content || file?.name,
    uploadedFileName: file?.name
  };

  // Cache fallback result for performance
  scanResultCache.set(cacheKey, finalResult);

  res.json(finalResult);
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OfferGuard server listening on http://0.0.0.0:${PORT}`);
  });
}

// Only launch standalone listener when not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
