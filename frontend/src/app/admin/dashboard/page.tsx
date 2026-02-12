"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  UsersRound,
  Trophy,
  Clock,
  Radio,
  FileCheck,
  Wallet,
  Plus,
  Upload,
  Send,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Swords,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/services/admin.service";
import { matchService } from "@/services/match.service";
import { tournamentService } from "@/services/tournament.service";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalTournaments: 0,
    totalMatches: 0,
    pendingRegistrations: 0,
    pendingTransactions: 0,
  });
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [recentTournaments, setRecentTournaments] = useState<any[]>([]);

  const loadDashboardData = useCallback(async (showToast = false) => {
    try {
      if (!loading) setRefreshing(true);
      
      const [dashboardStats, matches, tournaments] = await Promise.all([
        adminService.getDashboardStats(),
        matchService.getAllMatches(),
        tournamentService.getAllTournaments(),
      ]);

      setStats(dashboardStats);
      setRecentMatches(matches.slice(0, 5));
      setRecentTournaments(tournaments.slice(0, 5));
      setError(null);
      
      if (showToast) {
        toast.success("Dashboard refreshed successfully");
      }
    } catch (err: any) {
      console.error("Dashboard error:", err);
      setError(err.message || "Failed to load dashboard data");
      if (showToast) {
        toast.error("Failed to refresh dashboard");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading]);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const statsCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Teams",
      value: stats.totalTeams.toString(),
      icon: UsersRound,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Tournaments",
      value: stats.totalTournaments.toString(),
      icon: Trophy,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Total Matches",
      value: stats.totalMatches.toString(),
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Live Matches",
      value: recentMatches.filter((m) => m.status === "LIVE").length.toString(),
      icon: Radio,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations.toString(),
      icon: FileCheck,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Pending Payments",
      value: stats.pendingTransactions.toString(),
      icon: Wallet,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      title: "Custom Matches",
      value: "Review",
      icon: Swords,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
  ];

  const quickActions = [
    { label: "Create Tournament", icon: Plus, href: "/admin/scrims/create" },
    { label: "Manage Scrims", icon: Upload, href: "/admin/scrims" },
    { label: "View Reports", icon: FileCheck, href: "/admin/reports" },
    { label: "Review Custom", icon: Swords, href: "/admin/custom-matches" },
    { label: "Send Announcement", icon: Send, href: "/admin/announcements" },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <Button
          onClick={() => loadDashboardData(true)}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className="w-5 h-5" />
                  <span className="text-sm">{action.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Matches */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Matches</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/scrims">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMatches.length > 0 ? (
                recentMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{match.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline">{match.matchType}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(match.scheduledAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        match.status === "LIVE"
                          ? "destructive"
                          : match.status === "COMPLETED"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {match.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No recent matches</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tournaments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Tournaments</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/scrims">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTournaments.length > 0 ? (
                recentTournaments.map((tournament) => (
                  <div key={tournament.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{tournament.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline">{tournament.mode}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {tournament.maxTeams} teams
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        tournament.status === "ACTIVE"
                          ? "default"
                          : tournament.status === "COMPLETED"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {tournament.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No recent tournaments</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
