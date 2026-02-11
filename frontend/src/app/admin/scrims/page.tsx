"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Upload,
  Lock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { scrimService, Scrim } from "@/services/scrim.service";
import { toast } from "sonner";

export default function AdminScrimsPage() {
  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScrims();
  }, [filterStatus, searchQuery]);

  const fetchScrims = async () => {
    try {
      setLoading(true);
      const data = await scrimService.getScrims({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchQuery || undefined,
      });
      console.log('Fetched scrims:', data);
      setScrims(data);
    } catch (error: any) {
      console.error('Failed to fetch scrims:', error);
      toast.error(error.message || 'Failed to load scrims');
      // Set empty array on error so we don't show stale data
      setScrims([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scrim?')) return;

    try {
      await scrimService.deleteScrim(id);
      toast.success('Scrim deleted successfully');
      fetchScrims();
    } catch (error: any) {
      toast.error('Failed to delete scrim');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await scrimService.updateScrim(id, { status });
      toast.success('Status updated successfully');
      fetchScrims();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "live":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-purple-100 text-purple-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const filterScrimsByTab = (tab: string) => {
    const now = new Date();
    switch (tab) {
      case 'upcoming':
        return scrims.filter(s => s.status === 'SCHEDULED' && new Date(s.scheduledAt) > now);
      case 'live':
        return scrims.filter(s => s.status === 'LIVE');
      case 'completed':
        return scrims.filter(s => s.status === 'COMPLETED');
      default:
        return scrims;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scrim Management</h1>
          <p className="text-muted-foreground">Create and manage scrims</p>
        </div>
        <Link href="/admin/scrims/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Scrim
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search scrims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Scrims List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Scrims</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {['all', 'upcoming', 'live', 'completed'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-24 bg-muted rounded animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filterScrimsByTab(tab).length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No scrims found</p>
                </CardContent>
              </Card>
            ) : (
              filterScrimsByTab(tab).map((scrim) => (
                <Card key={scrim.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{scrim.title}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <Badge variant="outline">{scrim.team?.name || 'No Team'}</Badge>
                              <Badge className={getStatusColor(scrim.status)}>
                                {scrim.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(scrim.scheduledAt)} • {formatTime(scrim.scheduledAt)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Opponent: </span>
                                <span className="font-medium">{scrim.opponentName}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Players: </span>
                                <span className="font-medium">{scrim._count?.players || 0}</span>
                              </div>
                              {scrim.roomId && (
                                <div>
                                  <span className="text-muted-foreground">Room: </span>
                                  <span className="font-medium">{scrim.roomId}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/admin/scrims/${scrim.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/admin/scrims/${scrim.id}/room`}>
                          <Button variant="outline" size="sm">
                            <Upload className="w-4 h-4 mr-2" />
                            Room
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange(scrim.id, 'LIVE')}>
                              <Lock className="w-4 h-4 mr-2" />
                              Start Match
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(scrim.id, 'COMPLETED')}>
                              <Lock className="w-4 h-4 mr-2" />
                              Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(scrim.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
