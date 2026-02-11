"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Play, Trophy, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scrimService, Scrim } from "@/services/scrim.service";
import { toast } from "sonner";

export default function ScrimManagePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [scrim, setScrim] = useState<Scrim | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");

  const maxSlots = useMemo(() => {
    const config = scrim?.scrimConfig;
    if (!config) return 0;
    return config.basicInformation.scrimType === "SQUAD"
      ? config.slotConfiguration.totalTeamSlots || 0
      : config.slotConfiguration.totalSlots || 0;
  }, [scrim]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await scrimService.getScrim(id);
        setScrim(data);
        setRoomId(data.roomId || "");
        setRoomPassword(data.roomPassword || "");
      } catch (error: any) {
        toast.error(error?.message || "Failed to load scrim");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleStatus = async (status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED") => {
    if (!id) return;
    try {
      const updated = await scrimService.updateScrim(id, { status });
      setScrim(updated);
      toast.success(`Status changed to ${status}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    }
  };

  const handleRoomRelease = async () => {
    if (!id || !roomId) {
      toast.error("Room ID is required");
      return;
    }
    try {
      const updated = await scrimService.updateRoomDetails(id, roomId, roomPassword || undefined);
      setScrim(updated);
      toast.success("Room details updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update room");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!scrim) return <div className="p-6">Scrim not found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/scrims">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Manage Scrim</h1>
          <p className="text-muted-foreground">{scrim.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Registrations & Slots</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Joined: {scrim._count?.players || 0}</span>
              <span>/</span>
              <span>Max: {maxSlots || "-"}</span>
            </div>
            <div className="rounded border p-3 text-sm">
              Joined users are shown below. Use this page to manage slots and room access before match start.
            </div>
            <div className="space-y-2">
              {(scrim.players || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No users joined yet.</p>
              ) : (
                (scrim.players || []).map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between rounded border p-2">
                    <span>{index + 1}. {player.user.username}</span>
                    <Badge variant="outline">Slot {index + 1}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Match Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Badge>{scrim.status}</Badge>
              <Button className="w-full" variant="outline" onClick={() => handleStatus("SCHEDULED")}>Set Scheduled</Button>
              <Button className="w-full" onClick={() => handleStatus("LIVE")}><Play className="w-4 h-4 mr-2" />Start Live</Button>
              <Button className="w-full" variant="secondary" onClick={() => handleStatus("COMPLETED")}>Mark Completed</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Room Release</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Room ID</Label><Input value={roomId} onChange={(e) => setRoomId(e.target.value)} /></div>
              <div><Label>Room Password</Label><Input value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} /></div>
              <Button className="w-full" onClick={handleRoomRelease}>
                <KeyRound className="w-4 h-4 mr-2" />
                Save Room Details
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Next Step</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline" onClick={() => router.push(`/admin/scrims/${id}/room`)}>Open Room Page</Button>
              <Button className="w-full" onClick={() => router.push(`/admin/scrims/${id}/results`)}>
                <Trophy className="w-4 h-4 mr-2" />
                Go To Results & Prize
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
