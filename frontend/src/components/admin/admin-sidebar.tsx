"use client";

import {
  LayoutDashboard,
  Trophy,
  Users,
  UsersRound,
  Wallet,
  Flag,
  Megaphone,
  Settings,
  Shield,
  FileText,
  BarChart3,
  LifeBuoy,
  Swords,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    title: "Scrims",
    icon: Trophy,
    href: "/admin/scrims",
  },
  {
    title: "Registrations",
    icon: FileText,
    href: "/admin/registrations",
  },
  {
    title: "Users",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Teams",
    icon: UsersRound,
    href: "/admin/teams",
  },
  {
    title: "Payments",
    icon: Wallet,
    href: "/admin/payments",
  },
  {
    title: "Reports",
    icon: Flag,
    href: "/admin/reports",
  },
  {
    title: "Support Tickets",
    icon: LifeBuoy,
    href: "/admin/support/tickets",
  },
  {
    title: "Custom Matches",
    icon: Swords,
    href: "/admin/custom-matches",
  },
  {
    title: "Announcements",
    icon: Megaphone,
    href: "/admin/announcements",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/admin/analytics",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Tournament Manager</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.title}
              >
                <Link href={item.href}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback className="bg-orange-100 text-orange-600">
              AD
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Admin User</p>
            <p className="text-xs text-muted-foreground">Owner</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
