"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Send, Trophy, Target } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const match1Results = [
  { slot: 1, player: "PG_123", uid: "1234567890", placement: 1, kills: 12, points: 22 },
  { slot: 2, player: "CaptX", uid: "9876543210", placement: 3, kills: 8, points: 14 },
  { slot: 3, player: "NM_69", uid: "5555555555", placement: 15, kills: 3, points: 3 },
];

export default function ResultsPage({ params }: { params: { id: string } }) {
  const [results, setResults] = useState(match1Results);
  const [published, setPublished] = useState(false);

  const handlePublish = () => {
    console.log("Publishing results:", results);
    setPublished(true);
  };

  const updateResult = (slot: number, field: string, value: string) => {
    setResults(
      results.map((r) => {
        if (r.slot === slot) {
          const updated = { ...r, [field]: parseInt(value) || 0 };
          // Auto-calculate points (placement + kills)
          const placementPoints = updated.placement <= 10 ? [10, 8, 6, 4, 2, 1, 0, 0, 0, 0][updated.placement - 1] || 0 : 0;
          updated.points = placementPoints + updated.kills;
          return updated;
        }
        return r;
      })
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/scrims">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Publish Results</h1>
          <p className="text-muted-foreground">Solo Classic - Evening Battle</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Match Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="match1" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="match1">Match 1</TabsTrigger>
                  <TabsTrigger value="match2">Match 2</TabsTrigger>
                  <TabsTrigger value="match3">Match 3</TabsTrigger>
                  <TabsTrigger value="final">Final Standings</TabsTrigger>
                </TabsList>

                <TabsContent value="match1">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Slot</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead className="w-24">Placement</TableHead>
                          <TableHead className="w-24">Kills</TableHead>
                          <TableHead className="w-24">Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result) => (
                          <TableRow key={result.slot}>
                            <TableCell className="font-medium">#{result.slot}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{result.player}</p>
                                <p className="text-xs text-muted-foreground">{result.uid}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                max="48"
                                value={result.placement}
                                onChange={(e) =>
                                  updateResult(result.slot, "placement", e.target.value)
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={result.kills}
                                onChange={(e) => updateResult(result.slot, "kills", e.target.value)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{result.points}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="final">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead className="w-24">Total Points</TableHead>
                          <TableHead className="w-24">Total Kills</TableHead>
                          <TableHead className="w-32">Prize</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results
                          .sort((a, b) => b.points - a.points)
                          .map((result, index) => (
                            <TableRow key={result.slot}>
                              <TableCell className="font-medium">
                                {index === 0 && <Trophy className="w-4 h-4 inline text-yellow-600 mr-1" />}
                                #{index + 1}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{result.player}</p>
                                  <p className="text-xs text-muted-foreground">{result.uid}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="default">{result.points}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{result.kills}</Badge>
                              </TableCell>
                              <TableCell>
                                {index === 0 && <span className="font-medium text-green-600">रु 2,000</span>}
                                {index === 1 && <span className="font-medium text-blue-600">रु 1,000</span>}
                                {index === 2 && <span className="font-medium text-orange-600">रु 500</span>}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6">
                {!published ? (
                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={handlePublish}>
                      <Send className="w-4 h-4 mr-2" />
                      Publish Results
                    </Button>
                    <Button variant="outline">
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <Trophy className="w-5 h-5" />
                      <span className="font-medium">Results published successfully!</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Players can now view the final standings and prizes.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Point System */}
          <Card>
            <CardHeader>
              <CardTitle>Point System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">1st Place</span>
                <span className="font-medium">10 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">2nd Place</span>
                <span className="font-medium">8 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">3rd Place</span>
                <span className="font-medium">6 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">4th Place</span>
                <span className="font-medium">4 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">5th Place</span>
                <span className="font-medium">2 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">6th Place</span>
                <span className="font-medium">1 pt</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per Kill</span>
                <span className="font-medium">1 pt</span>
              </div>
            </CardContent>
          </Card>

          {/* Prize Pool */}
          <Card>
            <CardHeader>
              <CardTitle>Prize Pool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm">1st Place</span>
                </div>
                <span className="font-medium">रु 2,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">2nd Place</span>
                </div>
                <span className="font-medium">रु 1,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-orange-600" />
                  <span className="text-sm">3rd Place</span>
                </div>
                <span className="font-medium">रु 500</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-600" />
                  <span className="text-sm">MVP (Most Kills)</span>
                </div>
                <span className="font-medium">रु 300</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
