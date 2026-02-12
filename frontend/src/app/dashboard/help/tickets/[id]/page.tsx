"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supportService, SupportTicket, TicketMessage, TicketStatus } from "@/services/support.service";
import { toast } from "sonner";

function statusColor(status: TicketStatus) {
  if (status === "OPEN") return "bg-primary text-primary-foreground";
  if (status === "IN_PROGRESS") return "bg-muted text-foreground";
  if (status === "WAITING_USER") return "bg-background border";
  if (status === "RESOLVED") return "bg-emerald-600 text-white";
  return "bg-destructive text-destructive-foreground";
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const fetchTicket = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await supportService.getTicket(id);
      setTicket(data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTicket();
  }, [id]);

  const canSend = useMemo(() => reply.trim().length >= 1 && !sending, [reply, sending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    if (!reply.trim()) return;
    try {
      setSending(true);
      const msg = await supportService.addMessage({
        ticketId: ticket.id,
        message: reply.trim(),
        attachments: files.slice(0, 3),
      });
      setReply("");
      setFiles([]);
      setTicket((prev) => {
        if (!prev) return prev;
        const nextMessages = [...(prev.messages || []), msg as TicketMessage];
        return { ...prev, messages: nextMessages };
      });
      toast.success("Message sent");
      void fetchTicket();
    } catch (e: any) {
      toast.error(e?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Ticket</h1>
          <p className="text-muted-foreground mt-1">View status and message history.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/help/tickets">My Tickets</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/help">Help Center</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Loading...</CardContent>
        </Card>
      ) : !ticket ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Ticket not found.</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-lg truncate">{ticket.subject}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ticket.ticketNumber} • {ticket.category} • {ticket.priority}
                  </p>
                </div>
                <Badge className={statusColor(ticket.status)}>{ticket.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              {ticket.attachments?.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {ticket.attachments.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm underline text-primary"
                        >
                          View
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <p className="text-xs text-muted-foreground">Created: {new Date(ticket.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(ticket.messages || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                (ticket.messages || []).map((m) => (
                  <div key={m.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {m.user?.username || "User"}{" "}
                        {m.isStaffReply && <span className="text-xs text-muted-foreground">(Staff)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="text-sm whitespace-pre-wrap mt-2">{m.message}</p>
                    {m.attachments?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {m.attachments.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm underline text-primary"
                          >
                            Attachment
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-3">
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea value={reply} onChange={(e) => setReply(e.target.value)} className="min-h-24" />
                </div>
                <div className="space-y-2">
                  <Label>Attachments (max 3)</Label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  />
                </div>
                <Button type="submit" disabled={!canSend}>
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

