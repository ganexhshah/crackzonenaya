"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MoreVertical, Edit, Ban, Eye, Users, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { teamService, Team } from "@/services/team.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AdminTeamsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsData, statsData] = await Promise.all([
        teamService.adminGetAllTeams(),
        teamService.adminGetTeamStats(),
      ]);
      setTeams(teamsData);
      setStats(statsData);
    } catch (error: any) {
      console.error('Failed to fetch teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (teamId: string, currentStatus: boolean) => {
    try {
      await teamService.adminUpdateTeamStatus(teamId, !currentStatus);
      toast.success(`Team ${!currentStatus ? 'activated' : 'suspended'} successfully`);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update team status');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      await teamService.adminDeleteTeam(teamId);
      toast.success('Team deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete team');
    }
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.owner.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage teams and rosters</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground">Manage teams and rosters</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Teams</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Inactive</div>
            <div className="text-2xl font-bold mt-1 text-red-600">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by team name, tag, captain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teams List */}
      <div className="space-y-4">
        {filteredTeams.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No teams found matching your search' : 'No teams yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTeams.map((team) => (
            <Card key={team.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        {team.logo ? (
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={team.logo} alt={team.name} />
                            <AvatarFallback>{team.tag}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{team.name}</h3>
                          <Badge variant="outline">{team.tag}</Badge>
                          <Badge className={getStatusColor(team.isActive)}>
                            {team.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Captain: {team.owner.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {team._count?.members || team.members.length} members
                        </p>
                        {team.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {team.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Members: </span>
                            <span className="font-medium">{team._count?.members || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Balance: </span>
                            <span className="font-medium">रु {team.balance?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {team.isActive ? (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleToggleStatus(team.id, team.isActive)}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Suspend Team
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={() => handleToggleStatus(team.id, team.isActive)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Activate Team
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteTeam(team.id)}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
