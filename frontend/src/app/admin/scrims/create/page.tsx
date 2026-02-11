"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { scrimService } from "@/services/scrim.service";
import { toast } from "sonner";

type ScrimType = "SOLO" | "SQUAD";
type PlatformFeeType = "PERCENTAGE" | "FIXED";

export default function CreateScrimPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scrimType: "SOLO" as ScrimType,
    gameMode: "BATTLE_ROYALE",
    mapSelection: "BERMUDA",
    matchDate: "",
    matchTime: "",
    registrationOpenTime: "",
    registrationCloseTime: "",
    totalSlots: 48,
    totalTeamSlots: 12,
    playersPerTeam: 4,
    entryType: "FREE",
    entryFeeAmount: 0,
    platformFeeType: "PERCENTAGE" as PlatformFeeType,
    platformFeePercentage: 10,
    platformFeeFixed: 0,
    fixedCost: 0,
    prizeDistribution: {
      first: 50,
      second: 25,
      third: 15,
      fourth: 0,
      mvp: 10,
    },
    status: "SCHEDULED",
    visibilityStatus: "DRAFT",
  });

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updatePrizeDistribution = (position: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      prizeDistribution: { ...prev.prizeDistribution, [position]: value },
    }));
  };

  // Automatic Prize Pool Calculation
  const prizePoolCalculation = useMemo(() => {
    if (formData.entryType !== "PAID" || formData.entryFeeAmount <= 0) {
      return null;
    }

    const participants = formData.scrimType === "SOLO" ? formData.totalSlots : formData.totalTeamSlots;
    const entryFee = formData.entryFeeAmount;
    
    // Total Collected = N × E
    const totalCollected = participants * entryFee;
    
    // Platform Fee
    let platformFee = 0;
    if (formData.platformFeeType === "PERCENTAGE") {
      platformFee = totalCollected * (formData.platformFeePercentage / 100);
    } else {
      platformFee = formData.platformFeeFixed;
    }
    
    // Prize Pool = Total - PlatformFee - FixedCost
    const prizePool = totalCollected - platformFee - formData.fixedCost;
    
    // Calculate individual prizes
    const prizes = {
      first: (prizePool * formData.prizeDistribution.first) / 100,
      second: (prizePool * formData.prizeDistribution.second) / 100,
      third: (prizePool * formData.prizeDistribution.third) / 100,
      fourth: (prizePool * formData.prizeDistribution.fourth) / 100,
      mvp: (prizePool * formData.prizeDistribution.mvp) / 100,
    };

    const totalDistribution = Object.values(formData.prizeDistribution).reduce((a, b) => a + b, 0);
    
    return {
      totalCollected,
      platformFee,
      fixedCost: formData.fixedCost,
      prizePool,
      prizes,
      totalDistribution,
      isValid: prizePool >= 0 && totalDistribution === 100,
      warning: prizePool < 0 ? "Increase entry fee or reduce costs" : totalDistribution !== 100 ? "Prize distribution must total 100%" : null,
    };
  }, [
    formData.entryType,
    formData.entryFeeAmount,
    formData.scrimType,
    formData.totalSlots,
    formData.totalTeamSlots,
    formData.platformFeeType,
    formData.platformFeePercentage,
    formData.platformFeeFixed,
    formData.fixedCost,
    formData.prizeDistribution,
  ]);

  const toMs = (value: string) => (value ? new Date(value).getTime() : 0);

  const validate = () => {
    if (!formData.title || !formData.matchDate || !formData.matchTime) {
      toast.error("Title, match date and match time are required");
      return false;
    }

    const startAt = toMs(`${formData.matchDate}T${formData.matchTime}`);
    const regOpen = toMs(formData.registrationOpenTime);
    const regClose = toMs(formData.registrationCloseTime);

    if (!regOpen || !regClose) {
      toast.error("Registration open and close times are required");
      return false;
    }
    if (!(regOpen < regClose)) {
      toast.error("Registration open must be before close");
      return false;
    }
    if (!(regClose < startAt)) {
      toast.error("Registration close must be before scrim start");
      return false;
    }
    if (formData.scrimType === "SOLO" && Number(formData.totalSlots) > 48) {
      toast.error("Solo max slots is 48");
      return false;
    }
    if (formData.scrimType === "SQUAD" && Number(formData.totalTeamSlots) > 12) {
      toast.error("Squad max team slots is 12");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const scheduledAt = new Date(`${formData.matchDate}T${formData.matchTime}:00`).toISOString();

      // Build entry prize settings with calculated prize amounts
      const entryPrizeSettings: any = {
        entryType: formData.entryType as "FREE" | "PAID",
        paymentMethods: [],
      };

      if (formData.entryType === "PAID") {
        entryPrizeSettings.entryFeeAmount = Number(formData.entryFeeAmount);
        
        // Add calculated prize amounts if prize pool calculation is valid
        if (prizePoolCalculation && prizePoolCalculation.isValid) {
          entryPrizeSettings.firstPrizeAmount = Math.round(prizePoolCalculation.prizes.first);
          entryPrizeSettings.secondPrizeAmount = Math.round(prizePoolCalculation.prizes.second);
          entryPrizeSettings.thirdPrizeAmount = Math.round(prizePoolCalculation.prizes.third);
          if (prizePoolCalculation.prizes.fourth > 0) {
            entryPrizeSettings.fourthPrizeAmount = Math.round(prizePoolCalculation.prizes.fourth);
          }
          entryPrizeSettings.mvpPrizeAmount = Math.round(prizePoolCalculation.prizes.mvp);
          
          // Add prize pool metadata
          entryPrizeSettings.prizeDescription = `Total Prize Pool: ₹${prizePoolCalculation.prizePool.toFixed(2)} | Platform Fee: ₹${prizePoolCalculation.platformFee.toFixed(2)} | Fixed Cost: ₹${prizePoolCalculation.fixedCost.toFixed(2)}`;
        }
      }

      await scrimService.createScrim({
        title: formData.title,
        description: formData.description,
        scheduledAt,
        status: formData.status,
        scrimConfig: {
          basicInformation: {
            scrimType: formData.scrimType,
            gameMode: formData.gameMode as "BATTLE_ROYALE" | "CLASH_SQUAD",
            mapSelection: formData.mapSelection as "BERMUDA" | "PURGATORY" | "ALPINE" | "RANDOM",
            description: formData.description || undefined,
          },
          dateTimeSettings: {
            matchDate: formData.matchDate,
            matchTime: formData.matchTime,
            registrationOpenTime: formData.registrationOpenTime,
            registrationCloseTime: formData.registrationCloseTime,
            countdownAutoEnable: true,
            timezone: "Asia/Kathmandu",
          },
          slotConfiguration: {
            totalSlots: formData.scrimType === "SOLO" ? Number(formData.totalSlots) : undefined,
            totalTeamSlots: formData.scrimType === "SQUAD" ? Number(formData.totalTeamSlots) : undefined,
            playersPerTeam: formData.scrimType === "SQUAD" ? Number(formData.playersPerTeam) : undefined,
            waitlistEnable: false,
            autoSlotAssign: false,
          },
          entryPrizeSettings,
          pointsSystemSetup: { mode: "PRESET", killPoints: 1 },
          matchFormat: { totalMatches: 1, mapMode: "SAME_MAP", pointsMode: "CUMULATIVE" },
          roomControlSettings: {
            roomIdVisibility: "MANUAL_RELEASE",
            allowRoomPasswordChange: true,
            lockRoomDetailsAfterRelease: true,
          },
          registrationRules: {
            requireVerifiedAccount: true,
            allowMultipleRegistrations: false,
            allowBannedPlayers: false,
            autoApproveRegistration: false,
          },
          penaltyFairPlayRules: { emulatorAllowed: false },
          scrimStatusControls: {
            visibilityStatus: formData.visibilityStatus as "DRAFT" | "PUBLISHED",
            lifecycleStatus: formData.status as "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED",
          },
          visibilityPromotion: { featureOnHomepage: false, sponsorLogos: [] },
          advancedOptions: {
            manualResultEditingAllowed: true,
            screenshotProofRequired: false,
            autoLeaderboardUpdate: false,
            enableLivePointsTracking: false,
          },
        },
      });

      toast.success("Scrim created with prize pool");
      router.push("/admin/scrims");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create scrim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/scrims">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Scrim</h1>
          <p className="text-muted-foreground">Only required setup fields. Manage details in next steps.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Basic</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Title</Label><Input value={formData.title} onChange={(e) => updateField("title", e.target.value)} /></div>
            <div><Label>Description</Label><Textarea rows={3} value={formData.description} onChange={(e) => updateField("description", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select value={formData.scrimType} onValueChange={(v) => updateField("scrimType", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SOLO">Solo</SelectItem><SelectItem value="SQUAD">Squad</SelectItem></SelectContent></Select></div>
              <div><Label>Mode</Label><Select value={formData.gameMode} onValueChange={(v) => updateField("gameMode", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BATTLE_ROYALE">Battle Royale</SelectItem><SelectItem value="CLASH_SQUAD">Clash Squad</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>Map</Label><Select value={formData.mapSelection} onValueChange={(v) => updateField("mapSelection", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BERMUDA">Bermuda</SelectItem><SelectItem value="PURGATORY">Purgatory</SelectItem><SelectItem value="ALPINE">Alpine</SelectItem><SelectItem value="RANDOM">Random</SelectItem></SelectContent></Select></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Schedule & Slots</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={formData.matchDate} onChange={(e) => updateField("matchDate", e.target.value)} /></div>
              <div><Label>Start Time</Label><Input type="time" value={formData.matchTime} onChange={(e) => updateField("matchTime", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Registration Open</Label><Input type="datetime-local" value={formData.registrationOpenTime} onChange={(e) => updateField("registrationOpenTime", e.target.value)} /></div>
              <div><Label>Registration Close</Label><Input type="datetime-local" value={formData.registrationCloseTime} onChange={(e) => updateField("registrationCloseTime", e.target.value)} /></div>
            </div>
            {formData.scrimType === "SOLO" ? (
              <div><Label>Total Slots (Max 48)</Label><Input type="number" max={48} value={formData.totalSlots} onChange={(e) => updateField("totalSlots", Number(e.target.value))} /></div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Team Slots (Max 12)</Label><Input type="number" max={12} value={formData.totalTeamSlots} onChange={(e) => updateField("totalTeamSlots", Number(e.target.value))} /></div>
                <div><Label>Players Per Team</Label><Input type="number" value={formData.playersPerTeam} onChange={(e) => updateField("playersPerTeam", Number(e.target.value))} /></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Entry Type</Label><Select value={formData.entryType} onValueChange={(v) => updateField("entryType", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FREE">Free</SelectItem><SelectItem value="PAID">Paid</SelectItem></SelectContent></Select></div>
              <div>
                <Label>Entry Fee {formData.entryType === "PAID" && "(per " + (formData.scrimType === "SOLO" ? "player" : "team") + ")"}</Label>
                <Input 
                  type="number" 
                  min="0"
                  value={formData.entryFeeAmount || ""} 
                  onChange={(e) => updateField("entryFeeAmount", Number(e.target.value) || 0)} 
                  disabled={formData.entryType !== "PAID"} 
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Visibility</Label><Select value={formData.visibilityStatus} onValueChange={(v) => updateField("visibilityStatus", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="PUBLISHED">Published</SelectItem></SelectContent></Select></div>
              <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => updateField("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SCHEDULED">Scheduled</SelectItem><SelectItem value="LIVE">Live</SelectItem><SelectItem value="COMPLETED">Completed</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem></SelectContent></Select></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {formData.entryType === "PAID" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Prize Pool Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Platform Fee Type</Label>
                  <Select value={formData.platformFeeType} onValueChange={(v) => updateField("platformFeeType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.platformFeeType === "PERCENTAGE" ? (
                  <div>
                    <Label>Platform Fee %</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={formData.platformFeePercentage} 
                      onChange={(e) => updateField("platformFeePercentage", Number(e.target.value))} 
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Platform Fee (Fixed)</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      value={formData.platformFeeFixed} 
                      onChange={(e) => updateField("platformFeeFixed", Number(e.target.value))} 
                    />
                  </div>
                )}
              </div>
              <div>
                <Label>Fixed Cost (Other Expenses)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={formData.fixedCost} 
                  onChange={(e) => updateField("fixedCost", Number(e.target.value))} 
                />
              </div>
              <div className="pt-2 border-t">
                <Label className="text-base">Prize Distribution (%)</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-sm">1st Place</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={formData.prizeDistribution.first} 
                      onChange={(e) => updatePrizeDistribution("first", Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <Label className="text-sm">2nd Place</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={formData.prizeDistribution.second} 
                      onChange={(e) => updatePrizeDistribution("second", Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <Label className="text-sm">3rd Place</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={formData.prizeDistribution.third} 
                      onChange={(e) => updatePrizeDistribution("third", Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <Label className="text-sm">4th Place</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={formData.prizeDistribution.fourth} 
                      onChange={(e) => updatePrizeDistribution("fourth", Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <Label className="text-sm">MVP</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={formData.prizeDistribution.mvp} 
                      onChange={(e) => updatePrizeDistribution("mvp", Number(e.target.value))} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Prize Pool Calculation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {prizePoolCalculation ? (
                <>
                  {prizePoolCalculation.warning && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{prizePoolCalculation.warning}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Participants:</span>
                      <span className="font-semibold">{formData.scrimType === "SOLO" ? formData.totalSlots : formData.totalTeamSlots}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Entry Fee:</span>
                      <span className="font-semibold">₹{formData.entryFeeAmount}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-primary/10 rounded font-semibold">
                      <span>Total Collected:</span>
                      <span>₹{prizePoolCalculation.totalCollected.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded text-red-600">
                      <span>Platform Fee:</span>
                      <span>-₹{prizePoolCalculation.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded text-red-600">
                      <span>Fixed Cost:</span>
                      <span>-₹{prizePoolCalculation.fixedCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-100 dark:bg-green-900/20 rounded font-bold text-lg">
                      <span>Prize Pool:</span>
                      <span className="text-green-600 dark:text-green-400">₹{prizePoolCalculation.prizePool.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t space-y-2">
                    <div className="font-semibold text-sm mb-2">Prize Breakdown:</div>
                    {prizePoolCalculation.prizes.first > 0 && (
                      <div className="flex justify-between text-sm p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded">
                        <span>🥇 1st Place ({formData.prizeDistribution.first}%):</span>
                        <span className="font-semibold">₹{prizePoolCalculation.prizes.first.toFixed(2)}</span>
                      </div>
                    )}
                    {prizePoolCalculation.prizes.second > 0 && (
                      <div className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span>🥈 2nd Place ({formData.prizeDistribution.second}%):</span>
                        <span className="font-semibold">₹{prizePoolCalculation.prizes.second.toFixed(2)}</span>
                      </div>
                    )}
                    {prizePoolCalculation.prizes.third > 0 && (
                      <div className="flex justify-between text-sm p-2 bg-orange-50 dark:bg-orange-900/10 rounded">
                        <span>🥉 3rd Place ({formData.prizeDistribution.third}%):</span>
                        <span className="font-semibold">₹{prizePoolCalculation.prizes.third.toFixed(2)}</span>
                      </div>
                    )}
                    {prizePoolCalculation.prizes.fourth > 0 && (
                      <div className="flex justify-between text-sm p-2 bg-muted rounded">
                        <span>4th Place ({formData.prizeDistribution.fourth}%):</span>
                        <span className="font-semibold">₹{prizePoolCalculation.prizes.fourth.toFixed(2)}</span>
                      </div>
                    )}
                    {prizePoolCalculation.prizes.mvp > 0 && (
                      <div className="flex justify-between text-sm p-2 bg-blue-50 dark:bg-blue-900/10 rounded">
                        <span>⭐ MVP ({formData.prizeDistribution.mvp}%):</span>
                        <span className="font-semibold">₹{prizePoolCalculation.prizes.mvp.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm p-2 bg-muted rounded font-semibold border-t-2">
                      <span>Total Distribution ({prizePoolCalculation.totalDistribution}%):</span>
                      <span>₹{Object.values(prizePoolCalculation.prizes).reduce((a, b) => a + b, 0).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Set entry type to PAID and add entry fee to see prize pool calculation
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleCreate} disabled={submitting || (prizePoolCalculation ? !prizePoolCalculation.isValid : false)}>
          <Send className="w-4 h-4 mr-2" />
          {submitting ? "Creating..." : "Create Scrim"}
        </Button>
      </div>
    </div>
  );
}
