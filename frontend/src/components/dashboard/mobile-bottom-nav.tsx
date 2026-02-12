"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Users, Calendar, User, Wallet, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  {
    title: "Home",
    icon: Home,
    href: "/dashboard",
  },
  {
    title: "Notifications",
    icon: Bell,
    href: "/dashboard/notifications",
  },
  {
    title: "Tournaments",
    icon: Trophy,
    href: "/dashboard/tournaments",
  },
  {
    title: "Wallet",
    icon: Wallet,
    href: "/dashboard/wallet",
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const profileHref = user?.id ? `/dashboard/profile/${user.id}` : "/profile/setup";
  const isProfileActive = pathname.startsWith("/dashboard/profile") || pathname === "/profile/setup";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          );
        })}
        
        {/* Profile with Avatar */}
        <Link
          href={profileHref}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors",
            isProfileActive
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className={cn(
            "relative",
            isProfileActive && "ring-2 ring-primary rounded-full"
          )}>
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.avatar || ""} alt={user?.username || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-[10px]">
                {getInitials(user?.username)}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
