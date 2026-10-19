import React from 'react';
import Link from 'next/link';
import { MockupCard } from '@/components/docs/MockupCard';
import { DocsPagination } from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'Visual Flow Builder & Simulator | NotifyIQ Documentation',
  description: 'Design automated conversational workflows, sentiment branching, Gemini AI auto-replies, human handoff, and dry-run execution simulator in NotifyIQ.',
};

export default function FlowsDocPage() {
  return (
    <article className="space-y-10">
      {/* Header & Breadcrumb */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800 pb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400">Docs</Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Automation &amp; Intelligence</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">Visual Flow Builder</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Visual Flow Builder &amp; Execution Simulator
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The drag-and-drop conversational automation engine. Build intelligent branching logic, evaluate customer sentiment in real time, delegate queries to Google Gemini RAG nodes, and test customer journeys using the dry-run simulator.
        </p>
      </div>

      {/* 1. Purpose */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          1. Purpose of the Page
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The Visual Flow Builder allows teams to design end-to-end conversational customer journeys without writing code. By chaining triggers, conditional filters, automated WhatsApp messages, AI responders, CRM actions, and human agent handoffs, businesses can provide instantaneous 24/7 self-service while escalating high-friction conversations directly to human agents in the Workspace Care Inbox.
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
            <span className="font-bold text-slate-900 dark:text-slate-100">Conversation Designers</span>
            <p className="text-slate-600 dark:text-slate-400">Architects multi-step decision trees, FAQ routing branches, and user onboarding flows.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Customer Support Managers</span>
            <p className="text-slate-600 dark:text-slate-400">Configures fallback escalation triggers, urgent sentiment handlers, and agent handoff thresholds.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Technical Product Leads</span>
            <p className="text-slate-600 dark:text-slate-400">Tests routing logic in the interactive simulator and coordinates CRM webhook actions.</p>
          </div>
        </div>
      </section>

      {/* 7. CSS UI Mockup */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Interactive Visual Preview
        </h2>
        <MockupCard title="FlowBuilderPage.tsx • /flows" badge="6 Node Types" subtitle="Canvas Graph & Dry-Run Simulator">
          <div className="space-y-4">
            {/* Canvas Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 pb-3 text-xs">
              <div>
                <div className="font-bold text-white text-sm">Customer Support &amp; Triage Flow</div>
                <div className="text-[11px] text-slate-400">Status: <span className="text-emerald-400 font-semibold">Active Engine</span> • 5 Nodes, 4 Edges</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold text-xs cursor-pointer">
                  ▶ Open Simulator
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/20">
                  Save Flow Layout
                </span>
              </div>
            </div>

            {/* Simulated Node Canvas */}
            <div className="relative min-h-[300px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950/80 p-6 overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                {/* Node 1: Trigger */}
                <div className="w-48 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border-2 border-emerald-500 shadow-lg shadow-emerald-950 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">Trigger</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="font-bold text-white">Inbound Message</div>
                  <div className="text-[10px] text-slate-400">Matches any keyword or greeting</div>
                </div>

                {/* Arrow */}
                <div className="text-slate-600 font-mono text-sm">➔</div>

                {/* Node 2: Condition */}
                <div className="w-48 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border-2 border-amber-500 shadow-lg shadow-amber-950 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-amber-400">Condition</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  </div>
                  <div className="font-bold text-white">Sentiment Check</div>
                  <div className="text-[10px] text-slate-400">Negative or Urgent?</div>
                </div>

                {/* Arrow */}
                <div className="text-slate-600 font-mono text-sm">➔</div>

                {/* Node 3 & 4 Fork */}
                <div className="flex flex-col gap-4">
                  {/* Branch A: AI */}
                  <div className="w-52 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-purple-500 text-xs space-y-1 shadow-md shadow-purple-950">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono font-bold text-purple-400">AI Respond</span>
                      <span className="text-[9px] text-slate-400 font-mono">Gemini RAG</span>
                    </div>
                    <div className="font-bold text-white">Knowledge Auto-Reply</div>
                    <div className="text-[10px] text-slate-400">Ground answer in indexed docs</div>
                  </div>

                  {/* Branch B: Handoff */}
                  <div className="w-52 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-rose-500 text-xs space-y-1 shadow-md shadow-rose-950">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono font-bold text-rose-400">Human Handoff</span>
                      <span className="text-[9px] text-slate-400 font-mono">Urgent</span>
                    </div>
                    <div className="font-bold text-white">Escalate to Live Inbox</div>
                    <div className="text-[10px] text-slate-400">Alert agent &amp; pause bot</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dry-Run Simulator Drawer Banner */}
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                <span className="font-semibold text-slate-900 dark:text-white">Dry-Run Simulator:</span>
                <span className="text-slate-300">Test sample messages to inspect node routing before publishing to live users.</span>
              </div>
              <span className="text-[11px] font-mono text-purple-300">Input: &ldquo;I need refund now!&rdquo; ➔ Escalate (Handoff)</span>
            </div>
          </div>
        </MockupCard>
      </section>

      {/* 3. Step-by-Step Guide */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          3. Step-by-Step: Designing a Workflow
        </h2>
        <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Place a Trigger Node:</strong> Drag a <strong className="text-emerald-400">Trigger</strong> node onto the canvas. Set trigger criteria to match specific keywords (e.g. &ldquo;price&rdquo;, &ldquo;catalog&rdquo;) or accept any inbound message.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Add Condition &amp; Sentiment Routing:</strong> Connect the trigger to a <strong className="text-amber-400">Condition</strong> node. You can branch based on customer sentiment (<code className="text-slate-300">positive</code>, <code className="text-slate-300">neutral</code>, <code className="text-slate-300">negative</code>, <code className="text-slate-300">urgent</code>) or keyword contents.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Configure Gemini AI &amp; Outbound Messages:</strong> Route neutral or positive inquiries to an <strong className="text-purple-400">AI Respond</strong> node. This instructs the Gemini model to ground its response in your indexed Knowledge Base documents.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Set Human Escalation Fallbacks:</strong> Route urgent inquiries or low-confidence replies to a <strong className="text-rose-400">Human Handoff</strong> node. This pauses AI auto-replies and alerts live agents in the Workspace Care Inbox.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Test with Dry-Run Simulator:</strong> Click <strong className="text-purple-400">Open Simulator</strong>. Type a sample customer message (e.g. &ldquo;Cancel my subscription immediately&rdquo;), set the sentiment, and click Run. The visual nodes highlight in sequence, verifying your routing logic without sending actual WhatsApp messages.
          </li>
        </ol>
      </section>

      {/* 4. Fields and Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          4. Flow Node Types &amp; Configuration Schema
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-xl">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Node Type</th>
                <th className="p-3">Identifier</th>
                <th className="p-3">Key Parameters</th>
                <th className="p-3">Operational Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-400">
              <tr>
                <td className="p-3 font-semibold text-emerald-400 font-mono">Trigger</td>
                <td className="p-3 font-mono">trigger</td>
                <td className="p-3 font-mono">triggerType: &apos;keyword&apos; | &apos;any_message&apos;</td>
                <td className="p-3">Entry point activated by incoming Meta Cloud API WhatsApp webhooks.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-amber-400 font-mono">Condition</td>
                <td className="p-3 font-mono">condition</td>
                <td className="p-3 font-mono">conditionType: &apos;sentiment&apos; | &apos;keyword&apos;</td>
                <td className="p-3">Evaluates user message properties and routes downstream along true/false edges.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-cyan-400 font-mono">Send Message</td>
                <td className="p-3 font-mono">send_message</td>
                <td className="p-3 font-mono">messageText: string</td>
                <td className="p-3">Dispatches an immediate canned text message back to the customer on WhatsApp.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-purple-400 font-mono">AI Respond</td>
                <td className="p-3 font-mono">ai_respond</td>
                <td className="p-3 font-mono">useKnowledgeBase: boolean, systemPrompt</td>
                <td className="p-3">Invokes Google Gemini with RAG vector search to compose a grounded, dynamic response.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-amber-300 font-mono">Action</td>
                <td className="p-3 font-mono">action</td>
                <td className="p-3 font-mono">actionType: &apos;add_tag&apos;, tagName</td>
                <td className="p-3">Updates CRM contact attributes or assigns audience segmentation tags.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-rose-400 font-mono">Human Handoff</td>
                <td className="p-3 font-mono">human_handoff</td>
                <td className="p-3 font-mono">reason: string</td>
                <td className="p-3">Sets <code className="text-rose-400">isHumanTakeover: true</code> and marks thread as priority for live human agents.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Behind the Scenes */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          5. Behind the Scenes: Asynchronous Flow Execution
        </h2>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            When an inbound customer message passes signature verification, the backend executes the active flow graph:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Directed Acyclic Graph (DAG) Traversal:</strong> The flow engine evaluates nodes in topological order. Sentiment analysis runs against the message text to classify urgency.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">RAG Vector Query:</strong> When hitting an <code className="text-purple-400 font-mono">ai_respond</code> node, the engine computes a 768-dimension embedding, queries MongoDB Vector Search, and passes retrieved context to Gemini 1.5.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">WhatsApp Dispatch:</strong> The resulting response is queued to BullMQ and sent to Meta Graph API endpoint <code className="text-emerald-400 font-mono">/v20.0/{'{phone_number_id}'}/messages</code>.
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
            <div className="font-semibold text-slate-900 dark:text-slate-200">Why are my messages not triggering the flow?</div>
            <p className="text-slate-600 dark:text-slate-400">
              Ensure that your flow status toggle is set to <strong className="text-emerald-400">Active</strong> and that only one primary flow is active per workspace. Check that the trigger node matches incoming keywords or accepts any message.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">What happens if a customer sends a message when Human Handoff is active?</div>
            <p className="text-slate-600 dark:text-slate-400">
              Once an escalation node is executed, automated flow routing and AI responses are muted for that specific customer conversation until a human agent manually reactivates the bot from the Workspace Care Inbox.
            </p>
          </div>
        </div>
      </section>

      {/* Pagination Footer */}
      <DocsPagination currentHref="/docs/flows" />
    </article>
  );
}
