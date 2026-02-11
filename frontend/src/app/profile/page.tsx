"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  Gamepad2,
  Camera,
  Edit,
  Save,
  X,
  Trophy,
  Target,
  Zap,
  Calendar,
  Shield,
  Key,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const profileData = {
  fullName: "Player Name",
  email: "player@example.com",
  phone: "+977 9812345678",
  ign: "ProGamer123",
  uid: "123456789",
  avatar: "",
  level: 25,
  joinDate: "Jan 2024",
  stats: {
    totalMatches: 45,
    wins: 28,
    kills: 320,
    winRate: 62,
  },
};

export default function ProfilePage() {
  const { user, loading, updateUserAvatar } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatar, setAvatar] = useState(profileData.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: profileData.fullName,
    email: profileData.email,
    phone: profileData.phone,
    ign: profileData.ign,
    uid: profileData.uid,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
    
    // Load user's avatar if available
    if (user?.avatar) {
      setAvatar(user.avatar);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsLoading(true);
    
    // Save avatar to context
    if (avatar !== user?.avatar) {
      updateUserAvatar(avatar);
    }
    
    // Simulate API call for other data
    setTimeout(() => {
      setIsLoading(false);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    }, 1000);
  };

  const handleCancel = () => {
    setFormData({
      fullName: profileData.fullName,
      email: profileData.email,
      phone: profileData.phone,
      ign: profileData.ign,
      uid: profileData.uid,
    });
    setAvatar(user?.avatar || profileData.avatar);
    setIsEditing(false);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account information and gaming profile
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-primary">
                    <AvatarImage src={avatar} alt="Profile" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl">
                      {formData.fullName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </>
                  )}
                </div>

                {/* Name & Level */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold">{formData.fullName}</h2>
                  <p className="text-muted-foreground">{formData.ign}</p>
                  <Badge variant="secondary" className="mt-2">
                    Level {profileData.level}
                  </Badge>
                </div>

                <Separator />

                {/* Quick Stats */}
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="text-sm font-medium">{profileData.joinDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Matches</span>
                    <span className="text-sm font-medium">{profileData.stats.totalMatches}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="text-sm font-medium text-green-600">
                      {profileData.stats.winRate}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">Wins</span>
                </div>
                <span className="font-bold">{profileData.stats.wins}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-red-500" />
                  <span className="text-sm">Total Kills</span>
                </div>
                <span className="font-bold">{profileData.stats.kills}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">Matches</span>
                </div>
                <span className="font-bold">{profileData.stats.totalMatches}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Profile Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal and gaming details</CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="gaming">Gaming</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                {/* Personal Information */}
                <TabsContent value="personal" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-600">
                        <Shield className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                      <Badge variant="secondary">
                        <Calendar className="mr-1 h-3 w-3" />
                        Joined {profileData.joinDate}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>

                {/* Gaming Information */}
                <TabsContent value="gaming" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ign">In-Game Name (IGN)</Label>
                    <div className="relative">
                      <Gamepad2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="ign"
                        value={formData.ign}
                        onChange={(e) => setFormData({ ...formData, ign: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uid">Free Fire UID</Label>
                    <Input
                      id="uid"
                      value={formData.uid}
                      onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                      disabled={!isEditing}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your unique Free Fire player ID
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold">Gaming Statistics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Matches</p>
                        <p className="text-2xl font-bold">{profileData.stats.totalMatches}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Wins</p>
                        <p className="text-2xl font-bold text-green-600">{profileData.stats.wins}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Kills</p>
                        <p className="text-2xl font-bold text-red-600">{profileData.stats.kills}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <p className="text-2xl font-bold text-blue-600">{profileData.stats.winRate}%</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Security */}
                <TabsContent value="security" className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h4 className="font-semibold">Password</h4>
                            <p className="text-sm text-muted-foreground">
                              Last changed 30 days ago
                            </p>
                          </div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Change
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change Password</DialogTitle>
                              <DialogDescription>
                                Enter your current password and choose a new one
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Current Password</Label>
                                <Input type="password" placeholder="Enter current password" />
                              </div>
                              <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input type="password" placeholder="Enter new password" />
                              </div>
                              <div className="space-y-2">
                                <Label>Confirm New Password</Label>
                                <Input type="password" placeholder="Confirm new password" />
                              </div>
                              <Button className="w-full">Update Password</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h4 className="font-semibold">Two-Factor Authentication</h4>
                            <p className="text-sm text-muted-foreground">
                              Add an extra layer of security
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Enable
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h4 className="font-semibold">Email Verification</h4>
                            <p className="text-sm text-muted-foreground">
                              Your email is verified
                            </p>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-600">
                          Verified
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
