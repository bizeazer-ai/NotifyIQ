import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Terms and Conditions governing the use of NotifyIQ (a product of Aadi IT Services LLP), compliant with Indian law and Meta Platform policies.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="py-16 md:py-24 bg-white dark:bg-slate-950">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Legal &amp; Terms of Service
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Terms and Conditions
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Last updated: <time dateTime="2026-10-19">October 19, 2026</time>
          </p>
        </div>

        {/* Content Body */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              These Terms and Conditions (&ldquo;Terms&rdquo;) constitute a legally binding agreement between your organization or business entity (&ldquo;Customer&rdquo;, &ldquo;you&rdquo;, or &ldquo;your&rdquo;) and <strong>Aadi IT Services LLP</strong> (&ldquo;NotifyIQ&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), governing your access to and use of the NotifyIQ web platform, APIs, documentation, and WhatsApp Business API integration services (collectively, the &ldquo;Service&rdquo;).
            </p>
            <p className="mt-2">
              By registering an account, connecting a WhatsApp Business Account (WABA), creating an API key, or accessing the Service, you confirm that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              2. Description of the Service
            </h2>
            <p>
              NotifyIQ provides software-as-a-service (SaaS) tools for businesses to integrate with the Meta WhatsApp Cloud API (v20.0). Features include:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Guided Meta Embedded Signup and WABA credentials management.</li>
              <li>Live customer care messaging inboxes with human agent takeover controls.</li>
              <li>Broadcast campaign dispatches using approved Meta Message Templates.</li>
              <li>Visual drag-and-drop conversational flow builders and execution engines.</li>
              <li>Vector RAG (Retrieval-Augmented Generation) knowledge base indexing.</li>
              <li>Developer REST API keys and signed outbound webhook delivery.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              3. Eligibility &amp; Authority
            </h2>
            <p>
              You represent and warrant that:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>You are a validly existing legal entity or an individual of at least 18 years of age.</li>
              <li>The individual registering the account has the legal authority to bind the entity to these Terms.</li>
              <li>You are not barred from receiving services under the laws of India or any applicable international jurisdiction.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              4. Account Security &amp; Responsibilities
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your workspace login credentials, session tokens, and Developer API keys. You agree to immediately notify NotifyIQ of any unauthorized use of your account or security breach. All actions occurring under your account are deemed authorized by you.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              5. Acceptable Use Policy &amp; Anti-Spam Mandate
            </h2>
            <p>
              Compliance with WhatsApp and Meta messaging standards is fundamental. You strictly agree NOT to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Send Unsolicited Messages (Spam):</strong> You must have valid, verifiable prior opt-in consent from every recipient before dispatching WhatsApp broadcast messages, in accordance with Section 6 of the DPDP Act 2023 and WhatsApp Business Policies.
              </li>
              <li>
                <strong>Violate WhatsApp Policies:</strong> You must not transmit content promoting prohibited goods, weapons, tobacco, counterfeit goods, adult content, fraudulent schemes, predatory financial products, or misleading health claims.
              </li>
              <li>
                <strong>Circumvent Rate Limits:</strong> You must not bypass platform rate limits (80 messages/second per sender phone number) or attempt unauthorized scraping, penetration testing, or reverse engineering of the NotifyIQ infrastructure.
              </li>
              <li>
                <strong>Ignore Opt-Outs:</strong> If a customer requests to opt out (e.g. by texting STOP), you must honor the request immediately through the Contacts Directory consent controls.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              6. Meta Platforms &amp; WhatsApp Ecosystem Terms
            </h2>
            <p>
              NotifyIQ relies on the Meta Graph API and WhatsApp Business Platform. Your use of WhatsApp messaging is additionally governed by:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><a href="https://developers.facebook.com/terms/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">Meta Platform Terms</a></li>
              <li><a href="https://www.whatsapp.com/legal/business-terms/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">WhatsApp Business Terms of Service</a></li>
              <li><a href="https://www.whatsapp.com/legal/business-policy/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">WhatsApp Business Policy</a></li>
            </ul>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              You acknowledge that Meta Platforms, Inc. reserves the right to review message templates, inspect account quality ratings, throttle messaging tiers, or ban phone numbers for spam violations. NotifyIQ is not liable for actions taken by Meta against your WABA account.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              7. User Content &amp; Data Ownership
            </h2>
            <p>
              <strong>You retain 100% intellectual property ownership of all customer data, contact directories, message contents, and documents uploaded to the knowledge base.</strong>
            </p>
            <p className="mt-2">
              You grant NotifyIQ a non-exclusive, worldwide, limited license solely to host, transmit, format, and display your content to the extent necessary to provide the WhatsApp messaging and AI automation services.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              8. Fees, Subscriptions &amp; Taxes
            </h2>
            <p>
              Access to NotifyIQ is billed on a subscription and usage basis:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Subscription Fees:</strong> Billed in advance on a recurring monthly or annual basis via Stripe or Razorpay.
              </li>
              <li>
                <strong>Wholesale Usage Charges:</strong> Meta conversation category fees (Marketing, Utility, Authentication, Service) and AI token consumption are billed per active consumption metrics.
              </li>
              <li>
                <strong>Taxes (GST):</strong> For Indian customers, fees are subject to 18% Goods &amp; Services Tax (GST) under HSN Code 998314. Formal tax invoices are accessible directly via the Billing dashboard.
              </li>
              <li>
                <strong>Refunds:</strong> Payments are non-refundable except as expressly agreed in writing or required by statutory consumer protection laws.
              </li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              9. Intellectual Property &amp; Trademarks
            </h2>
            <p>
              NotifyIQ, its proprietary software architectures, source code, UI designs, visual flow builder canvases, documentation, and logos are the exclusive property of <strong>Aadi IT Services LLP</strong>.
            </p>
            <p className="mt-2 font-medium">
              &ldquo;NotifyIQ is a product of Aadi IT Services LLP. Trademark Registration is under process.&rdquo;
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              WhatsApp, Instagram, and Meta are registered trademarks of Meta Platforms, Inc. Use of these names on the platform is for descriptive and compatibility reference only and does not imply endorsement.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              10. Disclaimer of Warranties
            </h2>
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, NOTIFYIQ DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT META API SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              11. Limitation of Liability
            </h2>
            <p>
              IN NO EVENT SHALL AADI IT SERVICES LLP, ITS DIRECTORS, OR PARTNERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS GOODWILL). OUR TOTAL AGGREGATE LIABILITY ARISING FROM OR RELATED TO THESE TERMS SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY YOU TO NOTIFYIQ IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              12. Suspension &amp; Termination
            </h2>
            <p>
              NotifyIQ reserves the right to immediately suspend or terminate workspace access without prior notice if you violate our Acceptable Use Policy, engage in WhatsApp spamming, fail to pay fees, or if requested by Meta Platforms or law enforcement authorities. Upon termination, you may request export of your contact data within 14 days, after which data is permanently deleted.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              13. Governing Law &amp; Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of India, without regard to its conflict of law provisions.
            </p>
            <p className="mt-2 font-semibold">
              The competent courts situated in Surat, Gujarat, India shall have exclusive jurisdiction to settle any disputes or claims arising out of or in connection with these Terms or the use of the Service.
            </p>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              14. Contact Information
            </h2>
            <p>
              For legal inquiries, contractual questions, or official notices, please contact:
            </p>
            <div className="mt-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-sm">
              <p><strong>Aadi IT Services LLP</strong></p>
              <p>Attn: Legal &amp; Compliance Department</p>
              <p>Email: <a href="mailto:legal@notifyiq.com" className="text-emerald-600 dark:text-emerald-400 font-medium">legal@notifyiq.com</a> (or <a href="mailto:support@notifyiq.com" className="text-emerald-600 dark:text-emerald-400 font-medium">support@notifyiq.com</a>)</p>
              <p>Jurisdiction City: Delhi, India</p>
            </div>
          </section>

          {/* Mandatory Legal Review Draft Disclaimer */}
          {/* <div className="mt-12 p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
            <p className="font-bold uppercase tracking-wider mb-1">Legal Review Draft Notice</p>
            <p>
              This document is a draft to be reviewed by a qualified legal professional before publishing in accordance with client regulatory standards.
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
