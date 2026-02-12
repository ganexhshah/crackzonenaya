"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HelpGettingStartedPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Wallet & Payments</h1>
          <p className="text-muted-foreground mt-1">Deposits, withdrawals, verification, and refunds</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/help">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Common Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Deposits are verified before funds are added to your wallet (usually within 24 hours).</p>
          <p>2. Always upload a clear payment screenshot for faster verification.</p>
          <p>3. Withdrawals may require additional verification depending on your account.</p>
          <p>4. If you think a transaction is wrong, submit a ticket with reference details.</p>
        </CardContent>
      </Card>
    </div>
  );
}
