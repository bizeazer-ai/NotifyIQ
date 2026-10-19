import React from 'react';
import Link from 'next/link';
import { MockupCard } from '@/components/docs/MockupCard';
import { DocsPagination } from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'Workspace Care Inbox | NotifyIQ Documentation',
  description: 'Master the NotifyIQ live WhatsApp Care Inbox: 24-hr Meta session window, AI copilot, media messaging, and customer lead management.',
};

export default function InboxDocPage() {
  return (
    <article className="space-y-10">
      {/* Header & Breadcrumbs */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800 pb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400">Docs</Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Core Messaging Console</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">Workspace Care Inbox</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Workspace Care Inbox &amp; AI Copilot
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The unified customer communication hub. Manage real-time WhatsApp conversations, enforce Meta&apos;s 24-hour customer service window, collaborate with AI smart suggestions, dispatch media attachments, and take over chats seamlessly.
        </p>
      </div>

      {/* 1. Purpose */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          1. Purpose of the Page
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The Workspace Care Inbox is the primary interface for customer service teams and human agents. It provides a real-time, WebSocket-connected chat environment that integrates directly with Meta Cloud API v20.0. Agents can monitor AI bot interactions, review sentiment classifications, inspect conversation session timers, and reply via free-form text, media files, or pre-approved Meta message templates.
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
            <span className="font-bold text-slate-900 dark:text-slate-100">Customer Support Agents</span>
            <p className="text-slate-600 dark:text-slate-400">Handles inbound customer questions, escalations, troubleshooting, and order inquiries.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Sales Representatives</span>
            <p className="text-slate-600 dark:text-slate-400">Engages with warm leads generated from broadcast campaigns and updates CRM lead statuses.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Support Team Supervisors</span>
            <p className="text-slate-600 dark:text-slate-400">Monitors AI accuracy, intervenes in negative sentiment threads, and manages agent workload.</p>
          </div>
        </div>
      </section>

      {/* 7. CSS UI Mockup */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Interactive Visual Preview
        </h2>
        <MockupCard title="InboxPage.tsx • /inbox" badge="Real-time WebSockets" subtitle="24-Hr Meta Window & Copilot">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
            {/* Column 1: Conversations List (4 cols) */}
            <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xs p-3 flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-white">Active Conversations</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">14 Live</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by name or phone..."
                  disabled
                  className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600"
                />
              </div>

              {/* Thread items */}
              <div className="space-y-1.5 overflow-y-auto">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1 cursor-pointer">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white truncate">+91 98765 43210</span>
                    <span className="text-[10px] text-emerald-400 font-mono">14m left</span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">Can you share the invoice for order #8492?</div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">Priority</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">Billing</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 space-y-1 opacity-70">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 truncate">+1 (415) 555-0199</span>
                    <span className="text-[10px] text-slate-500 font-mono">22h left</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">Bot auto-replied with pricing catalog.</div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">AI Contained</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Chat Window (5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-between bg-slate-950 p-4 border-r border-slate-200 dark:border-slate-800">
              {/* Chat Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Aarav Mehta</span>
                    <span className="text-[10px] text-slate-400 font-normal">(+91 98765 43210)</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    24-Hr Window: 18h 42m remaining
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-semibold text-purple-300 border border-purple-500/30">
                    Bot Active
                  </span>
                  <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold cursor-pointer">
                    Take Over
                  </span>
                </div>
              </div>

              {/* Chat Bubble Stream */}
              <div className="py-4 space-y-3 flex-1 overflow-y-auto font-sans text-xs">
                {/* Customer Message */}
                <div className="flex flex-col items-start max-w-[85%]">
                  <div className="p-3 rounded-2xl rounded-tl-sm bg-slate-800 text-slate-100 space-y-1">
                    <p>Hi, I need help downloading my GST tax invoice for the enterprise renewal.</p>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 ml-1 font-mono">10:42 AM</span>
                </div>

                {/* AI / Agent Reply */}
                <div className="flex flex-col items-end max-w-[85%] ml-auto">
                  <div className="p-3 rounded-2xl rounded-tr-sm bg-emerald-600 text-white space-y-1 shadow-md shadow-emerald-950">
                    <p>Hello Aarav! I have retrieved your GST invoice for order #8492. You can download the PDF directly below.</p>
                    <div className="mt-2 p-2 rounded-lg bg-emerald-700/60 border border-emerald-500/40 flex items-center gap-2 text-[11px]">
                      <span>📄</span>
                      <span className="truncate font-mono">Invoice_8492_AadiServices.pdf</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-1 mr-1 font-mono">
                    <span>10:43 AM</span>
                    <span className="text-emerald-400">✓✓ Read</span>
                  </div>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Copilot Suggestion:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-300 truncate cursor-pointer hover:border-emerald-500">
                    &ldquo;Is there anything else regarding your tax invoice?&rdquo;
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-200 dark:border-slate-800">
                    📎
                  </button>
                  <input
                    type="text"
                    placeholder="Type message or click 📎 to attach media..."
                    disabled
                    className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                  />
                  <button type="button" className="px-3 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs">
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* Column 3: Lead & RAG Drawer (3 cols) */}
            <div className="hidden md:flex md:col-span-3 flex-col bg-slate-900/30 p-3 space-y-4 text-xs">
              <div className="font-bold text-white pb-2 border-b border-slate-200 dark:border-slate-800">Lead Metadata</div>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Customer Name</span>
                  <div className="font-semibold text-slate-900 dark:text-slate-200">Aarav Mehta</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Consent Status</span>
                  <div className="text-emerald-400 font-semibold">DPDP Opted-in (Verified)</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Sentiment</span>
                  <div className="text-amber-400 font-semibold">Neutral / Inquiring</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-300">Enterprise</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-300">GST-Registered</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">RAG Knowledge Assistant</span>
                <p className="text-[10px] text-slate-500 mt-1">Directly search indexed policies and product documentation to draft answers.</p>
              </div>
            </div>
          </div>
        </MockupCard>
      </section>

      {/* 3. Step-by-Step Guide */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          3. Step-by-Step: Operating the Live Inbox
        </h2>
        <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Select an Active Conversation:</strong> Click on any thread from the left conversation list. Threads are sorted with the most recent messages on top and include unread counters and sentiment tags.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Verify 24-Hour Session Status:</strong> Check the session countdown badge in the chat header. If the window is open (<code className="text-emerald-400 font-mono text-xs">Active session</code>), free-form text and attachments can be dispatched. If expired, you must choose a Meta-approved template.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Toggle AI Auto-Reply vs. Human Takeover:</strong> If the bot is actively conversing and you wish to reply manually, click <strong className="text-rose-400">Take Over</strong>. This pauses Gemini auto-responses so you can guide the customer directly without conflicting bot replies.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Send Media Attachments:</strong> Click the paperclip icon (<strong className="text-slate-900 dark:text-slate-200">📎</strong>) to attach images (PNG/JPEG), PDFs, videos (MP4), or audio. NotifyIQ uploads the file to server storage and dispatches a Meta Cloud API media payload.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Send Pre-Approved Meta Templates:</strong> If the 24-hour window has expired or you need to send an authenticated notification, click <strong className="text-slate-900 dark:text-slate-200">Send Template</strong>, select an approved template, fill in dynamic variables (<code className="text-emerald-400 font-mono text-xs">{'{{1}}'}</code>), and click Send.
          </li>
        </ol>
      </section>

      {/* 4. Fields and Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          4. Fields, Controls &amp; Modals Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-xl">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Control / Field</th>
                <th className="p-3">Component</th>
                <th className="p-3">API Route</th>
                <th className="p-3">Operational Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-400">
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Take Over / Reactivate AI</td>
                <td className="p-3">Header Toggle</td>
                <td className="p-3 font-mono text-emerald-400">POST /api/conversations/:id/toggle-ai</td>
                <td className="p-3">Switches the thread state between autonomous Gemini bot handling and human agent control.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">24h Session Window</td>
                <td className="p-3">Header Countdown</td>
                <td className="p-3 font-mono">windowExpiresAt</td>
                <td className="p-3">Calculates remaining time under Meta customer care policy (24 hours from the customer&apos;s last inbound message).</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Text Input Field</td>
                <td className="p-3">Chat Footer</td>
                <td className="p-3 font-mono text-emerald-400">POST /api/messages/send</td>
                <td className="p-3">Dispatches standard text message to Meta Cloud API endpoint <code className="text-slate-300">/v20.0/{'{phone_number_id}'}/messages</code>.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Media Attachment Modal</td>
                <td className="p-3">Modal Dialog</td>
                <td className="p-3 font-mono text-emerald-400">POST /api/messages/media</td>
                <td className="p-3">Uploads multipart/form-data with mime-type validation and dispatches document/image/video to WhatsApp.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Template Picker Modal</td>
                <td className="p-3">Modal Dialog</td>
                <td className="p-3 font-mono text-emerald-400">POST /api/messages/send-template</td>
                <td className="p-3">Enables out-of-session communication with pre-approved Meta Cloud API templates and parameter interpolation.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">RAG Assistant Query</td>
                <td className="p-3">Knowledge Tab</td>
                <td className="p-3 font-mono text-emerald-400">POST /api/ai/query</td>
                <td className="p-3">Performs MongoDB vector similarity search and returns synthesized answer with document citations.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Behind the Scenes */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          5. Behind the Scenes: Meta Platform Architecture
        </h2>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            The live inbox relies on a bidirectional event pipeline between Meta Cloud API v20.0, Redis WebSockets, and MongoDB:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li>
              <strong className="text-slate-900 dark:text-slate-200">24-Hour Care Window Rule:</strong> Per Meta Platform Policy, businesses can only send free-form replies within 24 hours of the user&apos;s last inbound message. Each inbound message resets <code className="text-emerald-400 font-mono">windowExpiresAt = Date.now() + 24 * 3600 * 1000</code>.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">WebSocket Broadcast:</strong> When an inbound message arrives, BullMQ processes it and notifies all active browser tabs in that workspace via WebSocket event <code className="text-slate-200 font-mono">message:new</code>, appending the chat bubble in real time without refreshing.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Message Delivery Receipts:</strong> As Meta delivers the message to the user&apos;s phone, webhook events update message status from <code className="text-slate-400 font-mono">sent</code> to <code className="text-slate-300 font-mono">delivered</code> (two grey checks) and <code className="text-emerald-400 font-mono">read</code> (two blue/green checks).
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
            <div className="font-semibold text-slate-900 dark:text-slate-200">Why is the send button disabled with &ldquo;Window Expired&rdquo;?</div>
            <p className="text-slate-600 dark:text-slate-400">
              More than 24 hours have passed since the customer last messaged. WhatsApp policy restricts outbound communication outside the 24-hour window to approved Meta Message Templates. Click &ldquo;Send Template&rdquo; to re-open the conversation.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">Will AI answer while I am chatting with a customer?</div>
            <p className="text-slate-600 dark:text-slate-400">
              No. When you send a manual message or click &ldquo;Take Over&rdquo;, the conversation sets <code className="text-slate-200 font-mono">isHumanTakeover: true</code>, which immediately mutes the Gemini AI auto-reply engine for that specific thread until you manually reactivate it.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">What file formats are supported for media messaging?</div>
            <p className="text-slate-600 dark:text-slate-400">
              NotifyIQ supports standard Meta media formats: JPEG, PNG, MP4 video, PDF, and audio (AAC, MP3). Files are streamed using <code className="text-slate-200 font-mono">POST /v20.0/{'{phone_number_id}'}/messages</code> with direct media object payloads.
            </p>
          </div>
        </div>
      </section>

      {/* Pagination Footer */}
      <DocsPagination currentHref="/docs/inbox" />
    </article>
  );
}
