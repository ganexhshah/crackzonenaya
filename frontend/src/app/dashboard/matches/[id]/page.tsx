"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Lock,
  Unlock,
  Upload,
  CheckCircle2,
  Timer,
  Copy,
  Check,
  Crown,
  Loader2,
} from "lucide-react";
import { matchService, type Match } from "@/services/match.service";
import { toast } from "sonner";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRoomUnlocked, setIsRoomUnlocked] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [copiedField, setCopiedField] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setIsLoading(true);
      const data = await matchService.getMatchById(matchId);
      setMatch(data);
      setIsUploaded(!!data.result);
    } catch (error: any) {
      console.error('Failed to load match:', error);
      toast.error(error.message || 'Failed to load match details');
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (!match) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const matchTime = new Date(match.scheduledAt).getTime();
      const difference = matchTime - now;
      
      setTimeLeft(difference);
      
      // Unlock room 15 minutes before match
      if (difference <= 15 * 60 * 1000 && difference > 0) {
        setIsRoomUnlocked(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [match]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return "Match Started";
    
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setScreenshot(file);
    }
  };


  const handleUpload = async () => {
    if (!screenshot) {
      toast.error("Please select a screenshot first");
      return;
    }
    
    try {
      setIsUploading(true);
      
      // In a real implementation, you would upload the file first
      // then submit the result with the file URL
      await matchService.submitResult(matchId, {
        result: "PENDING_VERIFICATION",
        score: "0", // This would come from the screenshot or user input
      });
      
      setIsUploaded(true);
      toast.success("Screenshot uploaded successfully!");
    } catch (error: any) {
      console.error('Failed to upload screenshot:', error);
      toast.error(error.message || 'Failed to upload screenshot');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Match not found</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/matches">Back to Matches</Link>
          </Button>
        </div>
      </div>
    );
  }

  const matchDate = new Date(match.scheduledAt);
  const formattedDate = matchDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const formattedTime = matchDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/matches">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Match Details</h1>
          <p className="text-muted-foreground mt-1">
            {match.title}
          </p>
        </div>
      </div>

      {/* Countdown Timer */}
      <Card className="border-primary">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Timer className="h-5 w-5" />
              <span className="text-sm font-medium">Match Starts In</span>
            </div>
            <div className="text-4xl md:text-5xl font-bold text-primary">
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm text-muted-foreground">
              {formattedDate} at {formattedTime}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Match Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Match Information</CardTitle>
                <Badge variant={match.status === "SCHEDULED" ? "default" : match.status === "COMPLETED" ? "secondary" : "outline"}>
                  {match.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">{formattedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-medium">{formattedTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium">{match.matchType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Opponent</p>
                    <p className="font-medium">{match.opponentName}</p>
                  </div>
                </div>
              </div>
              {match.description && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">{match.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Room Details */}
          <Card className={isRoomUnlocked ? "border-green-500" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {isRoomUnlocked ? (
                    <Unlock className="h-5 w-5 text-green-600" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                  Room Details
                </CardTitle>
                {isRoomUnlocked && (
                  <Badge variant="default" className="bg-green-600">Unlocked</Badge>
                )}
              </div>
              <CardDescription>
                {isRoomUnlocked
                  ? "Room details are now available"
                  : "Room details will unlock 15 minutes before match"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isRoomUnlocked && match.roomId ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Room ID</Label>
                    <div className="flex gap-2">
                      <Input
                        value={match.roomId}
                        readOnly
                        className="font-mono text-lg font-bold"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(match.roomId!, "roomId")}
                      >
                        {copiedField === "roomId" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {match.roomPassword && (
                    <div className="space-y-2">
                      <Label>Room Password</Label>
                      <div className="flex gap-2">
                        <Input
                          value={match.roomPassword}
                          readOnly
                          className="font-mono text-lg font-bold"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(match.roomPassword!, "password")}
                        >
                          {copiedField === "password" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-green-900 dark:text-green-100">
                      <strong>Important:</strong> Join the room 5 minutes before match time. 
                      Make sure all team members are ready.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="font-medium text-muted-foreground">Room Locked</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {match.roomId 
                      ? "Details will be available 15 minutes before match"
                      : "Room details not yet available"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Result */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Result Screenshot</CardTitle>
              <CardDescription>
                Submit your match result within 10 minutes after completion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isUploaded ? (
                <>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium mb-2">
                      {screenshot ? screenshot.name : "No file selected"}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Screenshot
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG (Max 5MB)
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleUpload}
                    disabled={!screenshot || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Screenshot
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p className="font-medium text-green-600">Screenshot Uploaded!</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Results will be verified and points will be awarded soon
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team Roster */}
          <Card>
            <CardHeader>
              <CardTitle>Team Roster</CardTitle>
              <CardDescription>{match.team?.name || "Your Team"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {match.players && match.players.length > 0 ? (
                match.players.map((player) => (
                  <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={player.user.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-sm">
                        {player.user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm flex items-center gap-1">
                        {player.user.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        K: {player.kills} / D: {player.deaths} / A: {player.assists}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No player stats available yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Match Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Match Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-muted-foreground">1.</span>
                  <span>Join the room 5 minutes before match time</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">2.</span>
                  <span>All players must use registered IGN and UID</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">3.</span>
                  <span>No hacking or third-party tools allowed</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground">4.</span>
                  <span>Screenshot proof required for results</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
