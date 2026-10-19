import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * Reusable Footer component complying strictly with NotifyIQ Footer Spec:
 * - Clickable NotifyIQ logo linking to home with accessible alt text
 * - Navigation links: Home, Docs, Privacy Policy, Terms and Conditions, Data Deletion
 * - Exact required notice: "NotifyIQ is a product of Aadi IT Services LLP. Trademark Registration is under process."
 * - Full responsive layout and light/dark theme adaptation with wider container
 */
export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors duration-200 mt-auto">
      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* NotifyIQ Logo linking to Home */}
          <Link
            href="/"
            className="group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1"
            aria-label="NotifyIQ Home"
          >
            <Logo size="sm" subtitle="Meta WABA Engine" />
          </Link>

          {/* Specified Navigation Links */}
          <nav
            aria-label="Footer Navigation"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
          >
            <Link
              href="/"
              className="text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/docs"
              className="text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors font-medium"
            >
              Docs
            </Link>
            <Link
              href="/privacy-policy"
              className="text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors font-medium"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-and-conditions"
              className="text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors font-medium"
            >
              Terms and Conditions
            </Link>
            <Link
              href="/data-deletion"
              className="text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors font-medium"
            >
              Data Deletion
            </Link>
          </nav>
        </div>

        {/* Divider and Exact Trademark Requirement */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p className="font-medium text-center sm:text-left">
            NotifyIQ is a product of Aadi IT Services LLP. Trademark Registration is under process.
          </p>
          <p className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
            Meta WhatsApp Cloud API v20.0 Verified
          </p>
        </div>
      </div>
    </footer>
  );
}
