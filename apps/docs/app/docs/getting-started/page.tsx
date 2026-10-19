import React from 'react';
import Link from 'next/link';
import { MockupCard } from '@/components/docs/MockupCard';
import { DocsPagination } from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'Getting Started & Onboarding Guide | NotifyIQ Documentation',
  description: 'Complete step-by-step setup guide for NotifyIQ: workspace creation, Meta WABA connection, permissions, AI knowledge indexing, and your first broadcast checklist.',
};

export default function GettingStartedDocPage() {
  return (
    <article className="space-y-10">
      {/* Header & Breadcrumb */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800 pb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400">Docs</Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Getting Started</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">Quickstart &amp; Onboarding</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Getting Started with NotifyIQ
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The comprehensive onboarding roadmap. Follow this step-by-step checklist to provision your workspace, link your Meta WhatsApp Business Account (WABA), vectorize your company knowledge, and execute your first compliant campaign broadcast in under 15 minutes.
        </p>
      </div>

      {/* Prerequisites Banner */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
          <span>✓</span> Pre-Flight Requirements
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white">1. Meta Business Manager</span>
            <p className="text-slate-600 dark:text-slate-400">An active Meta Business Portfolio with business verification or administrator credentials.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white">2. Dedicated Mobile Number</span>
            <p className="text-slate-600 dark:text-slate-400">A valid mobile number capable of receiving SMS/voice verification that is not active on mobile WhatsApp.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white">3. DPDP Consent Records</span>
            <p className="text-slate-600 dark:text-slate-400">Proof of explicit customer opt-in for marketing broadcast recipients per Indian law.</p>
          </div>
        </div>
      </div>

      {/* 5 Sequential Setup Steps */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Step-by-Step Onboarding Walkthrough
        </h2>

        {/* Step 1 */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
              Step 01 • Account Provisioning
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Route: /register</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Provision Your Tenant Workspace</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Navigate to the registration portal. Enter your company name, administrator email address, and account password. If you have a partner referral link, ensure the <code className="text-emerald-400 font-mono text-xs">?ref=...</code> parameter is preserved in the URL to automatically attach your workspace to your preferred agency support tier.
          </p>
        </div>

        {/* Step 2 */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
              Step 02 • Cloud API Linkage
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Route: /settings/waba</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Connect Your Meta WABA Account</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Head to <Link href="/docs/waba" className="text-emerald-400 underline font-medium">Meta WABA Profile Settings</Link> and click <strong>Continue with Facebook</strong>. Complete the Guided Embedded Signup popup to link your Business Portfolio. Ensure you grant both required scopes:
          </p>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 font-mono text-xs space-y-1 text-slate-300">
            <div>• <code className="text-emerald-400">whatsapp_business_management</code>: asset &amp; template oversight</div>
            <div>• <code className="text-emerald-400">whatsapp_business_messaging</code>: live message dispatch &amp; status receipts</div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
              Step 03 • AI Brain Ingestion
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Route: /knowledge-base</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Ingest Grounded Knowledge Base Documents</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Before enabling AI auto-replies, upload your verified company documentation in the <Link href="/docs/knowledge-base" className="text-emerald-400 underline font-medium">RAG Knowledge Base</Link>. NotifyIQ will split your PDF or text documents into 500-token chunks and compute 768-dimension Gemini embeddings. Test queries in the Playground to ensure the confidence score exceeds 85%.
          </p>
        </div>

        {/* Step 4 */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
              Step 04 • Template Approval
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Route: /campaigns/templates</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Submit a Meta Message Template</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Create an initial utility or marketing template in the <Link href="/docs/templates" className="text-emerald-400 underline font-medium">Template Builder</Link>. Use <code className="text-emerald-400 font-mono text-xs">{'{{1}}'}</code> for the customer&apos;s name and add a call-to-action button. Once submitted, Meta typically approves standard templates within 1 to 5 minutes.
          </p>
        </div>

        {/* Step 5 */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
              Step 05 • First Broadcast
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Route: /campaigns</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Import Contacts &amp; Launch Campaign</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Upload your recipient CSV list in the <Link href="/docs/contacts" className="text-emerald-400 underline font-medium">Contacts Directory</Link> with explicit consent flags. Navigate to <Link href="/docs/campaigns" className="text-emerald-400 underline font-medium">Broadcast Campaigns</Link>, select your newly approved template, map <code className="text-emerald-400 font-mono text-xs">{'{{1}}'}</code> to <code className="text-slate-300 font-mono text-xs">{'{{name}}'}</code>, and click <strong>Launch Broadcast</strong>!
          </p>
        </div>
      </section>

      {/* Visual Checklist Mockup */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Pre-Launch Quality &amp; Compliance Checklist
        </h2>
        <MockupCard title="Operator Pre-Flight Checklist" badge="Zero-Risk Deployment" subtitle="Verification Gates Before Live Dispatches">
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">✓</span>
                <span className="font-semibold text-slate-900 dark:text-white">Meta WABA Connected with Permanent Token</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">AES-256-GCM Encrypted</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">✓</span>
                <span className="font-semibold text-slate-900 dark:text-white">Inbound Webhook Handshake Confirmed (200 OK)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">HMAC-SHA256 Verified</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">✓</span>
                <span className="font-semibold text-slate-900 dark:text-white">Knowledge Base Grounded &amp; Tested</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Score &gt; 85% Cosine Similarity</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">✓</span>
                <span className="font-semibold text-slate-900 dark:text-white">Contacts Audit: 100% DPDP Explicit Consent</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Opt-outs Excluded</span>
            </div>
          </div>
        </MockupCard>
      </section>

      {/* Pagination Footer */}
      <DocsPagination currentHref="/docs/getting-started" />
    </article>
  );
}
