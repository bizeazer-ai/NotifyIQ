import React from 'react';
import Link from 'next/link';
import { MockupCard } from '@/components/docs/MockupCard';
import { DocsPagination } from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'Billing & Usage Analytics | NotifyIQ Documentation',
  description: 'Manage NotifyIQ subscription plans, wholesale message usage, Stripe USD checkout, Razorpay INR 18% GST tax invoicing, and sub-account telemetry.',
};

export default function BillingDocPage() {
  return (
    <article className="space-y-10">
      {/* Header & Breadcrumb */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800 pb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400">Docs</Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Platform Administration</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">Billing &amp; Usage</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Billing, Wholesale Usage &amp; GST Invoicing
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The financial and consumption accounting center. Monitor real-time WhatsApp dispatches, wholesale cost margins, multi-tenant sub-account telemetry, global Stripe payments, and compliant Razorpay INR 18% GST tax invoices.
        </p>
      </div>

      {/* 1. Purpose */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          1. Purpose of the Page
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The Billing &amp; Usage module provides total transparency over platform consumption and commercial subscription tiers. Agency operators and enterprise administrators can track granular outbound message dispatches, calculate wholesale rate margins, review tax invoices compliant with Indian GST (HSN 998314), and upgrade workspace capacity via Stripe or Razorpay.
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
            <span className="font-bold text-slate-900 dark:text-slate-100">Finance &amp; Accounts Leads</span>
            <p className="text-slate-600 dark:text-slate-400">Downloads tax invoices, reviews monthly GST amounts, and reconciles credit card and UPI transactions.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Agency &amp; Reseller Admins</span>
            <p className="text-slate-600 dark:text-slate-400">Monitors child workspace dispatches and analyzes wholesale billing margins across sub-tenants.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Workspace Owners</span>
            <p className="text-slate-600 dark:text-slate-400">Upgrades subscription tiers to unlock higher message throughput, extra AI tokens, and dedicated WABAs.</p>
          </div>
        </div>
      </section>

      {/* 7. CSS UI Mockup */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Interactive Visual Preview
        </h2>
        <MockupCard title="BillingPage.tsx • /billing" badge="Dual Payment Gateways" subtitle="Stripe (USD) & Razorpay (18% GST INR)">
          <div className="space-y-6">
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-blue-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Reseller Accounts</span>
                <div className="text-lg font-bold text-white">4 Sub-Tenants</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-emerald-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Outbound Messages</span>
                <div className="text-lg font-bold text-emerald-400">128,450</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-amber-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Accrued Wholesale</span>
                <div className="text-lg font-bold text-amber-400">$256.90</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-purple-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Wholesale Rate</span>
                <div className="text-lg font-bold text-purple-400">$0.002 / msg</div>
              </div>
            </div>

            {/* Sub-Accounts & Payment Gateways */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Reseller Accounts Table (7 cols) */}
              <div className="lg:col-span-7 p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="font-bold text-white text-sm">Child Reseller Accounts Usage</div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <th className="p-2.5">Workspace</th>
                        <th className="p-2.5">Slug</th>
                        <th className="p-2.5 text-right">Dispatches</th>
                        <th className="p-2.5 text-right">Accrued Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-300 font-mono text-[11px]">
                      <tr>
                        <td className="p-2.5 font-bold font-sans text-white">Apex Retailers</td>
                        <td className="p-2.5 text-slate-500">apex-retail</td>
                        <td className="p-2.5 text-right text-slate-200">64,225</td>
                        <td className="p-2.5 text-right text-emerald-400 font-bold">$128.45</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold font-sans text-white">Zephyr Logistics</td>
                        <td className="p-2.5 text-slate-500">zephyr-logistics</td>
                        <td className="p-2.5 text-right text-slate-200">38,535</td>
                        <td className="p-2.5 text-right text-emerald-400 font-bold">$77.07</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Checkout Cards (5 cols) */}
              <div className="lg:col-span-5 space-y-3 text-xs">
                {/* Stripe Card */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-300 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span>💳</span> Stripe Connect (USD)
                    </span>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">Global Cards</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Direct Visa/Mastercard billing for international workspaces.</p>
                  <button type="button" className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs">
                    Checkout with Stripe ($49/mo)
                  </button>
                </div>

                {/* Razorpay Card */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span>🇮🇳</span> Razorpay (INR)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">UPI / Netbanking</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Supports UPI/Netbanking with automated 18% GST invoice (HSN 998314).</p>
                  <button type="button" className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs">
                    Checkout with Razorpay (₹3,999 + GST)
                  </button>
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
          3. Step-by-Step: Managing Billing &amp; Subscriptions
        </h2>
        <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Review Monthly Dispatches:</strong> Check the <strong className="text-slate-900 dark:text-slate-200">Outbound Dispatches</strong> and <strong className="text-slate-900 dark:text-slate-200">Accrued Wholesale Billing</strong> metric cards to understand current cycle message volumes.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Audit Reseller Sub-Tenants:</strong> If managing client workspaces as an agency, inspect the <strong className="text-slate-900 dark:text-slate-200">Child Reseller Accounts Usage</strong> table to review dispatch counts and allocated costs per client slug.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Select Your Payment Gateway:</strong> For international credit/debit card subscriptions, click <strong className="text-blue-400">Checkout with Stripe</strong>. For payments in Indian Rupees (INR) via UPI, Google Pay, or Netbanking with 18% GST invoices, click <strong className="text-emerald-400">Checkout with Razorpay</strong>.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Download Compliant Invoices:</strong> Scroll to the <strong className="text-slate-900 dark:text-slate-200">Payment Invoice Logs</strong> table to view past transactions, download PDF receipts, and access GST breakdowns (CGST + SGST or IGST) for tax filing.
          </li>
        </ol>
      </section>

      {/* 4. Fields and Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          4. Gateway &amp; Tax Specification Table
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-xl">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Payment Method</th>
                <th className="p-3">Currency</th>
                <th className="p-3">Tax Treatment</th>
                <th className="p-3">Supported Instruments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-400">
              <tr>
                <td className="p-3 font-semibold text-blue-400 font-mono">Stripe Connect</td>
                <td className="p-3 font-mono">USD ($)</td>
                <td className="p-3">Export of Service / Zero-rated (Non-India)</td>
                <td className="p-3">International Credit &amp; Debit Cards (Visa, Mastercard, Amex)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-emerald-400 font-mono">Razorpay Gateway</td>
                <td className="p-3 font-mono">INR (₹)</td>
                <td className="p-3 font-bold text-emerald-400">18% GST (HSN 998314)</td>
                <td className="p-3">UPI (GPay, PhonePe, Paytm), Netbanking (50+ banks), Indian Credit/Debit cards</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Behind the Scenes */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          5. Behind the Scenes: Automated Metering &amp; Webhook Provisioning
        </h2>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Subscription status and usage metrics are synchronized automatically between payment gateways and your workspace:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Real-Time Message Accounting:</strong> Every time BullMQ processes an outbound message dispatch via Meta Cloud API, atomic counters increment in MongoDB without table locking.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Stripe Webhook Listener:</strong> <code className="text-blue-400 font-mono">customer.subscription.created</code> and <code className="text-blue-400 font-mono">invoice.payment_succeeded</code> events upgrade tenant quota limits instantly.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Razorpay Signature Verification:</strong> Inbound payment webhooks verify HMAC-SHA256 signatures against the webhook secret before generating official B2B tax invoice records.
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
            <div className="font-semibold text-slate-900 dark:text-slate-200">Can I claim Input Tax Credit (ITC) for Razorpay payments?</div>
            <p className="text-slate-600 dark:text-slate-400">
              Yes. Invoices generated through Razorpay include the 18% GST tax breakdown and HSN Code 998314. Enter your company GSTIN during checkout to ensure it appears on your tax invoice for GST credit filing.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">What happens if my wholesale usage exceeds my monthly quota?</div>
            <p className="text-slate-600 dark:text-slate-400">
              NotifyIQ will notify you when usage reaches 85% of your quota. Messages will continue to dispatch at your standard wholesale rate without service interruption, and overages will be billed at the end of the billing cycle.
            </p>
          </div>
        </div>
      </section>

      {/* Pagination Footer */}
      <DocsPagination currentHref="/docs/billing" />
    </article>
  );
}
