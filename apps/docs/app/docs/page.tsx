import React from 'react';
import Link from 'next/link';
import { DOCS_NAVIGATION } from '@/lib/docs-nav';

export const metadata = {
  title: 'Documentation Hub | NotifyIQ Platform',
  description: 'Explore end-to-end documentation for NotifyIQ WhatsApp Business Platform, AI auto-replies, and Meta Cloud API integration.',
};

export default function DocsHomePage() {
  return (
    <div className="space-y-12">
      {/* Hero / Header */}
      <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8 transition-colors">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
          Official Platform Guides
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          NotifyIQ Documentation
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-5xl">
          Everything you need to onboard, configure, and operate NotifyIQ. Learn how our multi-tenant platform orchestrates the Meta WhatsApp Cloud API (v20.0), BullMQ dispatch queues, visual journey automation, and Gemini-powered RAG intelligence.
        </p>
      </div>

      {/* Featured Quickstart Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-300 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 via-white to-slate-100 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-slate-950 p-6 sm:p-8 shadow-xs transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
              Step 01 • New Workspace Setup
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white">
              Getting Started with NotifyIQ
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Step-by-step walkthrough covering tenant registration, Meta Embedded Signup, WABA verification, and launching your first compliant template broadcast.
            </p>
          </div>
          <Link
            href="/docs/getting-started"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 shrink-0"
          >
            Start Setup Guide
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Categories & Page Cards Grid */}
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">Explore by Module</h2>
          <span className="text-xs text-slate-500 font-mono">13 Comprehensive Guides</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DOCS_NAVIGATION.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 transition-colors p-6 space-y-4 shadow-xs"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group block p-2.5 -mx-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 dark:text-slate-200 dark:group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/60">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture Overview Section */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/30 p-6 sm:p-8 space-y-6 shadow-xs transition-colors">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          System Architecture &amp; Data Flow
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          NotifyIQ operates on an asynchronous, queue-driven event architecture engineered to handle thousands of inbound and outbound WhatsApp events concurrently with strict compliance:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-emerald-700 dark:text-emerald-400 font-bold">1. Inbound Webhooks</div>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">
              Meta Cloud API delivers real-time payload verified with <code className="text-emerald-700 dark:text-emerald-400 font-mono">x-hub-signature-256</code> HMAC-SHA256, immediately queued to BullMQ.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-emerald-700 dark:text-emerald-400 font-bold">2. AI &amp; Journey Engine</div>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">
              BullMQ workers evaluate visual flow builder rules, query MongoDB Vector Search (768-dim embeddings), and trigger Gemini AI auto-replies.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-emerald-700 dark:text-emerald-400 font-bold">3. Dispatch &amp; Telemetry</div>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">
              Outbound dispatches are rate-limited to 80 msgs/sec via Redis token bucket and sent to Meta Graph API v20.0 with WebSocket UI updates.
            </p>
          </div>
        </div>
      </div>

      {/* Compliance Callout */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400 transition-colors">
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-200">Legal Compliance &amp; Meta Review:</span> All features are documented according to Meta Platform Terms, DPDP Act 2023, and GDPR.
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/privacy-policy" className="text-emerald-700 dark:text-emerald-400 hover:underline">Privacy Policy</Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link href="/terms-and-conditions" className="text-emerald-700 dark:text-emerald-400 hover:underline">Terms</Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link href="/data-deletion" className="text-emerald-700 dark:text-emerald-400 hover:underline">Data Deletion</Link>
        </div>
      </div>
    </div>
  );
}
