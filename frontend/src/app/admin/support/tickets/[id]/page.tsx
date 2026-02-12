"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

export default function AdminSupportTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");

  const fetchTicket = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const t = await adminService.getSupportTicketById(id);
      setTicket(t);
      setStatus(t.status);
      setPriority(t.priority);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTicket();
  }, [id]);

  const save = async () => {
    if (!ticket) return;
    try {
      setSaving(true);
      const updated = await adminService.updateSupportTicket(ticket.id, {
        status,
        priority,
      });
      setTicket(updated);
      toast.success("Ticket updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update ticket");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Ticket Detail</h1>
          <p className="text-muted-foreground mt-1">Update status/priority and review messages.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/support/tickets">Back</Link>
          </Button>
          <Button onClick={save} disabled={saving || loading || !ticket}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Loading...</CardContent>
        </Card>
      ) : !ticket ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Not found.</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ticket.subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{ticket.ticketNumber}</Badge>
                <Badge variant="secondary">{ticket.category}</Badge>
                <Badge>{ticket.status}</Badge>
                <Badge variant="outline">{ticket.priority}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                User: {ticket.user?.username} ({ticket.user?.email})
              </p>
              <Separator />
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manage</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">OPEN</SelectItem>
                    <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                    <SelectItem value="WAITING_USER">WAITING_USER</SelectItem>
                    <SelectItem value="RESOLVED">RESOLVED</SelectItem>
                    <SelectItem value="CLOSED">CLOSED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">LOW</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                    <SelectItem value="HIGH">HIGH</SelectItem>
                    <SelectItem value="URGENT">URGENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(ticket.messages || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages.</p>
              ) : (
                (ticket.messages || []).map((m: any) => (
                  <div key={m.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {m.user?.username || "User"} {m.isStaffReply ? "(Staff)" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="text-sm whitespace-pre-wrap mt-2">{m.message}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

