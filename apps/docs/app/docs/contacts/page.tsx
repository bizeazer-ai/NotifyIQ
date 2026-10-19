import React from 'react';
import Link from 'next/link';
import { MockupCard } from '@/components/docs/MockupCard';
import { DocsPagination } from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'Contacts Directory & DPDP Compliance | NotifyIQ Documentation',
  description: 'Manage contacts, DPDP consent tracking, audience segmentation tags, CSV importing/exporting, and WhatsApp chat export imports in NotifyIQ.',
};

export default function ContactsDocPage() {
  return (
    <article className="space-y-10">
      {/* Header & Breadcrumb */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800 pb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400">Docs</Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Core Messaging Console</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">Contacts Directory</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Contacts Directory &amp; DPDP Consent Registry
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The central customer database and regulatory compliance engine. Track explicit user consent per India&apos;s Digital Personal Data Protection (DPDP) Act 2023, organize audience tags, import/export CSV files, and seed leads via WhatsApp chat exports.
        </p>
      </div>

      {/* 1. Purpose */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          1. Purpose of the Page
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The Contacts Directory serves as the single source of truth for all WhatsApp recipients. More than a simple address book, it acts as a compliance safeguard: every contact record maintains an explicit <code className="text-emerald-400 font-mono text-xs">consentGiven</code> timestamp and <code className="text-emerald-400 font-mono text-xs">optedOut</code> flag. The campaign engine strictly cross-references this registry, guaranteeing that unverified or opted-out numbers can never receive marketing broadcasts.
        </p>
      </section>

      {/* 2. Who Uses It */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          2. Who Uses It (Target Roles)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Compliance &amp; Data Officers</span>
            <p className="text-slate-600 dark:text-slate-400">Verifies DPDP Act 2023 compliance, audit trails, opt-out requests, and data deletion requests.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Marketing Campaign Managers</span>
            <p className="text-slate-600 dark:text-slate-400">Segments audience contacts using custom tags (<code className="text-slate-300">VIP</code>, <code className="text-slate-300">Enterprise</code>, <code className="text-slate-300">Lead</code>) and uploads bulk CSV lists.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Customer Success Agents</span>
            <p className="text-slate-600 dark:text-slate-400">Inspects customer phone numbers, communication history, and manual contact creation.</p>
          </div>
        </div>
      </section>

      {/* 7. CSS UI Mockup */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Interactive Visual Preview
        </h2>
        <MockupCard title="ContactsPage.tsx • /contacts" badge="DPDP Compliant" subtitle="Audience Tags & Consent Ledger">
          <div className="space-y-4">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 pb-4">
              <div>
                <div className="text-base font-bold text-white">Contacts Directory</div>
                <div className="text-xs text-slate-400">3,420 Total Contacts • 3,420 Verified DPDP Consents (100%)</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs">
                  + Add Contact
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-300 font-medium text-xs">
                  Import CSV
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-300 font-medium text-xs">
                  Import WhatsApp Chat
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-300 font-medium text-xs">
                  Export CSV
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <input
                type="text"
                placeholder="Search by contact name or phone number..."
                disabled
                className="w-full sm:w-72 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 placeholder-slate-600"
              />
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 text-[11px]">ALL (3,420)</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 text-[11px]">Customer (2,100)</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 text-[11px]">VIP (480)</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 text-[11px]">Enterprise (320)</span>
              </div>
            </div>

            {/* Table Mockup */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3">Contact</th>
                    <th className="p-3">WhatsApp Number</th>
                    <th className="p-3">Audience Tags</th>
                    <th className="p-3">DPDP Consent</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-300">
                  <tr>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">AM</span>
                        <span className="font-semibold text-slate-900 dark:text-white">Aarav Mehta</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-400">+91 98765 43210</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-medium">Enterprise</span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Verified Consent
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer">Delete</span>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-[10px]">PS</span>
                        <span className="font-semibold text-slate-900 dark:text-white">Pooja Sharma</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-400">+91 91234 56789</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-medium">VIP</span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Verified Consent
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer">Delete</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </MockupCard>
      </section>

      {/* 3. Step-by-Step Guide */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          3. Step-by-Step: Managing Contacts &amp; Audiences
        </h2>
        <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Add a Single Contact:</strong> Click <strong className="text-emerald-400">+ Add Contact</strong>. Enter the customer&apos;s full name, phone number including the country code (e.g., <code className="text-emerald-400 font-mono text-xs">+919876543210</code>), assign an initial tag, and verify that the DPDP consent checkbox is checked.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Bulk Import via CSV:</strong> Click <strong className="text-slate-900 dark:text-slate-200">Import CSV</strong>. Select a UTF-8 encoded <code className="text-slate-300 font-mono text-xs">.csv</code> file containing columns: <code className="text-emerald-400 font-mono text-xs">name,phone,tags,consent</code>. NotifyIQ validates phone syntax (E.164) and deduplicates against existing records automatically.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Import WhatsApp Chat Export:</strong> Click <strong className="text-slate-900 dark:text-slate-200">Import WhatsApp Chat</strong>. Upload an exported <code className="text-slate-300 font-mono text-xs">.txt</code> transcript from WhatsApp. The parser extracts the participant phone number, creates a contact profile, and seeds message history into the Workspace Care Inbox.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Filter &amp; Segment Audiences:</strong> Click any tag pill (<code className="text-slate-300">VIP</code>, <code className="text-slate-300">Customer</code>, <code className="text-slate-300">Lead</code>) to instantly filter the list. When building Broadcast Campaigns, you can target specific tags.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Execute Contact Erasure:</strong> Click <strong className="text-rose-400">Delete</strong> on any row to permanently delete the contact record and trigger a cascading erase of associated chat messages, satisfying right-to-be-forgotten obligations under DPDP and GDPR.
          </li>
        </ol>
      </section>

      {/* 4. Fields and Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          4. Fields, Forms &amp; Modal Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-xl">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Field / Action</th>
                <th className="p-3">Type</th>
                <th className="p-3">Format / Constraint</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-400">
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Full Name</td>
                <td className="p-3">Input Text</td>
                <td className="p-3">String, min 2 chars</td>
                <td className="p-3">Contact&apos;s full name. Interpolated as <code className="text-emerald-400 font-mono">{'{{name}}'}</code> in WhatsApp campaign templates.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Phone Number</td>
                <td className="p-3">Input Text</td>
                <td className="p-3 font-mono">E.164 (+[country][number])</td>
                <td className="p-3">Destination WhatsApp mobile number. Standardized with country code (e.g. +91 for India).</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Audience Tag</td>
                <td className="p-3">Select / Pills</td>
                <td className="p-3">Customer, VIP, Lead, Partner, Support</td>
                <td className="p-3">Categorization label used for campaign segmentation and inbox filtering.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Consent Given</td>
                <td className="p-3">Checkbox</td>
                <td className="p-3 font-mono">Boolean (true/false)</td>
                <td className="p-3">Mandatory compliance flag confirming explicit opt-in under DPDP Act 2023.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Export CSV</td>
                <td className="p-3">Action Button</td>
                <td className="p-3 font-mono">GET /api/contacts/export</td>
                <td className="p-3">Generates and triggers a direct browser download of <code className="text-slate-300">contacts_export.csv</code>.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Behind the Scenes */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          5. Behind the Scenes: Data Integrity &amp; Meta Safety
        </h2>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            When contacts are stored or imported, NotifyIQ executes rigorous backend validations to protect your Meta WhatsApp Business Account quality score:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Phone Sanitization &amp; E.164 Formatting:</strong> Numbers are stripped of spaces, dashes, and leading zeros, and verified against international country code specifications.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Broadcast Hard Filtering:</strong> When a campaign dispatches, the query strictly filters: <code className="text-emerald-400 font-mono">{'{ consentGiven: true, optedOut: { $ne: true } }'}</code>. Even if a number is present in your database, it will be skipped by the BullMQ worker if consent is absent.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Opt-Out Detection:</strong> When an inbound webhook arrives containing standard opt-out keywords (e.g. &ldquo;STOP&rdquo;, &ldquo;UNSUBSCRIBE&rdquo;), NotifyIQ automatically sets <code className="text-rose-400 font-mono">optedOut = true</code>, halting automated messaging immediately.
            </li>
          </ul>
        </div>
      </section>

      {/* 6. Common Errors & FAQs */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          6. Common Errors &amp; FAQs
        </h2>
        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">Why did my CSV import fail?</div>
            <p className="text-slate-600 dark:text-slate-400">
              Ensure your CSV file contains the required header row: <code className="text-slate-300 font-mono">name,phone,tags,consent</code>. Ensure all phone numbers include the plus sign and country code without spaces (e.g. <code className="text-slate-300 font-mono">+919876543210</code>).
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">Why are certain contacts skipped during broadcast campaigns?</div>
            <p className="text-slate-600 dark:text-slate-400">
              NotifyIQ automatically suppresses contacts that have not explicitly granted consent or have requested opt-out. This protects your WABA phone number tier from spam flags and temporary Meta blocks.
            </p>
          </div>
        </div>
      </section>

      {/* Pagination Footer */}
      <DocsPagination currentHref="/docs/contacts" />
    </article>
  );
}
