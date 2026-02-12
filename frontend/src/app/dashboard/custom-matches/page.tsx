"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { customRoomService, CustomRoom } from "@/services/custom-room.service";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CustomRoomDetailsDialog } from "@/components/custom-rooms/custom-room-details-dialog";

export default function CustomMatchesPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [myRoomsLoading, setMyRoomsLoading] = useState(true);
  const [openRoomsLoading, setOpenRoomsLoading] = useState(true);
  const [myRooms, setMyRooms] = useState<CustomRoom[]>([]);
  const [openRooms, setOpenRooms] = useState<CustomRoom[]>([]);
  const [joinRoomTarget, setJoinRoomTarget] = useState<CustomRoom | null>(null);
  const [joinedRoomIds, setJoinedRoomIds] = useState<Set<string>>(new Set());

  const loadMy = async () => {
    try {
      setMyRoomsLoading(true);
      const data = await customRoomService.listMyRooms();
      setMyRooms(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMyRooms([]);
    } finally {
      setMyRoomsLoading(false);
    }
  };

  const loadOpen = async () => {
    try {
      setOpenRoomsLoading(true);
      const data = await customRoomService.listOpenRooms();
      setOpenRooms(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setOpenRooms([]);
    } finally {
      setOpenRoomsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadMy(), loadOpen()]);
  }, []);

  const balance = Number(user?.balance || 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Custom Matches</h1>
          <p className="text-muted-foreground mt-1">Join open rooms or manage your own.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">Back</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard#custom-match-rooms">Create Room</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="open" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="open">Open Rooms</TabsTrigger>
          <TabsTrigger value="mine">My Rooms</TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Open Custom Rooms</CardTitle>
              <CardDescription>Rooms waiting for an opponent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {openRoomsLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : openRooms.length === 0 ? (
                <div className="text-sm text-muted-foreground">No open rooms right now.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {openRooms.map((r) => (
                    <div key={r.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">
                            {r.type === "CUSTOM_ROOM" ? "Custom Room" : "Lone Wolf"} • {r.rounds} rounds
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            By {r.creator?.username || "Player"} • Entry ₹{Number(r.entryFee || 0).toFixed(0)} • Payout ₹{Number(r.payout || 0).toFixed(0)}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline">{r.teamSize}</Badge>
                            <Badge variant="outline">{r.status}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <CustomRoomDetailsDialog
                            room={r}
                            trigger={<Button size="sm" variant="outline">Details</Button>}
                          />
                          {joinedRoomIds.has(r.id) ? (
                            <Button size="sm" asChild>
                              <Link href="/dashboard/custom-matches">Manage</Link>
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => setJoinRoomTarget(r)}>
                              Join
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mine">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Rooms</CardTitle>
              <CardDescription>Rooms you created or joined</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {myRoomsLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : myRooms.length === 0 ? (
                <div className="text-sm text-muted-foreground">No rooms yet.</div>
              ) : (
                myRooms.map((r) => (
                  <div key={r.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {r.type === "CUSTOM_ROOM" ? "Custom Room" : "Lone Wolf"} • {r.teamSize} • {r.rounds} rounds
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Opponent: {r.opponent?.username || "Waiting..."} • Entry ₹{Number(r.entryFee || 0).toFixed(0)} • Payout ₹{Number(r.payout || 0).toFixed(0)}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">{r.status}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <CustomRoomDetailsDialog
                          room={r}
                          trigger={<Button size="sm" variant="outline">Details</Button>}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!joinRoomTarget} onOpenChange={(o) => !o && setJoinRoomTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Join Room</AlertDialogTitle>
            <AlertDialogDescription>Joining will deduct the entry fee from your wallet.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Wallet Balance</span>
              <span className="font-semibold">₹{balance.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-muted-foreground">Entry Fee</span>
              <span className="font-semibold text-destructive">-₹{Number(joinRoomTarget?.entryFee || 0).toFixed(2)}</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!joinRoomTarget) return;
                const fee = Number(joinRoomTarget.entryFee || 0);
                if (fee > 0 && balance < fee) {
                  toast.error("Insufficient balance. Please add money to your wallet.");
                  setJoinRoomTarget(null);
                  return;
                }
                try {
                  const targetId = joinRoomTarget.id;
                  await customRoomService.joinRoom(joinRoomTarget.id);
                  toast.success(`Joined room. ₹${fee.toFixed(2)} deducted from your wallet.`);
                  setJoinRoomTarget(null);
                  setJoinedRoomIds((prev) => new Set(prev).add(targetId));
                  setOpenRooms((prev) => prev.filter((x) => x.id !== targetId));
                  await refreshUser();
                  void Promise.all([loadMy(), loadOpen()]);
                  router.push("/dashboard/custom-matches");
                } catch (e: any) {
                  toast.error(e?.message || "Failed to join");
                }
              }}
            >
              Confirm & Join
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
