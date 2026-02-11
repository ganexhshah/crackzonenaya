"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, UserPlus, Crown, Edit, Plus, Trophy, Target, TrendingUp, X } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Team {
  id: string;
  name: string;
  tag: string;
  logo?: string;
  captainId: string;
  ownerId: string;
  members: any[];
  stats?: {
    matches: number;
    wins: number;
    points: number;
  };
}

interface JoinRequest {
  teamId: string;
  status: 'pending' | 'joined';
}

export default function TeamsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinRequests, setJoinRequests] = useState<Map<string, JoinRequest>>(new Map());
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamDetails, setShowTeamDetails] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      // Fetch user's teams
      const myTeamsData: any = await api.get('/teams/my-teams');
      setMyTeams(Array.isArray(myTeamsData) ? myTeamsData : []);

      // Fetch all teams (for available teams)
      const allTeamsData: any = await api.get('/teams');
      const allTeams = Array.isArray(allTeamsData) ? allTeamsData : [];
      
      // Filter out teams user is already in
      const available = allTeams.filter((team: Team) => 
        !myTeamsData.some((myTeam: Team) => myTeam.id === team.id) &&
        team.members.length < 4
      );
      setAvailableTeams(available);

      // Load join requests from localStorage
      const savedRequests = localStorage.getItem('joinRequests');
      if (savedRequests) {
        const requestsArray = JSON.parse(savedRequests);
        setJoinRequests(new Map(requestsArray));
      }
    } catch (error: any) {
      console.error('Failed to fetch teams:', error);
      toast.error('Failed to load teams');
      setMyTeams([]);
      setAvailableTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async (teamId: string) => {
    try {
      // For now, simulate a join request by storing it locally
      // In a real app, this would send a request to the backend
      const newRequest: JoinRequest = {
        teamId,
        status: 'pending'
      };
      
      const updatedRequests = new Map(joinRequests);
      updatedRequests.set(teamId, newRequest);
      setJoinRequests(updatedRequests);
      
      // Save to localStorage
      localStorage.setItem('joinRequests', JSON.stringify(Array.from(updatedRequests.entries())));
      
      toast.success('Join request sent! The team captain will review your request.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send join request');
    }
  };

  const handleCancelRequest = async (teamId: string) => {
    try {
      const updatedRequests = new Map(joinRequests);
      updatedRequests.delete(teamId);
      setJoinRequests(updatedRequests);
      
      // Save to localStorage
      localStorage.setItem('joinRequests', JSON.stringify(Array.from(updatedRequests.entries())));
      
      toast.success('Join request cancelled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel request');
    }
  };

  const getButtonState = (team: Team) => {
    // Check if user is already in the team
    const isMember = team.members.some((m: any) => m.userId === user?.id);
    if (isMember) {
      return { label: 'Joined', variant: 'default' as const, disabled: true, action: null };
    }

    // Check if there's a pending request
    const request = joinRequests.get(team.id);
    if (request && request.status === 'pending') {
      return { 
        label: 'Cancel Request', 
        variant: 'outline' as const, 
        disabled: false, 
        action: () => handleCancelRequest(team.id) 
      };
    }

    // Default: show join button
    return { 
      label: 'Request to Join', 
      variant: 'outline' as const, 
      disabled: false, 
      action: () => handleJoinRequest(team.id) 
    };
  };

  const handleViewTeamDetails = (team: Team) => {
    setSelectedTeam(team);
    setShowTeamDetails(true);
  };

  const handleCloseTeamDetails = () => {
    setShowTeamDetails(false);
    setSelectedTeam(null);
  };

  const handleViewProfile = (userId: string) => {
    // Close the modal first
    setShowTeamDetails(false);
    setSelectedTeam(null);
    // Navigate to profile page
    router.push(`/dashboard/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Teams</h1>
            <p className="text-muted-foreground mt-1">
              Manage your teams and find new teammates
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-16 w-16 bg-muted rounded-full" />
                <div className="h-6 w-3/4 bg-muted rounded mt-2" />
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
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage your teams and find new teammates
          </p>
        </div>
        <Button size="lg" asChild>
          <Link href="/dashboard/teams/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Link>
        </Button>
      </div>

      {/* My Teams Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Teams</h2>
        {myTeams.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {myTeams.map((team) => {
              const isCaptain = team.ownerId === user?.id;
              const captain = team.members.find((m: any) => m.userId === team.ownerId);
              
              return (
                <Card key={team.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-16 h-16 border-2 border-primary">
                          <AvatarImage src={team.logo} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-bold">
                            {team.tag}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {team.name}
                            {isCaptain && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </CardTitle>
                          <CardDescription>Tag: {team.tag}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Team Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{team.members.length}</div>
                        <p className="text-xs text-muted-foreground">Members</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {team.stats?.wins || 0}/{team.stats?.matches || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Wins</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{team.stats?.points || 0}</div>
                        <p className="text-xs text-muted-foreground">Points</p>
                      </div>
                    </div>

                    {/* Captain Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span className="text-muted-foreground">Captain:</span>
                      <span className="font-medium">{captain?.user?.username || 'Unknown'}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link href={`/dashboard/teams/${team.id}`}>
                          View Team
                        </Link>
                      </Button>
                      {isCaptain && (
                        <Button variant="outline" asChild>
                          <Link href={`/dashboard/teams/${team.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="font-medium text-muted-foreground">You're not in any team yet</p>
              <p className="text-sm text-muted-foreground mt-2">Create a team or join an existing one</p>
              <div className="flex gap-3 justify-center mt-6">
                <Button asChild>
                  <Link href="/dashboard/teams/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Team
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Available Teams Section */}
      {availableTeams.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Looking for Players</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTeams.map((team) => {
              const captain = team.members.find((m: any) => m.userId === team.ownerId);
              const needsPlayers = 4 - team.members.length;
              const buttonState = getButtonState(team);
              
              return (
                <Card 
                  key={team.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewTeamDetails(team)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="w-12 h-12 border-2">
                        <AvatarImage src={team.logo} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
                          {team.tag}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{team.name}</CardTitle>
                        <CardDescription className="text-xs">Tag: {team.tag}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      {needsPlayers} slot{needsPlayers > 1 ? 's' : ''} open
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span className="text-muted-foreground">Captain:</span>
                      <span className="font-medium truncate">{captain?.user?.username || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{team.members.length}/4 Members</span>
                    </div>
                    <Button 
                      className="w-full" 
                      variant={buttonState.variant}
                      disabled={buttonState.disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (buttonState.action) {
                          buttonState.action();
                        }
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {buttonState.label}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Details Dialog */}
      <Dialog open={showTeamDetails} onOpenChange={setShowTeamDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTeam && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  <Avatar className="w-16 h-16 border-2 border-primary">
                    <AvatarImage src={selectedTeam.logo} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xl font-bold">
                      {selectedTeam.tag}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">{selectedTeam.name}</DialogTitle>
                    <DialogDescription className="text-base">
                      Tag: {selectedTeam.tag}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Team Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Team Statistics
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {selectedTeam.stats?.matches || 0}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Matches</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {selectedTeam.stats?.wins || 0}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Wins</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-purple-600">
                          {selectedTeam.stats?.points || 0}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Points</p>
                      </CardContent>
                    </Card>
                  </div>
                  {selectedTeam.stats?.matches && selectedTeam.stats.matches > 0 && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Win Rate:</span>
                        <span className="font-semibold text-green-600">
                          {Math.round((selectedTeam.stats.wins / selectedTeam.stats.matches) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Team Members */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Team Members ({selectedTeam.members.length}/4)
                  </h3>
                  <div className="space-y-2">
                    {selectedTeam.members.map((member: any) => {
                      const isOwner = member.userId === selectedTeam.ownerId;
                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/60 transition-colors cursor-pointer"
                          onClick={() => handleViewProfile(member.userId)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleViewProfile(member.userId);
                            }
                          }}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.user?.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                              {member.user?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium hover:underline">{member.user?.username || 'Unknown'}</span>
                              {isOwner && (
                                <Badge variant="default" className="text-xs">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Captain
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">
                              {member.role?.toLowerCase() || 'Member'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {selectedTeam.members.length < 4 && (
                      <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {4 - selectedTeam.members.length} slot{4 - selectedTeam.members.length > 1 ? 's' : ''} available
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  {(() => {
                    const buttonState = getButtonState(selectedTeam);
                    return (
                      <>
                        <Button
                          className="flex-1"
                          variant={buttonState.variant}
                          disabled={buttonState.disabled}
                          onClick={() => {
                            if (buttonState.action) {
                              buttonState.action();
                              handleCloseTeamDetails();
                            }
                          }}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          {buttonState.label}
                        </Button>
                        <Button variant="outline" onClick={handleCloseTeamDetails}>
                          Close
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
