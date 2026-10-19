import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found (404) | NotifyIQ',
  description: 'The requested documentation or compliance page could not be located.',
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-slate-950 text-slate-100">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          Error 404 • Resource Not Located
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Page Not Found
        </h1>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          The page or documentation article you are looking for has been relocated or does not exist. Please check the URL or explore our official guides below.
        </p>

        {/* Helpful links grid */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <Link
            href="/docs"
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-colors block"
          >
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>📚</span> Documentation Hub
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Browse all 13 verified platform and Meta API guides.</p>
          </Link>

          <Link
            href="/docs/getting-started"
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-colors block"
          >
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>🚀</span> Getting Started
            </div>
            <p className="text-[11px] text-slate-400 mt-1">5-minute setup checklist for WABA onboarding.</p>
          </Link>

          <Link
            href="/privacy-policy"
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-colors block"
          >
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>🛡️</span> Privacy Policy
            </div>
            <p className="text-[11px] text-slate-400 mt-1">DPDP Act 2023 &amp; Meta data compliance terms.</p>
          </Link>

          <Link
            href="/data-deletion"
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-colors block"
          >
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>🗑️</span> Data Deletion
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Meta Platform Terms Section 4.a erasure process.</p>
          </Link>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
          >
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
