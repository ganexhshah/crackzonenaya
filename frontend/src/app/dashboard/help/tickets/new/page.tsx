"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supportService, TicketCategory, TicketPriority } from "@/services/support.service";
import { toast } from "sonner";

const categories: { value: TicketCategory; label: string }[] = [
  { value: "PAYMENT", label: "Wallet & Payments" },
  { value: "MATCH_ISSUE", label: "Match Issue" },
  { value: "BAN_APPEAL", label: "Appeal / Ban" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "ACCOUNT", label: "Account" },
  { value: "REFUND", label: "Refund" },
  { value: "REPORT", label: "Report Player/Team" },
  { value: "OTHER", label: "Other" },
];

const priorities: { value: TicketPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export default function NewTicketPage() {
  const router = useRouter();
  const [category, setCategory] = useState<TicketCategory>("PAYMENT");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => subject.trim().length >= 3 && description.trim().length >= 10, [subject, description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Please add a valid subject and description.");
      return;
    }
    try {
      setSubmitting(true);
      const ticket = await supportService.createTicket({
        category,
        priority,
        subject: subject.trim(),
        description: description.trim(),
        attachments: files.slice(0, 5),
      });
      toast.success("Ticket submitted");
      router.push(`/dashboard/help/tickets/${ticket.id}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Submit a Ticket</h1>
          <p className="text-muted-foreground mt-1">Describe your issue and attach screenshots if needed.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/help/tickets">My Tickets</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ticket Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what happened, include match/tournament IDs, payment reference, etc."
                className="min-h-32"
              />
              <p className="text-xs text-muted-foreground">Minimum 10 characters.</p>
            </div>

            <div className="space-y-2">
              <Label>Attachments (max 5)</Label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
              {files.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selected: {files.slice(0, 5).map((f) => f.name).join(", ")}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!canSubmit || submitting}>
                {submitting ? "Submitting..." : "Submit Ticket"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/help">Help Center</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

