"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type ReviewRoom = any;

export default function AdminCustomMatchesReviewPage() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<ReviewRoom[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [winnerSide, setWinnerSide] = useState<"CREATOR" | "OPPONENT">("CREATOR");

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.get("/custom-rooms/admin/review");
      setRooms(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load review rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resolve = async (id: string, side: "CREATOR" | "OPPONENT") => {
    try {
      setResolvingId(id);
      await api.post(`/custom-rooms/admin/${encodeURIComponent(id)}/resolve`, { winnerSide: side });
      toast.success("Resolved and payout processed");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to resolve");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Custom Matches Review</h1>
          <p className="text-muted-foreground mt-1">Verify results and resolve payouts.</p>
        </div>
        <Button variant="outline" onClick={() => load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Under Review</CardTitle>
          <CardDescription>Rooms with result screenshot submitted</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : rooms.length === 0 ? (
            <div className="text-sm text-muted-foreground">No rooms under review.</div>
          ) : (
            rooms.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold truncate">
                        {r.type} • {r.teamSize} • {r.rounds} rounds
                      </p>
                      <Badge>{r.status}</Badge>
                      <Badge variant="outline">Entry ₹{Number(r.entryFee || 0).toFixed(0)}</Badge>
                      <Badge variant="outline">Payout ₹{Number(r.payout || 0).toFixed(0)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Creator: {r.creator?.username} • Opponent: {r.opponent?.username}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted winner: <span className="font-semibold">{r.winnerSide || "-"}</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {r.resultScreenshotUrl ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={r.resultScreenshotUrl} target="_blank" rel="noreferrer">
                          View Screenshot
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        No Screenshot
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/users`}>User List</Link>
                    </Button>
                  </div>
                </div>

                {Array.isArray(r.reports) && r.reports.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-semibold">Reports</p>
                      <div className="mt-2 space-y-2">
                        {r.reports.map((rep: any) => (
                          <div key={rep.id} className="rounded-md bg-muted p-2 text-xs">
                            <p className="font-semibold">{rep.reason}</p>
                            <p className="text-muted-foreground mt-1">{rep.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <div className="w-full sm:w-60">
                    <Select value={winnerSide} onValueChange={(v) => setWinnerSide(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Winner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CREATOR">Creator Wins</SelectItem>
                        <SelectItem value="OPPONENT">Opponent Wins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => resolve(r.id, winnerSide)}
                    disabled={resolvingId === r.id}
                  >
                    {resolvingId === r.id ? "Resolving..." : "Resolve & Payout"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

