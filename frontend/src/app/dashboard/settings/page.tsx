"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/user.service";
import { toast } from "sonner";
import { Camera, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { getCachedPageData, setCachedPageData } from "@/lib/page-cache";

const SETTINGS_PAGE_CACHE_KEY = "dashboard:settings:profile";
const SETTINGS_PAGE_CACHE_TTL_MS = 2 * 60 * 1000;

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile data
  const [profileData, setProfileData] = useState({
    gameId: "",
    gameUsername: "",
    rank: "",
    bio: "",
    phone: "",
    country: "",
    discordId: "",
  });

  // Notification settings (stored in localStorage for now)
  const [notifications, setNotifications] = useState({
    tournaments: true,
    teamInvites: true,
    matchReminders: true,
  });

  // Privacy settings (stored in localStorage for now)
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showStats: true,
  });

  useEffect(() => {
    const cached = getCachedPageData<typeof profileData>(SETTINGS_PAGE_CACHE_KEY, SETTINGS_PAGE_CACHE_TTL_MS);
    if (cached) {
      setProfileData(cached);
      setLoading(false);
      void loadProfile({ silent: true });
    } else {
      void loadProfile();
    }
    loadSettings();
  }, []);

  const loadProfile = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true);
      const profile = await userService.getProfile();
      
      if (profile) {
        setProfileData({
          gameId: profile.gameId || "",
          gameUsername: profile.gameUsername || "",
          rank: profile.rank || "",
          bio: profile.bio || "",
          phone: profile.phone || "",
          country: profile.country || "",
          discordId: profile.discordId || "",
        });
        setCachedPageData(SETTINGS_PAGE_CACHE_KEY, {
          gameId: profile.gameId || "",
          gameUsername: profile.gameUsername || "",
          rank: profile.rank || "",
          bio: profile.bio || "",
          phone: profile.phone || "",
          country: profile.country || "",
          discordId: profile.discordId || "",
        });
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    // Load from localStorage
    const savedNotifications = localStorage.getItem("notifications");
    const savedPrivacy = localStorage.getItem("privacy");

    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    if (savedPrivacy) {
      setPrivacy(JSON.parse(savedPrivacy));
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await userService.updateProfile(profileData);
      await refreshUser();
      setCachedPageData(SETTINGS_PAGE_CACHE_KEY, profileData);
      toast.success("Profile updated successfully");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      setUploadingAvatar(true);
      await userService.uploadAvatar(file);
      await refreshUser();
      toast.success("Avatar updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem("notifications", JSON.stringify(updated));
    toast.success("Notification settings updated");
  };

  const handlePrivacyChange = (key: keyof typeof privacy) => {
    const updated = { ...privacy, [key]: !privacy[key] };
    setPrivacy(updated);
    localStorage.setItem("privacy", JSON.stringify(updated));
    toast.success("Privacy settings updated");
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Avatar Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Update your profile picture</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.avatar} alt={user?.username} />
              <AvatarFallback className="text-2xl">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <Label htmlFor="avatar" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Camera className="h-4 w-4" />
                <span>JPG, PNG or GIF (max. 5MB)</span>
              </div>
              <Button type="button" variant="outline" disabled={uploadingAvatar} asChild>
                <span>
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Photo"
                  )}
                </span>
              </Button>
            </Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={user?.username || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Username cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gameId">Game ID</Label>
                <Input
                  id="gameId"
                  placeholder="Your Free Fire ID"
                  value={profileData.gameId}
                  onChange={(e) => setProfileData({ ...profileData, gameId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gameUsername">Game Username</Label>
                <Input
                  id="gameUsername"
                  placeholder="Your in-game name"
                  value={profileData.gameUsername}
                  onChange={(e) => setProfileData({ ...profileData, gameUsername: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rank">Rank</Label>
                <Select
                  value={profileData.rank}
                  onValueChange={(value) => setProfileData({ ...profileData, rank: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bronze">Bronze</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                    <SelectItem value="Diamond">Diamond</SelectItem>
                    <SelectItem value="Heroic">Heroic</SelectItem>
                    <SelectItem value="Grandmaster">Grandmaster</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+977 9800000000"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Nepal"
                  value={profileData.country}
                  onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discordId">Discord ID</Label>
                <Input
                  id="discordId"
                  placeholder="username#1234"
                  value={profileData.discordId}
                  onChange={(e) => setProfileData({ ...profileData, discordId: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                rows={4}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tournament Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about tournaments
              </p>
            </div>
            <Switch
              checked={notifications.tournaments}
              onCheckedChange={() => handleNotificationChange("tournaments")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Team Invitations</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when invited to teams
              </p>
            </div>
            <Switch
              checked={notifications.teamInvites}
              onCheckedChange={() => handleNotificationChange("teamInvites")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Match Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Reminders before scheduled matches
              </p>
            </div>
            <Switch
              checked={notifications.matchReminders}
              onCheckedChange={() => handleNotificationChange("matchReminders")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Control your privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to others
              </p>
            </div>
            <Switch
              checked={privacy.profileVisible}
              onCheckedChange={() => handlePrivacyChange("profileVisible")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Statistics</Label>
              <p className="text-sm text-muted-foreground">
                Display your stats on your profile
              </p>
            </div>
            <Switch
              checked={privacy.showStats}
              onCheckedChange={() => handlePrivacyChange("showStats")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
