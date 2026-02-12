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
  Star,
  Instagram,
  Link as LinkIcon,
  Save,
  X,
  Copy,
  Check
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getCachedPageData, setCachedPageData } from "@/lib/page-cache";

const PROFILE_PAGE_CACHE_TTL_MS = 2 * 60 * 1000;

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  createdAt: string;
  gameName?: string;
  gameId?: string;
  profile?: {
    gameId?: string;
    gameUsername?: string;
    rank?: string;
    bio?: string;
    phone?: string;
    country?: string;
    discordId?: string;
    instagramHandle?: string;
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [socialHandles, setSocialHandles] = useState({
    discordId: '',
    instagramHandle: ''
  });
  const [profileData, setProfileData] = useState({
    gameName: '',
    gameId: '',
    gameUsername: '',
    rank: '',
    bio: '',
    phone: '',
    country: '',
    discordId: '',
    instagramHandle: ''
  });
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const userId = params.id as string;

  useEffect(() => {
    if (userId) {
      const cacheKey = `dashboard:profile:${userId}`;
      const cached = getCachedPageData<UserProfile>(cacheKey, PROFILE_PAGE_CACHE_TTL_MS);
      if (cached) {
        setProfile(cached);
        setLoading(false);
        void fetchUserProfile({ silent: true });
      } else {
        void fetchUserProfile();
      }
    }
  }, [userId]);

  useEffect(() => {
    if (profile?.profile) {
      setSocialHandles({
        discordId: profile.profile.discordId || '',
        instagramHandle: profile.profile.instagramHandle || ''
      });
      setProfileData({
        gameName: profile.gameName || '',
        gameId: profile.gameId || '',
        gameUsername: profile.profile.gameUsername || '',
        rank: profile.profile.rank || '',
        bio: profile.profile.bio || '',
        phone: profile.profile.phone || '',
        country: profile.profile.country || '',
        discordId: profile.profile.discordId || '',
        instagramHandle: profile.profile.instagramHandle || ''
      });
    }
  }, [profile]);

  const fetchUserProfile = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true);
      const data: any = await api.get(`/users/${userId}`);
      setProfile(data);
      setCachedPageData(`dashboard:profile:${userId}`, data);
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

  const handleSaveSocialHandles = async () => {
    try {
      setSaving(true);
      await api.put(`/users/${userId}/profile`, {
        discordId: socialHandles.discordId,
        instagramHandle: socialHandles.instagramHandle
      });
      toast.success("Social handles updated successfully!");
      setEditDialogOpen(false);
      fetchUserProfile();
    } catch (error: any) {
      console.error('Failed to update social handles:', error);
      toast.error(error.response?.data?.message || 'Failed to update social handles');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await api.put(`/users/${userId}/profile`, profileData);
      toast.success("Profile updated successfully!");
      setEditProfileDialogOpen(false);
      fetchUserProfile();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
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
                    <Dialog open={editProfileDialogOpen} onOpenChange={setEditProfileDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                          <DialogDescription>
                            Update your profile information, game details, and social handles
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          {/* Game Information Section */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                              <Gamepad2 className="h-4 w-4 text-purple-500" />
                              Game Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="gameId">Game ID</Label>
                                <Input
                                  id="gameId"
                                  placeholder="Enter your game ID"
                                  value={profileData.gameId}
                                  onChange={(e) => setProfileData({ ...profileData, gameId: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="gameName">Game Name</Label>
                                <Input
                                  id="gameName"
                                  placeholder="Enter your game name"
                                  value={profileData.gameName}
                                  onChange={(e) => setProfileData({ ...profileData, gameName: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="gameUsername">Alt Game Username</Label>
                                <Input
                                  id="gameUsername"
                                  placeholder="Alternative game username"
                                  value={profileData.gameUsername}
                                  onChange={(e) => setProfileData({ ...profileData, gameUsername: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="rank">Rank</Label>
                                <Input
                                  id="rank"
                                  placeholder="Your rank (e.g., Diamond, Master)"
                                  value={profileData.rank}
                                  onChange={(e) => setProfileData({ ...profileData, rank: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Social Handles Section */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                              <LinkIcon className="h-4 w-4" />
                              Social Handles
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="discordId" className="flex items-center gap-2">
                                  <MessageCircle className="h-4 w-4 text-indigo-500" />
                                  Discord Username
                                </Label>
                                <Input
                                  id="discordId"
                                  placeholder="username#1234"
                                  value={profileData.discordId}
                                  onChange={(e) => setProfileData({ ...profileData, discordId: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="instagramHandle" className="flex items-center gap-2">
                                  <Instagram className="h-4 w-4 text-pink-500" />
                                  Instagram Handle
                                </Label>
                                <Input
                                  id="instagramHandle"
                                  placeholder="@username"
                                  value={profileData.instagramHandle}
                                  onChange={(e) => setProfileData({ ...profileData, instagramHandle: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Personal Information Section */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Personal Information
                            </h3>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                  id="bio"
                                  placeholder="Tell us about yourself..."
                                  value={profileData.bio}
                                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                  rows={3}
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="phone">Phone Number</Label>
                                  <Input
                                    id="phone"
                                    placeholder="+1234567890"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="country">Country</Label>
                                  <Input
                                    id="country"
                                    placeholder="Your country"
                                    value={profileData.country}
                                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setEditProfileDialogOpen(false)} disabled={saving}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button onClick={handleSaveProfile} disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-purple-500" />
              Game Information
            </CardTitle>
            <CardDescription className="mt-1">
              In-game details and social handles
            </CardDescription>
          </div>
          {isOwnProfile && (
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Socials
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Social Handles</DialogTitle>
                  <DialogDescription>
                    Update your Discord and Instagram handles
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="discord" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-indigo-500" />
                      Discord Username
                    </Label>
                    <Input
                      id="discord"
                      placeholder="username#1234"
                      value={socialHandles.discordId}
                      onChange={(e) => setSocialHandles({ ...socialHandles, discordId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-500" />
                      Instagram Handle
                    </Label>
                    <Input
                      id="instagram"
                      placeholder="@username"
                      value={socialHandles.instagramHandle}
                      onChange={(e) => setSocialHandles({ ...socialHandles, instagramHandle: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSocialHandles} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {/* Primary Game Info - From User Model */}
          {(profile.gameId || profile.gameName) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                <Gamepad2 className="h-4 w-4" />
                Primary Game Account
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Game ID from User */}
                {profile.gameId && (
                  <button
                    onClick={() => handleCopyToClipboard(profile.gameId!, 'Game ID')}
                    className="space-y-2 p-5 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-2 border-purple-500/20 rounded-lg hover:border-purple-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer text-left group relative"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Game ID</p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedField === 'Game ID' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-purple-500" />
                        )}
                      </div>
                    </div>
                    <p className="font-mono font-bold text-2xl text-purple-600 dark:text-purple-400">{profile.gameId}</p>
                    <p className="text-xs text-muted-foreground">Click to copy</p>
                  </button>
                )}
                
                {/* Game Name from User */}
                {profile.gameName && (
                  <button
                    onClick={() => handleCopyToClipboard(profile.gameName!, 'Game Name')}
                    className="space-y-2 p-5 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-2 border-indigo-500/20 rounded-lg hover:border-indigo-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer text-left group relative"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Game Name</p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedField === 'Game Name' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-indigo-500" />
                        )}
                      </div>
                    </div>
                    <p className="font-bold text-2xl text-indigo-600 dark:text-indigo-400">{profile.gameName}</p>
                    <p className="text-xs text-muted-foreground">Click to copy</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Additional Game Info - From Profile Model */}
          {profile.profile && (profile.profile.gameId || profile.profile.gameUsername || profile.profile.rank) && (
            <>
              {(profile.gameId || profile.gameName) && <Separator className="my-6" />}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  Additional Game Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Game ID from Profile */}
                  {profile.profile.gameId && (
                    <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Alt Game ID</p>
                      <p className="font-mono font-semibold text-lg">{profile.profile.gameId}</p>
                    </div>
                  )}
                  
                  {/* Game Username from Profile */}
                  {profile.profile.gameUsername && (
                    <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Alt Game Name</p>
                      <p className="font-semibold text-lg">{profile.profile.gameUsername}</p>
                    </div>
                  )}
                  
                  {/* Rank */}
                  {profile.profile.rank && (
                    <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Rank</p>
                      <Badge variant="secondary" className="font-medium text-base">
                        <Star className="h-4 w-4 mr-1" />
                        {profile.profile.rank}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Social Handles Section */}
          {(profile.profile?.discordId || profile.profile?.instagramHandle || isOwnProfile) && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Social Handles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Discord */}
                  <button
                    onClick={() => profile.profile?.discordId && handleCopyToClipboard(profile.profile.discordId, 'Discord')}
                    disabled={!profile.profile?.discordId}
                    className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${
                      profile.profile?.discordId 
                        ? 'hover:bg-muted/50 hover:border-indigo-500/40 hover:shadow-md cursor-pointer group' 
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs text-muted-foreground">Discord</p>
                      <p className="font-medium truncate">
                        {profile.profile?.discordId || (isOwnProfile ? 'Not set' : 'Private')}
                      </p>
                    </div>
                    {profile.profile?.discordId && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedField === 'Discord' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-indigo-500" />
                        )}
                      </div>
                    )}
                  </button>
                  
                  {/* Instagram */}
                  <button
                    onClick={() => profile.profile?.instagramHandle && handleCopyToClipboard(profile.profile.instagramHandle, 'Instagram')}
                    disabled={!profile.profile?.instagramHandle}
                    className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${
                      profile.profile?.instagramHandle 
                        ? 'hover:bg-muted/50 hover:border-pink-500/40 hover:shadow-md cursor-pointer group' 
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                      <Instagram className="h-5 w-5 text-pink-500" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs text-muted-foreground">Instagram</p>
                      <p className="font-medium truncate">
                        {profile.profile?.instagramHandle || (isOwnProfile ? 'Not set' : 'Private')}
                      </p>
                    </div>
                    {profile.profile?.instagramHandle && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedField === 'Instagram' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-pink-500" />
                        )}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
          
          {/* Additional Info */}
          {(profile.profile?.country || (isOwnProfile && profile.profile?.phone)) && (
            <>
              <Separator className="my-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.profile.country && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Country</p>
                    <p className="font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {profile.profile.country}
                    </p>
                  </div>
                )}
                {isOwnProfile && profile.profile.phone && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {profile.profile.phone}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
