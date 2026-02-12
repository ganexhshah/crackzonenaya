"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Target, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { teamService } from "@/services/team.service";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function JoinTeamPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const teamId = params.id as string;

  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    if (!user) {
      toast.error('Please login to view this invitation');
      router.push(`/auth/login?redirect=/join/team/${teamId}`);
      return;
    }
    
    loadTeam();
  }, [teamId, user, authLoading]);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const data = await teamService.getPublicTeam(teamId);
      setTeam(data);
      
      // Check if user is already a member
      if (user && data.members) {
        const isMember = data.members.some((m: any) => m.userId === user.id);
        if (isMember) {
          toast.info('You are already a member of this team');
          router.push(`/dashboard/teams/${teamId}`);
        }
      }
    } catch (error: any) {
      console.error('Failed to load team:', error);
      toast.error('Team not found');
      router.push('/dashboard/teams');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    setProcessing(true);
    try {
      await teamService.acceptInvite(teamId);
      toast.success('Welcome to the team!');
      router.push(`/dashboard/teams/${teamId}`);
    } catch (error: any) {
      console.error('Failed to accept invite:', error);
      toast.error(error.message || 'Failed to accept invitation');
      setProcessing(false);
    }
  };

  const handleDeclineInvite = async () => {
    setProcessing(true);
    try {
      await teamService.declineInvite(teamId);
      toast.info('Invitation declined');
      router.push('/dashboard/teams');
    } catch (error: any) {
      console.error('Failed to decline invite:', error);
      toast.error(error.message || 'Failed to decline invitation');
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-4">
        <Card className="max-w-md w-full bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-400 mb-4">Team not found</p>
            <Button asChild>
              <Link href="/dashboard/teams">Browse Teams</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-4 flex items-center justify-center">
      <Card className="max-w-2xl w-full bg-gray-800/50 border-gray-700">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Avatar className="w-24 h-24 border-4 border-blue-600">
              <AvatarImage src={team.logo} alt={team.name} />
              <AvatarFallback className="text-2xl bg-blue-600 text-white">
                {team.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <CardTitle className="text-3xl text-white">{team.name}</CardTitle>
            <CardDescription className="text-lg text-gray-400 mt-2">
              Tag: {team.tag}
            </CardDescription>
          </div>
          <Badge className="bg-blue-600 text-white">
            {team.members?.length || 0} Members
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Team Description */}
          {team.description && (
            <div className="text-center">
              <p className="text-gray-300">{team.description}</p>
            </div>
          )}

          {/* Team Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-900/50 rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-white">{team.members?.length || 0}</div>
              <p className="text-xs text-gray-400">Members</p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-lg">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold text-white">{team._count?.matches || 0}</div>
              <p className="text-xs text-gray-400">Matches</p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-lg">
              <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-white">#{team.rank || '-'}</div>
              <p className="text-xs text-gray-400">Rank</p>
            </div>
          </div>

          {/* Team Members Preview */}
          {team.members && team.members.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Team Members</h3>
              <div className="flex flex-wrap gap-2">
                {team.members.slice(0, 6).map((member: any) => (
                  <div key={member.userId} className="flex items-center gap-2 bg-gray-900/50 rounded-full px-3 py-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={member.user?.avatar} />
                      <AvatarFallback className="text-xs">
                        {member.user?.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-300">{member.user?.username}</span>
                  </div>
                ))}
                {team.members.length > 6 && (
                  <div className="flex items-center gap-2 bg-gray-900/50 rounded-full px-3 py-1">
                    <span className="text-sm text-gray-400">+{team.members.length - 6} more</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-4">
              <p className="text-center text-blue-300 font-semibold">
                You've been invited to join this team!
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleAcceptInvite} 
                disabled={processing}
                className="bg-green-600 hover:bg-green-700 text-lg h-12"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 w-5 h-5" />
                    Accept
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleDeclineInvite} 
                disabled={processing}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-lg h-12"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <XCircle className="mr-2 w-5 h-5" />
                    Decline
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-xs text-center text-gray-400 mt-2">
              By accepting, you'll become a member and gain access to team features
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
