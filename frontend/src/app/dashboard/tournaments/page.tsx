"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Users, DollarSign, Clock, MapPin, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { scrimService, Scrim } from "@/services/scrim.service";
import { toast } from "sonner";
import { ReportDialog } from "@/components/report/report-dialog";
import { customRoomService, CustomRoom } from "@/services/custom-room.service";
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

const TOURNAMENTS_PAGE_CACHE_TTL_MS = 2 * 60 * 1000;
let tournamentsPageCache:
  | {
      timestamp: number;
      tournaments: Tournament[];
      scrims: Scrim[];
    }
  | null = null;

interface Tournament {
  id: string;
  name: string;
  type: string;
  format?: string;
  status: string;
  startDate: string;
  endDate: string;
  prizePool: number;
  entryFee: number;
  maxTeams: number;
  currentTeams?: number;
  map?: string;
  rules?: string;
  banner?: string;
}

export default function TournamentsPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRoomsLoading, setOpenRoomsLoading] = useState(true);
  const [openRooms, setOpenRooms] = useState<CustomRoom[]>([]);
  const [joinRoomTarget, setJoinRoomTarget] = useState<CustomRoom | null>(null);
  const [joinedRoomIds, setJoinedRoomIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const now = Date.now();
    const hasFreshCache = tournamentsPageCache && now - tournamentsPageCache.timestamp < TOURNAMENTS_PAGE_CACHE_TTL_MS;

    if (hasFreshCache) {
      setTournaments(tournamentsPageCache!.tournaments);
      setScrims(tournamentsPageCache!.scrims);
      setLoading(false);
      void fetchData({ silent: true });
      return;
    }

    void fetchData();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setOpenRoomsLoading(true);
        const rooms = await customRoomService.listOpenRooms();
        setOpenRooms(Array.isArray(rooms) ? rooms : []);
      } catch (e) {
        setOpenRooms([]);
      } finally {
        setOpenRoomsLoading(false);
      }
    };
    void load();
  }, []);

  const fetchData = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true);
      const [tournamentData, scrimData] = await Promise.all([
        api.get('/tournaments'),
        scrimService.getPublicScrims(),
      ]);

      const tournamentsData = Array.isArray(tournamentData) ? tournamentData : [];
      const validTournaments = tournamentsData.filter(
        (item: any) => item?.name && item?.startDate && typeof item?.maxTeams === "number"
      );

      setTournaments(validTournaments);
      const nextScrims = Array.isArray(scrimData) ? scrimData : [];
      setScrims(nextScrims);
      tournamentsPageCache = {
        timestamp: Date.now(),
        tournaments: validTournaments,
        scrims: nextScrims,
      };
    } catch (error: any) {
      console.error('Failed to fetch tournaments/scrims:', error);
      toast.error('Failed to load tournaments/scrims');
      setTournaments([]);
      setScrims([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Tournaments & Scrims</h1>
        <p className="text-muted-foreground mt-1">Browse and join public matches</p>
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-8" /></Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="tournaments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="scrims">Scrims</TabsTrigger>
          </TabsList>

          <TabsContent value="tournaments">
            {tournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournaments.map((tournament) => (
                  <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        <Badge>{tournament.status}</Badge>
                      </div>
                      <CardTitle className="mt-4 line-clamp-1">{tournament.name}</CardTitle>
                      <CardDescription>{tournament.type || tournament.format || "Tournament"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /><span>{formatDate(tournament.startDate)}</span></div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /><span>{formatTime(tournament.startDate)}</span></div>
                      {tournament.map && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /><span>{tournament.map}</span></div>}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /><span>{tournament.currentTeams || 0}/{tournament.maxTeams} Teams</span></div>
                      <div className="flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4 text-muted-foreground" /><span className="font-semibold">रु {tournament.prizePool} Prize Pool</span></div>
                      <div className="flex gap-2 mt-4">
                        <Button className="flex-1" asChild><Link href={`/dashboard/tournaments/${tournament.id}/register`}>Register Now</Link></Button>
                        <ReportDialog
                          trigger={
                            <Button variant="outline" size="icon">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            </Button>
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card><CardContent className="p-12 text-center"><p className="font-medium text-muted-foreground">No tournaments available</p></CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="scrims">
            {scrims.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scrims.map((scrim) => (
                  <Card key={scrim.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Trophy className="h-8 w-8 text-orange-500" />
                        <Badge>{scrim.status}</Badge>
                      </div>
                      <CardTitle className="mt-4 line-clamp-1">{scrim.title}</CardTitle>
                      <CardDescription>{scrim.scrimConfig?.basicInformation?.scrimType || "Scrim"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /><span>{formatDate(scrim.scheduledAt)}</span></div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /><span>{formatTime(scrim.scheduledAt)}</span></div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /><span>{scrim._count?.players || 0} joined</span></div>
                      <div className="flex gap-2 mt-4">
                        <Button className="flex-1" asChild><Link href="/dashboard/scrims">View Scrims</Link></Button>
                        <ReportDialog
                          trigger={
                            <Button variant="outline" size="icon">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            </Button>
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card><CardContent className="p-12 text-center"><p className="font-medium text-muted-foreground">No public scrims available</p></CardContent></Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
