import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSha256,
  generateReportId,
  validateScanInput
} from '../server/security';

describe('Security Controls & Payload Validation', () => {
  it('should compute deterministic 64-character SHA-256 hashes', () => {
    const inputA = 'Sample Offer Letter Content';
    const hashA1 = calculateSha256(inputA);
    const hashA2 = calculateSha256(inputA);

    assert.strictEqual(hashA1, hashA2);
    assert.strictEqual(hashA1.length, 64);
    assert.match(hashA1, /^[a-f0-9]{64}$/);

    const inputB = 'Different Content';
    const hashB = calculateSha256(inputB);
    assert.notStrictEqual(hashA1, hashB);
  });

  it('should generate properly formatted evidentiary Report IDs', () => {
    const reportId = generateReportId();
    const currentYear = new Date().getFullYear();
    assert.match(reportId, new RegExp(`^OG-${currentYear}-[A-F0-9]{8}$`));
  });

  it('should reject empty or missing content', () => {
    const emptyPayload = { type: 'text', content: '   ' };
    const result = validateScanInput(emptyPayload);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('Content is required'));
  });

  it('should reject malformed upload payloads missing base64 data', () => {
    const invalidUpload = {
      type: 'upload',
      content: '',
      file: { name: 'offer.pdf' }
    };
    const result = validateScanInput(invalidUpload);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('base64'));
  });

  it('should accept valid text and url scan payloads', () => {
    const validText = {
      type: 'text',
      content: 'Authentic job offer from verified company'
    };
    const resultText = validateScanInput(validText);
    assert.strictEqual(resultText.valid, true);
    assert.strictEqual(resultText.data?.type, 'text');
    assert.strictEqual(resultText.data?.content, 'Authentic job offer from verified company');

    const validUrl = {
      type: 'url',
      content: 'https://careers.google.com/jobs/results'
    };
    const resultUrl = validateScanInput(validUrl);
    assert.strictEqual(resultUrl.valid, true);
    assert.strictEqual(resultUrl.data?.type, 'url');
  });

  it('should enforce maximum content length limits', () => {
    const oversizedContent = 'A'.repeat(500001);
    const result = validateScanInput({ type: 'text', content: oversizedContent });
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('maximum permitted limit'));
  });
});
