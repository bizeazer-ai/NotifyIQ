export interface DocItem {
  title: string;
  href: string;
  description: string;
  badge?: string;
}

export interface DocSection {
  title: string;
  items: DocItem[];
}

export const DOCS_NAVIGATION: DocSection[] = [
  {
    title: 'Getting Started',
    items: [
      {
        title: 'Quickstart & Onboarding',
        href: '/docs/getting-started',
        description: 'Account creation, WABA connectivity, Meta verification, and first broadcast checklist.',
        badge: 'Start Here',
      },
    ],
  },
  {
    title: 'Core Messaging Console',
    items: [
      {
        title: 'Executive Dashboard',
        href: '/docs/dashboard',
        description: 'Real-time delivery SLA %, bot containment, message volumes, and telemetry graphs.',
      },
      {
        title: 'Workspace Care Inbox',
        href: '/docs/inbox',
        description: '24-hour Meta messaging window, AI copilot, media messaging, and customer lead drawer.',
        badge: 'Live Chat',
      },
      {
        title: 'Contacts Directory',
        href: '/docs/contacts',
        description: 'DPDP consent records, audience segmentation tags, CSV and WhatsApp chat import.',
      },
    ],
  },
  {
    title: 'Campaigns & Templates',
    items: [
      {
        title: 'Broadcast Campaigns',
        href: '/docs/campaigns',
        description: 'High-throughput outbound messaging, consent filters, 80 msgs/sec dispatch, and delivery stats.',
      },
      {
        title: 'Message Templates Builder',
        href: '/docs/templates',
        description: 'Meta Cloud API template submissions, variable placeholders {{1}}, and approval tracking.',
        badge: 'Meta API',
      },
    ],
  },
  {
    title: 'Automation & Intelligence',
    items: [
      {
        title: 'Visual Flow Builder',
        href: '/docs/flows',
        description: 'Drag-and-drop conversational canvas, condition triggers, Gemini AI nodes, and dry-run simulator.',
      },
      {
        title: 'RAG Knowledge Base',
        href: '/docs/knowledge-base',
        description: 'Enterprise document indexing, 768-dimension embeddings, MongoDB vector search, and playground.',
        badge: 'AI Powered',
      },
    ],
  },
  {
    title: 'Platform Administration',
    items: [
      {
        title: 'Billing & Usage Analytics',
        href: '/docs/billing',
        description: 'Wholesale usage counters, Stripe checkout, Razorpay INR + 18% GST tax invoices.',
      },
      {
        title: 'AI Agent & Settings',
        href: '/docs/settings',
        description: 'AI system prompt tuning, business operating hours, white-label branding, and REST API keys.',
      },
      {
        title: 'Meta WABA Profile & Connection',
        href: '/docs/waba',
        description: 'Embedded Signup OAuth, phone number registration with PIN, and Graph API logs.',
        badge: 'Meta Cloud',
      },
      {
        title: 'Outbound Webhooks',
        href: '/docs/webhooks',
        description: 'Real-time event streaming, HMAC-SHA256 signature verification, and delivery logs.',
      },
      {
        title: 'Authentication & Access',
        href: '/docs/auth',
        description: 'Tenant workspace security, referral tracking, and Admin Support Impersonation.',
      },
    ],
  },
];

export const ALL_DOC_PAGES: DocItem[] = DOCS_NAVIGATION.flatMap((section) => section.items);

export function getPrevNextDocs(currentHref: string): { prev: DocItem | null; next: DocItem | null } {
  const index = ALL_DOC_PAGES.findIndex((item) => item.href === currentHref);
  if (index === -1) {
    return { prev: null, next: null };
  }
  return {
    prev: index > 0 ? ALL_DOC_PAGES[index - 1] : null,
    next: index < ALL_DOC_PAGES.length - 1 ? ALL_DOC_PAGES[index + 1] : null,
  };
}
