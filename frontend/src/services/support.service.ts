const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const normalizedApiUrl = rawApiUrl.replace(/\/$/, "");
const API_URL = normalizedApiUrl.endsWith("/api") ? normalizedApiUrl : `${normalizedApiUrl}/api`;

export type TicketCategory =
  | "PAYMENT"
  | "MATCH_ISSUE"
  | "BAN_APPEAL"
  | "TECHNICAL"
  | "ACCOUNT"
  | "REFUND"
  | "REPORT"
  | "OTHER";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_USER" | "RESOLVED" | "CLOSED";

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  userId: string;
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  status: TicketStatus;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  _count?: { messages: number };
  messages?: TicketMessage[];
  user?: { id: string; username: string; email?: string; avatar?: string };
  assignedTo?: { id: string; username: string; avatar?: string } | null;
};

export type TicketMessage = {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  attachments: string[];
  isStaffReply: boolean;
  createdAt: string;
  user?: { id: string; username: string; avatar?: string; role?: string };
};

function getAuthHeader(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestJson<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...getAuthHeader(),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export const supportService = {
  async createTicket(input: {
    category: TicketCategory;
    priority?: TicketPriority;
    subject: string;
    description: string;
    attachments?: File[];
  }): Promise<SupportTicket> {
    const form = new FormData();
    form.append("category", input.category);
    form.append("subject", input.subject);
    form.append("description", input.description);
    if (input.priority) form.append("priority", input.priority);
    (input.attachments || []).forEach((f) => form.append("attachments", f));

    const res = await fetch(`${API_URL}/support/tickets`, {
      method: "POST",
      headers: { ...getAuthHeader() },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || data?.message || "Failed to create ticket");
    return data as SupportTicket;
  },

  async getMyTickets(params?: { status?: TicketStatus }): Promise<SupportTicket[]> {
    const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
    return requestJson<SupportTicket[]>(`/support/tickets${qs}`);
  },

  async getTicket(id: string): Promise<SupportTicket> {
    return requestJson<SupportTicket>(`/support/tickets/${encodeURIComponent(id)}`);
  },

  async addMessage(input: { ticketId: string; message: string; attachments?: File[] }): Promise<TicketMessage> {
    const form = new FormData();
    form.append("message", input.message);
    (input.attachments || []).forEach((f) => form.append("attachments", f));

    const res = await fetch(`${API_URL}/support/tickets/${encodeURIComponent(input.ticketId)}/messages`, {
      method: "POST",
      headers: { ...getAuthHeader() },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || data?.message || "Failed to send message");
    return data as TicketMessage;
  },
};

