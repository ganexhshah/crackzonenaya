"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supportService, SupportTicket, TicketStatus } from "@/services/support.service";
import { toast } from "sonner";

function statusBadgeVariant(status: TicketStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "OPEN") return "default";
  if (status === "IN_PROGRESS") return "secondary";
  if (status === "WAITING_USER") return "outline";
  if (status === "RESOLVED") return "secondary";
  return "destructive";
}

export default function MyTicketsPage() {
  const [status, setStatus] = useState<TicketStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await supportService.getMyTickets(status === "ALL" ? undefined : { status });
      setTickets(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTickets();
  }, [status]);

  const counts = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "OPEN").length;
    const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
    const waiting = tickets.filter((t) => t.status === "WAITING_USER").length;
    return { total, open, inProgress, waiting };
  }, [tickets]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Track ticket status and reply to support.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/help">Help Center</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/help/tickets/new">Submit a Ticket</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Total: {counts.total}</Badge>
          <Badge>Open: {counts.open}</Badge>
          <Badge variant="secondary">In Progress: {counts.inProgress}</Badge>
          <Badge variant="outline">Waiting You: {counts.waiting}</Badge>
        </div>
        <div className="w-full sm:w-56">
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="WAITING_USER">Waiting User</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="text-sm text-muted-foreground p-3">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="text-sm text-muted-foreground p-3">
              No tickets found.
            </div>
          ) : (
            tickets.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/help/tickets/${t.id}`}
                className="block rounded-lg border p-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.ticketNumber} • {t.category} • {t.priority}
                    </p>
                  </div>
                  <Badge variant={statusBadgeVariant(t.status)} className="shrink-0">
                    {t.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{t.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Updated: {new Date(t.updatedAt).toLocaleString()}
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

