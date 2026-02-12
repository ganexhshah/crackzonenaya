"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Users, Trophy, Swords } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { scrimService, Scrim } from "@/services/scrim.service";
import { toast } from "sonner";

type SearchUser = {
  id: string;
  username: string;
  gameName?: string;
  avatar?: string;
};

type SearchTeam = {
  id: string;
  name: string;
  tag?: string;
  members?: any[];
};

type SearchTournament = {
  id: string;
  name: string;
  type?: string;
  format?: string;
  status?: string;
};

export default function DashboardSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [teams, setTeams] = useState<SearchTeam[]>([]);
  const [tournaments, setTournaments] = useState<SearchTournament[]>([]);
  const [scrims, setScrims] = useState<Scrim[]>([]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const runSearch = async (q: string) => {
    const term = q.trim();
    if (term.length < 2) {
      setUsers([]);
      setTeams([]);
      setTournaments([]);
      setScrims([]);
      return;
    }

    try {
      setLoading(true);
      const [usersData, teamsData, tournamentsData, scrimsData] = await Promise.all([
        api.get(`/users/search?query=${encodeURIComponent(term)}`),
        api.get("/teams"),
        api.get("/tournaments"),
        scrimService.getPublicScrims(),
      ]);

      const termLower = term.toLowerCase();
      const allTeams = Array.isArray(teamsData) ? teamsData : [];
      const allTournaments = Array.isArray(tournamentsData) ? tournamentsData : [];
      const allScrims = Array.isArray(scrimsData) ? scrimsData : [];

      setUsers(Array.isArray(usersData) ? usersData : []);
      setTeams(
        allTeams.filter(
          (t: SearchTeam) =>
            t?.name?.toLowerCase().includes(termLower) || t?.tag?.toLowerCase().includes(termLower)
        )
      );
      setTournaments(
        allTournaments.filter(
          (t: SearchTournament) =>
            t?.name?.toLowerCase().includes(termLower) ||
            t?.type?.toLowerCase().includes(termLower) ||
            t?.format?.toLowerCase().includes(termLower)
        )
      );
      setScrims(
        allScrims.filter(
          (s) =>
            s?.title?.toLowerCase().includes(termLower) ||
            s?.scrimConfig?.basicInformation?.scrimType?.toLowerCase().includes(termLower)
        )
      );
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const trimmed = initialQuery.trim();
    if (trimmed.length >= 2) {
      void runSearch(trimmed);
      return;
    }
    setUsers([]);
    setTeams([]);
    setTournaments([]);
    setScrims([]);
  }, [initialQuery]);

  const totalResults = useMemo(
    () => users.length + teams.length + tournaments.length + scrims.length,
    [users.length, teams.length, tournaments.length, scrims.length]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/dashboard/search?q=${encodeURIComponent(q)}` : "/dashboard/search");
    void runSearch(q);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Search</h1>
        <p className="text-muted-foreground mt-1">Find users, teams, tournaments and scrims</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type at least 2 characters..."
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {query.trim().length > 0 && query.trim().length < 2 && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Enter at least 2 characters to search.
          </CardContent>
        </Card>
      )}

      {query.trim().length >= 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {loading ? "Searching..." : `${totalResults} result${totalResults === 1 ? "" : "s"} found`}
          </p>

          {users.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-4 w-4" />
                  Users
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {users.map((u) => (
                  <Link key={u.id} href={`/dashboard/profile/${u.id}`} className="block p-3 border rounded-lg hover:bg-muted/50">
                    <p className="font-medium">{u.username}</p>
                    {u.gameName && <p className="text-sm text-muted-foreground">{u.gameName}</p>}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {teams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-4 w-4" />
                  Teams
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {teams.map((t) => (
                  <Link key={t.id} href={`/dashboard/teams/${t.id}`} className="block p-3 border rounded-lg hover:bg-muted/50">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-muted-foreground">Tag: {t.tag || "N/A"}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {tournaments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-4 w-4" />
                  Tournaments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tournaments.map((t) => (
                  <Link key={t.id} href={`/dashboard/tournaments`} className="block p-3 border rounded-lg hover:bg-muted/50">
                    <p className="font-medium">{t.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{t.type || t.format || "Tournament"}</Badge>
                      {t.status && <Badge>{t.status}</Badge>}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {scrims.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Swords className="h-4 w-4" />
                  Scrims
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {scrims.map((s) => (
                  <Link key={s.id} href={`/dashboard/scrims/${s.id}`} className="block p-3 border rounded-lg hover:bg-muted/50">
                    <p className="font-medium">{s.title}</p>
                    <CardDescription>{s.status}</CardDescription>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {!loading && totalResults === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No results found for "{query}".
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
