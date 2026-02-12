"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Trophy,
  Users,
  Wallet,
  Swords,
  UserPlus,
  DollarSign,
  Megaphone,
  Settings,
  Loader2,
  Filter,
} from "lucide-react";
import { notificationService, Notification, NotificationType } from "@/services/notification.service";
import { formatDistanceToNow } from "date-fns";

const notificationIcons: Record<NotificationType, any> = {
  [NotificationType.MATCH]: Swords,
  [NotificationType.TOURNAMENT]: Trophy,
  [NotificationType.TEAM]: Users,
  [NotificationType.PAYMENT]: DollarSign,
  [NotificationType.WALLET]: Wallet,
  [NotificationType.SCRIM]: Swords,
  [NotificationType.TEAM_INVITE]: UserPlus,
  [NotificationType.TEAM_JOIN]: Users,
  [NotificationType.MATCH_RESULT]: Trophy,
  [NotificationType.TOURNAMENT_START]: Trophy,
  [NotificationType.TRANSACTION]: DollarSign,
  [NotificationType.SYSTEM]: Settings,
  [NotificationType.ANNOUNCEMENT]: Megaphone,
};

const notificationColors: Record<NotificationType, string> = {
  [NotificationType.MATCH]: "text-orange-500 bg-orange-50 dark:bg-orange-950",
  [NotificationType.TOURNAMENT]: "text-purple-500 bg-purple-50 dark:bg-purple-950",
  [NotificationType.TEAM]: "text-blue-500 bg-blue-50 dark:bg-blue-950",
  [NotificationType.PAYMENT]: "text-green-500 bg-green-50 dark:bg-green-950",
  [NotificationType.WALLET]: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950",
  [NotificationType.SCRIM]: "text-red-500 bg-red-50 dark:bg-red-950",
  [NotificationType.TEAM_INVITE]: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950",
  [NotificationType.TEAM_JOIN]: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950",
  [NotificationType.MATCH_RESULT]: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950",
  [NotificationType.TOURNAMENT_START]: "text-pink-500 bg-pink-50 dark:bg-pink-950",
  [NotificationType.TRANSACTION]: "text-teal-500 bg-teal-50 dark:bg-teal-950",
  [NotificationType.SYSTEM]: "text-gray-500 bg-gray-50 dark:bg-gray-950",
  [NotificationType.ANNOUNCEMENT]: "text-violet-500 bg-violet-50 dark:bg-violet-950",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, activeTab, selectedType]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationService.getAll();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    // Filter by read/unread
    if (activeTab === "unread") {
      filtered = filtered.filter((n) => !n.isRead);
    } else if (activeTab === "read") {
      filtered = filtered.filter((n) => n.isRead);
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((n) => n.type === selectedType);
    }

    setFilteredNotifications(filtered);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const notification = notifications.find((n) => n.id === id);
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleClearRead = async () => {
    try {
      await notificationService.clearRead();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch (error) {
      console.error("Failed to clear read notifications:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const Icon = notificationIcons[notification.type];
    const colorClass = notificationColors[notification.type];

    return (
      <div
        className={`p-3 sm:p-4 border rounded-lg transition-all hover:shadow-md cursor-pointer ${
          notification.isRead
            ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`p-2.5 sm:p-3 rounded-full ${colorClass} shrink-0`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                  {notification.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {notification.type.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-[11px] sm:text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {!notification.isRead && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Stay updated with all your activities
          </p>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm sm:text-lg px-2.5 sm:px-3 py-1">
              {unreadCount} New
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                {notifications.length} total notifications
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto justify-center"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto justify-center"
                onClick={handleClearRead}
                disabled={notifications.filter((n) => n.isRead).length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Read
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm px-1.5 sm:px-3 py-2">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs sm:text-sm px-1.5 sm:px-3 py-2">
                Unread ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read" className="text-xs sm:text-sm px-1.5 sm:px-3 py-2">
                Read ({notifications.length - unreadCount})
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  className="sm:hidden"
                  onClick={() => setShowFilters((prev) => !prev)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </div>

              <div className={`${showFilters ? "flex" : "hidden"} sm:flex items-center gap-2 flex-wrap`}>
                <Filter className="w-4 h-4 text-gray-500 shrink-0 hidden sm:block" />
                <Button
                  size="sm"
                  variant={selectedType === "all" ? "default" : "outline"}
                  className="text-xs sm:text-sm"
                  onClick={() => setSelectedType("all")}
                >
                  All Types
                </Button>
                {Object.values(NotificationType).map((type) => {
                  const Icon = notificationIcons[type];
                  return (
                    <Button
                      key={type}
                      size="sm"
                      className="text-xs sm:text-sm"
                      variant={selectedType === type ? "default" : "outline"}
                      onClick={() => setSelectedType(type)}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {type.replace(/_/g, " ")}
                    </Button>
                  );
                })}
              </div>
            </div>

            <TabsContent value={activeTab} className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <Alert>
                  <BellOff className="w-4 h-4" />
                  <AlertDescription>
                    {activeTab === "unread"
                      ? "No unread notifications"
                      : activeTab === "read"
                      ? "No read notifications"
                      : "No notifications yet"}
                  </AlertDescription>
                </Alert>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
