"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flag, Eye, Check, X, AlertTriangle } from "lucide-react";
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

const reports = [
  {
    id: 1,
    type: "hacker",
    reporter: "ProGamer123",
    reported: "SuspiciousPlayer",
    uid: "1234567890",
    scrim: "Solo Classic - Evening Battle",
    reason: "Using aimbot and wallhack",
    evidence: "Screenshot attached",
    status: "open",
    createdAt: "2026-02-10 14:30",
  },
  {
    id: 2,
    type: "emulator",
    reporter: "CaptainX",
    reported: "EmulatorUser",
    uid: "9876543210",
    scrim: "Squad Championship",
    reason: "Playing on emulator",
    evidence: "Video link provided",
    status: "reviewing",
    createdAt: "2026-02-10 15:45",
  },
];

export default function AdminReportsPage() {
  const [viewDialog, setViewDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionNote, setActionNote] = useState("");

  const handleAction = (action: string) => {
    console.log("Taking action:", action, "Note:", actionNote);
    setActionDialog(false);
    setActionNote("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-700";
      case "reviewing":
        return "bg-blue-100 text-blue-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "hacker":
        return "bg-red-100 text-red-700";
      case "emulator":
        return "bg-orange-100 text-orange-700";
      case "glitch":
        return "bg-purple-100 text-purple-700";
      case "slot_cheating":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reports & Disputes</h1>
        <p className="text-muted-foreground">Review and resolve player reports</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Open</div>
            <div className="text-2xl font-bold mt-1">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Reviewing</div>
            <div className="text-2xl font-bold mt-1">8</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Resolved</div>
            <div className="text-2xl font-bold mt-1">145</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Rejected</div>
            <div className="text-2xl font-bold mt-1">23</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open (12)</TabsTrigger>
          <TabsTrigger value="reviewing">Reviewing (8)</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <Flag className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getTypeColor(report.type)}>{report.type}</Badge>
                          <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                        </div>
                        <h3 className="font-semibold">
                          {report.reporter} reported {report.reported}
                        </h3>
                        <p className="text-sm text-muted-foreground">UID: {report.uid}</p>
                        <p className="text-sm text-muted-foreground">{report.scrim}</p>
                        <p className="text-sm mt-2">{report.reason}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline">{report.evidence}</Badge>
                          <span className="text-xs text-muted-foreground">{report.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setViewDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    {report.status !== "resolved" && report.status !== "rejected" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setActionDialog(true);
                        }}
                      >
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* View Report Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              {selectedReport?.type} • {selectedReport?.status}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Reporter</Label>
                <p className="text-sm font-medium mt-1">{selectedReport?.reporter}</p>
              </div>
              <div>
                <Label>Reported Player</Label>
                <p className="text-sm font-medium mt-1">{selectedReport?.reported}</p>
              </div>
              <div>
                <Label>UID</Label>
                <p className="text-sm font-medium mt-1">{selectedReport?.uid}</p>
              </div>
              <div>
                <Label>Scrim</Label>
                <p className="text-sm font-medium mt-1">{selectedReport?.scrim}</p>
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <p className="text-sm mt-1">{selectedReport?.reason}</p>
            </div>
            <div>
              <Label>Evidence</Label>
              <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center min-h-[200px] mt-2">
                <p className="text-muted-foreground">Evidence preview</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Action</DialogTitle>
            <DialogDescription>
              Decide on the action for this report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="actionNote">Action Note</Label>
              <Textarea
                id="actionNote"
                placeholder="Add notes about your decision..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setActionDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleAction("ban")} className="w-full sm:w-auto">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Ban Player
            </Button>
            <Button variant="secondary" onClick={() => handleAction("warn")} className="w-full sm:w-auto">
              Issue Warning
            </Button>
            <Button onClick={() => handleAction("reject")} className="w-full sm:w-auto">
              <X className="w-4 h-4 mr-2" />
              Reject Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
