"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, User, Gamepad2, Camera, CheckCircle2, Clipboard } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profileImage, setProfileImage] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [formData, setFormData] = useState({
    ign: "",
    uid: "",
  });

  useEffect(() => {
    // Check if user is authenticated
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    // Load existing data if available
    if (user) {
      if (user.avatar) {
        setProfileImage(user.avatar);
      }
      if ((user as any).gameId) {
        setFormData(prev => ({ ...prev, uid: (user as any).gameId }));
      }
      if ((user as any).gameName) {
        setFormData(prev => ({ ...prev, ign: (user as any).gameName }));
      }
    }

    // Show welcome message for first-time users
    if (typeof window !== 'undefined') {
      const isFirstTime = localStorage.getItem('isFirstTimeUser');
      if (isFirstTime === 'true') {
        setShowWelcome(true);
        toast.success('Registration Successful!', {
          description: 'Welcome! Please complete your gaming profile to get started.',
          duration: 5000,
        });
        localStorage.removeItem('isFirstTimeUser');
      }
    }
  }, [user, loading, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: "Image size must be less than 5MB" });
        return;
      }

      if (!file.type.startsWith("image/")) {
        setErrors({ ...errors, image: "Please upload a valid image file" });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        setErrors({ ...errors, image: "" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasteUID = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleanedUID = text.replace(/\D/g, '').slice(0, 10);
      if (cleanedUID) {
        setFormData({ ...formData, uid: cleanedUID });
        toast.success('UID pasted successfully!');
      } else {
        toast.error('No valid UID found in clipboard');
      }
    } catch (error) {
      toast.error('Failed to paste from clipboard');
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    try {
      const response = await api.uploadFile<{ url: string }>('/users/upload/avatar', file, 'file');
      return response.url;
    } catch (error: any) {
      console.error('Image upload error:', error);
      throw new Error(error?.message || 'Failed to upload image');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ign.trim()) {
      newErrors.ign = "In-game name is required";
    }

    if (!formData.uid.trim()) {
      newErrors.uid = "Free Fire UID is required";
    } else if (!/^\d+$/.test(formData.uid)) {
      newErrors.uid = "UID must contain only numbers";
    } else if (formData.uid.length !== 10) {
      newErrors.uid = "UID must be exactly 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let avatarUrl = profileImage;

      // Upload image to Cloudinary if a new image was selected
      if (imageFile) {
        try {
          setUploadingImage(true);
          toast.info('Uploading profile picture...');
          avatarUrl = await uploadImageToCloudinary(imageFile);
          setUploadingImage(false);
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError);
          toast.warning('Image upload failed, continuing without image');
          setUploadingImage(false);
          avatarUrl = profileImage; // Keep existing image or empty
        }
      }

      // Save profile data to backend
      await api.put('/users/profile', {
        gameName: formData.ign,
        gameId: formData.uid,
        avatar: avatarUrl || undefined,
      });

      // Refresh user data
      await refreshUser();

      toast.success('Profile Updated!', {
        description: 'Your gaming profile has been saved successfully.',
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error('Profile setup error:', error);
      toast.error('Failed to save profile', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 px-4 sm:px-6">
          {showWelcome && (
            <Alert className="mb-4 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                <strong>Welcome aboard!</strong> Your account has been created successfully.
              </AlertDescription>
            </Alert>
          )}
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">Setup Your Gaming Profile</CardTitle>
          <CardDescription className="text-center text-sm">
            Complete your profile to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-blue-100 dark:border-blue-900">
                  <AvatarImage src={profileImage} alt="Profile" />
                  <AvatarFallback className="bg-linear-to-br from-blue-400 to-indigo-500 text-white text-2xl sm:text-3xl">
                    <User className="w-12 h-12 sm:w-16 sm:h-16" />
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 sm:p-3 shadow-lg transition-colors"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="text-xs sm:text-sm"
                >
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Upload Profile Picture
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG or GIF (Max 5MB)
                </p>
              </div>
              {errors.image && (
                <p className="text-sm text-red-500">{errors.image}</p>
              )}
            </div>

            {/* In-Game Name */}
            <div className="space-y-2">
              <Label htmlFor="ign" className="text-sm sm:text-base">In-Game Name (IGN) *</Label>
              <div className="relative">
                <Gamepad2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="ign"
                  type="text"
                  placeholder="Your Free Fire IGN"
                  className="pl-10 text-sm sm:text-base"
                  value={formData.ign}
                  onChange={(e) => setFormData({ ...formData, ign: e.target.value })}
                  required
                />
              </div>
              {errors.ign && (
                <p className="text-sm text-red-500">{errors.ign}</p>
              )}
            </div>

            {/* Free Fire UID */}
            <div className="space-y-2">
              <Label htmlFor="uid" className="text-sm sm:text-base">Free Fire UID (10 digits) *</Label>
              <div className="relative">
                <Input
                  id="uid"
                  type="text"
                  placeholder="Enter your 10-digit UID"
                  className="pr-12 text-sm sm:text-base"
                  value={formData.uid}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, uid: value });
                  }}
                  maxLength={10}
                  required
                />
                <button
                  type="button"
                  onClick={handlePasteUID}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="Paste UID from clipboard"
                >
                  <Clipboard className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Your UID is a 10-digit number found in your Free Fire profile
              </p>
              {errors.uid && (
                <p className="text-sm text-red-500">{errors.uid}</p>
              )}
            </div>

            <Alert className="text-sm">
              <AlertDescription>
                <strong className="text-sm">How to find your UID:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-xs sm:text-sm">
                  <li>Open Free Fire game</li>
                  <li>Tap on your profile icon</li>
                  <li>Your 10-digit UID is displayed below your name</li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button type="submit" className="w-full text-sm sm:text-base" disabled={isLoading || uploadingImage}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingImage ? 'Uploading image...' : 'Saving profile...'}
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
