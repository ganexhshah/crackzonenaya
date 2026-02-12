"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

type AdminTicket = any;

export default function AdminSupportTicketsPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [status, setStatus] = useState<string>("ALL");
  const [priority, setPriority] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSupportTickets({
        status: status === "ALL" ? undefined : status,
        priority: priority === "ALL" ? undefined : priority,
        category: category === "ALL" ? undefined : category,
      });
      setTickets(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTickets();
  }, [status, priority, category]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage user tickets and update statuses.</p>
        </div>
        <Button variant="outline" onClick={() => fetchTickets()}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="OPEN">OPEN</SelectItem>
            <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
            <SelectItem value="WAITING_USER">WAITING_USER</SelectItem>
            <SelectItem value="RESOLVED">RESOLVED</SelectItem>
            <SelectItem value="CLOSED">CLOSED</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priority</SelectItem>
            <SelectItem value="LOW">LOW</SelectItem>
            <SelectItem value="MEDIUM">MEDIUM</SelectItem>
            <SelectItem value="HIGH">HIGH</SelectItem>
            <SelectItem value="URGENT">URGENT</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Category</SelectItem>
            <SelectItem value="PAYMENT">PAYMENT</SelectItem>
            <SelectItem value="MATCH_ISSUE">MATCH_ISSUE</SelectItem>
            <SelectItem value="BAN_APPEAL">BAN_APPEAL</SelectItem>
            <SelectItem value="TECHNICAL">TECHNICAL</SelectItem>
            <SelectItem value="ACCOUNT">ACCOUNT</SelectItem>
            <SelectItem value="REFUND">REFUND</SelectItem>
            <SelectItem value="REPORT">REPORT</SelectItem>
            <SelectItem value="OTHER">OTHER</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="text-sm text-muted-foreground p-3">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="text-sm text-muted-foreground p-3">No tickets.</div>
          ) : (
            tickets.map((t) => (
              <Link
                key={t.id}
                href={`/admin/support/tickets/${t.id}`}
                className="block rounded-lg border p-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.ticketNumber} • {t.category} • {t.priority} • {t.user?.username || "user"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{t.status}</Badge>
                    <Badge variant="secondary">{t._count?.messages || 0} msgs</Badge>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

