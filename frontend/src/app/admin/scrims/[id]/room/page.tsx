"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Eye, EyeOff, Copy, Check } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

export default function RoomPublishPage({ params }: { params: { id: string } }) {
  const [roomData, setRoomData] = useState({
    roomId: "",
    password: "",
    releaseTime: "",
    visibleToApproved: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [published, setPublished] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePublish = () => {
    console.log("Publishing room:", roomData);
    setPublished(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/scrims">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Publish Room ID & Password</h1>
          <p className="text-muted-foreground">Solo Classic - Evening Battle</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Details Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="roomId">Room ID *</Label>
                <div className="flex gap-2">
                  <Input
                    id="roomId"
                    placeholder="Enter room ID"
                    value={roomData.roomId}
                    onChange={(e) => setRoomData({ ...roomData, roomId: e.target.value })}
                  />
                  {published && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(roomData.roomId)}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={roomData.password}
                      onChange={(e) => setRoomData({ ...roomData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {published && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(roomData.password)}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="releaseTime">Release Time</Label>
                <Input
                  id="releaseTime"
                  type="datetime-local"
                  value={roomData.releaseTime}
                  onChange={(e) => setRoomData({ ...roomData, releaseTime: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Room details will be visible to players at this time (e.g., 10 minutes before match)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visibleToApproved"
                  checked={roomData.visibleToApproved}
                  onCheckedChange={(checked) =>
                    setRoomData({ ...roomData, visibleToApproved: checked as boolean })
                  }
                />
                <label htmlFor="visibleToApproved" className="text-sm font-medium">
                  Visible to approved players only
                </label>
              </div>

              <div className="pt-4">
                {!published ? (
                  <Button className="w-full" onClick={handlePublish}>
                    <Upload className="w-4 h-4 mr-2" />
                    Publish Room Details
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Room details published successfully!</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Players can now see the room ID and password.
                      </p>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => setPublished(false)}>
                      Update Room Details
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Scrim Info */}
          <Card>
            <CardHeader>
              <CardTitle>Scrim Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">Solo</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium">Feb 15, 2026 • 6:00 PM</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Map</p>
                <p className="font-medium">Bermuda</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Slots</p>
                <p className="font-medium">45/48</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="bg-green-100 text-green-700">Published</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Registration Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-medium">45</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Approved</span>
                <span className="font-medium text-green-600">42</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="font-medium text-yellow-600">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rejected</span>
                <span className="font-medium text-red-600">0</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
