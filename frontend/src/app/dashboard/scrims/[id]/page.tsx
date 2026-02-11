"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Calendar, Clock, Users, Trophy, DollarSign, 
  MapPin, Gamepad2, Shield, Info, CheckCircle2, XCircle, Wallet 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { scrimService, Scrim } from "@/services/scrim.service";
import { teamService } from "@/services/team.service";
import { teamWalletService } from "@/services/team-wallet.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ScrimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [scrim, setScrim] = useState<Scrim | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  
  // Team wallet states
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [teamBalance, setTeamBalance] = useState(0);
  const [showMoneyRequestDialog, setShowMoneyRequestDialog] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    if (params.id) {
      loadScrim();
    }
  }, [params.id]);

  const loadScrim = async () => {
    try {
      setLoading(true);
      const data = await scrimService.getScrim(params.id as string);
      setScrim(data);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load scrim");
      router.push("/dashboard/scrims");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error("Please login to register");
      router.push("/auth/login");
      return;
    }

    try {
      setRegistering(true);
      
      const scrimType = scrim?.scrimConfig?.basicInformation?.scrimType;
      const isPaid = scrim?.scrimConfig?.entryPrizeSettings?.entryType === "PAID";
      const entryFee = scrim?.scrimConfig?.entryPrizeSettings?.entryFeeAmount || 0;

      // Check if team scrim
      if (scrimType === 'SQUAD' || scrimType === 'DUO') {
        // Load user teams
        const teams: any = await teamService.getUserTeams();
        setUserTeams(teams);

        if (!teams || teams.length === 0) {
          toast.error("You need to join a team first!");
          setTimeout(() => router.push('/dashboard/teams'), 2000);
          return;
        }

        // Find team where user is leader
        const leaderTeam = teams.find((t: any) => t.ownerId === user.id);

        if (!leaderTeam) {
          toast.error("Only team leader can register for team scrims!");
          toast.info("Please ask your team leader to register");
          return;
        }

        setSelectedTeam(leaderTeam);

        // Check if paid scrim
        if (isPaid && entryFee > 0) {
          // Get team wallet balance
          const balanceData = await teamWalletService.getBalance(leaderTeam.id);
          setTeamBalance(balanceData.balance);

          if (balanceData.balance < entryFee) {
            // Insufficient team wallet - need to collect from members
            toast.info(`Team wallet has ₹${balanceData.balance}. Need ₹${entryFee} for entry.`);
            
            // Load team members with their balances
            const teamDetails: any = await teamService.getTeam(leaderTeam.id);
            const members = teamDetails.members || [];
            
            // Filter out the leader
            const otherMembers = members.filter((m: any) => m.userId !== user.id);
            setTeamMembers(otherMembers);
            
            // Auto-select all members initially
            setSelectedMembers(otherMembers.map((m: any) => m.userId));
            
            // Show money request dialog
            setShowMoneyRequestDialog(true);
            setRegistering(false);
            return;
          }

          // Team has sufficient balance - proceed with registration
          toast.success("Team wallet has sufficient balance!");
          await registerTeamForScrim(leaderTeam.id, entryFee);
        } else {
          // Free scrim - direct registration
          await registerTeamForScrim(leaderTeam.id, 0);
        }
      } else {
        // Solo scrim - existing logic
        if (isPaid && entryFee > 0) {
          toast.info(`Entry fee: ₹${entryFee}. Redirecting to payment...`);
          // TODO: Implement solo payment flow
          toast.success("Registration initiated! Complete payment to confirm.");
        } else {
          await scrimService.addPlayer(scrim!.id, user.id);
          toast.success("Successfully registered for scrim!");
          loadScrim();
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to register");
    } finally {
      setRegistering(false);
    }
  };

  const registerTeamForScrim = async (teamId: string, entryFee: number) => {
    try {
      // TODO: Implement actual team registration API
      // For now, just show success
      toast.success(`Team registered successfully! Entry fee: ₹${entryFee}`);
      loadScrim();
    } catch (error: any) {
      throw new Error(error?.message || "Failed to register team");
    }
  };

  const handleSendMoneyRequests = async () => {
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one team member");
      return;
    }

    if (!selectedTeam) return;

    try {
      const entryFee = scrim?.scrimConfig?.entryPrizeSettings?.entryFeeAmount || 0;
      const needed = entryFee - teamBalance;
      const perMember = needed / (selectedMembers.length + 1); // +1 for leader

      // Send money requests
      const result = await teamWalletService.requestMoney(
        selectedTeam.id,
        selectedMembers,
        perMember,
        `Entry fee for ${scrim?.title}`
      );

      toast.success(`Money requests sent to ${selectedMembers.length} members!`);
      toast.info(`Each member needs to contribute ₹${perMember.toFixed(2)}`);
      
      setShowMoneyRequestDialog(false);
      
      // Show info about next steps
      setTimeout(() => {
        toast.info("Waiting for team members to approve requests...");
      }, 1000);
    } catch (error: any) {
      if (error?.insufficientMembers) {
        const members = error.insufficientMembers;
        toast.error(`Some members have insufficient balance:`);
        members.forEach((m: any) => {
          toast.error(`${m.username}: ₹${m.balance} (need ₹${m.required})`);
        });
      } else {
        toast.error(error?.message || "Failed to send money requests");
      }
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const formatDate = (value: string) => 
    new Date(value).toLocaleDateString("en-US", { 
      weekday: "long", 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });

  const formatTime = (value: string) => 
    new Date(value).toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit", 
      hour12: true 
    });

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!scrim) return null;

  const config = scrim.scrimConfig;
  const basic = config?.basicInformation;
  const dateTime = config?.dateTimeSettings;
  const slots = config?.slotConfiguration;
  const entry = config?.entryPrizeSettings;
  const rules = config?.registrationRules;
  const prizePool = (config as any)?.prizePoolCalculation;

  const statusColors = {
    SCHEDULED: "bg-blue-500",
    LIVE: "bg-green-500",
    COMPLETED: "bg-gray-500",
    CANCELLED: "bg-red-500",
  };

  const isPaid = entry?.entryType === "PAID";
  const canRegister = scrim.status === "SCHEDULED";

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/dashboard/scrims">
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Title & Status */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">{scrim.title}</h1>
          <Badge className={`${statusColors[scrim.status]} text-white shrink-0 text-xs sm:text-sm`}>
            {scrim.status}
          </Badge>
        </div>
        {scrim.description && (
          <p className="text-sm sm:text-base text-muted-foreground">{scrim.description}</p>
        )}
      </div>

      {/* Prize Pool Highlight (if paid) */}
      {isPaid && prizePool && (
        <Card className="border-2 border-yellow-500 bg-linear-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600 shrink-0" />
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Total Prize Pool</div>
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-600">
                    ₹{prizePool.prizePool?.toFixed(2) || "0.00"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 shrink-0" />
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Entry Fee</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    ₹{entry.entryFeeAmount || 0}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="outline" className="text-xs">{basic?.scrimType || "N/A"}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Game Mode</span>
              <Badge variant="outline" className="text-xs">{basic?.gameMode || "N/A"}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Map</span>
              <Badge variant="outline" className="text-xs">{basic?.mapSelection || "N/A"}</Badge>
            </div>
            {basic?.scrimCode && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Scrim Code</span>
                <code className="text-xs sm:text-sm font-mono bg-muted px-2 py-1 rounded">
                  {basic.scrimCode}
                </code>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Match Date</div>
              <div className="font-semibold text-sm sm:text-base">{formatDate(scrim.scheduledAt)}</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Match Time</div>
              <div className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                {formatTime(scrim.scheduledAt)}
              </div>
            </div>
            {dateTime?.registrationOpenTime && (
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Registration Opens</div>
                <div className="text-xs sm:text-sm">{formatTime(dateTime.registrationOpenTime)}</div>
              </div>
            )}
            {dateTime?.registrationCloseTime && (
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Registration Closes</div>
                <div className="text-xs sm:text-sm">{formatTime(dateTime.registrationCloseTime)}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slots */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              Slots
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {basic?.scrimType === "SOLO" ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Slots</span>
                  <span className="font-semibold">{slots?.totalSlots || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Registered</span>
                  <span className="font-semibold text-green-600">
                    {scrim._count?.players || 0}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Team Slots</span>
                  <span className="font-semibold">{slots?.totalTeamSlots || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Players Per Team</span>
                  <span className="font-semibold">{slots?.playersPerTeam || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Teams Registered</span>
                  <span className="font-semibold text-green-600">
                    {scrim._count?.players || 0}
                  </span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Available</span>
              <span className="font-semibold text-blue-600">
                {(basic?.scrimType === "SOLO" 
                  ? (slots?.totalSlots || 0) 
                  : (slots?.totalTeamSlots || 0)) - (scrim._count?.players || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prize Pool Breakdown (if paid and has calculation) */}
      {isPaid && prizePool && (
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Prize Pool Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calculation Summary */}
              <div className="space-y-2">
                <div className="text-sm font-semibold mb-3">Financial Breakdown</div>
                <div className="flex justify-between p-2 bg-muted rounded text-sm">
                  <span>Total Collected:</span>
                  <span className="font-semibold">₹{prizePool.totalCollected?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded text-sm text-red-600">
                  <span>Platform Fee:</span>
                  <span>-₹{prizePool.platformFeeAmount?.toFixed(2) || "0.00"}</span>
                </div>
                {prizePool.fixedCost > 0 && (
                  <div className="flex justify-between p-2 bg-muted rounded text-sm text-red-600">
                    <span>Fixed Cost:</span>
                    <span>-₹{prizePool.fixedCost?.toFixed(2) || "0.00"}</span>
                  </div>
                )}
                <div className="flex justify-between p-2 bg-green-100 dark:bg-green-900/20 rounded font-bold text-green-600">
                  <span>Prize Pool:</span>
                  <span>₹{prizePool.prizePool?.toFixed(2) || "0.00"}</span>
                </div>
              </div>

              {/* Prize Distribution */}
              <div className="space-y-2">
                <div className="text-sm font-semibold mb-3">Winner Prizes</div>
                {entry.firstPrizeAmount && entry.firstPrizeAmount > 0 && (
                  <div className="flex justify-between p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded">
                    <span className="text-sm">🥇 1st Place ({prizePool.prizeDistribution?.first || 0}%):</span>
                    <span className="font-semibold text-yellow-600">₹{entry.firstPrizeAmount}</span>
                  </div>
                )}
                {entry.secondPrizeAmount && entry.secondPrizeAmount > 0 && (
                  <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm">🥈 2nd Place ({prizePool.prizeDistribution?.second || 0}%):</span>
                    <span className="font-semibold text-gray-600">₹{entry.secondPrizeAmount}</span>
                  </div>
                )}
                {entry.thirdPrizeAmount && entry.thirdPrizeAmount > 0 && (
                  <div className="flex justify-between p-2 bg-orange-50 dark:bg-orange-900/10 rounded">
                    <span className="text-sm">🥉 3rd Place ({prizePool.prizeDistribution?.third || 0}%):</span>
                    <span className="font-semibold text-orange-600">₹{entry.thirdPrizeAmount}</span>
                  </div>
                )}
                {(entry as any).fourthPrizeAmount && (entry as any).fourthPrizeAmount > 0 && (
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-sm">4th Place ({prizePool.prizeDistribution?.fourth || 0}%):</span>
                    <span className="font-semibold">₹{(entry as any).fourthPrizeAmount}</span>
                  </div>
                )}
                {entry.mvpPrizeAmount && entry.mvpPrizeAmount > 0 && (
                  <div className="flex justify-between p-2 bg-blue-50 dark:bg-blue-900/10 rounded">
                    <span className="text-sm">⭐ MVP ({prizePool.prizeDistribution?.mvp || 0}%):</span>
                    <span className="font-semibold text-blue-600">₹{entry.mvpPrizeAmount}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entry Fee Only (if paid but no calculation) */}
      {isPaid && !prizePool && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Entry Fee & Prizes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Entry Fee</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  ₹{entry.entryFeeAmount || 0}
                </div>
              </div>
              {entry.firstPrizeAmount && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">🥇 1st Prize</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    ₹{entry.firstPrizeAmount}
                  </div>
                </div>
              )}
              {entry.secondPrizeAmount && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">🥈 2nd Prize</div>
                  <div className="text-2xl font-bold text-gray-600">
                    ₹{entry.secondPrizeAmount}
                  </div>
                </div>
              )}
              {entry.thirdPrizeAmount && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">🥉 3rd Prize</div>
                  <div className="text-2xl font-bold text-orange-600">
                    ₹{entry.thirdPrizeAmount}
                  </div>
                </div>
              )}
              {entry.mvpPrizeAmount && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">⭐ MVP Prize</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{entry.mvpPrizeAmount}
                  </div>
                </div>
              )}
            </div>
            {entry.prizeDescription && (
              <Alert className="mt-4">
                <AlertDescription>{entry.prizeDescription}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rules & Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Registration Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              {rules?.requireVerifiedAccount ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm">Verified Account Required</span>
            </div>
            <div className="flex items-center gap-2">
              {rules?.autoApproveRegistration ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm">Auto Approve Registration</span>
            </div>
            <div className="flex items-center gap-2">
              {rules?.allowMultipleRegistrations ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm">Multiple Registrations Allowed</span>
            </div>
            <div className="flex items-center gap-2">
              {!rules?.allowBannedPlayers ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm">Banned Players Blocked</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Game Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {basic?.shortRules && (
              <div>
                <div className="text-sm font-semibold mb-1">Quick Rules</div>
                <p className="text-sm text-muted-foreground">{basic.shortRules}</p>
              </div>
            )}
            {basic?.fullRules && (
              <div>
                <div className="text-sm font-semibold mb-1">Full Rules</div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {basic.fullRules}
                </p>
              </div>
            )}
            {!basic?.shortRules && !basic?.fullRules && (
              <p className="text-sm text-muted-foreground">
                Standard scrim rules apply
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Room Details */}
      {scrim.roomId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Room Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Room ID</div>
                <code className="text-lg font-mono bg-muted px-3 py-2 rounded block">
                  {scrim.roomId}
                </code>
              </div>
              {scrim.roomPassword && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Room Password</div>
                  <code className="text-lg font-mono bg-muted px-3 py-2 rounded block">
                    {scrim.roomPassword}
                  </code>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons - MOBILE OPTIMIZED */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-3 sm:p-4 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 mt-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-7xl mx-auto">
          {canRegister && (
            <Button 
              size="lg" 
              className="flex-1 h-12 sm:h-11 text-base sm:text-sm font-semibold" 
              onClick={handleRegister}
              disabled={registering}
            >
              {registering ? "Registering..." : isPaid ? `Pay ₹${entry.entryFeeAmount} & Register` : "Register for Free"}
            </Button>
          )}
          {scrim.status === "LIVE" && scrim.roomId && (
            <Button size="lg" className="flex-1 h-12 sm:h-11 text-base sm:text-sm font-semibold" variant="default">
              Join Room Now
            </Button>
          )}
          {scrim.status === "COMPLETED" && (
            <Button size="lg" className="flex-1 h-12 sm:h-11 text-base sm:text-sm font-semibold" variant="outline" asChild>
              <Link href={`/dashboard/scrims/${scrim.id}/results`}>
                View Results
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Money Request Dialog */}
      <Dialog open={showMoneyRequestDialog} onOpenChange={setShowMoneyRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Team Entry Fee Required</DialogTitle>
            <DialogDescription>
              Request money from team members to fund the entry fee
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Fee Breakdown */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Entry Fee:</span>
                <span className="font-bold">₹{entry?.entryFeeAmount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Team Wallet:</span>
                <span className="text-green-600 font-semibold">₹{teamBalance.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Need to Collect:</span>
                <span className="font-bold text-red-600">
                  ₹{((entry?.entryFeeAmount || 0) - teamBalance).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Per Member Contribution */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Per Member Contribution</div>
              <div className="text-2xl font-bold text-blue-600">
                ₹{(((entry?.entryFeeAmount || 0) - teamBalance) / (selectedMembers.length + 1)).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Split among {selectedMembers.length + 1} members (including you)
              </div>
            </div>

            {/* Member Selection */}
            <div>
              <h4 className="font-semibold mb-3">Select Team Members</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {teamMembers.map((member: any) => {
                  const perMember = ((entry?.entryFeeAmount || 0) - teamBalance) / (selectedMembers.length + 1);
                  const hasBalance = (member.user?.balance || 0) >= perMember;
                  
                  return (
                    <div key={member.userId} className="flex items-center space-x-3 p-2 rounded hover:bg-muted">
                      <Checkbox
                        id={member.userId}
                        checked={selectedMembers.includes(member.userId)}
                        onCheckedChange={() => toggleMember(member.userId)}
                        disabled={!hasBalance}
                      />
                      <Label 
                        htmlFor={member.userId} 
                        className="flex-1 cursor-pointer flex items-center justify-between"
                      >
                        <span className={!hasBalance ? 'text-muted-foreground' : ''}>
                          {member.user?.username || 'Unknown'}
                        </span>
                        <span className={`text-sm ${hasBalance ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{(member.user?.balance || 0).toFixed(2)}
                          {!hasBalance && ' ⚠️'}
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </div>
              {teamMembers.some((m: any) => (m.user?.balance || 0) < ((entry?.entryFeeAmount || 0) - teamBalance) / (selectedMembers.length + 1)) && (
                <Alert className="mt-3">
                  <AlertDescription className="text-xs">
                    ⚠️ Members with insufficient balance are disabled
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowMoneyRequestDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSendMoneyRequests}
                disabled={selectedMembers.length === 0}
              >
                Request Money ({selectedMembers.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
