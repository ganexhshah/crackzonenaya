"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Users, Trophy, Eye, Timer, AlertCircle } from "lucide-react";
import { useMyMatches } from "@/hooks/useMatches";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { customRoomService, CustomRoom } from "@/services/custom-room.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CustomRoomDetailsDialog } from "@/components/custom-rooms/custom-room-details-dialog";
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

export default function MatchesPage() {
  const { matches, loading, error } = useMyMatches();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [openRoomsLoading, setOpenRoomsLoading] = useState(true);
  const [openRooms, setOpenRooms] = useState<CustomRoom[]>([]);
  const [joinRoomTarget, setJoinRoomTarget] = useState<CustomRoom | null>(null);
  const [joinedRoomIds, setJoinedRoomIds] = useState<Set<string>>(new Set());
  const [myRoomsLoading, setMyRoomsLoading] = useState(true);
  const [myRooms, setMyRooms] = useState<CustomRoom[]>([]);

  const categorizedMatches = useMemo(() => {
    const now = new Date();
    
    return {
      upcoming: matches.filter(m => m.status === 'SCHEDULED' && new Date(m.scheduledAt) > now),
      live: matches.filter(m => m.status === 'LIVE'),
      completed: matches.filter(m => m.status === 'COMPLETED'),
    };
  }, [matches]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setOpenRoomsLoading(true);
        const rooms = await customRoomService.listOpenRooms();
        setOpenRooms(Array.isArray(rooms) ? rooms : []);
      } catch (e: any) {
        setOpenRooms([]);
      } finally {
        setOpenRoomsLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const loadMine = async () => {
      try {
        setMyRoomsLoading(true);
        const rooms = await customRoomService.listMyRooms();
        setMyRooms(Array.isArray(rooms) ? rooms : []);
      } catch (e: any) {
        setMyRooms([]);
      } finally {
        setMyRoomsLoading(false);
      }
    };
    void loadMine();
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">My Matches</h1>
        <p className="text-muted-foreground mt-1">
          Track your tournament matches and results
        </p>
      </div>

      {/* Open Custom Rooms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Open Custom Rooms</CardTitle>
          <CardDescription>Join rooms created by other players</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {openRoomsLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : openRooms.length === 0 ? (
            <div className="text-sm text-muted-foreground">No open rooms right now.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {openRooms.slice(0, 6).map((r) => (
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

      {/* My Custom Rooms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Custom Rooms</CardTitle>
          <CardDescription>Rooms you created or joined (manage start/result here)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {myRoomsLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : myRooms.length === 0 ? (
            <div className="text-sm text-muted-foreground">No custom rooms yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myRooms.slice(0, 6).map((r) => (
                <div key={r.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {r.type === "CUSTOM_ROOM" ? "Custom Room" : "Lone Wolf"} • {r.rounds} rounds
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Opponent: {r.opponent?.username || "Waiting..."} • Entry ₹{Number(r.entryFee || 0).toFixed(0)} • Payout ₹{Number(r.payout || 0).toFixed(0)}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">{r.teamSize}</Badge>
                        <Badge variant="outline">{r.status}</Badge>
                      </div>
                      {(r.roomId || r.roomPassword) && (
                        <div className="mt-2 rounded-md bg-muted p-2 text-xs">
                          {r.roomId && (
                            <div>
                              <span className="text-muted-foreground">Room ID:</span>{" "}
                              <span className="font-mono font-semibold">{r.roomId}</span>
                            </div>
                          )}
                          {r.roomPassword && (
                            <div>
                              <span className="text-muted-foreground">Password:</span>{" "}
                              <span className="font-mono font-semibold">{r.roomPassword}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <CustomRoomDetailsDialog
                        room={r}
                        trigger={<Button size="sm" variant="outline">Details</Button>}
                      />
                      <Button size="sm" onClick={() => router.push("/dashboard/custom-matches")}>
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!joinRoomTarget} onOpenChange={(o) => !o && setJoinRoomTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Join Room</AlertDialogTitle>
            <AlertDialogDescription>
              Joining will deduct the entry fee from your wallet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Wallet Balance</span>
              <span className="font-semibold">₹{Number(user?.balance || 0).toFixed(2)}</span>
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
                const bal = Number(user?.balance || 0);
                if (fee > 0 && bal < fee) {
                  toast.error("Insufficient balance. Please add money to your wallet.");
                  setJoinRoomTarget(null);
                  return;
                }
                try {
                  const targetId = joinRoomTarget.id;
                  await customRoomService.joinRoom(joinRoomTarget.id);
                  toast.success(`Joined room. ₹${fee.toFixed(2)} deducted from your wallet.`);
                  setJoinedRoomIds((prev) => new Set(prev).add(targetId));
                  setOpenRooms((prev) => prev.filter((x) => x.id !== targetId));
                  await refreshUser();
                  setJoinRoomTarget(null);
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

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="upcoming">
              Upcoming ({categorizedMatches.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="live">
              Live ({categorizedMatches.live.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({categorizedMatches.completed.length})
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Matches */}
          <TabsContent value="upcoming" className="space-y-4">
            {categorizedMatches.upcoming.length > 0 ? (
              categorizedMatches.upcoming.map((match) => (
                <Card key={match.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{match.title}</CardTitle>
                        <CardDescription>{match.matchType} • {match.team?.name || 'Team'}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {match.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(match.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatTime(match.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>vs {match.opponentName}</span>
                      </div>
                    </div>

                    {match.description && (
                      <p className="text-sm text-muted-foreground">{match.description}</p>
                    )}

                    <Button className="w-full" asChild>
                      <Link href={`/dashboard/matches/${match.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="font-medium text-muted-foreground">No upcoming matches</p>
                  <p className="text-sm text-muted-foreground mt-2">Register for tournaments to see matches here</p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/tournaments">Browse Tournaments</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Live Matches */}
          <TabsContent value="live" className="space-y-4">
            {categorizedMatches.live.length > 0 ? (
              categorizedMatches.live.map((match) => (
                <Card key={match.id} className="border-green-500 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {match.title}
                          <Badge variant="destructive" className="animate-pulse">
                            <Timer className="h-3 w-3 mr-1" />
                            LIVE
                          </Badge>
                        </CardTitle>
                        <CardDescription>{match.matchType} • {match.team?.name || 'Team'}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>vs {match.opponentName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <span>{match.team?.name || 'Team'}</span>
                      </div>
                    </div>

                    {match.roomId && (
                      <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg space-y-2">
                        <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                          Match is Live!
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-green-700 dark:text-green-300">Room ID:</span>
                            <p className="font-mono font-bold">{match.roomId}</p>
                          </div>
                          {match.roomPassword && (
                            <div>
                              <span className="text-green-700 dark:text-green-300">Password:</span>
                              <p className="font-mono font-bold">{match.roomPassword}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Button className="w-full" variant="default" asChild>
                      <Link href={`/dashboard/matches/${match.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Match Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Timer className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="font-medium text-muted-foreground">No live matches</p>
                  <p className="text-sm text-muted-foreground mt-2">Your active matches will appear here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Completed Matches */}
          <TabsContent value="completed" className="space-y-4">
            {categorizedMatches.completed.length > 0 ? (
              categorizedMatches.completed.map((match) => {
                const totalKills = match.players?.reduce((sum, p) => sum + p.kills, 0) || 0;
                const isWin = match.result?.toLowerCase().includes('win');
                
                return (
                  <Card key={match.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{match.title}</CardTitle>
                          <CardDescription>{match.matchType} • {match.team?.name || 'Team'}</CardDescription>
                        </div>
                        <Badge
                          variant={isWin ? "default" : "secondary"}
                          className={isWin ? "bg-green-600" : ""}
                        >
                          {match.result || 'Completed'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {match.score && (
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{match.score}</div>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        )}
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{totalKills}</div>
                          <p className="text-xs text-muted-foreground">Team Kills</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-sm font-medium">{formatDate(match.endedAt || match.scheduledAt)}</div>
                          <p className="text-xs text-muted-foreground">Date</p>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/dashboard/matches/${match.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Full Results
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="font-medium text-muted-foreground">No completed matches</p>
                  <p className="text-sm text-muted-foreground mt-2">Your match history will appear here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
