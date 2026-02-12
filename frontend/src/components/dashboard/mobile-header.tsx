"use client";

import { useEffect, useState } from "react";
import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Trophy,
  Users,
  Calendar,
  Wallet,
  BarChart3,
  Gamepad2,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService, Notification } from "@/services/notification.service";
import { formatDistanceToNow } from "date-fns";

const menuItems = [
  { title: "Dashboard", icon: Home, href: "/dashboard" },
  { title: "Notifications", icon: Bell, href: "/dashboard/notifications" },
  { title: "Tournaments", icon: Trophy, href: "/dashboard/tournaments" },
  { title: "Scrims", icon: Calendar, href: "/dashboard/scrims" },
  { title: "My Teams", icon: Users, href: "/dashboard/teams" },
  { title: "Matches", icon: Calendar, href: "/dashboard/matches" },
  { title: "Custom Matches", icon: Swords, href: "/dashboard/custom-matches" },
  { title: "Statistics", icon: BarChart3, href: "/dashboard/stats" },
  { title: "Wallet", icon: Wallet, href: "/dashboard/wallet" },
  { title: "Practice", icon: Gamepad2, href: "/dashboard/practice" },
  { title: "Help", icon: HelpCircle, href: "/dashboard/help" },
];

const settingsItems = (userId?: string) => [
  { title: "Profile", icon: User, href: userId ? `/dashboard/profile/${userId}` : "/profile/setup" },
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getAll();
      const latestUnread = data.notifications
        .filter((n: Notification) => !n.isRead)
        .slice(0, 5);
      setNotifications(latestUnread);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await notificationService.markAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      
      if (notification.link) {
        router.push(notification.link);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      MATCH: "🗡️",
      TOURNAMENT: "🏆",
      TEAM: "👥",
      PAYMENT: "💵",
      WALLET: "💰",
      SCRIM: "⚔️",
      TEAM_INVITE: "➕",
      TEAM_JOIN: "👤",
      MATCH_RESULT: "🏅",
      TOURNAMENT_START: "🎯",
      TRANSACTION: "💳",
      SYSTEM: "⚙️",
      ANNOUNCEMENT: "📢",
    };
    return icons[type] || "🔔";
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSearchClick = () => {
    setIsSearchOpen((prev) => !prev);
  };

  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    router.push(q ? `/dashboard/search?q=${encodeURIComponent(q)}` : "/dashboard/search");
    setIsSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left: Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 px-6 pt-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">GameHub</div>
                  <div className="text-xs text-muted-foreground font-normal">Pro Gaming</div>
                </div>
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6 h-[calc(100vh-92px)] overflow-y-auto px-6 pb-6">
              {/* User Profile */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user?.avatar || ""} alt={user?.username || "User"} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                    {getInitials(user?.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.username || "Player"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">MENU</p>
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                ))}
              </div>

              <Separator />

              {/* Settings Items */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">ACCOUNT</p>
                {settingsItems(user?.id).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                ))}
              </div>

              <Separator />

              {/* Logout */}
              <button
                onClick={() => logout()}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-destructive w-full"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Center: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-base">GameHub</h2>
          </div>
        </div>

        {/* Right: Notifications, Search & Profile */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleSearchClick}>
            <Search className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                <>
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="cursor-pointer p-3"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3 w-full">
                        <div className="text-xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem asChild className="text-center justify-center cursor-pointer">
                <Link href="/dashboard/notifications" className="w-full">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar || ""} alt={user?.username || "User"} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs">
                    {getInitials(user?.username)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.username || "Player"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={user?.id ? `/dashboard/profile/${user.id}` : "/profile/setup"} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isSearchOpen && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
              placeholder="Search..."
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              autoFocus
            />
            <Button size="sm" onClick={handleSearchSubmit}>
              Go
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
