"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Swords, Users } from "lucide-react";
import { scrimService, Scrim } from "@/services/scrim.service";
import { toast } from "sonner";
import { getCachedPageData, setCachedPageData } from "@/lib/page-cache";

const SCRIMS_PAGE_CACHE_KEY = "dashboard:scrims:list";
const SCRIMS_PAGE_CACHE_TTL_MS = 2 * 60 * 1000;

export default function DashboardScrimsPage() {
  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getCachedPageData<Scrim[]>(SCRIMS_PAGE_CACHE_KEY, SCRIMS_PAGE_CACHE_TTL_MS);
    if (cached) {
      setScrims(cached);
      setLoading(false);
    }

    (async () => {
      try {
        if (!cached) setLoading(true);
        const data = await scrimService.getPublicScrims();
        const nextData = Array.isArray(data) ? data : [];
        setScrims(nextData);
        setCachedPageData(SCRIMS_PAGE_CACHE_KEY, nextData);
      } catch (error: any) {
        toast.error(error?.message || "Failed to load scrims");
        setScrims([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatTime = (value: string) => new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Public Scrims</h1>
        <p className="text-muted-foreground mt-1">Join published upcoming and live scrims</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : scrims.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scrims.map((scrim) => (
            <Card key={scrim.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Swords className="h-7 w-7 text-orange-500" />
                  <Badge>{scrim.status}</Badge>
                </div>
                <CardTitle className="mt-3 line-clamp-1">{scrim.title}</CardTitle>
                <CardDescription>{scrim.scrimConfig?.basicInformation?.scrimType || "SCRIM"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(scrim.scheduledAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(scrim.scheduledAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {scrim._count?.players || 0} / {
                      scrim.scrimConfig?.basicInformation?.scrimType === "SOLO" 
                        ? scrim.scrimConfig?.slotConfiguration?.totalSlots || 0
                        : scrim.scrimConfig?.slotConfiguration?.totalTeamSlots || 0
                    } {scrim.scrimConfig?.basicInformation?.scrimType === "SOLO" ? "players" : "teams"}
                  </span>
                </div>
                {scrim.scrimConfig?.entryPrizeSettings?.entryType === "PAID" && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                    <span>₹{scrim.scrimConfig.entryPrizeSettings.entryFeeAmount || 0} Entry</span>
                  </div>
                )}
                <Button className="w-full mt-3" asChild>
                  <Link href={`/dashboard/scrims/${scrim.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="font-medium text-muted-foreground">No public scrims available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
