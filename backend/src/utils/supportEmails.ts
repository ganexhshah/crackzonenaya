type TicketLike = {
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  id: string;
};

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function wrapEmail(opts: { title: string; preheader?: string; bodyHtml: string }) {
  const preheader = opts.preheader ? escapeHtml(opts.preheader) : "";
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(opts.title)}</title>
  </head>
  <body style="margin:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e6e8ef;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:18px 20px;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;">
                <div style="font-weight:700;font-size:16px;">GameHub Support</div>
                <div style="opacity:.9;font-size:12px;margin-top:2px;">Ticket Updates</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px;">
                ${opts.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;background:#fafbff;border-top:1px solid #eef0f6;color:#6b7280;font-size:12px;">
                If you did not request this, you can ignore this email.
              </td>
            </tr>
          </table>
          <div style="color:#9aa3b2;font-size:11px;margin-top:10px;">© ${new Date().getFullYear()} GameHub</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function ticketCreatedUserEmail(opts: { username?: string; ticket: TicketLike }) {
  const t = opts.ticket;
  const body = `
    <p style="margin:0 0 10px;font-size:16px;font-weight:700;">Ticket Submitted</p>
    <p style="margin:0 0 14px;color:#374151;font-size:13px;">Hi ${escapeHtml(opts.username || "Player")}, we received your request.</p>
    <div style="border:1px solid #eef0f6;border-radius:12px;padding:12px;">
      <div style="font-size:12px;color:#6b7280;">Ticket</div>
      <div style="font-size:14px;font-weight:700;margin-top:2px;">${escapeHtml(t.ticketNumber)}</div>
      <div style="margin-top:10px;font-size:12px;color:#6b7280;">Subject</div>
      <div style="font-size:13px;color:#111827;margin-top:2px;">${escapeHtml(t.subject)}</div>
      <div style="margin-top:10px;font-size:12px;color:#6b7280;">Status</div>
      <div style="font-size:13px;color:#111827;margin-top:2px;">${escapeHtml(t.status)}</div>
    </div>
    <p style="margin:14px 0 0;color:#374151;font-size:13px;">You can track and reply in the Help Center.</p>
  `;
  return wrapEmail({
    title: "Ticket Submitted",
    preheader: `Ticket ${t.ticketNumber} submitted`,
    bodyHtml: body,
  });
}

export function ticketCreatedAdminEmail(opts: { ticket: TicketLike; username?: string; email?: string }) {
  const t = opts.ticket;
  const body = `
    <p style="margin:0 0 10px;font-size:16px;font-weight:700;">New Support Ticket</p>
    <div style="border:1px solid #eef0f6;border-radius:12px;padding:12px;">
      <div style="font-size:12px;color:#6b7280;">Ticket</div>
      <div style="font-size:14px;font-weight:700;margin-top:2px;">${escapeHtml(t.ticketNumber)}</div>
      <div style="margin-top:10px;font-size:12px;color:#6b7280;">User</div>
      <div style="font-size:13px;color:#111827;margin-top:2px;">${escapeHtml(opts.username || "Unknown")} (${escapeHtml(opts.email || "-")})</div>
      <div style="margin-top:10px;font-size:12px;color:#6b7280;">Category / Priority</div>
      <div style="font-size:13px;color:#111827;margin-top:2px;">${escapeHtml(t.category)} / ${escapeHtml(t.priority)}</div>
      <div style="margin-top:10px;font-size:12px;color:#6b7280;">Subject</div>
      <div style="font-size:13px;color:#111827;margin-top:2px;">${escapeHtml(t.subject)}</div>
    </div>
  `;
  return wrapEmail({
    title: "New Support Ticket",
    preheader: `New ticket ${t.ticketNumber}`,
    bodyHtml: body,
  });
}

export function ticketMessageEmail(opts: {
  toRole: "USER" | "ADMIN";
  ticket: TicketLike;
  fromName: string;
  message: string;
}) {
  const t = opts.ticket;
  const body = `
    <p style="margin:0 0 10px;font-size:16px;font-weight:700;">New Message on Ticket</p>
    <p style="margin:0 0 12px;color:#374151;font-size:13px;">
      From <b>${escapeHtml(opts.fromName)}</b> on <b>${escapeHtml(t.ticketNumber)}</b>
    </p>
    <div style="border:1px solid #eef0f6;border-radius:12px;padding:12px;background:#fbfcff;">
      <div style="font-size:12px;color:#6b7280;">Message</div>
      <div style="white-space:pre-wrap;font-size:13px;color:#111827;margin-top:6px;">${escapeHtml(opts.message)}</div>
    </div>
    <p style="margin:14px 0 0;color:#374151;font-size:13px;">
      Reply in the Help Center to continue the conversation.
    </p>
  `;
  return wrapEmail({
    title: "New Ticket Message",
    preheader: `New message on ${t.ticketNumber}`,
    bodyHtml: body,
  });
}

export function ticketStatusChangedEmail(opts: { username?: string; ticket: TicketLike; oldStatus: string; newStatus: string }) {
  const t = opts.ticket;
  const body = `
    <p style="margin:0 0 10px;font-size:16px;font-weight:700;">Ticket Status Updated</p>
    <p style="margin:0 0 14px;color:#374151;font-size:13px;">Hi ${escapeHtml(opts.username || "Player")}, your ticket status changed.</p>
    <div style="border:1px solid #eef0f6;border-radius:12px;padding:12px;">
      <div style="font-size:12px;color:#6b7280;">Ticket</div>
      <div style="font-size:14px;font-weight:700;margin-top:2px;">${escapeHtml(t.ticketNumber)}</div>
      <div style="margin-top:10px;font-size:12px;color:#6b7280;">Status</div>
      <div style="font-size:13px;color:#111827;margin-top:2px;">${escapeHtml(opts.oldStatus)} → ${escapeHtml(opts.newStatus)}</div>
      <div style="margin-top:10px;font-size:12px;color:#6b7280;">Subject</div>
      <div style="font-size:13px;color:#111827;margin-top:2px;">${escapeHtml(t.subject)}</div>
    </div>
  `;
  return wrapEmail({
    title: "Ticket Status Updated",
    preheader: `${t.ticketNumber} status updated`,
    bodyHtml: body,
  });
}

