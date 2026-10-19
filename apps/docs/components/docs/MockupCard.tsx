import React from 'react';

interface MockupCardProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
  subtitle?: string;
}

export function MockupCard({ title, badge = 'Verified UI', subtitle, children }: MockupCardProps) {
  return (
    <div className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl dark:shadow-2xl overflow-hidden ring-1 ring-slate-200/80 dark:ring-slate-800/80 transition-colors">
      {/* Window Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800/90 text-xs transition-colors">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="ml-2 font-mono text-[11px] text-slate-700 dark:text-slate-400 font-medium truncate max-w-[280px] sm:max-w-md">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {subtitle && (
            <span className="hidden sm:inline text-[11px] text-slate-500 font-mono">
              {subtitle}
            </span>
          )}
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold tracking-wide">
            {badge}
          </span>
        </div>
      </div>

      {/* Mockup Canvas */}
      <div className="p-4 sm:p-6 bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
        {children}
      </div>
    </div>
  );
}
