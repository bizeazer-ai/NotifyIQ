import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for NotifyIQ (a product of Aadi IT Services LLP). Compliant with Meta Platform Terms, WhatsApp Business Policy, DPDP Act 2023, and GDPR.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="py-16 md:py-24 bg-white dark:bg-slate-950">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Legal &amp; Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Privacy Policy
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
              1. Who We Are
            </h2>
            <p>
              NotifyIQ (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is an enterprise messaging intelligence and WhatsApp Business API (WABA) automation software provided by <strong>Aadi IT Services LLP</strong>, a limited liability partnership organized under the laws of the Republic of India.
            </p>
            <p className="mt-2">
              We respect your privacy and are committed to safeguarding all personal data and communications information processed through our systems in full compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act, India)</strong>, the <strong>General Data Protection Regulation (GDPR, Regulation (EU) 2016/679)</strong>, the <strong>Meta Platform Terms</strong>, and the <strong>WhatsApp Business Terms of Service and Policies</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              2. What Data We Collect
            </h2>
            <p>
              We adhere strictly to data minimization principles. We only collect and process data that is strictly necessary for providing the NotifyIQ WABA automation services:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Account &amp; Workspace Profile Data:</strong> Full name, corporate email address, business name, encrypted credentials, billing address, and referral attribution when provisioning a workspace account.
              </li>
              <li>
                <strong>Meta Platform &amp; WABA Credentials:</strong> When you connect your WhatsApp Business Account via Meta Guided Embedded Signup or manual entry, we store your Meta Business Account ID, WhatsApp Phone Number ID, display phone number, and a system user access token.
              </li>
              <li>
                <strong>WhatsApp Messaging Data &amp; Metadata:</strong> Inbound and outbound message text bodies, media identifiers, message delivery statuses (sent, delivered, read, failed), timestamps, and conversation sentiment tags required for real-time customer care and conversation threading.
              </li>
              <li>
                <strong>Customer Contact Directory:</strong> Phone numbers in E.164 format, contact names, user-defined CRM tags, consent confirmation timestamps (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">consentGiven</code>), and opt-out preferences.
              </li>
              <li>
                <strong>System &amp; Diagnostic Logs:</strong> Outbound webhook responses, latency measurements, and Meta Graph API response logs (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">meta_api_logs</code>) with authentication tokens strictly redacted.
              </li>
            </ul>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 italic">
              Note: We do NOT access private social profiles, friend lists, or unrelated personal Facebook/Instagram user accounts.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              3. Purpose of Processing
            </h2>
            <p>We process your personal and messaging data exclusively for the following operational purposes:</p>
            <ol className="list-decimal pl-5 mt-2 space-y-1.5">
              <li>Authenticating users and isolating multi-tenant workspace environments.</li>
              <li>Facilitating bidirectional messaging via the Meta WhatsApp Cloud API v20.0.</li>
              <li>Executing visual flow automations, keyword triggers, and AI-grounded customer assistance.</li>
              <li>Managing broadcast campaign dispatches to consent-verified recipients within Meta rate limits.</li>
              <li>Generating delivery SLA metrics, containment analytics, and statutory tax invoices (18% GST HSN 998314).</li>
              <li>Maintaining immutable compliance audit logs for statutory legal verification.</li>
            </ol>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              4. Legal Basis for Processing
            </h2>
            <p>Our processing operations are legally grounded in:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Contractual Performance:</strong> Processing necessary to fulfill our service agreement and provide WABA automation.</li>
              <li><strong>Explicit Consent:</strong> Valid consent collected for broadcast messaging under Section 6 of the DPDP Act 2023 and Article 6(1)(a) of the GDPR.</li>
              <li><strong>Compliance with Legal Obligations:</strong> Retaining financial transaction and audit records pursuant to Indian tax and accounting regulations.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              5. Data Storage, Isolation &amp; Security
            </h2>
            <p>We apply defense-in-depth technical and organizational security controls:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Encryption at Rest:</strong> All Meta permanent access tokens, webhook secrets, and sensitive integration keys are encrypted using <strong>AES-256-GCM</strong> with an authenticated initialization vector and verification tag (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">iv:authTag:ciphertext</code>).
              </li>
              <li>
                <strong>Encryption in Transit:</strong> All web traffic and WebSocket communication are enforced via TLS 1.3 encryption.
              </li>
              <li>
                <strong>Multi-Tenant Data Isolation:</strong> Every database query and socket room is scoped strictly to the authenticated tenant <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">workspaceId</code>, preventing any cross-tenant data visibility.
              </li>
              <li>
                <strong>Geographic Residency:</strong> Primary production databases are hosted in certified Tier-III data centers located in Mumbai, India (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">ap-south-1</code>).
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              6. Data Sharing &amp; Third Parties
            </h2>
            <p>
              <strong>We never sell, rent, monetize, or trade customer contact records or WhatsApp message content to data brokers, advertisers, or third-party marketers.</strong>
            </p>
            <p className="mt-2">We only transmit data to trusted sub-processors strictly required to fulfill the service:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>
                <strong>Meta Platforms, Inc. / Meta Platforms Ireland Ltd.:</strong> Transmitting outbound and receiving inbound WhatsApp Cloud API payloads.
              </li>
              <li>
                <strong>Cloud Infrastructure &amp; Database Providers:</strong> Managed database clusters (MongoDB Atlas), in-memory queue brokers (Redis), and cloud hosting providers under strict data protection addendums.
              </li>
              <li>
                <strong>Payment Processors:</strong> Stripe Inc. and Razorpay Software Private Ltd. for secure processing of subscription payments without storing raw credit card details on our servers.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              7. Data Retention &amp; Erasure
            </h2>
            <p>
              We retain personal data for as long as your workspace account remains active. Upon workspace termination or contact deletion:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Individual contact records, conversations, and message histories are wiped immediately through an atomic cascading deletion pipeline.
              </li>
              <li>
                Financial records and transaction invoices are retained for the statutory period mandated by Indian tax legislation.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              8. User Rights &amp; How to Request Deletion
            </h2>
            <p>Under the DPDP Act 2023 and GDPR, you have the following rights:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Right to Access &amp; Portability:</strong> You can export all contacts, messages, and audit logs into a standardized ZIP archive directly from the console.</li>
              <li><strong>Right to Rectification:</strong> Update contact attributes or workspace information at any time.</li>
              <li><strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> Permanently delete contacts or request full workspace account eradication.</li>
            </ul>
            <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="font-semibold text-slate-900 dark:text-white">
                How to Submit a Data Deletion Request:
              </p>
              <p className="mt-1 text-sm">
                Follow our step-by-step instructions on our{" "}
                <Link href="/data-deletion" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">
                  Data Deletion Instructions Page
                </Link>{" "}
                or email our Privacy Officer directly at{" "}
                <a href="mailto:privacy@notifyiq.com" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">
                  privacy@notifyiq.com
                </a>
                . All requests are processed within 30 days.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              9. Cookies &amp; Local Storage
            </h2>
            <p>
              NotifyIQ uses essential session cookies and local storage tokens (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">notifyiq_token</code>, <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">notifyiq_workspace</code>) strictly to maintain authenticated user sessions and UI workspace preferences. We do not use third-party behavioral advertising tracking cookies.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              10. Meta Platform &amp; WhatsApp Policy Compliance
            </h2>
            <p>
              NotifyIQ operates in strict accordance with:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Meta Platform Terms:</strong> Ensuring data accessed through Meta APIs is never used for surveillance or sold.</li>
              <li><strong>WhatsApp Business Terms of Service:</strong> Complying with messaging tier caps, opt-in consent mandates, and content restrictions.</li>
              <li><strong>WhatsApp Business Policy:</strong> Zero tolerance for unsolicited promotional spam or prohibited categories.</li>
              <li><strong>Instagram Platform Policies:</strong> Ensuring future multi-channel capabilities adhere to Meta ecosystem integrity standards.</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              11. Children&apos;s Privacy
            </h2>
            <p>
              NotifyIQ is exclusively a business-to-business (B2B) communications tool and does not knowingly collect or solicit personal data from children under the age of 18.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              12. Contact Details &amp; Grievance Redressal
            </h2>
            <p>
              For privacy inquiries, data subject access requests, or regulatory questions, please contact our designated Grievance &amp; Privacy Officer:
            </p>
            <div className="mt-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-sm">
              <p><strong>Aadi IT Services LLP</strong></p>
              <p>Attn: Privacy &amp; Data Protection Officer</p>
              <p>Email: <a href="mailto:privacy@notifyiq.com" className="text-emerald-600 dark:text-emerald-400 font-medium">privacy@notifyiq.com</a> (or <a href="mailto:support@notifyiq.com" className="text-emerald-600 dark:text-emerald-400 font-medium">support@notifyiq.com</a>)</p>
              <p>Jurisdiction: Delhi, India</p>
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
