import React from 'react';
import Link from 'next/link';
import { MockupCard } from '@/components/docs/MockupCard';
import { DocsPagination } from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'WhatsApp Message Templates Builder | NotifyIQ Documentation',
  description: 'Design, preview, and submit Meta-approved WhatsApp Cloud API message templates with {{1}} placeholders, interactive buttons, and real-time status tracking.',
};

export default function TemplatesDocPage() {
  return (
    <article className="space-y-10">
      {/* Header & Breadcrumb */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800 pb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400">Docs</Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Campaigns &amp; Templates</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">Message Templates Builder</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          WhatsApp Message Templates &amp; Meta Review
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The interactive visual template workshop. Draft Meta Cloud API compliant message templates with dynamic variable placeholders (<code className="text-emerald-400 font-mono text-xs">{'{{1}}'}</code>), call-to-action buttons, quick replies, and real-time approval status synchronization.
        </p>
      </div>

      {/* 1. Purpose */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          1. Purpose of the Page
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Under Meta Platform Rules, any business-initiated WhatsApp message (such as broadcast campaigns, automated order updates, or messages sent after the 24-hour customer window has lapsed) requires a pre-approved message template. This page lets you compose templates, test how they look inside a live WhatsApp mobile mockup, and submit them directly to Meta Cloud API review without logging into Meta Business Manager.
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
            <span className="font-bold text-slate-900 dark:text-slate-100">Content &amp; Copywriters</span>
            <p className="text-slate-600 dark:text-slate-400">Drafts engaging messaging copy, verifies character limits, and formats dynamic personalization tokens.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Marketing Specialists</span>
            <p className="text-slate-600 dark:text-slate-400">Selects appropriate Meta template categories (<code className="text-slate-300">MARKETING</code> vs. <code className="text-slate-300">UTILITY</code>) and adds trackable CTA URLs.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Developers &amp; Integrators</span>
            <p className="text-slate-600 dark:text-slate-400">References template names and parameter indexes (<code className="text-emerald-400 font-mono">{'{{1}}'}</code>, <code className="text-emerald-400 font-mono">{'{{2}}'}</code>) when triggering automated API dispatches.</p>
          </div>
        </div>
      </section>

      {/* 7. CSS UI Mockup */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Interactive Visual Preview
        </h2>
        <MockupCard title="TemplateBuilderPage.tsx • /campaigns/templates" badge="Meta v20.0 Synchronized" subtitle="Live Device Bubble & Approval Status">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Editor (7 cols) */}
            <div className="lg:col-span-7 p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-bold text-white text-sm">Template Specification</span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Ready to Submit
                </span>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Template Name (lowercase &amp; underscores only)</label>
                <input
                  type="text"
                  disabled
                  value="shipping_confirmation_v2"
                  className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono text-[11px] text-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">Category</label>
                  <select disabled className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-300">
                    <option>UTILITY</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">Language</label>
                  <select disabled className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-300">
                    <option>English (en)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Header Text (Optional)</label>
                <input
                  type="text"
                  disabled
                  value="Package In Transit"
                  className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-300"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Body Text (Use &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; placeholders)
                </label>
                <textarea
                  disabled
                  rows={3}
                  value="Hi {{1}}, your order #{{2}} has shipped! Track your package in real-time using the button below."
                  className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-300 font-sans"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Footer Text</label>
                <input
                  type="text"
                  disabled
                  value="Thank you for choosing NotifyIQ."
                  className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-400 text-[11px]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <span className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/20">
                  Submit to Meta Review
                </span>
              </div>
            </div>

            {/* Right WhatsApp Mobile Device Bubble Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">WhatsApp Preview Canvas</span>
              <div className="w-full max-w-[270px] rounded-2xl bg-emerald-950/90 border border-emerald-800/80 p-3.5 text-xs space-y-2.5 shadow-2xl text-slate-200">
                <div className="text-[13px] font-bold text-white border-b border-emerald-900/60 pb-1">
                  Package In Transit
                </div>
                <p className="text-[11px] leading-relaxed">
                  Hi <span className="text-emerald-400 font-mono">&#123;&#123;1&#125;&#125;</span>, your order <span className="text-emerald-400 font-mono">&#123;&#123;2&#125;&#125;</span> has shipped! Track your package in real-time using the button below.
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Thank you for choosing NotifyIQ.
                </div>
                <div className="pt-2 border-t border-emerald-900/60 space-y-1.5 text-center font-semibold text-emerald-300 text-[11px]">
                  <div className="p-2 rounded-lg bg-emerald-900/80 border border-emerald-700/60 flex items-center justify-center gap-1.5">
                    <span>🔗</span> Track Shipment
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-900/40 border border-emerald-800/40 text-[10px] text-slate-300">
                    💬 Contact Support
                  </div>
                </div>
              </div>

              {/* Status indicator pill */}
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Meta Status: APPROVED
              </div>
            </div>
          </div>
        </MockupCard>
      </section>

      {/* 3. Step-by-Step Guide */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          3. Step-by-Step: Submitting a Message Template
        </h2>
        <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Define Template Identifier:</strong> Enter a lowercase name using only letters, numbers, and underscores (e.g. <code className="text-emerald-400 font-mono text-xs">order_update_v1</code>). Special characters, spaces, and capital letters are automatically sanitized.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Choose the Category:</strong> Select <strong className="text-slate-900 dark:text-slate-200">UTILITY</strong> for order/shipping updates, account alerts, and billing receipts; <strong className="text-slate-900 dark:text-slate-200">MARKETING</strong> for promotions, discounts, and brand awareness; or <strong className="text-slate-900 dark:text-slate-200">AUTHENTICATION</strong> for one-time passwords (OTPs).
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Compose Body with Placeholders:</strong> Write your message text. Insert dynamic positional variables by typing <code className="text-emerald-400 font-mono text-xs">{'{{1}}'}</code>, <code className="text-emerald-400 font-mono text-xs">{'{{2}}'}</code>, etc. Ensure numbered placeholders appear sequentially without skipping indexes.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Add Interactive Buttons (Optional):</strong> Configure a <strong className="text-slate-900 dark:text-slate-200">Call-to-Action (URL)</strong> button (e.g., &ldquo;Track Order&rdquo; pointing to your web tracking link) or add <strong className="text-slate-900 dark:text-slate-200">Quick Reply</strong> buttons for quick user answers.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Submit to Meta Cloud API:</strong> Click <strong className="text-emerald-400 font-bold">Submit to Meta Review</strong>. NotifyIQ communicates with Meta Graph API v20.0. Most utility and marketing templates are reviewed within 1 to 5 minutes by Meta&apos;s automated AI policy checks.
          </li>
        </ol>
      </section>

      {/* 4. Fields and Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          4. Template Fields &amp; Meta Specifications
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-xl">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Component</th>
                <th className="p-3">Character Limits</th>
                <th className="p-3">Formatting Allowed</th>
                <th className="p-3">Meta Policy Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-400">
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Header</td>
                <td className="p-3 font-mono">Max 60 chars (Text)</td>
                <td className="p-3">TEXT, IMAGE, VIDEO, or DOCUMENT</td>
                <td className="p-3">Bold headline or media banner rendered at the top of the bubble.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Body</td>
                <td className="p-3 font-mono">Max 1,024 chars</td>
                <td className="p-3">Bold (*), Italic (_), Variables <code className="text-emerald-400 font-mono">{'{{1}}'}</code></td>
                <td className="p-3">Mandatory core text. Variables cannot be placed at the very start or end of the text.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Footer</td>
                <td className="p-3 font-mono">Max 60 chars</td>
                <td className="p-3">Plain text only (no variables)</td>
                <td className="p-3">Disclaimers, opt-out guidance (e.g. &ldquo;Reply STOP to unsubscribe&rdquo;).</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Buttons</td>
                <td className="p-3 font-mono">Max 25 chars / button</td>
                <td className="p-3">Up to 2 URL/Phone CTAs or 3 Quick Replies</td>
                <td className="p-3">Interactive pills that allow one-tap customer actions.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Behind the Scenes */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          5. Behind the Scenes: Meta Cloud API Integration
        </h2>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            When submitting a template, NotifyIQ calls <code className="text-emerald-400 font-mono">POST /api/waba/templates</code> which executes against Meta Graph API:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Meta API Call:</strong> <code className="text-emerald-400 font-mono">POST /v20.0/{'{business_account_id}'}/message_templates</code> passing the formatted components array (<code className="text-slate-300 font-mono">HEADER</code>, <code className="text-slate-300 font-mono">BODY</code>, <code className="text-slate-300 font-mono">FOOTER</code>, <code className="text-slate-300 font-mono">BUTTONS</code>).
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Template Status Sync:</strong> NotifyIQ polls and processes webhook events for <code className="text-slate-200 font-mono">message_template_status_update</code>, automatically reflecting status changes from <code className="text-amber-400 font-mono">PENDING</code> to <code className="text-emerald-400 font-mono">APPROVED</code> or <code className="text-rose-400 font-mono">REJECTED</code>.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Template Deletion:</strong> Calling delete triggers <code className="text-rose-400 font-mono">DELETE /v20.0/{'{business_account_id}'}/message_templates?name={'{name}'}</code>, safely unregistering the template from Meta servers.
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
            <div className="font-semibold text-slate-900 dark:text-slate-200">Why was my template REJECTED by Meta?</div>
            <p className="text-slate-600 dark:text-slate-400">
              Common reasons include: using promotional wording in a template marked as <code className="text-slate-300 font-mono">UTILITY</code>, placing variable placeholders at the very beginning or end of the body without enclosing words, or using vague variable samples. Ensure your template category aligns with its content.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">How long does Meta template approval take?</div>
            <p className="text-slate-600 dark:text-slate-400">
              Most standard templates are approved automatically within 1 to 5 minutes by Meta&apos;s AI safety scanners. Templates requiring human review can take up to 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Pagination Footer */}
      <DocsPagination currentHref="/docs/templates" />
    </article>
  );
}
