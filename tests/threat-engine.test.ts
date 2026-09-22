import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runHeuristicAnalysis } from '../server/threatEngine';

describe('Forensic Threat Engine - Heuristic Inspection', () => {
  it('should identify classic advance-fee fake check scams with CRITICAL_SCAM threat level', () => {
    const fakeCheckPayload = `
      From: recruiting-apexsolutions@gmail.com
      Subject: OFFICIAL JOB OFFER - Remote Operations Specialist ($54.00/hr)
      Dear Candidate,
      Congratulations! Following your text interview on Telegram (@apex_recruiter_dan), our executive board has selected you.
      EQUIPMENT PROCUREMENT PROTOCOL:
      Our company finance department will send you an official certified cashier's check of $3,850.00 today.
      Upon receipt, you MUST deposit this check into your personal bank account within 24 hours.
      Once deposited, wire $3,200 via Zelle or Bitcoin ATM to our accredited Apple Hardware Vendor for your customized MacBook Pro.
      To accept immediately, reply with your full legal name, SSN, and banking direct deposit routing numbers within 12 hours.
    `;

    const report = runHeuristicAnalysis('text', fakeCheckPayload);

    assert.ok(report.scamThreatIndex >= 80, `Expected score >= 80, got ${report.scamThreatIndex}`);
    assert.strictEqual(report.threatLevel, 'CRITICAL_SCAM');
    assert.strictEqual(report.targetCategory, 'Job Offer Scam');

    // Check specific security pillar flags
    const checkFlag = report.redFlagChecks.find(c => c.id === 'equipment-payment');
    assert.ok(checkFlag, 'Equipment payment flag must be present');
    assert.strictEqual(checkFlag?.status, 'CRITICAL_FAIL');

    const commFlag = report.redFlagChecks.find(c => c.id === 'comm-channel');
    assert.ok(commFlag, 'Communication channel flag must be present');
    assert.strictEqual(commFlag?.status, 'CRITICAL_FAIL');

    const domainFlag = report.redFlagChecks.find(c => c.id === 'sender-domain');
    assert.ok(domainFlag, 'Sender domain flag must be present');
    assert.strictEqual(domainFlag?.status, 'WARNING');

    // Verify safe reply is generated
    assert.ok(report.safeReply.body.includes('As a security precaution'));
    assert.ok(report.auditFingerprint.sha256Fingerprint.length === 64);
  });

  it('should detect sight-unseen phantom rental deposit traps', () => {
    const rentalPayload = `
      Hello prospective tenant,
      I am the owner of the luxury 2-bedroom condo apartment. I am currently relocated to Spain on a missionary assignment.
      Due to my absence, an in-person walkthrough is not possible before lease execution.
      Please wire the first month rent and security deposit of $1,800 via Zelle or Apple Cash.
      Once payment is confirmed, I will FedEx the house keys and signed lease agreement to your current address immediately.
    `;

    const report = runHeuristicAnalysis('text', rentalPayload);

    assert.ok(report.scamThreatIndex >= 50, `Expected rental scam score >= 50, got ${report.scamThreatIndex}`);
    assert.strictEqual(report.targetCategory, 'Rental / Deposit Scam');

    const rentalFlag = report.redFlagChecks.find(c => c.id === 'rental-deposit');
    assert.ok(rentalFlag, 'Rental deposit flag must be present');
    assert.strictEqual(rentalFlag?.status, 'CRITICAL_FAIL');
  });

  it('should flag lookalike phishing domains and suspicious TLDs', () => {
    const phishingUrl = 'https://careers-stripe-onboarding-portal.xyz/apply';
    const report = runHeuristicAnalysis('url', phishingUrl);

    assert.ok(report.scamThreatIndex >= 50, `Expected URL scam score >= 50, got ${report.scamThreatIndex}`);
    assert.strictEqual(report.targetCategory, 'Phishing Communication');
    assert.ok(report.domainAnalysis.riskLevel === 'HIGH' || report.domainAnalysis.riskLevel === 'CRITICAL');
    assert.strictEqual(report.domainAnalysis.domain, 'careers-stripe-onboarding-portal.xyz');
  });

  it('should classify authentic corporate employment offers as SAFE or LOW_RISK', () => {
    const legitimateOffer = `
      From: talent-acquisition@acme-enterprises.com
      Subject: Offer of Employment - Senior Software Engineer
      Dear Jane Doe,
      We are delighted to extend an offer of employment for the position of Senior Software Engineer at Acme Enterprises.
      Your starting annual base salary will be $165,000, payable semi-monthly.
      Your comprehensive medical, dental, and 401(k) benefits will begin on your first day of employment.
      All company-issued IT equipment will be configured and shipped directly by our Corporate IT Operations Team at no cost to you.
      To review and execute the standard offer letter, please log into your verified candidate portal at https://careers.acme-enterprises.com/login.
    `;

    const report = runHeuristicAnalysis('text', legitimateOffer);

    assert.ok(report.scamThreatIndex <= 20, `Expected legit offer score <= 20, got ${report.scamThreatIndex}`);
    assert.ok(report.threatLevel === 'SAFE' || report.threatLevel === 'LOW_RISK');

    const checkFlag = report.redFlagChecks.find(c => c.id === 'equipment-payment');
    assert.strictEqual(checkFlag?.status, 'PASS');

    const commFlag = report.redFlagChecks.find(c => c.id === 'comm-channel');
    assert.strictEqual(commFlag?.status, 'PASS');
  });
});
