// Built-in tools for the helpdesk example
export async function getTicket(args: Record<string, string>): Promise<string> {
  const id = args["ticket_id"] || "";
  const tickets: Record<string, string> = {
    "TKT-001": "Status: Open | Priority: High | Subject: Login failure after password reset | Customer: acme@example.com",
    "TKT-002": "Status: Pending | Priority: Medium | Subject: API rate limit exceeded | Customer: widgetco@example.com",
    "TKT-003": "Status: Critical | Priority: Critical | Subject: Production database unreachable | Customer: admin@bigcorp.com",
  };
  return tickets[id] || `Ticket ${id} not found.`;
}

export async function searchKnowledgeBase(args: Record<string, string>): Promise<string> {
  const query = args["query"]?.toLowerCase() || "";
  const articles: Record<string, string> = {
    "login": "KB-101: Reset password via /reset-password endpoint. Verify email domain is whitelisted.",
    "api": "KB-202: API rate limits are 1000 req/min for standard tier. Upgrade to enterprise for higher limits.",
    "database": "KB-303: Check database connection string in .env. Verify VPN tunnel is active for production access.",
  };
  for (const [key, article] of Object.entries(articles)) {
    if (query.includes(key)) return article;
  }
  return "No relevant knowledge base articles found.";
}

export async function escalateTicket(args: Record<string, string>): Promise<string> {
  return `Ticket ${args["ticket_id"]} escalated to ${args["reason"]} team.`;
}

export async function checkSLA(args: Record<string, string>): Promise<string> {
  return `SLA for ${args["ticket_id"]}: Within limits (responded in 15 min, target 30 min).`;
}
