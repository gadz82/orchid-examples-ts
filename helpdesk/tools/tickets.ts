/**
 * Built-in tools — Helpdesk ticket management and knowledge base (demo).
 *
 * All data is static / in-memory. No external API calls.
 */

export interface KBArticle {
    id: string;
    title: string;
    category: string;
    content: string;
    tags: string[];
}

export interface Ticket {
    ticketId: string;
    subject: string;
    status: string;
    priority: string;
    category: string;
    assignedTo: string;
    createdAt: string;
    updatedAt: string;
    description: string;
    resolution: string | null;
}

export const KB_ARTICLES: KBArticle[] = [
    {
        id: "KB-001",
        title: "How to reset your password",
        category: "authentication",
        content:
            "Navigate to Settings > Security > Change Password. Enter your current password, " +
            "then your new password twice. If you forgot your current password, use the " +
            "'Forgot Password' link on the login page to receive a reset email.",
        tags: ["password", "login", "authentication", "reset"],
    },
    {
        id: "KB-002",
        title: "Configuring SSO with SAML 2.0",
        category: "authentication",
        content:
            "Go to Admin > Integrations > SSO Configuration. Upload your IdP metadata XML or " +
            "enter the SSO URL, Entity ID, and X.509 certificate manually. Test the connection " +
            "before enabling. Supported IdPs: Okta, Azure AD, OneLogin, PingIdentity.",
        tags: ["sso", "saml", "authentication", "integration"],
    },
    {
        id: "KB-003",
        title: "API rate limits and throttling",
        category: "api",
        content:
            "The default rate limit is 100 requests/minute per API key. Enterprise plans support " +
            "up to 1000 req/min. When throttled, the API returns HTTP 429 with a Retry-After header. " +
            "Implement exponential backoff in your integration code.",
        tags: ["api", "rate-limit", "throttling", "integration"],
    },
    {
        id: "KB-004",
        title: "Troubleshooting email delivery issues",
        category: "email",
        content:
            "Check Admin > Notifications > Email Logs for bounce/reject status. Common causes: " +
            "SPF/DKIM misconfiguration, recipient mailbox full, domain blacklisted. Verify your " +
            "sending domain DNS records. For SMTP relay, ensure port 587 TLS is not blocked by your firewall.",
        tags: ["email", "notifications", "smtp", "dns"],
    },
    {
        id: "KB-005",
        title: "Data export and GDPR compliance",
        category: "compliance",
        content:
            "Use Admin > Data Management > Export to generate a full data export in CSV or JSON format. " +
            "For GDPR subject access requests, use the dedicated SAR endpoint: POST /api/v1/gdpr/sar. " +
            "Data deletion requests are processed within 30 days per our data processing agreement.",
        tags: ["gdpr", "export", "compliance", "data", "privacy"],
    },
    {
        id: "KB-006",
        title: "Webhook configuration and retry policy",
        category: "integration",
        content:
            "Configure webhooks at Admin > Integrations > Webhooks. Events: user.created, course.completed, " +
            "enrollment.updated. Webhooks retry 3 times with exponential backoff (1s, 5s, 25s). " +
            "Payloads are signed with HMAC-SHA256; verify using the webhook secret.",
        tags: ["webhook", "integration", "api", "events"],
    },
];

export const TICKETS: Record<string, Ticket> = {
    "TK-1001": {
        ticketId: "TK-1001",
        subject: "Cannot login after password reset",
        status: "open",
        priority: "high",
        category: "authentication",
        assignedTo: "support",
        createdAt: "2026-04-07T10:30:00Z",
        updatedAt: "2026-04-07T14:22:00Z",
        description: "User reports being unable to login after resetting password via email link.",
        resolution: null,
    },
    "TK-1002": {
        ticketId: "TK-1002",
        subject: "API returns 500 on user enrollment",
        status: "in_progress",
        priority: "critical",
        category: "api",
        assignedTo: "support",
        createdAt: "2026-04-06T09:15:00Z",
        updatedAt: "2026-04-07T16:45:00Z",
        description: "POST /api/v1/enrollments returns HTTP 500 intermittently.",
        resolution: null,
    },
    "TK-1003": {
        ticketId: "TK-1003",
        subject: "Email notifications not being delivered",
        status: "resolved",
        priority: "medium",
        category: "email",
        assignedTo: "support",
        createdAt: "2026-04-05T11:00:00Z",
        updatedAt: "2026-04-06T10:30:00Z",
        description: "Batch emails for course reminders are not reaching recipients.",
        resolution: "SPF record was missing for the sending domain. Added TXT record and redelivered.",
    },
    "TK-1004": {
        ticketId: "TK-1004",
        subject: "GDPR data export taking too long",
        status: "escalated",
        priority: "high",
        category: "compliance",
        assignedTo: "escalation",
        createdAt: "2026-04-04T08:00:00Z",
        updatedAt: "2026-04-07T09:00:00Z",
        description: "Data export for 50k users has been running for 48 hours with no progress.",
        resolution: null,
    },
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
    authentication: ["login", "password", "sso", "saml", "auth", "token", "session", "mfa", "2fa"],
    api: ["api", "endpoint", "rest", "http", "500", "429", "rate limit", "webhook", "integration"],
    email: ["email", "smtp", "notification", "delivery", "bounce", "spam"],
    compliance: ["gdpr", "export", "privacy", "data deletion", "sar", "compliance"],
    billing: ["invoice", "payment", "subscription", "license", "billing", "plan"],
    general: [],
};

