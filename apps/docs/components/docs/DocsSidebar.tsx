'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOCS_NAVIGATION, DocItem } from '@/lib/docs-nav';

export function DocsSidebar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return DOCS_NAVIGATION;
    const query = searchQuery.toLowerCase();
    return DOCS_NAVIGATION.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      ),
    })).filter((section) => section.items.length > 0);
  }, [searchQuery]);

  return (
    <>
      {/* Mobile Sticky Control Bar */}
      <div className="lg:hidden sticky top-16 z-30 flex items-center justify-between px-4 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-sm transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400">Documentation:</span>
          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
            {DOCS_NAVIGATION.flatMap((s) => s.items).find((i) => i.href === pathname)?.title || 'Overview'}
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          type="button"
          aria-label={mobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
          Menu
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation Container */}
      <aside
        className={`fixed lg:sticky top-16 inset-y-0 left-0 z-40 lg:z-10 w-72 h-[calc(100vh-4rem)] bg-white/95 dark:bg-slate-950/95 lg:bg-transparent border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Search Filter Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search guides & APIs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {/* Docs Hub Home Link */}
          <div>
            <Link
              href="/docs"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                pathname === '/docs'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60'
              }`}
            >
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Documentation Hub
            </Link>
          </div>

          {filteredSections.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-slate-500">
              No documentation pages match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {section.title}
                </div>
                <div className="mt-1 space-y-0.5">
                  {section.items.map((item: DocItem) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`group flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold shadow-xs dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 dark:shadow-emerald-950'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/60'
                        }`}
                      >
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <span
                            className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-tight shrink-0 ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 group-hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Quick Support / Compliance Box */}
          <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800/80 px-3">
            <div className="p-3 rounded-lg bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 transition-colors">
              <div className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                Meta Cloud API v20.0
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                Documentation verified against live backend controllers &amp; Meta Graph API v20.0 specs.
              </p>
              <div className="pt-1 flex gap-2">
                <Link
                  href="/privacy-policy"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline text-[10px] font-medium"
                >
                  Privacy
                </Link>
                <span className="text-slate-400 dark:text-slate-700">•</span>
                <Link
                  href="/data-deletion"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline text-[10px] font-medium"
                >
                  Data Deletion
                </Link>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
