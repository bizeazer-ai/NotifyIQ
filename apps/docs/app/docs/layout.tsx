import React from 'react';
import { DocsSidebar } from '@/components/docs/DocsSidebar';

export const metadata = {
  title: 'Documentation | NotifyIQ Meta WhatsApp Cloud API Platform',
  description: 'Comprehensive guides, API specifications, and architecture documentation for NotifyIQ WhatsApp Business Platform.',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-[1700px] w-full mx-auto flex flex-col lg:flex-row px-4 sm:px-6 lg:px-8">
        {/* Left Sidebar */}
        <DocsSidebar />

        {/* Main Content Area: Spacious layout taking more width */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-8 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
