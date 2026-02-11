"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Users, Trophy, Eye, Timer, AlertCircle } from "lucide-react";
import { useMyMatches } from "@/hooks/useMatches";
import { useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MatchesPage() {
  const { matches, loading, error } = useMyMatches();

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
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">My Matches</h1>
        <p className="text-muted-foreground mt-1">
          Track your tournament matches and results
        </p>
      </div>

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
