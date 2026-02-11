"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Filter,
  Check,
  X,
  Eye,
  AlertCircle,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const registrations = [
  {
    id: 1,
    type: "solo",
    scrim: "Solo Classic - Evening Battle",
    player: "ProGamer123",
    ign: "PG_123",
    uid: "1234567890",
    phone: "+977 9812345678",
    registeredAt: "2026-02-10 14:30",
    status: "pending",
    paymentStatus: "verified",
  },
  {
    id: 2,
    type: "squad",
    scrim: "Squad Championship",
    team: "Team Alpha",
    captain: "CaptainX",
    members: 4,
    phone: "+977 9823456789",
    registeredAt: "2026-02-10 15:45",
    status: "approved",
    slot: 5,
    paymentStatus: "verified",
  },
  {
    id: 3,
    type: "solo",
    scrim: "Duo Showdown",
    player: "NoobMaster",
    ign: "NM_69",
    uid: "9876543210",
    phone: "+977 9834567890",
    registeredAt: "2026-02-10 16:20",
    status: "pending",
    paymentStatus: "pending",
  },
];

export default function AdminRegistrationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScrim, setFilterScrim] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedReg, setSelectedReg] = useState<number | null>(null);

  const handleApprove = (id: number) => {
    console.log("Approving registration:", id);
  };

  const handleReject = () => {
    console.log("Rejecting registration:", selectedReg, "Reason:", rejectReason);
    setRejectDialog(false);
    setRejectReason("");
    setSelectedReg(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "waitlist":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Registration Management</h1>
        <p className="text-muted-foreground">Approve or reject player registrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold mt-1">47</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Approved</div>
            <div className="text-2xl font-bold mt-1">234</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Rejected</div>
            <div className="text-2xl font-bold mt-1">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Waitlist</div>
            <div className="text-2xl font-bold mt-1">8</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by IGN, UID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterScrim} onValueChange={setFilterScrim}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Scrim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scrims</SelectItem>
                <SelectItem value="1">Solo Classic</SelectItem>
                <SelectItem value="2">Squad Championship</SelectItem>
                <SelectItem value="3">Duo Showdown</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="waitlist">Waitlist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Registrations List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending (47)</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {registrations.map((reg) => (
            <Card key={reg.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {reg.type === "squad" ? (
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-orange-600" />
                        </div>
                      ) : (
                        <Avatar className="w-12 h-12">
                          <AvatarImage src="/placeholder-avatar.jpg" />
                          <AvatarFallback className="bg-orange-100 text-orange-600">
                            {reg.ign?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {reg.type === "squad" ? reg.team : reg.player}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {reg.type === "squad"
                            ? `Captain: ${reg.captain} • ${reg.members} members`
                            : `${reg.ign} • ${reg.uid}`}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{reg.scrim}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className={getStatusColor(reg.status)}>{reg.status}</Badge>
                          <Badge
                            variant={reg.paymentStatus === "verified" ? "default" : "secondary"}
                          >
                            Payment: {reg.paymentStatus}
                          </Badge>
                          {reg.slot && <Badge variant="outline">Slot #{reg.slot}</Badge>}
                          <span className="text-xs text-muted-foreground">{reg.registeredAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {reg.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="default" onClick={() => handleApprove(reg.id)}>
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReg(reg.id);
                          setRejectDialog(true);
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this registration. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Duplicate UID, Invalid payment proof, etc."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
