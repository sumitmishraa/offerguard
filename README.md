# OfferGuard: Fake Offer Letter & Phishing Inspector

[![Live Demo](https://img.shields.io/badge/Live%20Demo-OfferGuard-black?style=for-the-badge&logo=google)](https://ais-pre-2vjqt3u4u45tpdabbrxf7v-953170270137.asia-east1.run.app)
[![Built with Gemini](https://img.shields.io/badge/AI%20Engine-Gemini%203.8%20Flash-4285F4?style=for-the-badge&logo=google-gemini)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)

> Built by **Sumit Mishra** for **PromptWars × GEN AI Club Hackathon** on [Hack2skill](https://hack2skill.com/event/promptwars-x-genai-pu).

---

## 🎯 Executive Problem Statement
Job seekers and prospective renters lose over **$5.2 Billion annually** to fake employment appointment letters, check laundering traps, and sight-unseen rental deposit scams. Traditional email spam filters verify SPF/DKIM headers but fail completely against realistic text narratives sent from authentic Gmail or newly spun lookalike domains.

---

## 💡 What OfferGuard Solves
**OfferGuard** is an AI-powered cybersecurity inspector that turns suspicious offer letters, recruiter emails, and apartment vacancy links into an instant, calibrated **Scam Threat Index (0–100%)**. It combines server-side Google Gemini 3.8 Flash analysis with cryptographic proof hashing and safe response generation.

---

## 🌟 Standout Capabilities

### 1. 0–100% Calibrated Scam Threat Index
Calculated against 5 core fraud pillars:
- **Advance-Fee Equipment Checks**: Detects fake cashier checks sent to buy hardware from "approved third-party vendors" via Zelle or wire transfer.
- **Unofficial Communication Channels**: Flags interviews conducted over Telegram, WhatsApp, or Google Chat instead of verified corporate portals.
- **Sender Domain Legitimacy**: Catches recruiters claiming corporate representation from public webmail accounts (`recruiting-apexsolutions@gmail.com`).
- **Domain Age & Typosquatting**: Identifies lookalike domains (`careers-stripe-recruitment.xyz`).
- **Premature Identity Harvesting**: Detects artificial urgency demanding SSN or banking credentials within tight deadlines.

### 2. Multi-Modal Threat Inspection
- **Paste Text**: Analyze job offer letters, recruiter emails, or rental listings.
- **Link / URL**: Inspect live career links or apartment listings for domain age and spoofing risks.
- **Upload File**: Upload appointment letter PDFs or email screenshots directly.

### 3. Visual Red-Flag Highlight Inspector
Highlights exact phrases in the communication that triggered threat indicators, explaining the underlying social engineering and fraud mechanics.

### 4. 1-Click Safe Verification Counter-Response
Generates an assertive, professional response asking for verified corporate career links and official HR directory contacts—safely disarming scammers without surrendering personal or banking details.

### 5. Cryptographic Forensic Audit Seal
Generates a tamper-resistant SHA-256 fingerprint and Report ID for evidentiary reporting to **ReportFraud.ftc.gov** or the **FBI IC3**.

### 6. Instant Export Suite
- **Download JSON**: Instant formatted `.json` file download.
- **Copy Report**: Clipboard-ready plaintext report.
- **Print / PDF**: Direct browser print/save export.

---

## 🏗️ Architecture & Security

```
[ User Input (Text / URL / Document) ]
                  │
                  ▼
         [ Express Server (server.ts) ]
                  │
         ┌────────┴───────────────────────────┐
         ▼                                   ▼
 [ Google Gemini 3.8 Flash ]       [ Deterministic Heuristic Engine ]
 (Strict JSON Schema validation)   (Instant fail-safe backup)
         │                                   │
         └────────┬──────────────────────────┘
                  ▼
      [ SHA-256 Content Audit Hash ]
                  │
                  ▼
[ Forensic Threat Report + Safe Reply + JSON Export ]
```

### 🔒 Enterprise Security & Code Quality Standards
- **Zero API Key Exposure**: The Gemini API key resides solely in `server.ts` through lazy initialization. It is never shipped in frontend bundles.
- **Payload Sanitization**: Enforced body limits and strict type coercion (`text`, `url`, `upload`).
- **Resilient Fallback**: 10-second timeout racing ensures high availability even during network disruptions.

---

## 🚀 Quick Start / Local Installation

### Prerequisites
- Node.js (v18+)
- npm or pnpm
- Google Gemini API Key (from [Google AI Studio](https://aistudio.google.com/))

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sumitmishraa/OfferGuard.git
   cd OfferGuard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   PORT=3000
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

## 🧪 Testing with Real-World Scenarios
OfferGuard comes with built-in 1-click test scenarios on the landing page:
1. **Equipment Check Scam**: The classic remote job cashier check scam ($3,850 check, wire $3,200 for MacBook).
2. **Fake Recruiter (Stripe Impersonation)**: Telegram interview from a `@gmail.com` recruiter.
3. **Rental Deposit Trap**: Out-of-state landlord asking for a security deposit before in-person walkthrough.
4. **Legitimate Tech Offer**: Standard corporate offer letter passing all security checks.

---

## 👤 Author & Hackathon Submission
- **Creator**: **Sumit Mishra**
- **Repository**: [https://github.com/sumitmishraa/OfferGuard](https://github.com/sumitmishraa/OfferGuard)
- **Event**: [PromptWars × GEN AI Club on Hack2skill](https://hack2skill.com/event/promptwars-x-genai-pu)
- **License**: MIT
