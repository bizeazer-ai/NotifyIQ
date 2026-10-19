import React from 'react';
import Link from 'next/link';
import { MockupCard } from '@/components/docs/MockupCard';
import { DocsPagination } from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'AI Agent & System Settings | NotifyIQ Documentation',
  description: 'Configure Gemini AI system prompts, confidence thresholds, business operating hours, custom white-label branding, and Developer REST API keys.',
};

export default function SettingsDocPage() {
  return (
    <article className="space-y-10">
      {/* Header & Breadcrumb */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800 pb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400">Docs</Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Platform Administration</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">AI Agent &amp; Settings</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          AI Agent Tuning, Business Hours &amp; REST API Keys
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The workspace administration hub. Tune Google Gemini system instructions, calibrate confidence threshold sliders, schedule business hours and out-of-office autoreplies, personalize white-label agency branding, and generate developer REST API keys.
        </p>
      </div>

      {/* 1. Purpose */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          1. Purpose of the Page
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The Settings module gives workspace administrators granular control over how their automated WhatsApp customer service operates. From defining the exact persona and boundary constraints of the Gemini AI model, to setting regional timezones (<code className="text-emerald-400 font-mono text-xs">Asia/Kolkata</code>), to issuing scoped developer API tokens (<code className="text-emerald-400 font-mono text-xs">nq_live_...</code>) for backend integrations.
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
            <span className="font-bold text-slate-900 dark:text-slate-100">Workspace Administrators</span>
            <p className="text-slate-600 dark:text-slate-400">Configures AI system instructions, operating hours, and human agent fallback rules.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Agency &amp; Brand Managers</span>
            <p className="text-slate-600 dark:text-slate-400">Sets up white-label custom domains (CNAME), logo assets, and primary brand accent colors.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Software Engineers</span>
            <p className="text-slate-600 dark:text-slate-400">Provisions API keys with granular scopes (<code className="text-slate-300">send</code>, <code className="text-slate-300">read</code>, <code className="text-slate-300">webhook</code>) and tests cURL/Node.js snippets.</p>
          </div>
        </div>
      </section>

      {/* 7. CSS UI Mockup */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Interactive Visual Preview
        </h2>
        <MockupCard title="SettingsPage.tsx • /settings" badge="Enterprise Admin" subtitle="AI Auto-Reply, Branding & Scoped API Keys">
          <div className="space-y-6">
            {/* Tab navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-semibold">
              <span className="pb-2 border-b-2 border-emerald-400 text-emerald-400 cursor-pointer">
                AI Auto-Reply Configuration
              </span>
              <span className="pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-200 cursor-pointer">
                Developer REST API Keys
              </span>
              <span className="pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-200 cursor-pointer">
                White-Label &amp; Domain
              </span>
            </div>

            {/* Split Grid: Prompt Tuning & Operating Hours */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: AI Prompt & Threshold (7 cols) */}
              <div className="lg:col-span-7 p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Gemini AI Auto-Reply Behavior</span>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                    Engine Active
                  </span>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">System Instructions Prompt</label>
                  <textarea
                    disabled
                    rows={3}
                    value="You are NotifyIQ, an AI assistant for BizEazer. Answer customer questions strictly using the provided knowledge base context. Maintain a professional, helpful tone."
                    className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-300 font-sans text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Confidence Threshold Slider</span>
                    <span className="text-emerald-400 font-mono font-bold">0.75 (75%)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value="0.75"
                    disabled
                    className="w-full accent-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500">
                    Queries with semantic similarity below 0.75 automatically escalate to human agents.
                  </span>
                </div>

                <div className="pt-2 flex justify-end">
                  <span className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/20">
                    Save AI Settings
                  </span>
                </div>
              </div>

              {/* Right: Operating Hours & API Keys (5 cols) */}
              <div className="lg:col-span-5 space-y-4 text-xs">
                {/* Operating Hours Box */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">Business Operating Hours</span>
                  <div className="space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Timezone:</span>
                      <span className="font-mono text-emerald-400">Asia/Kolkata (IST)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Working Days:</span>
                      <span>Monday – Friday</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hours:</span>
                      <span className="font-mono">09:00 – 18:00</span>
                    </div>
                  </div>
                </div>

                {/* Developer API Key Preview */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Active REST API Key</span>
                    <span className="text-[10px] font-mono text-blue-400">nq_live_9a4f...</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-mono">send</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-mono">read</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-mono">webhook</span>
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
          3. Step-by-Step: Configuring AI &amp; Integrations
        </h2>
        <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Customize AI Persona &amp; Tone:</strong> In the <strong className="text-slate-900 dark:text-slate-200">AI Auto-Reply Configuration</strong> tab, refine the system instruction prompt. Specify your brand name, operating domain, and strict negative constraints (e.g., &ldquo;Do not quote custom development rates&rdquo;).
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Calibrate Confidence Threshold:</strong> Adjust the threshold slider between <code className="text-slate-300 font-mono text-xs">0.50</code> and <code className="text-slate-300 font-mono text-xs">0.90</code>. Recommended: <code className="text-emerald-400 font-mono text-xs">0.75</code>. Higher values demand stricter similarity before the bot replies, minimizing risk.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Set Business Working Hours:</strong> Enable operating hours, select your local timezone (<code className="text-emerald-400 font-mono text-xs">Asia/Kolkata</code>), and set working shifts. When users message outside these hours, NotifyIQ sends a polite off-hours notice.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Generate Developer REST API Key:</strong> Switch to the <strong className="text-slate-900 dark:text-slate-200">Developer REST API Keys</strong> tab. Click <strong className="text-emerald-400">+ Generate Key</strong>, assign a name (e.g. &ldquo;Production ERP Sync&rdquo;), select permissions (<code className="text-slate-300 font-mono text-xs">send</code>, <code className="text-slate-300 font-mono text-xs">read</code>, <code className="text-slate-300 font-mono text-xs">webhook</code>), and copy the permanent key (<code className="text-emerald-400 font-mono text-xs">nq_live_...</code>).
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Configure White-Label Custom Domain:</strong> Enter your custom CNAME record (e.g. <code className="text-slate-300 font-mono text-xs">support.yourcompany.com</code>) and hex accent color to rebrand client-facing portals.
          </li>
        </ol>
      </section>

      {/* 4. Fields and Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          4. Settings &amp; API Key Schema Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-xl">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Field / Setting</th>
                <th className="p-3">Default Value</th>
                <th className="p-3">Valid Range / Options</th>
                <th className="p-3">Operational Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-400">
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">confidenceThreshold</td>
                <td className="p-3 font-mono">0.75</td>
                <td className="p-3 font-mono">0.00 – 1.00</td>
                <td className="p-3">Minimum cosine similarity required between customer message and indexed RAG chunk.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">fallbackToHuman</td>
                <td className="p-3 font-mono text-emerald-400">true</td>
                <td className="p-3 font-mono">boolean</td>
                <td className="p-3">When enabled, flags conversation as priority and notifies agents when confidence is low.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">operatingHours.timezone</td>
                <td className="p-3 font-mono">Asia/Kolkata</td>
                <td className="p-3 font-mono">IANA Timezone Strings</td>
                <td className="p-3">Determines evaluation time for out-of-hours autoreplies and schedule calculations.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">API Key Scopes</td>
                <td className="p-3 font-mono">send, read, webhook</td>
                <td className="p-3 font-mono">send, read, webhook</td>
                <td className="p-3">Restricts programmatic REST API token capabilities for external applications.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Behind the Scenes */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          5. Behind the Scenes: Authentication &amp; API Key Hashing
        </h2>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Settings and API security rely on robust backend encryption:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li>
              <strong className="text-slate-900 dark:text-slate-200">SHA-256 One-Way Key Hashing:</strong> Developer API keys are generated using cryptographically random byte generators (<code className="text-emerald-400 font-mono">nq_live_[32 hex characters]</code>). Only the SHA-256 hash is saved in the database; the plain text secret is shown once upon creation.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Dynamic Prompt Injection:</strong> Auto-reply settings are cached in Redis. When BullMQ workers process incoming WhatsApp messages, instructions are fetched with zero database latency.
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
            <div className="font-semibold text-slate-900 dark:text-slate-200">What happens if I lose my developer API key secret?</div>
            <p className="text-slate-600 dark:text-slate-400">
              For security, plaintext API keys cannot be recovered once created. Revoke the lost key immediately from the settings dashboard and generate a replacement key with the same scopes.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">Can the bot reply to messages when our team is online?</div>
            <p className="text-slate-600 dark:text-slate-400">
              Yes. If &ldquo;Out of Hours Only&rdquo; is unchecked, the Gemini bot will assist customers 24/7. If an agent prefers to chat manually, simply toggle &ldquo;Take Over&rdquo; in the Workspace Care Inbox.
            </p>
          </div>
        </div>
      </section>

      {/* Pagination Footer */}
      <DocsPagination currentHref="/docs/settings" />
    </article>
  );
}
