"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CustomRoom } from "@/services/custom-room.service";

function yn(v: boolean) {
  return v ? "Yes" : "No";
}

function formatTeamSize(ts: string) {
  return ts
    .replaceAll("_", " ")
    .replace("ONE V ONE", "1v1")
    .replace("TWO V TWO", "2v2")
    .replace("THREE V THREE", "3v3")
    .replace("FOUR V FOUR", "4v4");
}

export function CustomRoomDetailsDialog({
  room,
  trigger,
}: {
  room: CustomRoom;
  trigger: ReactNode;
}) {
  const creator = room.creator;
  const creatorProfileHref = creator?.id ? `/dashboard/profile/${creator.id}` : "/dashboard";

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Room Details</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{room.type === "CUSTOM_ROOM" ? "CUSTOM ROOM" : "LONE WOLF"}</Badge>
          <Badge variant="outline">{formatTeamSize(room.teamSize)}</Badge>
          <Badge variant="outline">{room.rounds} rounds</Badge>
          <Badge>{room.status}</Badge>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Created by</p>
                <div className="flex items-center gap-2">
                  <Button asChild variant="link" className="h-auto p-0 font-semibold">
                    <Link href={creatorProfileHref}>
                      {creator?.username || "Player"}
                    </Link>
                  </Button>
                  {creator?.gameName && (
                    <Badge variant="secondary">{creator.gameName}</Badge>
                  )}
                </div>
                {creator?.gameId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Game ID: <span className="font-mono">{creator.gameId}</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Entry</p>
                <p className="text-lg font-bold">₹{Number(room.entryFee || 0).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">
                  Payout: <span className="font-semibold text-emerald-600">₹{Number(room.payout || 0).toFixed(0)}</span>
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              <div className="rounded-md border p-2">
                <p className="text-xs text-muted-foreground">Coin</p>
                <p className="font-semibold">{room.coinSetting === 0 ? "Default" : room.coinSetting}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-xs text-muted-foreground">Room Maker</p>
                <p className="font-semibold">{room.roomMaker}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-xs text-muted-foreground">Odds</p>
                <p className="font-semibold">{Number(room.odds || 0).toFixed(1)}x</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div className="rounded-md bg-muted p-2">
                <p className="text-xs text-muted-foreground">Throwable Limit</p>
                <p className="font-semibold">{yn(room.throwableLimit)}</p>
              </div>
              <div className="rounded-md bg-muted p-2">
                <p className="text-xs text-muted-foreground">Character Skill</p>
                <p className="font-semibold">{yn(room.characterSkill)}</p>
              </div>
              <div className="rounded-md bg-muted p-2">
                <p className="text-xs text-muted-foreground">Headshot Only</p>
                <p className="font-semibold">{yn(room.headshotOnly)}</p>
              </div>
              <div className="rounded-md bg-muted p-2">
                <p className="text-xs text-muted-foreground">Gun Attributes</p>
                <p className="font-semibold">{yn(room.gunAttributes)}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Created: {new Date(room.createdAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

