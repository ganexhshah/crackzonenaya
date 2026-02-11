"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Users, DollarSign, Clock, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { scrimService, Scrim } from "@/services/scrim.service";
import { toast } from "sonner";

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
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tournamentData, scrimData] = await Promise.all([
        api.get('/tournaments'),
        scrimService.getPublicScrims(),
      ]);

      const tournamentsData = Array.isArray(tournamentData) ? tournamentData : [];
      const validTournaments = tournamentsData.filter(
        (item: any) => item?.name && item?.startDate && typeof item?.maxTeams === "number"
      );

      setTournaments(validTournaments);
      setScrims(Array.isArray(scrimData) ? scrimData : []);
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
                      <Button className="w-full mt-4" asChild><Link href={`/dashboard/tournaments/${tournament.id}/register`}>Register Now</Link></Button>
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
                      <Button className="w-full mt-4" asChild><Link href="/dashboard/scrims">View Scrims</Link></Button>
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
