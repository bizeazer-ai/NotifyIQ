import React from 'react';
import Link from 'next/link';
import { MockupCard } from '@/components/docs/MockupCard';
import { DocsPagination } from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'Meta WABA Profile & Connection | NotifyIQ Documentation',
  description: 'Connect Meta WhatsApp Business Account (WABA), Embedded Signup OAuth, phone registration with PIN, profile settings, and Graph API v20.0 inspection logs.',
};

export default function WabaDocPage() {
  return (
    <article className="space-y-10">
      {/* Header & Breadcrumb */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800 pb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400">Docs</Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Platform Administration</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">Meta WABA Profile</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Meta WABA Profile, Phone Numbers &amp; Graph API v20.0
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The official gateway connecting NotifyIQ to the Meta WhatsApp Cloud API. Complete Meta Embedded Signup, register business phone numbers with a 6-digit PIN, sync verified business profiles, and monitor real-time Graph API audit logs.
        </p>
      </div>

      {/* 1. Purpose */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          1. Purpose of the Page
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          This page manages the direct handshake between your NotifyIQ tenant workspace and the Meta WhatsApp Business Platform. Whether onboarding via Meta&apos;s Guided Embedded Signup popup or entering direct system user credentials, this console stores encrypted tokens (AES-256-GCM), provisions phone numbers, updates verified business metadata displayed to customers on WhatsApp, and streams live API transaction telemetry.
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
            <span className="font-bold text-slate-900 dark:text-slate-100">System Administrators</span>
            <p className="text-slate-600 dark:text-slate-400">Connects the Meta Business Manager, authorizes scopes, and registers new phone numbers.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Brand &amp; Marketing Managers</span>
            <p className="text-slate-600 dark:text-slate-400">Updates WhatsApp profile pictures, business category vertical, website URLs, and company bio.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">DevOps &amp; Security Engineers</span>
            <p className="text-slate-600 dark:text-slate-400">Inspects HTTP status codes and payloads in the real-time Meta Graph API audit log.</p>
          </div>
        </div>
      </section>

      {/* 7. CSS UI Mockup */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Interactive Visual Preview
        </h2>
        <MockupCard title="WabaProfilePage.tsx • /settings/waba" badge="Meta Graph API v20.0" subtitle="Connected WABA, Phone Selector & Live API Logs">
          <div className="space-y-6">
            {/* Connection Status Banner */}
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <div className="font-bold text-white text-sm">WhatsApp Business Account Connected</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    WABA ID: 104829104928190 • Phone ID: 109283746592019
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-300 font-medium text-xs">
                  Switch Number
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-xs cursor-pointer">
                  Disconnect
                </span>
              </div>
            </div>

            {/* Split Grid: Profile Settings & Live API Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Profile Fields (7 cols) */}
              <div className="lg:col-span-7 p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                <span className="font-bold text-white text-sm">Verified WhatsApp Business Profile</span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 block mb-1">Business About (Bio)</label>
                    <input
                      type="text"
                      disabled
                      value="Enterprise WhatsApp Automation & Intelligence"
                      className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 block mb-1">Industry Vertical</label>
                    <select disabled className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-200">
                      <option>Professional Services (PROF_SERVICES)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">Official Support Email</label>
                  <input
                    type="email"
                    disabled
                    value="support@notifyiq.app"
                    className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">Registered Business Website</label>
                  <input
                    type="url"
                    disabled
                    value="https://notifyiq.app"
                    className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-[11px]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <span className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/20">
                    Sync to Meta Cloud API
                  </span>
                </div>
              </div>

              {/* Real-time Meta Graph API Telemetry Logs (5 cols) */}
              <div className="lg:col-span-5 p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Graph API Inspection Log
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">v20.0 Calls</span>
                </div>

                <div className="space-y-2 font-mono text-[10px]">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-200 dark:border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-400 font-bold">POST /v20.0/.../messages</span>
                      <span className="text-emerald-400 font-bold">200 OK</span>
                    </div>
                    <div className="text-slate-500 truncate">Template broadcast dispatch ID: wamid.HBg...</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-200 dark:border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400 font-bold">POST /v20.0/.../profile</span>
                      <span className="text-emerald-400 font-bold">200 OK</span>
                    </div>
                    <div className="text-slate-500 truncate">Sync vertical &amp; website URLs</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-200 dark:border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-400 font-bold">GET /v20.0/.../phone_numbers</span>
                      <span className="text-emerald-400 font-bold">200 OK</span>
                    </div>
                    <div className="text-slate-500 truncate">Quality Rating: GREEN (High tier)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MockupCard>
      </section>

      {/* 3. Step-by-Step Guide */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          3. Step-by-Step: Connecting and Managing WABA
        </h2>
        <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Launch Meta Embedded Signup:</strong> Click the <strong className="text-blue-400">Continue with Facebook</strong> button. The official Meta modal opens. Log in, select or create your Meta Business Manager, pick or register your WhatsApp phone number, and grant permissions.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Authorize Cloud API Permissions:</strong> Confirm the two mandatory permissions requested: <code className="text-emerald-400 font-mono text-xs">whatsapp_business_management</code> and <code className="text-emerald-400 font-mono text-xs">whatsapp_business_messaging</code>.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Select Your Active WhatsApp Number:</strong> If your WABA has multiple numbers, use the <strong className="text-slate-900 dark:text-slate-200">Select Active Phone</strong> dropdown to set the default dispatcher. Quality rating indicators (<code className="text-emerald-400 font-mono text-xs">GREEN</code>, <code className="text-amber-400 font-mono text-xs">YELLOW</code>, <code className="text-rose-400 font-mono text-xs">RED</code>) display phone health.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Update WhatsApp Business Profile:</strong> Fill in your company About, Support Email, Website URLs, and select your Industry Vertical. Click <strong className="text-emerald-400 font-bold">Sync to Meta Cloud API</strong> to push updates to WhatsApp handsets globally.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Inspect Real-Time Graph API Logs:</strong> Monitor the real-time API inspection panel to verify outbound dispatches, template syncs, and Meta response codes.
          </li>
        </ol>
      </section>

      {/* 4. Fields and Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          4. Meta Graph API v20.0 Endpoints Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-xl">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Endpoint Route</th>
                <th className="p-3">HTTP Method</th>
                <th className="p-3">Permission Scope</th>
                <th className="p-3">Functionality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-400">
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">/v20.0/oauth/access_token</td>
                <td className="p-3 font-mono">GET</td>
                <td className="p-3 font-mono">Embedded Signup Code</td>
                <td className="p-3">Exchanges temporary authorization code for long-lived permanent system user token.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">/v20.0/{'{waba_id}'}/phone_numbers</td>
                <td className="p-3 font-mono">GET</td>
                <td className="p-3 font-mono">whatsapp_business_management</td>
                <td className="p-3">Lists all phone numbers, display names, and real-time quality ratings.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">/v20.0/{'{phone_id}'}/register</td>
                <td className="p-3 font-mono">POST</td>
                <td className="p-3 font-mono">whatsapp_business_management</td>
                <td className="p-3">Registers a phone number on Meta Cloud API using a 6-digit PIN.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">/v20.0/{'{phone_id}'}/whatsapp_business_profile</td>
                <td className="p-3 font-mono">POST / GET</td>
                <td className="p-3 font-mono">whatsapp_business_management</td>
                <td className="p-3">Updates and retrieves about, address, description, email, vertical, and websites.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Behind the Scenes */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          5. Behind the Scenes: AES-256-GCM Token Encryption
        </h2>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Meta API tokens grant sensitive access to customer communications. NotifyIQ implements strict enterprise cryptographic safeguards:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li>
              <strong className="text-slate-900 dark:text-slate-200">AES-256-GCM Vaulting:</strong> Permanent Meta access tokens are encrypted before storage using AES-256-GCM with unique initialization vectors (<code className="text-slate-200 font-mono">iv</code>) and authentication tags (<code className="text-slate-200 font-mono">authTag</code>).
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Subscribed Apps Handshake:</strong> Upon successful connection, NotifyIQ automatically calls <code className="text-emerald-400 font-mono">POST /v20.0/{'{phone_number_id}'}/subscribed_apps</code>, registering our webhook receiver with Meta&apos;s event dispatcher.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Safe Disconnection:</strong> Clicking Disconnect immediately wipes encrypted tokens from the database, halts outbound queue processing, and unregisters webhooks.
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
            <div className="font-semibold text-slate-900 dark:text-slate-200">Can I use a phone number already registered on my personal WhatsApp?</div>
            <p className="text-slate-600 dark:text-slate-400">
              No. A phone number can only be registered on either personal WhatsApp or WhatsApp Business Platform (API) at one time. If using an existing number, you must first delete the WhatsApp account on your mobile handset before registering it with the Cloud API.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">What does a RED quality rating mean?</div>
            <p className="text-slate-600 dark:text-slate-400">
              A RED quality rating indicates that multiple recipients have reported your messages as spam or blocked your number. Meta may temporarily throttle your outbound messaging tier. Pause broadcast campaigns and review DPDP consent records.
            </p>
          </div>
        </div>
      </section>

      {/* Pagination Footer */}
      <DocsPagination currentHref="/docs/waba" />
    </article>
  );
}
