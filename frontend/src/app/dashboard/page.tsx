"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Trophy, Calendar, Users, DollarSign, Clock, Filter, User, UserPlus, Info, MapPin, AlertCircle, Wallet as WalletIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

const banners = [
  {
    id: 1,
    title: "Free Fire Championship 2024",
    subtitle: "Join the biggest tournament of the year",
    image: "bg-gradient-to-r from-orange-500 to-red-600",
    cta: "Register Now",
    href: "/dashboard/tournaments",
  },
  {
    id: 2,
    title: "Weekly Squad Battle",
    subtitle: "Compete with your team for amazing prizes",
    image: "bg-gradient-to-r from-blue-500 to-indigo-600",
    cta: "Join Battle",
    href: "/dashboard/tournaments",
  },
  {
    id: 3,
    title: "Practice Mode Available",
    subtitle: "Improve your skills before the big match",
    image: "bg-gradient-to-r from-green-500 to-teal-600",
    cta: "Start Practice",
    href: "/dashboard/practice",
  },
  {
    id: 4,
    title: "Find Your Squad",
    subtitle: "Connect with players and form the ultimate team",
    image: "bg-gradient-to-r from-purple-500 to-pink-600",
    cta: "Browse Teams",
    href: "/dashboard/teams",
  },
];

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

      {/* Banner Carousel */}
      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {banners.map((banner) => (
              <CarouselItem key={banner.id}>
                <Link href={banner.href}>
                  <Card className={`${banner.image} border-0 text-white overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform h-[200px] md:h-[240px]`}>
                    <CardContent className="p-6 md:p-8 lg:p-10 relative h-full flex flex-col justify-center">
                      <div className="relative z-10">
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-2 line-clamp-2">
                          {banner.title}
                        </h2>
                        <p className="text-white/90 text-sm md:text-base mb-4 md:mb-6 max-w-md line-clamp-2">
                          {banner.subtitle}
                        </p>
                        <Button size="default" variant="secondary" className="font-semibold md:text-base">
                          {banner.cta}
                        </Button>
                      </div>
                      {/* Decorative Elements */}
                      <div className="absolute top-0 right-0 w-40 h-40 md:w-64 md:h-64 bg-white/10 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-black/10 rounded-full blur-2xl"></div>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
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

