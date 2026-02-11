"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Users, Trophy, Calendar, Clock, MapPin, Loader2, CheckCircle2, Crown } from "lucide-react";

const tournamentData = {
  id: 1,
  title: "Free Fire Championship",
  type: "Squad",
  date: "Dec 25, 2024",
  time: "6:00 PM",
  map: "Bermuda",
  slots: "32/64",
  prize: "रु 1,000",
  rules: [
    "All players must have valid Free Fire accounts",
    "No hacking or cheating allowed",
    "Team must have 4 players minimum",
    "Substitutes are allowed (max 1)",
    "Room ID and password will be shared 15 minutes before match",
    "Screenshots of results must be submitted within 10 minutes",
  ],
};

const myTeams = [
  {
    id: 1,
    name: "Pro Squad",
    tag: "PRO",
    logo: "",
    members: [
      { id: 1, ign: "Player Name", uid: "123456789", role: "Captain" },
      { id: 2, ign: "ProGamer123", uid: "987654321", role: "Player" },
      { id: 3, ign: "SnipeKing", uid: "456789123", role: "Player" },
      { id: 4, ign: "RushMaster", uid: "789123456", role: "Substitute" },
    ],
  },
  {
    id: 2,
    name: "Elite Warriors",
    tag: "ELW",
    logo: "",
    members: [
      { id: 1, ign: "EliteOne", uid: "111222333", role: "Captain" },
      { id: 2, ign: "EliteTwo", uid: "444555666", role: "Player" },
      { id: 3, ign: "EliteThree", uid: "777888999", role: "Player" },
    ],
  },
];

export default function TournamentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "confirm" | "success">("select");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [slotNumber, setSlotNumber] = useState<number | null>(null);

  const selectedTeamData = myTeams.find((t) => t.id === Number(selectedTeam));

  const handleTeamSelect = () => {
    if (!selectedTeam) {
      alert("Please select a team");
      return;
    }
    setStep("confirm");
  };

  const handleSubmit = async () => {
    if (!acceptedRules) {
      alert("Please accept the tournament rules");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setSlotNumber(Math.floor(Math.random() * 64) + 1);
      setStep("success");
      setIsLoading(false);
    }, 1500);
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <CardDescription>
              Your team has been registered for the tournament
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Your Slot Number</p>
              <div className="text-5xl font-bold text-primary">{slotNumber}</div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary">Pending Approval</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Team</span>
                <span className="font-medium">{selectedTeamData?.name}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Tournament</span>
                <span className="font-medium">{tournamentData.title}</span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Next Steps:</strong> Your registration is pending approval. 
                You'll receive a notification once approved. Room details will be shared 
                15 minutes before the match starts.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/dashboard/tournaments">Back to Tournaments</Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link href="/dashboard/matches">View My Matches</Link>
              </Button>
            </div>
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
          <Link href="/dashboard/tournaments">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Register for Tournament</h1>
          <p className="text-muted-foreground mt-1">
            {step === "select" ? "Select your team" : "Confirm registration details"}
          </p>
        </div>
      </div>

      {/* Tournament Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{tournamentData.title}</CardTitle>
              <CardDescription>{tournamentData.type} Battle Royale</CardDescription>
            </div>
            <Badge>Open</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{tournamentData.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{tournamentData.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{tournamentData.map}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span>{tournamentData.prize}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {step === "select" && (
        <>
          {/* Select Team */}
          <Card>
            <CardHeader>
              <CardTitle>Select Team</CardTitle>
              <CardDescription>Choose which team to register</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myTeams.length > 0 ? (
                <>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {myTeams.map((team) => (
                        <SelectItem key={team.id} value={String(team.id)}>
                          {team.name} ({team.tag}) - {team.members.length} members
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedTeamData && (
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={selectedTeamData.logo} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                            {selectedTeamData.tag}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{selectedTeamData.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedTeamData.members.length} members
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Team Members:</p>
                        {selectedTeamData.members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              {member.ign}
                              {member.role === "Captain" && (
                                <Crown className="h-3 w-3 text-yellow-500" />
                              )}
                            </span>
                            <Badge variant={member.role === "Substitute" ? "secondary" : "outline"} className="text-xs">
                              {member.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="font-medium text-muted-foreground">No teams available</p>
                  <p className="text-sm text-muted-foreground mt-2">Create a team first to register</p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/teams/create">Create Team</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {myTeams.length > 0 && (
            <Button className="w-full" size="lg" onClick={handleTeamSelect}>
              Continue to Confirmation
            </Button>
          )}
        </>
      )}

      {step === "confirm" && selectedTeamData && (
        <>
          {/* Confirm Roster */}
          <Card>
            <CardHeader>
              <CardTitle>Confirm Roster</CardTitle>
              <CardDescription>Review your team lineup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedTeamData.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {member.ign}
                      {member.role === "Captain" && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">UID: {member.uid}</p>
                  </div>
                  <Badge variant={member.role === "Substitute" ? "secondary" : "default"}>
                    {member.role}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tournament Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Rules</CardTitle>
              <CardDescription>Please read and accept the rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto p-4 bg-muted rounded-lg">
                {tournamentData.rules.map((rule, index) => (
                  <div key={index} className="flex gap-2 text-sm">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="rules"
                  checked={acceptedRules}
                  onCheckedChange={(checked) => setAcceptedRules(checked as boolean)}
                />
                <Label htmlFor="rules" className="text-sm cursor-pointer leading-relaxed">
                  I have read and accept all tournament rules and regulations. I understand that 
                  violation of any rules may result in disqualification.
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep("select")}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!acceptedRules || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
