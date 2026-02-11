"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Users, 
  Trophy, 
  Target,
  TrendingUp,
  Shield,
  Edit,
  Phone,
  Globe,
  MessageCircle,
  Gamepad2,
  Award,
  Activity,
  Clock,
  Star
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  createdAt: string;
  profile?: {
    gameId?: string;
    gameUsername?: string;
    rank?: string;
    bio?: string;
    phone?: string;
    country?: string;
    discordId?: string;
  };
  teams?: any[];
  stats?: {
    totalMatches: number;
    wins: number;
    losses: number;
    points: number;
  };
  recentMatches?: any[];
  achievements?: any[];
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = params.id as string;

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const data: any = await api.get(`/users/${userId}`);
      setProfile(data);
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-32 w-full bg-muted rounded" />
          <div className="h-64 w-full bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">User not found</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const winRate = profile.stats?.totalMatches 
    ? Math.round((profile.stats.wins / profile.stats.totalMatches) * 100) 
    : 0;

  const handleSendMessage = () => {
    toast.info("Messaging feature coming soon!");
  };

  const handleAddFriend = () => {
    toast.info("Friend system coming soon!");
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="w-24 h-24 border-4 border-primary">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold">
                {profile.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{profile.username}</h1>
                  {isOwnProfile && (
                    <Badge variant="secondary">You</Badge>
                  )}
                  <Badge variant="outline" className="capitalize">
                    <Shield className="h-3 w-3 mr-1" />
                    {profile.role?.toLowerCase() || 'Player'}
                  </Badge>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {isOwnProfile ? profile.email : '••••••@••••.com'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {profile.profile?.bio && (
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {profile.profile.bio}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {isOwnProfile ? (
                  <>
                    <Button onClick={() => router.push('/profile/setup')}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/dashboard/settings')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleSendMessage}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                    <Button variant="outline" onClick={handleAddFriend}>
                      <Users className="mr-2 h-4 w-4" />
                      Add Friend
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Info Card */}
      {profile.profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-purple-500" />
              Game Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {profile.profile.gameUsername && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Game Username</p>
                  <p className="font-medium">{profile.profile.gameUsername}</p>
                </div>
              )}
              {profile.profile.gameId && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Game ID</p>
                  <p className="font-medium">{profile.profile.gameId}</p>
                </div>
              )}
              {profile.profile.rank && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Rank</p>
                  <Badge variant="secondary" className="font-medium">
                    <Star className="h-3 w-3 mr-1" />
                    {profile.profile.rank}
                  </Badge>
                </div>
              )}
              {profile.profile.country && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {profile.profile.country}
                  </p>
                </div>
              )}
            </div>
            
            {(isOwnProfile && profile.profile.phone) && (
              <Separator className="my-4" />
            )}
            
            {isOwnProfile && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.profile.phone && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {profile.profile.phone}
                    </p>
                  </div>
                )}
                {profile.profile.discordId && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Discord</p>
                    <p className="font-medium flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      {profile.profile.discordId}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs for different sections */}
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-3xl font-bold text-blue-600">
                  {profile.stats?.totalMatches || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Total Matches</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-3xl font-bold text-green-600">
                  {profile.stats?.wins || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Wins</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-3xl font-bold text-purple-600">
                  {profile.stats?.points || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Points</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <div className="text-3xl font-bold text-orange-600">
                  {winRate}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">Win Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Overview
              </CardTitle>
              <CardDescription>
                {isOwnProfile ? "Your" : `${profile.username}'s`} recent performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Performance chart coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          {profile.teams && profile.teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.teams.map((teamMember: any) => {
                const team = teamMember.team;
                return (
                  <Card 
                    key={team.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2">
                          <AvatarImage src={team.logo} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
                            {team.tag}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{team.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">Tag: {team.tag}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="capitalize">
                          {teamMember.role?.toLowerCase() || 'Member'}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {team._count?.members || 0}
                        </div>
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
                <p className="text-muted-foreground">
                  {isOwnProfile ? "You haven't" : `${profile.username} hasn't`} joined any teams yet
                </p>
                {isOwnProfile && (
                  <Button className="mt-4" onClick={() => router.push('/dashboard/teams')}>
                    Browse Teams
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                {isOwnProfile ? "Your" : `${profile.username}'s`} recent matches and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.recentMatches && profile.recentMatches.length > 0 ? (
                  profile.recentMatches.map((match: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${match.result === 'win' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className="flex-1">
                        <p className="font-medium">{match.title}</p>
                        <p className="text-sm text-muted-foreground">{match.date}</p>
                      </div>
                      <Badge variant={match.result === 'win' ? 'default' : 'secondary'}>
                        {match.result}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profile.achievements && profile.achievements.length > 0 ? (
                  profile.achievements.map((achievement: any, index: number) => (
                    <div key={index} className="text-center p-4 border rounded-lg">
                      <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      <p className="text-sm font-medium">{achievement.name}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No achievements yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
