"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Trophy, Calendar, Users, DollarSign, Clock, Filter, User, UserPlus, Info, MapPin, AlertCircle, Crown, Shield, Wallet, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { customRoomService, CustomRoom, CustomRoomTeamSize, CustomRoomType } from "@/services/custom-room.service";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const DASHBOARD_CACHE_TTL_MS = 2 * 60 * 1000;
let dashboardCache:
  | {
      timestamp: number;
      tournaments: any[];
      scrims: any[];
      userTeams: any[];
      stats: {
        activeTournaments: number;
        playersOnline: number;
        activeTeams: number;
        totalPrizes: number;
      };
      customRooms: CustomRoom[];
    }
  | null = null;

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [scrims, setScrims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrimsLoading, setScrimsLoading] = useState(true);
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [customRooms, setCustomRooms] = useState<CustomRoom[]>([]);
  const [customRoomsLoading, setCustomRoomsLoading] = useState(true);

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomType, setRoomType] = useState<CustomRoomType>("CUSTOM_ROOM");
  const [teamSize, setTeamSize] = useState<CustomRoomTeamSize>("ONE_V_ONE");
  const [rounds, setRounds] = useState<number>(13);
  const [throwableLimit, setThrowableLimit] = useState(false);
  const [characterSkill, setCharacterSkill] = useState(false);
  const [headshotOnly, setHeadshotOnly] = useState(false);
  const [gunAttributes, setGunAttributes] = useState(false);
  const [coinSetting, setCoinSetting] = useState<number>(0);
  const [roomMaker, setRoomMaker] = useState<"ME" | "OPPONENT">("ME");
  const [entryFee, setEntryFee] = useState<number>(0);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [stats, setStats] = useState({
    activeTournaments: 0,
    playersOnline: 0,
    activeTeams: 0,
    totalPrizes: 0,
  });

  const currentBalance = Number(user?.balance || 0);
  const willDeduct = Number(entryFee || 0);
  const hasEnoughForCreate = willDeduct <= 0 || currentBalance >= willDeduct;

  const createRoomNow = async () => {
    try {
      setCreatingRoom(true);
      const created = await customRoomService.createRoom({
        type: roomType,
        teamSize,
        rounds,
        throwableLimit,
        characterSkill,
        headshotOnly,
        gunAttributes,
        coinSetting,
        roomMaker,
        entryFee,
      });
      toast.success("Room created");
      setShowCreateRoom(false);
      setShowCreateConfirm(false);
      setCustomRooms((prev) => [created, ...prev].slice(0, 5));
    } catch (e: any) {
      toast.error(e?.message || "Failed to create room");
    } finally {
      setCreatingRoom(false);
    }
  };

  useEffect(() => {
    const now = Date.now();
    const hasFreshCache = dashboardCache && now - dashboardCache.timestamp < DASHBOARD_CACHE_TTL_MS;

    if (hasFreshCache) {
      setTournaments(dashboardCache!.tournaments);
      setScrims(dashboardCache!.scrims);
      setUserTeams(dashboardCache!.userTeams);
      setStats(dashboardCache!.stats);
      setCustomRooms(dashboardCache!.customRooms || []);
      setLoading(false);
      setScrimsLoading(false);
      setTeamsLoading(false);
      setCustomRoomsLoading(false);

      void Promise.all([
        fetchTournaments({ silent: true }),
        fetchScrims({ silent: true }),
        fetchUserTeams({ silent: true }),
        fetchCustomRooms({ silent: true }),
      ]);
      return;
    }

    void Promise.all([fetchTournaments(), fetchScrims(), fetchUserTeams(), fetchCustomRooms()]);
  }, []);

  const setDashboardCache = (patch: Partial<NonNullable<typeof dashboardCache>>) => {
    const previous = dashboardCache;
    dashboardCache = {
      timestamp: Date.now(),
      tournaments: patch.tournaments ?? previous?.tournaments ?? [],
      scrims: patch.scrims ?? previous?.scrims ?? [],
      userTeams: patch.userTeams ?? previous?.userTeams ?? [],
      customRooms: patch.customRooms ?? previous?.customRooms ?? [],
      stats:
        patch.stats ??
        previous?.stats ?? {
          activeTournaments: 0,
          playersOnline: 0,
          activeTeams: 0,
          totalPrizes: 0,
        },
    };
  };

  const fetchCustomRooms = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setCustomRoomsLoading(true);
      const data = await customRoomService.listMyRooms();
      const rooms = Array.isArray(data) ? data.slice(0, 5) : [];
      setCustomRooms(rooms);
      setDashboardCache({ customRooms: rooms });
    } catch (e) {
      setCustomRooms([]);
    } finally {
      setCustomRoomsLoading(false);
    }
  };

  const fetchScrims = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setScrimsLoading(true);
      const data: any = await api.get('/scrims/public');
      const scrimsData = Array.isArray(data) ? data.slice(0, 3) : []; // Show only 3 scrims
      setScrims(scrimsData);
      setDashboardCache({ scrims: scrimsData });
    } catch (error: any) {
      console.error('Failed to fetch scrims:', error);
      setScrims([]);
    } finally {
      setScrimsLoading(false);
    }
  };

  const fetchUserTeams = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setTeamsLoading(true);
      const data: any = await api.get('/teams/my-teams');
      const teamsData = Array.isArray(data) ? data : [];
      setUserTeams(teamsData);
      setDashboardCache({ userTeams: teamsData });
    } catch (error: any) {
      console.error('Failed to fetch teams:', error);
      setUserTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchTournaments = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true);
      const data: any = await api.get('/tournaments');
      const tournamentsData = Array.isArray(data) ? data : [];
      const nextStats = {
        activeTournaments: tournamentsData.length || 0,
        playersOnline: 1200, // Mock data
        activeTeams: 156, // Mock data
        totalPrizes: 50000, // Mock data
      };
      setTournaments(tournamentsData);
      setStats(nextStats);
      setDashboardCache({ tournaments: tournamentsData, stats: nextStats });
    } catch (error: any) {
      console.error('Failed to fetch tournaments:', error);
      toast.error('Failed to load tournaments');
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter tournaments based on selected filters
  const filteredTournaments = tournaments.filter((tournament) => {
    const tournamentType = (tournament.type || tournament.format || "").toLowerCase();
    const typeMatch = filterType === "all" || tournamentType.includes(filterType.toLowerCase());
    const statusMatch = filterStatus === "all" || tournament.status === filterStatus;
    
    return typeMatch && statusMatch;
  });

  const clearFilters = () => {
    setFilterType("all");
    setFilterStatus("all");
  };

  const activeFiltersCount = [filterType, filterStatus].filter(f => f !== "all").length;

  const handleRegister = (tournament: any) => {
    setSelectedTournament(tournament);
    setShowRegisterDialog(true);
    setAcceptedRules(false);
  };

  const confirmRegistration = () => {
    if (!acceptedRules) {
      toast.error("Please accept the tournament rules");
      return;
    }

    const userBalance = user?.balance || 0;
    if (userBalance < selectedTournament.entryFee) {
      toast.error("Insufficient balance! Please add money to your wallet.");
      return;
    }

    // Proceed to registration page
    router.push(`/dashboard/tournaments/${selectedTournament.id}/register`);
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
      {/* Greeting Section */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Hi, {user?.username || "Player"}! 👋</h1>
        <p className="text-muted-foreground mt-1">
          Ready to dominate the battlefield today?
        </p>
      </div>

      {/* Quick Access Carousel - Teams & Wallet */}
      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {/* Wallet Balance Banner Card */}
            <CarouselItem className="pl-2 md:pl-4 basis-[92%] sm:basis-1/2 lg:basis-1/3">
              <Card className="h-[220px] border-2 border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/30">
                <CardContent className="p-5 sm:p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-2">
                      <Wallet className="h-5 w-5" />
                      <p className="text-sm font-semibold">Wallet Balance</p>
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-emerald-700 dark:text-emerald-300">
                      रु {(user?.balance || 0).toFixed(2)}
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-800/80 dark:text-emerald-200/80 mt-1">
                      Add or withdraw funds instantly
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild className="w-full">
                      <Link href="/dashboard/wallet">
                        Add Money
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full bg-background/70">
                      <Link href="/dashboard/wallet">
                        Withdraw
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
            {/* User Teams Cards */}
            {teamsLoading ? (
              <>
                {[1, 2].map((i) => (
                  <CarouselItem key={i} className="pl-2 md:pl-4 basis-[92%] sm:basis-1/2 lg:basis-1/3">
                    <Card className="animate-pulse h-[220px]">
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-14 w-14 bg-muted rounded-full shrink-0" />
                          <div className="flex-1">
                            <div className="h-5 w-3/4 bg-muted rounded mb-2" />
                            <div className="h-4 w-1/2 bg-muted rounded" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-6">
                          <div className="h-12 bg-muted rounded" />
                          <div className="h-12 bg-muted rounded" />
                          <div className="h-12 bg-muted rounded" />
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </>
            ) : userTeams.length > 0 ? (
              userTeams.map((team) => {
                const isOwner = team.ownerId === user?.id;
                const memberCount = team.members?.length || 0;
                
                return (
                  <CarouselItem key={team.id} className="pl-2 md:pl-4 basis-[92%] sm:basis-1/2 lg:basis-1/3">
                    <Link href={`/dashboard/teams/${team.id}`}>
                      <Card className="hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer h-[220px] border-2 hover:border-primary/50">
                        <CardContent className="p-5 sm:p-6 h-full flex flex-col justify-between">
                          <div>
                            <div className="flex items-start gap-3 mb-4">
                              <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-primary shrink-0 shadow-lg">
                                <AvatarImage src={team.logo} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-base sm:text-lg">
                                  {team.tag}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-base sm:text-lg truncate">{team.name}</h3>
                                  {isOwner && <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 shrink-0" />}
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Tag: {team.tag}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant={isOwner ? "default" : "secondary"} className="text-xs">
                                    {isOwner ? "Leader" : "Member"}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 sm:p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                              <div className="font-bold text-base sm:text-lg text-blue-600 dark:text-blue-400">{team.stats?.matches || 0}</div>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Matches</p>
                            </div>
                            <div className="p-2 sm:p-2.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
                              <div className="font-bold text-base sm:text-lg text-green-600 dark:text-green-400">{team.stats?.wins || 0}</div>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Wins</p>
                            </div>
                            <div className="p-2 sm:p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                              <div className="font-bold text-base sm:text-lg text-purple-600 dark:text-purple-400">{team.stats?.points || 0}</div>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Points</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </CarouselItem>
                );
              })
            ) : (
              <CarouselItem className="pl-2 md:pl-4 basis-[92%] sm:basis-1/2 lg:basis-1/3">
                <Card className="border-2 border-dashed hover:border-solid hover:border-primary transition-all h-[220px]">
                  <CardContent className="p-5 sm:p-6 h-full flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-muted rounded-full mb-3">
                      <Users className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                    </div>
                    <p className="font-semibold text-sm sm:text-base mb-1">No Teams Yet</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">Create or join a team to get started</p>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none">
                        <Link href="/dashboard/teams/create">
                          <UserPlus className="mr-1 h-3 w-3" />
                          Create
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="flex-1 sm:flex-none">
                        <Link href="/dashboard/teams">
                          <Shield className="mr-1 h-3 w-3" />
                          Browse
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            )}

            {/* Game Profile Card */}
            <CarouselItem className="pl-2 md:pl-4 basis-[92%] sm:basis-1/2 lg:basis-1/3">
              <Card className="h-[220px] border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-5 sm:p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Gamepad2 className="h-5 w-5" />
                      <p className="text-sm font-semibold">Game Profile</p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Game Name</p>
                        <p className="font-bold text-lg truncate">{user?.gameName || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Game ID</p>
                        <p className="font-mono text-sm break-all">{user?.gameId || "Not set"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link href={user?.id ? `/dashboard/profile/${user.id}` : "/profile/setup"}>
                        View Profile
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/dashboard/settings">Edit</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>

          </CarouselContent>
          <CarouselPrevious className="hidden lg:flex -left-4" />
          <CarouselNext className="hidden lg:flex -right-4" />
        </Carousel>
      </div>

      {/* Create Custom Match Room */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Custom Match Rooms</h2>
          <p className="text-sm text-muted-foreground">Create a room, set rules, stake entry fee, and play</p>
        </div>
        <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
          <DialogTrigger asChild>
            <Button>
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Your Own Match Room</DialogTitle>
              <DialogDescription>Choose room type, rules, and entry fee.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Room Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={roomType === "CUSTOM_ROOM" ? "default" : "outline"}
                    className="w-full justify-center"
                    onClick={() => setRoomType("CUSTOM_ROOM")}
                  >
                    Custom Room
                  </Button>
                  <Button
                    type="button"
                    variant={roomType === "LONE_WOLF" ? "default" : "outline"}
                    className="w-full justify-center"
                    onClick={() => setRoomType("LONE_WOLF")}
                  >
                    Lone Wolf
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Team Size</Label>
                <div className={cn("grid gap-2", roomType === "CUSTOM_ROOM" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2")}>
                  <Button
                    type="button"
                    variant={teamSize === "ONE_V_ONE" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setTeamSize("ONE_V_ONE")}
                  >
                    1v1
                  </Button>
                  <Button
                    type="button"
                    variant={teamSize === "TWO_V_TWO" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setTeamSize("TWO_V_TWO")}
                  >
                    2v2
                  </Button>
                  {roomType === "CUSTOM_ROOM" && (
                    <Button
                      type="button"
                      variant={teamSize === "THREE_V_THREE" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setTeamSize("THREE_V_THREE")}
                    >
                      3v3
                    </Button>
                  )}
                  {roomType === "CUSTOM_ROOM" && (
                    <Button
                      type="button"
                      variant={teamSize === "FOUR_V_FOUR" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setTeamSize("FOUR_V_FOUR")}
                    >
                      4v4
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rounds</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(roomType === "CUSTOM_ROOM" ? [7, 13] : [9, 13]).map((r) => (
                    <Button
                      key={r}
                      type="button"
                      variant={rounds === r ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setRounds(r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Coin Setting</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={coinSetting === 0 ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setCoinSetting(0)}
                  >
                    Default Coin
                  </Button>
                  <Button
                    type="button"
                    variant={coinSetting === 9950 ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setCoinSetting(9950)}
                  >
                    9950
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">Throwable Limit</p>
                  <p className="text-xs text-muted-foreground">Enable throwable limit</p>
                </div>
                <Switch checked={throwableLimit} onCheckedChange={setThrowableLimit} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">Character Skill</p>
                  <p className="text-xs text-muted-foreground">Allow character skills</p>
                </div>
                <Switch checked={characterSkill} onCheckedChange={setCharacterSkill} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">Headshot Mode</p>
                  <p className="text-xs text-muted-foreground">Headshot only</p>
                </div>
                <Switch checked={headshotOnly} onCheckedChange={setHeadshotOnly} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">Gun Attributes</p>
                  <p className="text-xs text-muted-foreground">Enable gun attributes</p>
                </div>
                <Switch checked={gunAttributes} onCheckedChange={setGunAttributes} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Room Maker</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={roomMaker === "ME" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setRoomMaker("ME")}
                  >
                    Me
                  </Button>
                  <Button
                    type="button"
                    variant={roomMaker === "OPPONENT" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setRoomMaker("OPPONENT")}
                  >
                    Opponent
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Entry Fee (INR)</Label>
                <Input
                  type="number"
                  min={0}
                  value={entryFee}
                  onChange={(e) => setEntryFee(Number(e.target.value || 0))}
                />
                <p className="text-xs text-muted-foreground">
                  Winner payout: ₹{(Number(entryFee || 0) * 1.8).toFixed(2)} (1.8 odds)
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={() => {
                  if (!hasEnoughForCreate) {
                    toast.error("Insufficient balance. Please add money to your wallet.");
                    return;
                  }
                  if (willDeduct > 0) {
                    setShowCreateConfirm(true);
                    return;
                  }
                  void createRoomNow();
                }}
                disabled={creatingRoom}
                className="flex-1"
              >
                {creatingRoom ? "Creating..." : "Create Room"}
              </Button>
              {!hasEnoughForCreate && (
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/dashboard/wallet">Add Money</Link>
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowCreateRoom(false)} className="flex-1">
                Cancel
              </Button>
            </div>

            <AlertDialog open={showCreateConfirm} onOpenChange={setShowCreateConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Entry Fee Deduction</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will deduct ₹{willDeduct.toFixed(2)} from your wallet to create the room.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Wallet Balance</span>
                    <span className="font-semibold">₹{currentBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-muted-foreground">Deduction</span>
                    <span className="font-semibold text-destructive">-₹{willDeduct.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-muted-foreground">Balance After</span>
                    <span className="font-semibold">₹{(currentBalance - willDeduct).toFixed(2)}</span>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void createRoomNow()}>
                    Confirm & Create
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Custom Rooms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Custom Rooms</CardTitle>
          <CardDescription>Manage rooms you created or joined</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {customRoomsLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : customRooms.length === 0 ? (
            <div className="text-sm text-muted-foreground">No rooms yet. Create one to start.</div>
          ) : (
            customRooms.map((r) => {
              const youAreCreator = r.creatorId === user?.id;
              const opponentName = r.opponent?.username || "Waiting...";
              const joinable = r.status === "WAITING_JOIN" && !r.opponentId && youAreCreator;
              return (
                <div key={r.id} className="rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold truncate">
                          {r.type === "CUSTOM_ROOM" ? "Custom Room" : "Lone Wolf"} •{" "}
                          {r.teamSize.replaceAll("_", " ").replace("ONE V ONE", "1v1").replace("TWO V TWO", "2v2").replace("THREE V THREE", "3v3").replace("FOUR V FOUR", "4v4")} •{" "}
                          {r.rounds} rounds
                        </p>
                        <Badge variant="outline">{r.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                        <div className="rounded-md bg-muted p-2">
                          <div className="text-muted-foreground">Opponent</div>
                          <div className="font-semibold truncate">{opponentName}</div>
                        </div>
                        <div className="rounded-md bg-muted p-2">
                          <div className="text-muted-foreground">Entry</div>
                          <div className="font-semibold">₹{Number(r.entryFee || 0).toFixed(0)}</div>
                        </div>
                        <div className="rounded-md bg-muted p-2">
                          <div className="text-muted-foreground">Payout</div>
                          <div className="font-semibold text-emerald-600">₹{Number(r.payout || 0).toFixed(0)}</div>
                        </div>
                        <div className="rounded-md bg-muted p-2">
                          <div className="text-muted-foreground">Room Maker</div>
                          <div className="font-semibold">{r.roomMaker}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {joinable && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const link = `${window.location.origin}/dashboard/matches?room=${encodeURIComponent(r.id)}`;
                            try {
                              await navigator.clipboard.writeText(link);
                              toast.success("Join link copied");
                            } catch {
                              toast.success("Link ready: " + link);
                            }
                          }}
                        >
                          Copy Join Link
                        </Button>
                      )}
                      {r.opponentId && r.status === "READY_TO_START" && (
                        <Button size="sm" variant="outline" onClick={async () => {
                          try { await customRoomService.ready(r.id); toast.success("Ready clicked"); void fetchCustomRooms({silent:true}); } catch(e:any){ toast.error(e?.message||"Failed");}
                        }}>
                          I’m Ready
                        </Button>
                      )}
                      {r.status === "STARTED" && (
                        <Button size="sm" asChild>
                          <Link href="/dashboard/custom-matches">Manage</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Tournaments Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Upcoming Tournaments</h2>
            <p className="text-sm text-muted-foreground">Join and compete for amazing prizes</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="default" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center" variant="destructive">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Filter Tournaments</DialogTitle>
                  <DialogDescription>
                    Choose your preferences to find the perfect tournament
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Tournament Type Filter */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Tournament Type</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <button
                        onClick={() => setFilterType("all")}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-primary",
                          filterType === "all" 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                      >
                        <Trophy className="h-6 w-6 mb-2" />
                        <span className="text-xs font-medium">All</span>
                      </button>

                      <button
                        onClick={() => setFilterType("solo")}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-primary",
                          filterType === "solo" 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                      >
                        <User className="h-6 w-6 mb-2" />
                        <span className="text-xs font-medium">Solo</span>
                      </button>

                      <button
                        onClick={() => setFilterType("squad")}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-primary",
                          filterType === "squad" 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                      >
                        <Users className="h-6 w-6 mb-2" />
                        <span className="text-xs font-medium">Squad</span>
                      </button>

                      <button
                        onClick={() => setFilterType("duo")}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-primary",
                          filterType === "duo" 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                      >
                        <UserPlus className="h-6 w-6 mb-2" />
                        <span className="text-xs font-medium">Duo</span>
                      </button>
                    </div>
                  </div>

                  <Separator />

                  {/* Status Filter */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Status</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setFilterStatus("all")}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-primary",
                          filterStatus === "all" 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                      >
                        <Trophy className="h-6 w-6 mb-2" />
                        <span className="text-xs font-medium">All</span>
                      </button>

                      <button
                        onClick={() => setFilterStatus("Open")}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-primary",
                          filterStatus === "Open" 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                      >
                        <Badge variant="default" className="mb-2">Open</Badge>
                        <span className="text-xs font-medium">Open</span>
                      </button>

                      <button
                        onClick={() => setFilterStatus("Filling Fast")}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-primary",
                          filterStatus === "Filling Fast" 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                      >
                        <Badge variant="destructive" className="mb-2">Fast</Badge>
                        <span className="text-xs font-medium">Filling Fast</span>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={clearFilters}
                    >
                      Clear All
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button asChild variant="outline">
              <Link href="/dashboard/tournaments">View All</Link>
            </Button>
          </div>
        </div>

        {/* Tournament Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-8 w-8 bg-muted rounded" />
                  <div className="h-6 w-3/4 bg-muted rounded mt-2" />
                  <div className="h-4 w-1/2 bg-muted rounded mt-1" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Trophy className={`h-8 w-8 ${tournament.featured ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                    <div className="flex items-center gap-2">
                      <Badge variant={tournament.status === "FULL" ? "destructive" : "default"}>
                        {tournament.status}
                      </Badge>
                      {/* Info Icon */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Info className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>{tournament.name}</DialogTitle>
                            <DialogDescription>{tournament.type}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Date</p>
                                  <p className="font-medium">{formatDate(tournament.startDate)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Time</p>
                                  <p className="font-medium">{formatTime(tournament.startDate)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Map</p>
                                  <p className="font-medium">{tournament.map || "TBA"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Teams</p>
                                  <p className="font-medium">{tournament.currentTeams || 0}/{tournament.maxTeams}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Prize</p>
                                  <p className="font-medium">रु {tournament.prizePool}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Entry Fee</p>
                                  <p className="font-medium">रु {tournament.entryFee}</p>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-semibold mb-2">Tournament Rules</h4>
                              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {tournament.rules || "Rules will be announced soon."}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <CardTitle className="line-clamp-1">{tournament.name}</CardTitle>
                  <CardDescription>{tournament.type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(tournament.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(tournament.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{tournament.currentTeams || 0}/{tournament.maxTeams} Teams</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold text-foreground">रु {tournament.prizePool} Prize Pool</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      <span className="font-semibold text-orange-600">रु {tournament.entryFee} Entry Fee</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => handleRegister(tournament)}>
                    Register Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="font-medium text-muted-foreground">No tournaments match your filters</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filter criteria</p>
              <div className="mt-5 mx-auto max-w-md rounded-lg border bg-muted/30 p-4 text-left">
                <p className="font-semibold">Try Custom Matches</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Join open custom rooms created by other players, or create your own match room.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/dashboard/custom-matches">Browse Custom Matches</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/dashboard#custom-match-rooms">Create Room</Link>
                  </Button>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Registration Confirmation Dialog */}
        <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Registration</DialogTitle>
              <DialogDescription>
                {selectedTournament?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Entry Fee & Balance */}
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Entry Fee</span>
                  <span className="font-semibold text-lg">रु {selectedTournament?.entryFee}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Balance</span>
                  <span className={`font-semibold text-lg ${(user?.balance || 0) >= (selectedTournament?.entryFee || 0) ? 'text-green-600' : 'text-red-600'}`}>
                    रु {(user?.balance || 0).toFixed(2)}
                  </span>
                </div>
                {(user?.balance || 0) >= (selectedTournament?.entryFee || 0) && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Balance After</span>
                      <span className="font-semibold text-lg text-blue-600">
                        रु {((user?.balance || 0) - (selectedTournament?.entryFee || 0)).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Insufficient Balance Warning */}
              {(user?.balance || 0) < (selectedTournament?.entryFee || 0) && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-100 text-sm">
                      Insufficient Balance
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                      You need रु {((selectedTournament?.entryFee || 0) - (user?.balance || 0)).toFixed(2)} more to register for this tournament.
                    </p>
                    <Button asChild size="sm" className="mt-3" variant="destructive">
                      <Link href="/dashboard/wallet">
                        Add Money
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Tournament Rules */}
              {(user?.balance || 0) >= (selectedTournament?.entryFee || 0) && (
                <>
                  <div>
                    <h4 className="font-semibold mb-2">Tournament Rules</h4>
                    <div className="max-h-48 overflow-y-auto p-3 bg-muted rounded-lg">
                      <div className="text-sm whitespace-pre-wrap">
                        {selectedTournament?.rules || "Rules will be announced soon."}
                      </div>
                    </div>
                  </div>

                  {/* Accept Rules */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptRules"
                      checked={acceptedRules}
                      onCheckedChange={(checked) => setAcceptedRules(checked as boolean)}
                    />
                    <Label htmlFor="acceptRules" className="text-sm cursor-pointer leading-relaxed">
                      I have read and accept all tournament rules. I understand that रु {selectedTournament?.entryFee} will be deducted from my wallet balance.
                    </Label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowRegisterDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={confirmRegistration}
                      disabled={!acceptedRules}
                    >
                      Confirm & Register
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scrims Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Live Scrims</h2>
            <p className="text-sm text-muted-foreground">Join scrims and win real money</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/scrims">View All Scrims</Link>
          </Button>
        </div>

        {/* Scrim Cards */}
        {scrimsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded mt-1" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : scrims.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scrims.map((scrim) => {
              const config = scrim.scrimConfig;
              const entry = config?.entryPrizeSettings;
              const prizePool = (config as any)?.prizePoolCalculation;
              const isPaid = entry?.entryType === "PAID";

              return (
                <Card key={scrim.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Trophy className="h-7 w-7 text-orange-500" />
                      <Badge variant={scrim.status === "LIVE" ? "default" : "secondary"}>
                        {scrim.status}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-1">{scrim.title}</CardTitle>
                    <CardDescription>
                      {config?.basicInformation?.scrimType || "SCRIM"} • {config?.basicInformation?.gameMode || "BR"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(scrim.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(scrim.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {scrim._count?.players || 0} / {
                            config?.basicInformation?.scrimType === "SOLO" 
                              ? config?.slotConfiguration?.totalSlots || 0
                              : config?.slotConfiguration?.totalTeamSlots || 0
                          } {config?.basicInformation?.scrimType === "SOLO" ? "players" : "teams"}
                        </span>
                      </div>
                      {isPaid && (
                        <>
                          {prizePool && prizePool.prizePool > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Trophy className="h-4 w-4" />
                              <span className="font-semibold text-yellow-600">
                                ₹{prizePool.prizePool.toFixed(0)} Prize Pool
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Wallet className="h-4 w-4" />
                            <span className="font-semibold text-green-600">
                              ₹{entry.entryFeeAmount || 0} Entry
                            </span>
                          </div>
                        </>
                      )}
                      {!isPaid && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            FREE ENTRY
                          </Badge>
                        </div>
                      )}
                    </div>
                    <Button className="w-full mt-4" asChild>
                      <Link href={`/dashboard/scrims/${scrim.id}`}>
                        {isPaid ? `Pay ₹${entry.entryFeeAmount} & Join` : "Join Free"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="font-medium text-muted-foreground">No scrims available right now</p>
              <p className="text-sm text-muted-foreground mt-2">Check back later for new scrims</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.activeTournaments}</div>
            <p className="text-sm text-muted-foreground mt-1">Active Tournaments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.playersOnline}</div>
            <p className="text-sm text-muted-foreground mt-1">Players Online</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.activeTeams}</div>
            <p className="text-sm text-muted-foreground mt-1">Active Teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">रु {(stats.totalPrizes / 1000).toFixed(0)}K</div>
            <p className="text-sm text-muted-foreground mt-1">Total Prizes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-emerald-600">रु {(user?.balance || 0).toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">Wallet Balance</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


