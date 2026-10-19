import React from 'react';
import Link from 'next/link';
import { getPrevNextDocs } from '@/lib/docs-nav';

interface DocsPaginationProps {
  currentHref: string;
}

export function DocsPagination({ currentHref }: DocsPaginationProps) {
  const { prev, next } = getPrevNextDocs(currentHref);

  if (!prev && !next) return null;

  return (
    <nav aria-label="Documentation Page Navigation" className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex flex-col p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 dark:hover:border-slate-700 transition-all text-left shadow-xs"
        >
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous Guide
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors truncate">
            {prev.title}
          </span>
          <span className="text-xs text-slate-500 mt-1 line-clamp-1">{prev.description}</span>
        </Link>
      ) : (
        <div />
      )}

      {next && (
        <Link
          href={next.href}
          className="group flex flex-col p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 dark:hover:border-slate-700 transition-all text-right sm:col-start-2 shadow-xs"
        >
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase flex items-center justify-end gap-1.5 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            Next Guide
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors truncate">
            {next.title}
          </span>
          <span className="text-xs text-slate-500 mt-1 line-clamp-1">{next.description}</span>
        </Link>
      )}
    </nav>
  );
}
