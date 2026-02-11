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
import { Trophy, Calendar, Users, DollarSign, Clock, Filter, User, UserPlus, Info, MapPin, AlertCircle, Wallet as WalletIcon, Crown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
  const [stats, setStats] = useState({
    activeTournaments: 0,
    playersOnline: 0,
    activeTeams: 0,
    totalPrizes: 0,
  });

  // Mock wallet balance - in production, fetch from backend
  const walletBalance = 1250.50;

  useEffect(() => {
    fetchTournaments();
    fetchScrims();
    fetchUserTeams();
  }, []);

  const fetchScrims = async () => {
    try {
      setScrimsLoading(true);
      const data: any = await api.get('/scrims/public');
      const scrimsData = Array.isArray(data) ? data.slice(0, 3) : []; // Show only 3 scrims
      setScrims(scrimsData);
    } catch (error: any) {
      console.error('Failed to fetch scrims:', error);
      setScrims([]);
    } finally {
      setScrimsLoading(false);
    }
  };

  const fetchUserTeams = async () => {
    try {
      setTeamsLoading(true);
      const data: any = await api.get('/teams/my-teams');
      const teamsData = Array.isArray(data) ? data : [];
      setUserTeams(teamsData);
    } catch (error: any) {
      console.error('Failed to fetch teams:', error);
      setUserTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const data: any = await api.get('/tournaments');
      const tournamentsData = Array.isArray(data) ? data : [];
      setTournaments(tournamentsData);
      setStats({
        activeTournaments: tournamentsData.length || 0,
        playersOnline: 1200, // Mock data
        activeTeams: 156, // Mock data
        totalPrizes: 50000, // Mock data
      });
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

    if (walletBalance < selectedTournament.entryFee) {
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
            {/* Wallet Balance Card */}
            <CarouselItem className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <Link href="/dashboard/wallet">
                <Card className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 border-0 text-white overflow-hidden cursor-pointer hover:scale-[1.02] transition-all hover:shadow-2xl h-[200px] sm:h-[220px]">
                  <CardContent className="p-5 sm:p-6 relative h-full flex flex-col justify-between">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <WalletIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                        <Badge variant="secondary" className="text-xs font-semibold shadow-sm">Active</Badge>
                      </div>
                      <div>
                        <p className="text-white/90 text-xs sm:text-sm font-medium mb-1">Wallet Balance</p>
                        <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                          ₹{walletBalance.toFixed(2)}
                        </h3>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <Button size="sm" variant="secondary" className="font-semibold shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto">
                        Add Money
                      </Button>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-black/10 rounded-full blur-2xl"></div>
                    <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>

            {/* User Teams Cards */}
            {teamsLoading ? (
              <>
                {[1, 2].map((i) => (
                  <CarouselItem key={i} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <Card className="animate-pulse h-[200px] sm:h-[220px]">
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
                  <CarouselItem key={team.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <Link href={`/dashboard/teams/${team.id}`}>
                      <Card className="hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer h-[200px] sm:h-[220px] border-2 hover:border-primary/50">
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
                            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                              <div className="font-bold text-base sm:text-lg text-blue-600 dark:text-blue-400">{team.stats?.matches || 0}</div>
                              <p className="text-xs text-muted-foreground">Matches</p>
                            </div>
                            <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                              <div className="font-bold text-base sm:text-lg text-green-600 dark:text-green-400">{team.stats?.wins || 0}</div>
                              <p className="text-xs text-muted-foreground">Wins</p>
                            </div>
                            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                              <div className="font-bold text-base sm:text-lg text-purple-600 dark:text-purple-400">{team.stats?.points || 0}</div>
                              <p className="text-xs text-muted-foreground">Points</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </CarouselItem>
                );
              })
            ) : (
              <CarouselItem className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <Card className="border-2 border-dashed hover:border-solid hover:border-primary transition-all h-[200px] sm:h-[220px]">
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

            {/* View All Teams Card */}
            {userTeams.length > 0 && (
              <CarouselItem className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <Link href="/dashboard/teams">
                  <Card className="border-dashed hover:border-solid hover:shadow-lg transition-all cursor-pointer h-[180px]">
                    <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                      <Shield className="h-12 w-12 mb-3 text-primary" />
                      <p className="font-semibold mb-1">View All Teams</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Manage your {userTeams.length} team{userTeams.length !== 1 ? 's' : ''}
                      </p>
                      <Button size="sm">
                        Go to Teams
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious className="hidden lg:flex -left-4" />
          <CarouselNext className="hidden lg:flex -right-4" />
        </Carousel>
      </div>

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
                      <WalletIcon className="h-4 w-4" />
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
                  <span className={`font-semibold text-lg ${walletBalance >= (selectedTournament?.entryFee || 0) ? 'text-green-600' : 'text-red-600'}`}>
                    रु {walletBalance.toFixed(2)}
                  </span>
                </div>
                {walletBalance >= (selectedTournament?.entryFee || 0) && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Balance After</span>
                      <span className="font-semibold text-lg text-blue-600">
                        रु {(walletBalance - (selectedTournament?.entryFee || 0)).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Insufficient Balance Warning */}
              {walletBalance < (selectedTournament?.entryFee || 0) && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-100 text-sm">
                      Insufficient Balance
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                      You need रु {((selectedTournament?.entryFee || 0) - walletBalance).toFixed(2)} more to register for this tournament.
                    </p>
                    <Button asChild size="sm" className="mt-3" variant="destructive">
                      <Link href="/dashboard/wallet">
                        <WalletIcon className="mr-2 h-4 w-4" />
                        Add Money
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Tournament Rules */}
              {walletBalance >= (selectedTournament?.entryFee || 0) && (
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
                            <WalletIcon className="h-4 w-4" />
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </div>
    </div>
  );
}

