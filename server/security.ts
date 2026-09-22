import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Validated scan input structure
 */
export interface ValidatedScanInput {
  type: 'text' | 'url' | 'upload';
  content: string;
  file?: {
    name: string;
    size: number;
    mimeType: string;
    base64: string;
  };
}

/**
 * Computes deterministic SHA-256 cryptographic digest
 */
export function calculateSha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generates an immutable, evidentiary Report ID for law enforcement reporting (FTC / IC3)
 */
export function generateReportId(): string {
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  const year = new Date().getFullYear();
  return `OG-${year}-${randomSuffix}`;
}

/**
 * Security Headers Middleware adhering to OWASP Top 10 recommendations
 */
export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
}

/**
 * Rate Limiter State
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requests/minute per IP

// Periodic garbage collection for expired rate limit records
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Rate Limiter Middleware to defend against denial-of-service and automated bot scanning
 */
export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                   req.socket.remoteAddress ||
                   '127.0.0.1';

  const now = Date.now();
  const record = rateLimitStore.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(clientIp, { count: 1, resetTime: now + WINDOW_MS });
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS_PER_WINDOW - 1).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + WINDOW_MS) / 1000).toString());
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());
    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({
      error: 'Rate limit exceeded. Please wait before submitting another threat inspection.',
      retryAfterSeconds: retryAfter
    });
    return;
  }

  record.count++;
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
  res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS_PER_WINDOW - record.count).toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());
  next();
}

/**
 * In-Memory LRU Cache for high-performance sub-millisecond repeated analysis
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class ThreatScanCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxItems: number;
  private defaultTtlMs: number;

  constructor(maxItems = 300, defaultTtlMs = 30 * 60 * 1000) {
    this.maxItems = maxItems;
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const scanResultCache = new ThreatScanCache<unknown>(300, 30 * 60 * 1000);

/**
 * Strict Input Validation for threat scan requests
 */
export function validateScanInput(body: unknown): {
  valid: boolean;
  error?: string;
  data?: ValidatedScanInput;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }

  const { type, content, file } = body as Record<string, unknown>;

  const inputType = type === 'upload' ? 'upload' : type === 'url' ? 'url' : 'text';

  if (inputType === 'upload') {
    if (!file || typeof file !== 'object') {
      return { valid: false, error: 'Uploaded file data is required for file inspection.' };
    }
    const f = file as Record<string, unknown>;
    if (!f.base64 || typeof f.base64 !== 'string') {
      return { valid: false, error: 'File base64 content is required.' };
    }
    return {
      valid: true,
      data: {
        type: 'upload',
        content: typeof content === 'string' ? content : '',
        file: {
          name: typeof f.name === 'string' ? f.name : 'uploaded-document',
          size: typeof f.size === 'number' ? f.size : 0,
          mimeType: typeof f.mimeType === 'string' ? f.mimeType : 'application/octet-stream',
          base64: f.base64
        }
      }
    };
  }

  if (typeof content !== 'string' || content.trim().length === 0) {
    return { valid: false, error: 'Content is required for threat scanning.' };
  }

  const trimmed = content.trim();
  if (trimmed.length > 500000) {
    return { valid: false, error: 'Content exceeds the maximum permitted limit of 500,000 characters.' };
  }

  return {
    valid: true,
    data: {
      type: inputType,
      content: trimmed
    }
  };
}
