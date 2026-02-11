"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Upload, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function EditTeamPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const teamId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [teamLogo, setTeamLogo] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    description: "",
  });

  useEffect(() => {
    if (teamId && user) {
      fetchTeam();
    }
  }, [teamId, user?.id]);

  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      const team: any = await api.get(`/teams/${teamId}`);
      
      // Check if user is owner (not captainId, it's ownerId)
      if (team.ownerId !== user?.id) {
        toast.error('Only the team owner can edit the team');
        router.push(`/dashboard/teams/${teamId}`);
        return;
      }

      setFormData({
        name: team.name || "",
        tag: team.tag || "",
        description: team.description || "",
      });
      setTeamLogo(team.logo || "");
    } catch (error: any) {
      console.error('Failed to fetch team:', error);
      toast.error('Failed to load team');
      router.push('/dashboard/teams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ ...errors, logo: "Logo size must be less than 2MB" });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeamLogo(reader.result as string);
        setErrors({ ...errors, logo: "" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = "Team name is required";
    if (!formData.tag.trim()) newErrors.tag = "Team tag is required";
    if (formData.tag.length > 5) newErrors.tag = "Tag must be 5 characters or less";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSaving(true);
      
      // Update team
      await api.put(`/teams/${teamId}`, {
        name: formData.name,
        description: formData.description,
      });

      // Upload logo if changed
      if (logoFile) {
        try {
          await api.uploadFile(`/teams/${teamId}/logo`, logoFile, 'logo');
        } catch (error) {
          console.error('Failed to upload logo:', error);
          // Continue anyway, logo upload is optional
        }
      }

      toast.success('Team updated successfully!');
      router.push(`/dashboard/teams/${teamId}`);
    } catch (error: any) {
      console.error('Failed to update team:', error);
      toast.error(error.message || 'Failed to update team');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/teams/${teamId}`);
      toast.success('Team deleted successfully');
      router.push('/dashboard/teams');
    } catch (error: any) {
      console.error('Failed to delete team:', error);
      toast.error(error.message || 'Failed to delete team');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/teams">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Edit Team</h1>
            <p className="text-muted-foreground mt-1">Loading...</p>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/teams/${teamId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Edit Team</h1>
          <p className="text-muted-foreground mt-1">
            Update your team information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Information */}
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>Update basic details about your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24 border-4 border-border">
                <AvatarImage src={teamLogo} alt="Team Logo" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold">
                  {formData.tag || "TEAM"}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Change Team Logo
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG, JPG or GIF (Max 2MB)
              </p>
              {errors.logo && (
                <p className="text-sm text-red-500">{errors.logo}</p>
              )}
            </div>

            <Separator />

            {/* Team Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                placeholder="Enter team name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Team Tag (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="tag">Team Tag</Label>
              <Input
                id="tag"
                value={formData.tag}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Team tag cannot be changed after creation
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Tell others about your team..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that will affect your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Team
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your team
              and remove all associated data including match history and statistics.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
