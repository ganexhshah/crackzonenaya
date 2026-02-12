"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Wallet,
  Trophy,
  ShieldAlert,
  Flag,
  Award,
  UserCircle2,
  Wrench,
  ScrollText,
  LifeBuoy,
} from "lucide-react";

const sections = [
  { title: "Getting Started", icon: BookOpen, href: "/dashboard/help/getting-started" },
  { title: "Wallet & Payments", icon: Wallet, href: "/dashboard/help/wallet-payments" },
  { title: "Tournament Rules", icon: Trophy, href: "/dashboard/help/tournament-rules" },
  { title: "Reporting & Appeals", icon: Flag, href: "/dashboard/help/reporting-appeals" },
  { title: "Prizes & Results", icon: Award, href: "/dashboard/help/prizes-results" },
  { title: "Account Issues", icon: UserCircle2, href: "/dashboard/help/account-issues" },
  { title: "Technical Issues", icon: Wrench, href: "/dashboard/help/technical-issues" },
  { title: "Policies", icon: ScrollText, href: "/dashboard/help/policies" },
];

export default function HelpCenterPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Help Center</h1>
          <p className="text-muted-foreground mt-1">
            Getting Started, Wallet, Rules, Policies, and Support Tickets
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/help/tickets">
              <LifeBuoy className="h-4 w-4 mr-2" />
              My Tickets
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/help/tickets/new">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Submit a Ticket
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-2 bg-gradient-to-r from-muted/40 via-background to-muted/40">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Need help fast?</p>
              <p className="text-sm text-muted-foreground">
                Check a section below, or submit a ticket and track its status.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              Tickets include statuses: OPEN, IN_PROGRESS, WAITING_USER, RESOLVED, CLOSED
            </Badge>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sections.map((s) => (
              <Link key={s.href} href={s.href} className="block">
                <div className="rounded-lg border bg-background hover:bg-muted/40 transition-colors p-4 h-full">
                  <div className="flex items-center gap-2">
                    <s.icon className="h-5 w-5 text-primary" />
                    <p className="font-semibold">{s.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    View guides, rules, and common fixes.
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

