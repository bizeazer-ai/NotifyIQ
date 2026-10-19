import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Deletion Instructions",
  description:
    "Meta User Data Deletion Instructions for NotifyIQ (Aadi IT Services LLP). Learn how to request permanent deletion of data accessed via Meta APIs.",
};

export default function DataDeletionPage() {
  return (
    <div className="py-16 md:py-24 bg-white dark:bg-slate-950">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Meta Platform Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            User Data Deletion Instructions
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Compliant with Meta Platform Terms Section 4.a, India DPDP Act 2023, and GDPR Article 17
          </p>
        </div>

        {/* Content Body */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* Policy Overview */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              1. Overview
            </h2>
            <p>
              NotifyIQ is committed to user privacy and transparent data governance. In compliance with the <strong>Meta Platform Terms</strong>, the <strong>Digital Personal Data Protection Act 2023 (DPDP Act, India)</strong>, and the <strong>General Data Protection Regulation (GDPR, EU)</strong>, we provide clear, accessible mechanisms for users to request the permanent deletion of their account information, WhatsApp messaging records, and any personal data retrieved via the Meta Graph API or Facebook Login.
            </p>
          </section>

          {/* Option 1: In-App Self-Service Deletion */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              2. Option A: In-App Self-Service Deletion
            </h2>
            <p>
              If you have access to the NotifyIQ Workspace Console, you can execute real-time data deletions directly without waiting for manual verification:
            </p>

            <div className="mt-4 space-y-4">
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                  A. Deleting Individual Contacts &amp; Chat Histories
                </h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm mt-2">
                  <li>Log in to your NotifyIQ console at <code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">console.notifyiq.com</code>.</li>
                  <li>Navigate to <strong>Contacts Directory</strong> (<code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">/contacts</code>).</li>
                  <li>Locate the target contact using the search bar or tag filter.</li>
                  <li>Click the red <strong>Delete</strong> icon on the right side of the contact row.</li>
                  <li>Confirm the prompt. This initiates an atomic cascading erasure: the contact record, linked conversation threads, and WhatsApp message histories are permanently wiped from MongoDB.</li>
                </ol>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                  B. Disconnecting WhatsApp Business Account (WABA)
                </h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm mt-2">
                  <li>In the left sidebar, navigate to <strong>Meta WABA Profile</strong> (<code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">/settings/waba</code>).</li>
                  <li>Scroll to the <strong>Danger Zone</strong> section at the bottom of the page.</li>
                  <li>Click <strong>Disconnect Meta WABA Account</strong>.</li>
                  <li>Confirm disconnection. NotifyIQ immediately deletes your encrypted system user access token (<code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">waba.accessToken</code>), deletes the webhook secret, and unsubscribes the app from your Meta phone number.</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Option 2: Email Deletion Request */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              3. Option B: Submitting an Administrative Deletion Request
            </h2>
            <p>
              If you wish to request full eradication of all workspace data, or if you are an end customer whose number was messaged by an entity using NotifyIQ, you may submit a formal Data Deletion Request via email:
            </p>

            <div className="mt-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-sm space-y-3">
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:privacy@notifyiq.com" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">
                  privacy@notifyiq.com
                </a>{" "}
                (or <a href="mailto:support@notifyiq.com" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">support@notifyiq.com</a>)
              </p>
              <p><strong>Subject Line:</strong> <code className="text-xs bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">Data Deletion Request - Meta Platform Data</code></p>
              <p><strong>Please Include:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your registered workspace email address or mobile phone number (in E.164 format with country code).</li>
                <li>Your Meta Business Account ID or WhatsApp Phone Number ID (if applicable).</li>
                <li>A clear statement specifying whether you require deletion of a specific phone number or complete workspace closure.</li>
              </ul>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-sm">
              <p className="font-semibold">Turnaround SLA &amp; Confirmation:</p>
              <p className="mt-1">
                Our Privacy Team will acknowledge your request within <strong>48 hours</strong> and issue a unique Deletion Request Tracking Code. Full data erasure is executed within <strong>30 calendar days</strong>, after which a certificate of deletion confirmation is transmitted to you.
              </p>
            </div>
          </section>

          {/* Option 3: Revoking Access from Facebook Business Settings */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              4. Revoking Permissions via Meta / Facebook Settings
            </h2>
            <p>
              You can revoke NotifyIQ&apos;s access to your Meta assets at any time directly through your Facebook account:
            </p>
            <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
              <li>Log in to your <strong>Facebook Account</strong> or <strong>Meta Business Suite</strong>.</li>
              <li>Go to <strong>Settings &amp; Privacy</strong> &rarr; <strong>Settings</strong>.</li>
              <li>In the left menu, select <strong>Business Integrations</strong> or <strong>Apps and Websites</strong>.</li>
              <li>Find <strong>NotifyIQ</strong> in the active applications list.</li>
              <li>Click <strong>Remove</strong> and confirm that you wish to revoke all API permissions.</li>
            </ol>
          </section>

          {/* What Gets Deleted vs Retained */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              5. What Data is Deleted vs. Retained
            </h2>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                    <th className="py-2.5 px-3 font-bold">Data Category</th>
                    <th className="py-2.5 px-3 font-bold">Action Taken</th>
                    <th className="py-2.5 px-3 font-bold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Meta WABA Access Tokens</td>
                    <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 font-semibold">Permanently Erased</td>
                    <td className="py-2.5 px-3 text-slate-500">Deleted immediately; cryptographic keys purged.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Customer Messages &amp; Media</td>
                    <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 font-semibold">Permanently Erased</td>
                    <td className="py-2.5 px-3 text-slate-500">All inbound/outbound texts and media attachments wiped.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Contacts Directory</td>
                    <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 font-semibold">Permanently Erased</td>
                    <td className="py-2.5 px-3 text-slate-500">Phone numbers, tags, and CRM metadata purged.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Knowledge Base Vector Embeddings</td>
                    <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 font-semibold">Permanently Erased</td>
                    <td className="py-2.5 px-3 text-slate-500">Chunked documents and 768-dim vectors deleted.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Compliance Audit Logs</td>
                    <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-semibold">Anonymized</td>
                    <td className="py-2.5 px-3 text-slate-500">Phone numbers masked (e.g. +9198****3210) to verify compliance.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Tax Invoices (GST)</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-semibold">Statutory Retention</td>
                    <td className="py-2.5 px-3 text-slate-500">Retained solely as mandated by Indian taxation law (HSN 998314).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Links to Privacy Policy & Terms */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 text-sm">
            <Link href="/privacy-policy" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              &larr; View Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              View Terms and Conditions &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
