import React from 'react';
import Link from 'next/link';
import { MockupCard } from '@/components/docs/MockupCard';
import { DocsPagination } from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'RAG Knowledge Base & Embeddings | NotifyIQ Documentation',
  description: 'Ingest company documents, generate 768-dim Gemini vector embeddings, execute MongoDB Vector Search, and test responses in the RAG Playground.',
};

export default function KnowledgeBaseDocPage() {
  return (
    <article className="space-y-10">
      {/* Header & Breadcrumb */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800 pb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400">Docs</Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Automation &amp; Intelligence</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">RAG Knowledge Base</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          RAG Knowledge Base &amp; Semantic Grounding
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The intelligence center powering NotifyIQ&apos;s AI auto-replies. Ingest company policies, FAQs, and product sheets into 768-dimensional Google Gemini vector embeddings, index them in MongoDB Vector Search, and guarantee strictly grounded WhatsApp customer responses.
        </p>
      </div>

      {/* 1. Purpose */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          1. Purpose of the Page
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Retrieval-Augmented Generation (RAG) ensures that AI auto-replies in WhatsApp are 100% accurate, factual, and strictly bounded by your company&apos;s verified documentation. The Knowledge Base interface provides tools to upload text and documents (PDF, DOCX, CSV, TXT), automatically split them into 500-token chunks, compute semantic embeddings, and test retrieval in an interactive playground before deploying to production customer chats.
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
            <span className="font-bold text-slate-900 dark:text-slate-100">Customer Support Architects</span>
            <p className="text-slate-600 dark:text-slate-400">Uploads operating procedures, troubleshooting checklists, and returns/warranty policies.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Product &amp; Sales Operations</span>
            <p className="text-slate-600 dark:text-slate-400">Maintains pricing schedules, feature matrices, and product catalogs for instant bot quoting.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">AI Engineers &amp; QA Leads</span>
            <p className="text-slate-600 dark:text-slate-400">Evaluates cosine similarity confidence scores and inspects source citations in the Playground.</p>
          </div>
        </div>
      </section>

      {/* 7. CSS UI Mockup */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Interactive Visual Preview
        </h2>
        <MockupCard title="KnowledgeBasePage.tsx • /knowledge-base" badge="768-dim Vectors" subtitle="Document Indexer & RAG Playground">
          <div className="space-y-6">
            {/* Tabs Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 pb-3 text-xs">
              <div>
                <div className="font-bold text-white text-sm">Enterprise Knowledge Repository</div>
                <div className="text-[11px] text-slate-400">Embedding Engine: <code className="text-emerald-400 font-mono">gemini-embedding-001</code> • 8 Indexed Docs</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer">
                  Upload Documents
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-300 font-medium text-xs cursor-pointer">
                  RAG Query Playground
                </span>
              </div>
            </div>

            {/* Split Grid: Ingestion Form & Indexed Docs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* File Uploader (6 cols) */}
              <div className="lg:col-span-6 p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <span className="font-bold text-slate-900 dark:text-white text-xs">Ingest Document or Policy</span>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center space-y-2 bg-slate-950/60">
                  <span className="text-2xl">📄</span>
                  <div className="text-slate-300 font-medium">Drag &amp; drop file or browse</div>
                  <div className="text-[10px] text-slate-500 font-mono">Supports PDF, DOCX, TXT, CSV, JSON (Auto 500-token chunks)</div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-slate-600 dark:text-slate-400 block text-[11px]">Or Paste Direct Policy Text</label>
                  <input
                    type="text"
                    disabled
                    value="Enterprise Cancellation Policy 2026"
                    className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-300 text-xs"
                  />
                  <textarea
                    disabled
                    rows={2}
                    value="Customers may request cancellation within 14 calendar days of plan activation for a full refund..."
                    className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-400 text-[11px]"
                  />
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs">
                    Vectorize &amp; Index
                  </span>
                </div>
              </div>

              {/* RAG Query Playground Preview (6 cols) */}
              <div className="lg:col-span-6 p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-purple-500/30 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                    Playground Semantic Query Test
                  </span>
                  <span className="text-[10px] font-mono text-purple-300">Confidence: 94.2%</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 text-[11px] text-slate-300">
                  <span className="text-slate-500 font-mono mr-2">Query:</span>
                  &ldquo;What is the refund timeline if a client cancels?&rdquo;
                </div>

                {/* Grounded Result Card */}
                <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/30 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                    Grounded AI Synthesis
                  </div>
                  <p className="text-slate-200 leading-relaxed text-[11px]">
                    Clients can receive a full refund if the cancellation request is submitted within 14 calendar days of plan activation. Refunds are processed back to the original payment method within 5-7 business days.
                  </p>
                  <div className="pt-2 border-t border-purple-900/50 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>Source:</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-purple-300 border border-purple-500/20">
                      Enterprise Cancellation Policy 2026.pdf (Chunk #2)
                    </span>
                  </div>
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
          3. Step-by-Step: Adding and Testing Knowledge
        </h2>
        <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Upload Knowledge Documents:</strong> Go to the <strong className="text-slate-900 dark:text-slate-200">Upload Documents</strong> tab. Either drag in a file (<code className="text-slate-300 font-mono text-xs">.pdf</code>, <code className="text-slate-300 font-mono text-xs">.docx</code>, <code className="text-slate-300 font-mono text-xs">.txt</code>, <code className="text-slate-300 font-mono text-xs">.csv</code>) or paste raw text with a descriptive document title.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Automatic Token Chunking:</strong> NotifyIQ automatically breaks documents into 500-token chunks with 50-token semantic overlap. This prevents context fragmentation across sentences.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Vector Embedding Generation:</strong> The backend sends text chunks to Google Gemini API (<code className="text-emerald-400 font-mono text-xs">models/embedding-001</code>), creating 768-dimension dense vector arrays saved to MongoDB with vector index markers.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Run Playground Verification Queries:</strong> Switch to the <strong className="text-purple-400">RAG Query Playground</strong> tab. Enter typical customer questions (e.g. &ldquo;How do I configure my webhook?&rdquo;) and verify that the AI cites the correct source document and displays high confidence (&gt;85%).
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Manage &amp; Prune Documents:</strong> View all active indexed documents in the repository table. When company policies update, delete outdated versions to prevent contradictory answers.
          </li>
        </ol>
      </section>

      {/* 4. Fields and Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          4. Controls, Endpoints &amp; Vector Specifications
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-xl">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Feature / Parameter</th>
                <th className="p-3">API Route</th>
                <th className="p-3">Specification</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-400">
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Index Document</td>
                <td className="p-3 font-mono text-emerald-400">POST /api/ai/knowledge</td>
                <td className="p-3 font-mono">title, content, fileType</td>
                <td className="p-3">Splits raw text into 500-token chunks and computes Gemini 768-dim embeddings.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Delete Document</td>
                <td className="p-3 font-mono text-rose-400">DELETE /api/ai/knowledge/:id</td>
                <td className="p-3 font-mono">docId</td>
                <td className="p-3">Purges all chunk embeddings associated with the specified document from MongoDB.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">RAG Playground Query</td>
                <td className="p-3 font-mono text-purple-400">POST /api/ai/query</td>
                <td className="p-3 font-mono">query: string</td>
                <td className="p-3">Executes vector cosine search and generates grounded synthesized text with citations.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Embedding Model</td>
                <td className="p-3">Google Gemini API</td>
                <td className="p-3 font-mono">gemini-embedding-001 (768d)</td>
                <td className="p-3">Generates dense semantic vector representations for similarity ranking.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Behind the Scenes */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          5. Behind the Scenes: Real-Time RAG Auto-Reply Pipeline
        </h2>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            When a customer sends a WhatsApp message while the AI bot is enabled, the backend executes the following RAG sequence:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Query Vectorization:</strong> The inbound message text is vectorized in real time using <code className="text-emerald-400 font-mono">gemini-embedding-001</code>.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">MongoDB Atlas Vector Search:</strong> An approximate nearest neighbor (ANN) search retrieves the top 3 most relevant document chunks based on cosine distance.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Grounded Generation:</strong> Retrieved chunks are injected into the Gemini system prompt: <em>&ldquo;You are a WhatsApp customer care agent for NotifyIQ. Only answer questions using the provided context chunks. If the answer is not in the context, politely state that you will connect them with a human agent.&rdquo;</em>
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">WhatsApp Delivery:</strong> The synthesized message is dispatched via Meta Graph API v20.0 with delivery receipts logged.
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
            <div className="font-semibold text-slate-900 dark:text-slate-200">Why does the AI say &ldquo;I don&apos;t have enough information&rdquo;?</div>
            <p className="text-slate-600 dark:text-slate-400">
              NotifyIQ strictly prevents AI hallucination. If the customer&apos;s question cannot be matched with high cosine confidence against your indexed documents, the bot will decline to speculate and offer human agent handoff.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">How many documents can I upload?</div>
            <p className="text-slate-600 dark:text-slate-400">
              There is no arbitrary document count limit. Storage and token usage are calculated based on your workspace billing tier and wholesale token consumption.
            </p>
          </div>
        </div>
      </section>

      {/* Pagination Footer */}
      <DocsPagination currentHref="/docs/knowledge-base" />
    </article>
  );
}
