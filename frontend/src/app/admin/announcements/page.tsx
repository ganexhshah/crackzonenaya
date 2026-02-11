"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Edit, Trash2, Megaphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const announcements = [
  {
    id: 1,
    title: "New Tournament Starting Soon!",
    message: "Join our biggest tournament of the month. Prize pool: रु 50,000!",
    target: "all",
    createdAt: "2026-02-10 14:30",
    status: "active",
  },
  {
    id: 2,
    title: "Server Maintenance",
    message: "Scheduled maintenance on Feb 15, 2026 from 2:00 AM to 4:00 AM.",
    target: "all",
    createdAt: "2026-02-09 10:00",
    status: "active",
  },
];

export default function AdminAnnouncementsPage() {
  const [createDialog, setCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target: "all",
  });

  const handleSend = () => {
    console.log("Sending announcement:", formData);
    setCreateDialog(false);
    setFormData({ title: "", message: "", target: "all" });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Send notifications to users</p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-lg">{announcement.title}</h3>
                    <Badge className="bg-green-100 text-green-700">{announcement.status}</Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">{announcement.message}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline">Target: {announcement.target}</Badge>
                    <span className="text-muted-foreground">{announcement.createdAt}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Announcement Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Announcement</DialogTitle>
            <DialogDescription>
              Create and send a notification to users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., New Tournament Starting Soon!"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Enter your announcement message..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Send To *</Label>
              <Select value={formData.target} onValueChange={(value) => setFormData({ ...formData, target: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="registered">Registered Players Only</SelectItem>
                  <SelectItem value="approved">Approved Players Only</SelectItem>
                  <SelectItem value="teams">Team Captains Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend}>
              <Send className="w-4 h-4 mr-2" />
              Send Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
