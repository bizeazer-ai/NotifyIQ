import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-emerald-950/20 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Meta WABA Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Meta Cloud API v20.0 Platform Ready
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
              Enterprise WhatsApp Intelligence &{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Campaign Automation
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              NotifyIQ powers enterprise customer engagement over the Meta WhatsApp Business API.
              Unify live agent customer care, autonomous RAG knowledge base answers, visual flow automations,
              and high-throughput broadcasts with strict DPDP &amp; GDPR compliance.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/docs"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-600/20 transition-all hover:shadow-emerald-600/30 active:scale-[0.99]"
              >
                <span>Read Full Documentation</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-base transition-colors"
              >
                <span>How It Works</span>
              </Link>
            </div>
          </div>

          {/* Interactive UI Telemetry Mockup */}
          <div className="mt-16 max-w-6xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            {/* Header Mockup */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                  console.notifyiq.app / live-workspace-inbox
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                WABA Cloud API Online
              </div>
            </div>

            {/* Mockup Dashboard Cards */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Delivery SLA Rate
                </div>
                <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">99.8%</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Sub-second Meta webhook delivery receipts
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  AI Bot Containment
                </div>
                <div className="mt-2 text-3xl font-black text-cyan-600 dark:text-cyan-400">84.2%</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Autonomous resolution via Vector RAG
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Outbound Rate Limit
                </div>
                <div className="mt-2 text-3xl font-black text-indigo-600 dark:text-indigo-400">80 msg/sec</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Redis Lua Token Bucket throttling
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Features Section */}
      <section id="features" className="py-20 md:py-28 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950">
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Verified Capabilities
            </h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Engineered for Scalable WhatsApp Operations
            </p>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Every feature below is implemented directly in the NotifyIQ production core, eliminating guesswork and vendor lock-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Meta Embedded Signup &amp; WABA
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Connect official WhatsApp Business Accounts with a single OAuth popup. Access tokens and webhook secrets are encrypted at rest using AES-256-GCM.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Live Workspace Care Inbox
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Real-time WebSockets workspace isolation with a 24-hour Meta service window countdown timer, media streaming upload, and Human Takeover toggle.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-5 font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                High-Volume Broadcasts
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Dispatch approved Meta Message Templates to opt-in contacts with dynamic parameter replacement (<code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{"{{1}}"}</code> &rarr; <code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{"{{name}}"}</code>).
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Visual Flow Builder &amp; Simulator
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Design custom conversation paths with Trigger, Condition, WhatsApp Outbound, Gemini AI, and Human Escalation nodes with built-in dry-run testing.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                RAG Vector Knowledge Base
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Chunk enterprise documentation, generate 768-dim embeddings into MongoDB Vector Search, and deliver grounded, cited answers to customer queries.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                DPDP Act 2023 &amp; GDPR Ready
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Comprehensive consent records, opt-out automation, Right to Erasure cascade wipes, and 24-hr self-service data portability archives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works (4 Steps) */}
      <section id="how-it-works" className="py-20 md:py-28 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40">
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Implementation Flow
            </h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Get Started in Four Simple Steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Connect WABA</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Log in via Meta Embedded Signup popup dialog to exchange your authorization code for permanent system user access.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-black text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Ingest Knowledge</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Upload your company FAQs, product specs, and PDFs to automatically index 768-dim embeddings into MongoDB Vector Search.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-cyan-600 text-white font-black text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Automate &amp; Broadcast</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Build visual message routing flows and broadcast approved Meta Message Templates to consent-verified customer lists.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center mb-4">
                4
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Stream Webhooks</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Forward real-time inbound messages, sentiment scores, and delivery statuses to your external CRM with HMAC signatures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Meta Platform & WhatsApp Integration Details */}
      <section id="meta-integration" className="py-20 md:py-28 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950">
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
                Meta Cloud API Architecture
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight">
                Deep, Direct Integration with Meta Platforms
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                NotifyIQ communicates directly with the Meta Graph API v20.0 endpoints, bypassing third-party middleware bottlenecks and ensuring your messaging stays compliant with WhatsApp Business Policies.
              </p>

              <ul className="mt-8 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">✓</div>
                  <span><strong>Granular Permissions</strong>: Utilizes strictly approved <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">whatsapp_business_management</code> and <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">whatsapp_business_messaging</code> scopes.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">✓</div>
                  <span><strong>High-Performance Ingestion</strong>: Meta webhook handshakes and payload signatures (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">x-hub-signature-256</code>) are verified and acknowledged in under 100ms.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">✓</div>
                  <span><strong>Multi-Channel Roadmap</strong>: Architected from inception for seamless expansion to Instagram Messaging and Messenger omni-channel support.</span>
                </li>
              </ul>
            </div>

            {/* Architecture Card */}
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shadow-lg">
              <h3 className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4">
                Verified Meta Endpoints
              </h3>
              <div className="space-y-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                <div className="p-2.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span>POST /v20.0/{'{phone_id}'}/messages</span>
                  <span className="text-emerald-600 font-bold">DISPATCH</span>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span>POST /v20.0/{'{phone_id}'}/media</span>
                  <span className="text-teal-600 font-bold">STREAM</span>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span>POST /v20.0/{'{waba_id}'}/message_templates</span>
                  <span className="text-cyan-600 font-bold">TEMPLATES</span>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span>POST /v20.0/oauth/access_token</span>
                  <span className="text-indigo-600 font-bold">EMBEDDED SIGNUP</span>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span>POST /api/waba/webhook</span>
                  <span className="text-purple-600 font-bold">HMAC VERIFIED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section className="py-20 md:py-24 bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white">
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Ready to Automate WhatsApp Operations?
          </h2>
          <p className="mt-4 text-emerald-50 text-base sm:text-lg max-w-2xl mx-auto">
            Explore our developer documentation, review Meta compliance policies, or learn how to connect your first WABA number.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/docs"
              className="px-6 py-3.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-base shadow-lg transition-transform active:scale-[0.99]"
            >
              Browse User Documentation
            </Link>
            <Link
              href="/privacy-policy"
              className="px-6 py-3.5 rounded-xl border border-white/40 hover:bg-white/10 text-white font-semibold text-base transition-colors"
            >
              Review Privacy Policy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
