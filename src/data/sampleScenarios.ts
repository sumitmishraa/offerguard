import { SampleScenario } from '../types';

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'equipment-check-scam',
    title: 'Equipment Check Phishing',
    category: 'Job Offer',
    threatExpected: 'Critical',
    type: 'text',
    description: 'Classic fake check scam targeting remote job seekers with equipment purchase demands.',
    content: `From: recruiting-apexsolutions@gmail.com
Subject: OFFICIAL JOB OFFER - Remote Operations Specialist ($54.00/hr)

Dear Candidate,

Congratulations! Following your text interview on Telegram (@apex_recruiter_dan), the executive board of Apex Global Dynamics has selected you for the position of Remote Operations Specialist.

STARTING SALARY: $54.00 per hour (Paid weekly via Direct Deposit)
HOURS: Flexible, 25-40 hrs/week

EQUIPMENT PROCUREMENT PROTOCOL:
To ensure security standards, our company finance department will send you an official certified cashier's check of $3,850.00 today. Upon receipt, you MUST deposit this check into your personal bank account within 24 hours. Once deposited, wire $3,200 via Zelle or Bitcoin ATM to our accredited Apple Hardware Vendor for your customized MacBook Pro and time-tracking terminal. The remaining $650 is your signing bonus.

To accept immediately, reply with your full legal name, date of birth, SSN, and banking direct deposit routing numbers within 12 hours.`
  },
  {
    id: 'rental-deposit-trap',
    title: 'Apartment Wire Deposit Trap',
    category: 'Rental Trap',
    threatExpected: 'Critical',
    type: 'text',
    description: 'Unseen apartment listing scam demanding security deposits via wire transfer.',
    content: `Listing: 2-Bedroom Luxury Condo - Downtown Skyline Views
Monthly Rent: $1,150/month (All utilities included: water, heat, Gigabit internet, parking)

Hello,
Thank you for your interest in our condo! I am Dr. William Howard, the owner. My wife and I just relocated to West Africa for a 3-year humanitarian medical mission, which is why the rent is discounted so drastically. We just need a trustworthy tenant to take good care of our beloved home.

Due to our overseas location, in-person physical walkthroughs are not possible until keys are delivered via FedEx Express. To reserve the unit and stop other viewings, you must wire the first month's rent ($1,150) plus security deposit ($800) via Chime or Apple Cash today.

Once payment is confirmed by our escrow agent, FedEx will deliver the electronic keys and signed lease package to your doorstep within 48 hours. If not satisfied upon arrival, full refund guaranteed within 24 hours.`
  },
  {
    id: 'typosquat-url',
    title: 'Typosquatting Career Portal URL',
    category: 'Job Offer',
    threatExpected: 'High',
    type: 'url',
    description: 'Impersonation domain imitating a Fortune 500 employer careers site.',
    content: 'https://careers-stripe-recruitment-portal.xyz/apply/auth-verify-step2?ref=urgent_offer_992'
  },
  {
    id: 'legit-offer',
    title: 'Legitimate Standard Offer',
    category: 'Legitimate',
    threatExpected: 'Safe',
    type: 'text',
    description: 'Realistic corporate offer letter with standard corporate terms and no advance fees.',
    content: `From: careers@datadog.com
Subject: Offer of Employment - Senior Systems Engineer

Dear Alex,

On behalf of Datadog, Inc., I am pleased to offer you the position of Senior Systems Engineer, reporting to the VP of Infrastructure Engineering.

Key Terms:
- Base Salary: $165,000 annualized, payable semi-monthly in accordance with normal payroll procedures.
- Equity: Recommendation to the Board for an option grant of 4,000 RSUs vesting over 4 years.
- Benefits: Comprehensive health, dental, vision, and 401(k) retirement match.
- Equipment: Corporate laptop and security peripherals will be provisioned directly by Datadog IT and shipped directly to your residential address via tracked courier. At no point will you be asked to purchase equipment or transfer funds.

Please review the attached formal offer letter and sign via DocuSign by Friday at 5:00 PM EST. If you have questions, please contact your talent partner directly at talent@datadog.com.`
  }
];
