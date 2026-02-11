"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Crown,
  Edit,
  Copy,
  Check,
  Trophy,
  Target,
  Zap,
  Share2,
  UserPlus,
  MoreVertical,
  Trash2,
  Shield,
  UserMinus,
  Settings,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const teamId = params.id as string;
  
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const data: any = await api.get(`/teams/${teamId}`);
      setTeam(data);
    } catch (error: any) {
      console.error('Failed to fetch team:', error);
      toast.error('Failed to load team');
      router.push('/dashboard/teams');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    const inviteCode = `TEAM-${teamId}`;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      toast.error('Please enter a user email or ID');
      return;
    }

    setIsAddingMember(true);
    try {
      // In a real app, you'd search for the user by email first
      // For now, we'll assume the input is a userId
      await api.post(`/teams/${teamId}/members`, { userId: newMemberEmail });
      toast.success('Member added successfully!');
      setNewMemberEmail("");
      setIsAddMemberOpen(false);
      fetchTeam(); // Refresh team data
    } catch (error: any) {
      console.error('Failed to add member:', error);
      toast.error(error.response?.data?.error || 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemovingMember(true);
    try {
      await api.delete(`/teams/${teamId}/members/${memberToRemove.userId}`);
      toast.success('Member removed successfully!');
      setMemberToRemove(null);
      fetchTeam(); // Refresh team data
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      toast.error(error.response?.data?.error || 'Failed to remove member');
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleDeleteTeam = async () => {
    setIsDeletingTeam(true);
    try {
      await api.delete(`/teams/${teamId}`);
      toast.success('Team deleted successfully!');
      router.push('/dashboard/teams');
    } catch (error: any) {
      console.error('Failed to delete team:', error);
      toast.error(error.response?.data?.error || 'Failed to delete team');
      setIsDeletingTeam(false);
      setShowDeleteDialog(false);
    }
  };

  const handlePromoteMember = async (memberId: string, userId: string) => {
    try {
      // This would require a backend endpoint to update member role
      toast.info('Promote member feature coming soon!');
    } catch (error) {
      toast.error('Failed to promote member');
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/teams">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="h-20 w-full bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return null;
  }

  const isOwner = team.ownerId === user?.id;
  const captain = team.members?.find((m: any) => m.userId === team.ownerId);
  const stats = team.stats || { matches: 0, wins: 0, losses: 0, points: 0, rank: 0 };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/dashboard/teams">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-primary">
              <AvatarImage src={team.logo} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold">
                {team.tag}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                {team.name}
                {isOwner && <Crown className="h-6 w-6 text-yellow-500" />}
              </h1>
              <p className="text-muted-foreground">Tag: {team.tag}</p>
              <Badge variant="default" className="mt-2">Active</Badge>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="flex gap-2">
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Players</DialogTitle>
                  <DialogDescription>
                    Share this code with players to join your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Invite Code</Label>
                    <div className="flex gap-2">
                      <Input value={`TEAM-${teamId}`} readOnly />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyInviteCode}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Players can use this code to request joining your team
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            <Button asChild>
              <Link href={`/dashboard/teams/${teamId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Team
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Team Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/teams/${teamId}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Team Info
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAddMemberOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members ({team.members?.length || 0})
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="management">
              <Shield className="mr-2 h-4 w-4" />
              Management
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Team Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Team Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{stats.matches}</div>
                      <p className="text-sm text-muted-foreground mt-1">Matches</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{stats.wins}</div>
                      <p className="text-sm text-muted-foreground mt-1">Wins</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{stats.losses}</div>
                      <p className="text-sm text-muted-foreground mt-1">Losses</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{stats.points}</div>
                      <p className="text-sm text-muted-foreground mt-1">Points</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">#{stats.rank || '-'}</div>
                      <p className="text-sm text-muted-foreground mt-1">Rank</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Description */}
              {team.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About Team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{team.description}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" asChild>
                    <Link href="/dashboard/tournaments">
                      <Trophy className="mr-2 h-4 w-4" />
                      Join Tournament
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard/practice">
                      <Target className="mr-2 h-4 w-4" />
                      Practice Mode
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard/stats">
                      <Zap className="mr-2 h-4 w-4" />
                      View Stats
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={captain?.user?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
                        {captain?.user?.username?.substring(0, 2).toUpperCase() || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {captain?.user?.username || 'Unknown'}
                        <Crown className="h-4 w-4 text-yellow-500" />
                      </p>
                      <p className="text-sm text-muted-foreground">Team Leader</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Roster</CardTitle>
                  <CardDescription>{team.members?.length || 0} members</CardDescription>
                </div>
                {isOwner && (
                  <Button onClick={() => setIsAddMemberOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {team.members && team.members.length > 0 ? (
                team.members.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.user?.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                          {member.user?.username?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.user?.username || 'Unknown'}</p>
                          {member.userId === team.ownerId && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === "SUBSTITUTE" ? "secondary" : "default"}>
                        {member.role}
                      </Badge>
                      {isOwner && member.userId !== team.ownerId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handlePromoteMember(member.id, member.userId)}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Promote to Captain
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setMemberToRemove(member)}
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No members yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Management Tab (Owner Only) */}
        {isOwner && (
          <TabsContent value="management" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Management</CardTitle>
                  <CardDescription>Manage your team settings and members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsInviteOpen(true)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Generate Invite Code
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsAddMemberOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Team Member
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={`/dashboard/teams/${teamId}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Team Information
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Team
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    This action cannot be undone. All team data will be permanently deleted.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Team Statistics</CardTitle>
                <CardDescription>Overview of your team's performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Members</span>
                    <span className="font-bold">{team.members?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Matches</span>
                    <span className="font-bold">{stats.matches}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="font-bold text-green-600">
                      {stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Team Rank</span>
                    <span className="font-bold">#{stats.rank || 'Unranked'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Enter the user ID or email of the player you want to add
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="memberEmail">User ID or Email</Label>
              <Input
                id="memberEmail"
                placeholder="Enter user ID or email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddMemberOpen(false);
                setNewMemberEmail("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={isAddingMember}>
              {isAddingMember ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.user?.username} from the team?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingMember}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemovingMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemovingMember ? "Removing..." : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Team Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{team.name}"? This action cannot be undone.
              All team data, members, and statistics will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTeam}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={isDeletingTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingTeam ? "Deleting..." : "Delete Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
