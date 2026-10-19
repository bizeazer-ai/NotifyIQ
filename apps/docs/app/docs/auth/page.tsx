import React from 'react';
import Link from 'next/link';
import { MockupCard } from '@/components/docs/MockupCard';
import { DocsPagination } from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'Authentication & Workspace Access | NotifyIQ Documentation',
  description: 'Understand NotifyIQ multi-tenant authentication: User Login, Tenant Workspace Registration with referral tracking, RBAC, and Admin Support Impersonation.',
};

export default function AuthDocPage() {
  return (
    <article className="space-y-10">
      {/* Header & Breadcrumb */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800 pb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400">Docs</Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Platform Administration</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">Authentication &amp; Access</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Authentication, Workspace Access &amp; Support Impersonation
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The security perimeter. Learn how NotifyIQ provisions isolated multi-tenant workspaces, manages role-based access control (RBAC), tracks referral onboarding, and provides zero-password Admin Support Impersonation.
        </p>
      </div>

      {/* 1. Purpose */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          1. Purpose of the Page
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          NotifyIQ is an enterprise multi-tenant software platform. Every customer operates inside an isolated workspace bounded by their unique <code className="text-emerald-400 font-mono text-xs">workspaceId</code>. This guide explains how users authenticate, how new tenants are registered and attributed to partners, and how authorized platform engineers diagnose tenant issues safely using temporary cryptographically signed impersonation sessions.
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
            <span className="font-bold text-slate-900 dark:text-slate-100">New Business Owners</span>
            <p className="text-slate-600 dark:text-slate-400">Provisions a brand new company workspace and sets up the primary workspace administrator account.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Support Agents &amp; Operators</span>
            <p className="text-slate-600 dark:text-slate-400">Logs in with individual credentials to manage WhatsApp chats and handle customer inquiries.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Super-Admin Support Staff</span>
            <p className="text-slate-600 dark:text-slate-400">Uses signed one-time impersonation links from the central admin console to assist clients in real time.</p>
          </div>
        </div>
      </section>

      {/* 7. CSS UI Mockup */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Interactive Visual Preview
        </h2>
        <MockupCard title="RegisterPage.tsx & AdminImpersonationPage.tsx" badge="Tenant Isolation" subtitle="JWT Auth & Admin Support Portal">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left: Tenant Sign In / Registration Mockup */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-900 dark:text-white text-xs">Workspace Onboarding Portal</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  POST /api/auth/register
                </span>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Company / Workspace Name</label>
                <input
                  type="text"
                  disabled
                  value="Apex Retailers India"
                  className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Workspace Admin Email</label>
                <input
                  type="email"
                  disabled
                  value="admin@apexretail.in"
                  className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Referral Attribution</label>
                <input
                  type="text"
                  disabled
                  value="ref=partner_bizeazer_gujarat"
                  className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-400 font-mono text-[11px]"
                />
              </div>

              <div className="pt-2">
                <span className="w-full block text-center py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs">
                  Create Tenant Workspace
                </span>
              </div>
            </div>

            {/* Right: Admin Support Impersonation Mockup */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-amber-500/30 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Super-Admin Support Impersonation
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Audit Logged
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Super-admins can access client workspaces to debug WABA webhook deliveries or template formatting without requesting client passwords:
              </p>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-[10px]">
                <div className="text-slate-500">Target Workspace:</div>
                <div className="text-slate-200 font-bold">ws_66f1082a912e (Apex Retailers)</div>
                <div className="text-slate-500 pt-1">Session Token:</div>
                <div className="text-amber-400 truncate">imp_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
              </div>

              <div className="pt-2">
                <span className="w-full block text-center py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs">
                  Redirecting to Workspace Dashboard...
                </span>
              </div>
            </div>
          </div>
        </MockupCard>
      </section>

      {/* 3. Step-by-Step Guide */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          3. Step-by-Step: Onboarding and Role Management
        </h2>
        <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Workspace Registration:</strong> Navigate to <code className="text-slate-300 font-mono text-xs">/register</code>. Enter your company name, admin email, and secure password (minimum 6 characters). If arriving through an affiliate partner link (<code className="text-slate-300 font-mono text-xs">?ref=...</code>), partner attribution is automatically preserved.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Standard Sign In:</strong> Existing operators sign in at <code className="text-slate-300 font-mono text-xs">/login</code>. The backend verifies credentials, returns a JWT token, and establishes the active workspace session.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Role-Based Access Enforcement:</strong> Users are assigned either the <strong className="text-slate-900 dark:text-slate-200">ADMIN</strong> role (access to Billing, API Keys, WABA Credentials, and Team Settings) or the <strong className="text-slate-900 dark:text-slate-200">AGENT</strong> role (focused purely on Live Inbox care, Contacts, and Campaign dispatching).
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Admin Support Impersonation:</strong> When an enterprise client requests assistance, certified super-admins can click &ldquo;Access Workspace&rdquo; from the central Admin Console. This opens <code className="text-slate-300 font-mono text-xs">/auth/admin-impersonation?token=...&amp;workspace=...</code>, validating the temporary support token and mounting the workspace session with full audit logging.
          </li>
        </ol>
      </section>

      {/* 4. Fields and Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          4. Authentication Security &amp; Token Headers
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-xl">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Header / Property</th>
                <th className="p-3">Storage Key</th>
                <th className="p-3">Payload Format</th>
                <th className="p-3">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-400">
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Authorization</td>
                <td className="p-3 font-mono">notifyiq_token</td>
                <td className="p-3 font-mono text-emerald-400">Bearer &lt;JWT&gt;</td>
                <td className="p-3">Cryptographically signed JSON Web Token verifying user identity and roles.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">x-workspace-id</td>
                <td className="p-3 font-mono">notifyiq_workspace</td>
                <td className="p-3 font-mono">MongoDB ObjectId string</td>
                <td className="p-3">Enforces strict database tenancy, preventing cross-tenant data leakage.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Impersonation Token</td>
                <td className="p-3 font-mono">URL param &apos;token&apos;</td>
                <td className="p-3 font-mono text-amber-400">Signed 15-min JWT</td>
                <td className="p-3">Single-use token issued exclusively to super-admins with audit logging.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Behind the Scenes */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          5. Behind the Scenes: Multi-Tenant Database Isolation
        </h2>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Tenant security is enforced at the database query layer:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Automatic Query Scoping:</strong> Every database query for contacts, messages, templates, and flows includes an immutable filter: <code className="text-emerald-400 font-mono">{'{ workspaceId: req.user.workspaceId }'}</code>.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Password Hashing:</strong> User passwords are encrypted using bcrypt with high work factors before ever being persisted.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Impersonation Audit Trail:</strong> Every action taken during an impersonated support session is tagged in audit logs with both the super-admin operator ID and the target workspace ID.
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
            <div className="font-semibold text-slate-900 dark:text-slate-200">How long does my login session remain active?</div>
            <p className="text-slate-600 dark:text-slate-400">
              Standard operator sessions remain valid for 7 days unless explicitly logged out. Impersonated support tokens expire automatically after 15 minutes.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">Can users in one workspace see contacts in another workspace?</div>
            <p className="text-slate-600 dark:text-slate-400">
              No. Multi-tenant isolation strictly segments all data. Contacts, messages, WABA tokens, and billing records are completely isolated by workspace ID.
            </p>
          </div>
        </div>
      </section>

      {/* Pagination Footer */}
      <DocsPagination currentHref="/docs/auth" />
    </article>
  );
}