const PRIORITY_KEYWORDS: Record<string, string[]> = {
    critical: ["down", "outage", "500", "crash", "data loss", "security breach", "urgent"],
    high: ["cannot", "unable", "broken", "failing", "blocked", "not working"],
    medium: ["slow", "intermittent", "sometimes", "delay", "issue"],
    low: ["question", "how to", "feature request", "suggestion", "minor"],
};

export async function classifyTicket(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    const description = String(args.description ?? args.query ?? "").trim();

    if (!description) {
        return { error: "No description provided for classification" };
    }

    const text = description.toLowerCase();

    let category = "general";
    let categoryScore = 0;
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        const matches = keywords.reduce((acc, kw) => (text.includes(kw) ? acc + 1 : acc), 0);
        if (matches > categoryScore) {
            categoryScore = matches;
            category = cat;
        }
    }

    let priority = "medium";
    for (const [prio, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
        if (keywords.some((kw) => text.includes(kw))) {
            priority = prio;
            break;
        }
    }

    const suggestedAgent = priority === "critical" || text.includes("escalat") ? "escalation" : "support";
    const confidence = Math.min(0.95, 0.6 + categoryScore * 0.1);

    return {
        priority,
        category,
        confidence: Math.round(confidence * 100) / 100,
        suggested_agent: suggestedAgent,
        reasoning: `Classified as '${category}' (matched ${categoryScore} keyword(s)) with '${priority}' priority. Routing to ${suggestedAgent} agent.`,
    };
}

export async function getTicketStatus(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    const ticketId = String(args.ticket_id ?? args.query ?? "").trim().toUpperCase();

    if (!ticketId) {
        return { error: "No ticket ID provided" };
    }

    const ticket = TICKETS[ticketId];
    if (!ticket) {
        return {
            error: `Ticket '${ticketId}' not found`,
            available_tickets: Object.keys(TICKETS),
        };
    }

    return { ...ticket };
}

export async function searchKB(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    const query = String(args.query ?? "").trim();

    if (!query) {
        return { error: "No search query provided" };
    }

    const text = query.toLowerCase();
    const words = text.split(/\s+/).filter((w) => w.length > 0);

    const scored: Array<{ score: number; article: KBArticle }> = [];

    for (const article of KB_ARTICLES) {
        let score = 0;
        const titleLower = article.title.toLowerCase();

        for (const word of words) {
            if (titleLower.includes(word)) score += 3;
        }

        for (const tag of article.tags) {
            if (text.includes(tag)) score += 2;
        }

        const contentLower = article.content.toLowerCase();
        for (const word of words) {
            if (word.length > 2 && contentLower.includes(word)) score += 1;
        }

        if (text.includes(article.category.toLowerCase())) score += 1.5;

        if (score > 0) {
            score += Math.random() * 0.5;
            scored.push({ score, article });
        }
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3);

    if (top.length === 0) {
        return {
            query,
            results: [],
            message: "No matching knowledge base articles found. Consider escalating to a human agent.",
        };
    }

    const maxScore = top[0].score;
    return {
        query,
        results: top.map(({ score, article }) => ({
            article_id: article.id,
            title: article.title,
            category: article.category,
            content: article.content,
            relevance_score: Math.round((score / maxScore) * 100) / 100,
        })),
        total_matches: scored.length,
    };
}
