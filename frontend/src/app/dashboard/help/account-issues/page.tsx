"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HelpGettingStartedPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Account Issues</h1>
          <p className="text-muted-foreground mt-1">Login, verification, and profile issues</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/help">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Verify your email and complete your profile.</p>
          <p>2. Join or create a team if you want to play squad tournaments.</p>
          <p>3. Add money to your wallet if the tournament has an entry fee.</p>
          <p>4. Register for a tournament and follow the rules.</p>
        </CardContent>
      </Card>
    </div>
  );
}


