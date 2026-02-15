"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Crown,
  Edit,
  Copy,
  Check,
  Trophy,
  Target,
  Zap,
  Share2,
  UserPlus,
  MoreVertical,
  Trash2,
  Shield,
  UserMinus,
  Settings,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Send,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { teamService } from "@/services/team.service";
import { userService, User } from "@/services/user.service";
import { teamWalletService, TeamTransaction, MoneyRequest } from "@/services/team-wallet.service";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamQRDialog } from "@/components/team/team-qr-dialog";
import { ReportDialog } from "@/components/report/report-dialog";
import { getCachedPageData, setCachedPageData } from "@/lib/page-cache";

const TEAM_DETAIL_CACHE_TTL_MS = 2 * 60 * 1000;

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const teamId = params.id as string;
  
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New states for user list
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
  const [invitations, setInvitations] = useState<any[]>([]);

  // Wallet states
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<TeamTransaction[]>([]);
  const [moneyRequests, setMoneyRequests] = useState<MoneyRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MoneyRequest[]>([]);
  const [isRequestMoneyOpen, setIsRequestMoneyOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [requestAmount, setRequestAmount] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  useEffect(() => {
    const cacheKey = `dashboard:team:${teamId}`;
    const cached = getCachedPageData<{
      team: any;
      walletBalance: number;
      transactions: TeamTransaction[];
      moneyRequests: MoneyRequest[];
      pendingRequests: MoneyRequest[];
    }>(cacheKey, TEAM_DETAIL_CACHE_TTL_MS);

    if (cached) {
      setTeam(cached.team);
      setWalletBalance(cached.walletBalance);
      setTransactions(cached.transactions);
      setMoneyRequests(cached.moneyRequests);
      setPendingRequests(cached.pendingRequests);
      setLoading(false);
      void Promise.all([fetchTeam({ silent: true }), fetchWalletData({ silent: true })]);
    } else {
      void Promise.all([fetchTeam(), fetchWalletData()]);
    }
    
    // Set up polling to refresh team data every 30 seconds
    const interval = setInterval(() => {
      void fetchTeam({ silent: true });
      void fetchWalletData({ silent: true });
    }, 30000);
    
    return () => clearInterval(interval);
  }, [teamId]);

  useEffect(() => {
    if (isAddMemberOpen && team && team.ownerId === user?.id) {
      fetchAllUsers();
      fetchInvitations();
    }
  }, [isAddMemberOpen, team, user]);

  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await userService.getAllUsers();
      setAllUsers(users);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const invites = await teamService.getTeamInvitations(teamId);
      setInvitations(invites);
      
      // Track invited users
      const invited = new Set(
        invites
          .filter((inv: any) => inv.status === 'PENDING')
          .map((inv: any) => inv.userId)
      );
      setInvitedUsers(invited);
    } catch (error: any) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  const fetchTeam = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true);
      const data: any = await api.get(`/teams/${teamId}`);
      setTeam(data);
      setCachedPageData(`dashboard:team:${teamId}`, {
        team: data,
        walletBalance,
        transactions,
        moneyRequests,
        pendingRequests,
      });
    } catch (error: any) {
      console.error('Failed to fetch team:', error);
      toast.error('Failed to load team');
      router.push('/dashboard/teams');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchTeam(), fetchWalletData()]);
      toast.success('Team data refreshed!');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchWalletData = async (options?: { silent?: boolean }) => {
    try {
      const [balanceData, transactionsData, requestsData, pendingData] = await Promise.all([
        teamWalletService.getBalance(teamId),
        teamWalletService.getTransactions(teamId),
        teamWalletService.getTeamRequests(teamId).catch(() => []),
        teamWalletService.getPendingRequests().catch(() => []),
      ]);

      setWalletBalance(balanceData.balance);
      setTransactions(transactionsData);
      setMoneyRequests(requestsData);
      const nextPending = pendingData.filter((req: MoneyRequest) => req.teamId === teamId);
      setPendingRequests(nextPending);
      setCachedPageData(`dashboard:team:${teamId}`, {
        team,
        walletBalance: balanceData.balance,
        transactions: transactionsData,
        moneyRequests: requestsData,
        pendingRequests: nextPending,
      });
    } catch (error: any) {
      console.error('Failed to fetch wallet data:', error);
    }
  };

  const copyInviteCode = () => {
    const inviteCode = `TEAM-${teamId}`;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const users: any = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
      setSearchResults(users);
    } catch (error: any) {
      console.error('Failed to search users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setNewMemberEmail(value);
    setSelectedUser(null);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const selectUser = (user: any) => {
    setSelectedUser(user);
    setNewMemberEmail(user.email);
    setSearchResults([]);
  };

  const handleAddMember = async () => {
    if (!selectedUser) {
      toast.error('Please select a user from the search results');
      return;
    }

    setIsAddingMember(true);
    try {
      await api.post(`/teams/${teamId}/members`, { userId: selectedUser.id });
      toast.success('Member added successfully!');
      setNewMemberEmail("");
      setSelectedUser(null);
      setSearchResults([]);
      setIsAddMemberOpen(false);
      fetchTeam();
    } catch (error: any) {
      console.error('Failed to add member:', error);
      toast.error(error.message || 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleInviteUser = async (userId: string) => {
    try {
      await teamService.inviteMember(teamId, userId);
      toast.success('Invitation sent successfully!');
      setInvitedUsers(prev => new Set([...prev, userId]));
      fetchInvitations();
    } catch (error: any) {
      console.error('Failed to invite user:', error);
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemovingMember(true);
    try {
      await api.delete(`/teams/${teamId}/members/${memberToRemove.userId}`);
      toast.success('Member removed successfully!');
      setMemberToRemove(null);
      fetchTeam(); // Refresh team data
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      toast.error(error.response?.data?.error || 'Failed to remove member');
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleDeleteTeam = async () => {
    setIsDeletingTeam(true);
    try {
      await api.delete(`/teams/${teamId}`);
      toast.success('Team deleted successfully!');
      router.push('/dashboard/teams');
    } catch (error: any) {
      console.error('Failed to delete team:', error);
      toast.error(error.response?.data?.error || 'Failed to delete team');
      setIsDeletingTeam(false);
      setShowDeleteDialog(false);
    }
  };

  const handlePromoteMember = async (memberId: string, userId: string) => {
    try {
      // This would require a backend endpoint to update member role
      toast.info('Promote member feature coming soon!');
    } catch (error) {
      toast.error('Failed to promote member');
    }
  };

  const handleRequestMoney = async () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    const amount = parseFloat(requestAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      console.log('Sending money request:', { teamId, selectedMembers, amount, requestReason });
      const result = await teamWalletService.requestMoney(teamId, selectedMembers, amount, requestReason);
      console.log('Money request result:', result);
      toast.success('Money requests sent successfully!');
      setIsRequestMoneyOpen(false);
      setSelectedMembers([]);
      setRequestAmount("");
      setRequestReason("");
      fetchWalletData();
    } catch (error: any) {
      console.error('Failed to request money:', error);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send money requests';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await teamWalletService.respondToRequest(requestId, action);
      toast.success(action === 'approve' ? 'Request approved!' : 'Request rejected');
      fetchWalletData();
    } catch (error: any) {
      console.error('Failed to respond to request:', error);
      toast.error(error.response?.data?.error || 'Failed to process request');
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const exportTransactions = () => {
    const csv = [
      ['Date', 'Type', 'Amount', 'Description'],
      ...filteredTransactions.map(t => [
        new Date(t.createdAt).toLocaleDateString(),
        t.type,
        t.amount.toString(),
        t.description || '',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-${teamId}-transactions.csv`;
    a.click();
    toast.success('Transactions exported!');
  };

  const filteredTransactions = transactions.filter(t => {
    if (transactionFilter === 'all') return true;
    return t.type === transactionFilter;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * transactionsPerPage,
    currentPage * transactionsPerPage
  );

  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  const walletStats = {
    totalDeposits: transactions
      .filter(t => t.type === 'MEMBER_CONTRIBUTION' || t.type === 'DEPOSIT')
      .reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawals: transactions
      .filter(t => t.type === 'TOURNAMENT_FEE' || t.type === 'WITHDRAWAL')
      .reduce((sum, t) => sum + t.amount, 0),
    transactionCount: transactions.length,
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/teams">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="h-20 w-full bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return null;
  }

  const isOwner = team.ownerId === user?.id;
  const captain = team.members?.find((m: any) => m.userId === team.ownerId);
  const stats = team.stats || { matches: 0, wins: 0, losses: 0, points: 0, rank: 0 };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* Back button and team info */}
        <div className="flex items-start gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1 shrink-0">
            <Link href="/dashboard/teams">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <Avatar className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 border-2 sm:border-4 border-primary shrink-0">
              <AvatarImage src={team.logo} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg sm:text-xl md:text-2xl font-bold">
                {team.tag}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 truncate">
                <span className="truncate">{team.name}</span>
                {isOwner && <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 shrink-0" />}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground truncate">Tag: {team.tag}</p>
              <Badge variant="default" className="mt-1 sm:mt-2 text-xs">Active</Badge>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          
          {isOwner && (
            <>
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <Share2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Invite</span>
                  <span className="sm:hidden">Invite</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Players</DialogTitle>
                  <DialogDescription>
                    Share this code with players to join your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Invite Code</Label>
                    <div className="flex gap-2">
                      <Input value={`TEAM-${teamId}`} readOnly />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyInviteCode}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Players can use this code to request joining your team
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            <TeamQRDialog teamId={teamId} teamName={team.name} />

            <Button asChild size="sm" className="flex-1 sm:flex-none">
              <Link href={`/dashboard/teams/${teamId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Edit Team</span>
                <span className="sm:hidden">Edit</span>
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="px-2 sm:px-3">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Team Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/teams/${teamId}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Team Info
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAddMemberOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
        {/* Pending Request Alert */}
        {!isOwner && pendingRequests.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-orange-900 text-sm sm:text-base">
                  {pendingRequests.length} Pending Money Request{pendingRequests.length > 1 ? 's' : ''}
                </h3>
                <p className="text-xs sm:text-sm text-orange-700 mt-1">
                  Your team leader has requested money. Go to the Wallet tab to review and respond.
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="border-orange-600 text-orange-600 hover:bg-orange-100 text-xs shrink-0"
                onClick={() => {
                  const walletTab = document.querySelector('[value="wallet"]') as HTMLElement;
                  walletTab?.click();
                }}
              >
                View
              </Button>
            </div>
          </div>
        )}
        
        <TabsList className={`w-full grid ${isOwner ? 'grid-cols-4' : 'grid-cols-3'} h-auto gap-1 p-1`}>
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-1 sm:px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="text-xs sm:text-sm py-2 px-1 sm:px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
            <Wallet className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Wallet</span>
            <span className="sm:hidden">Wallet</span>
            {!isOwner && pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="members" className="text-xs sm:text-sm py-2 px-1 sm:px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Members ({team.members?.length || 0})</span>
            <span className="sm:hidden">({team.members?.length || 0})</span>
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="management" className="text-xs sm:text-sm py-2 px-1 sm:px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Management</span>
              <span className="sm:hidden">Manage</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Left Column - Team Stats */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Team Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Team Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.matches}</div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Matches</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.wins}</div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Wins</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-red-600">{stats.losses}</div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Losses</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.points}</div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Points</p>
                    </div>
                    <div className="text-center col-span-2 sm:col-span-1">
                      <div className="text-2xl sm:text-3xl font-bold text-orange-600">#{stats.rank || '-'}</div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">Rank</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Description */}
              {team.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">About Team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-muted-foreground">{team.description}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-4 md:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start text-sm" asChild>
                    <Link href="/dashboard/tournaments">
                      <Trophy className="mr-2 h-4 w-4" />
                      Join Tournament
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm" asChild>
                    <Link href="/dashboard/practice">
                      <Target className="mr-2 h-4 w-4" />
                      Practice Mode
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm" asChild>
                    <Link href="/dashboard/stats">
                      <Zap className="mr-2 h-4 w-4" />
                      View Stats
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Team Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                      <AvatarImage src={captain?.user?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white text-sm">
                        {captain?.user?.username?.substring(0, 2).toUpperCase() || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium flex items-center gap-2 text-sm sm:text-base truncate">
                        <span className="truncate">{captain?.user?.username || 'Unknown'}</span>
                        <Crown className="h-4 w-4 text-yellow-500 shrink-0" />
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Team Leader</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="space-y-4 md:space-y-6">
          {/* Wallet Balance Card */}
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                Team Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">₹{walletBalance.toFixed(2)}</div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <div className="flex items-center gap-1 text-green-200">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Deposits</span>
                    <span className="sm:hidden">In</span>
                  </div>
                  <div className="font-semibold mt-1 text-sm sm:text-base">₹{walletStats.totalDeposits.toFixed(2)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-red-200">
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Withdrawals</span>
                    <span className="sm:hidden">Out</span>
                  </div>
                  <div className="font-semibold mt-1 text-sm sm:text-base">₹{walletStats.totalWithdrawals.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-blue-200 truncate">
                    <span className="hidden sm:inline">Transactions</span>
                    <span className="sm:hidden">Total</span>
                  </div>
                  <div className="font-semibold mt-1 text-sm sm:text-base">{walletStats.transactionCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Money Request Section (Leader Only) */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    Request Money from Members
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Request contributions from team members for tournaments or expenses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full text-sm"
                    onClick={() => setIsRequestMoneyOpen(true)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Create Money Request
                  </Button>

                  {/* Sent Requests */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs sm:text-sm">Recent Requests</h4>
                    {moneyRequests.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {moneyRequests.slice(0, 5).map((request) => (
                          <div
                            key={request.id}
                            className="p-2 sm:p-3 border rounded-lg text-xs sm:text-sm"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-sm sm:text-base">₹{request.amount}</span>
                              <Badge
                                variant={
                                  request.status === 'APPROVED'
                                    ? 'default'
                                    : request.status === 'REJECTED'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {request.status}
                              </Badge>
                            </div>
                            {request.reason && (
                              <p className="text-muted-foreground text-xs line-clamp-2">{request.reason}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                        No requests sent yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Requests (For All Members) */}
            {pendingRequests.length > 0 && (
              <Card className="border-orange-500/50 bg-orange-50/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-orange-600">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                    Pending Money Requests
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {isOwner ? 'Your pending requests to members' : 'Requests from your team leader'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-3 sm:p-4 border border-orange-200 rounded-lg space-y-3 bg-white"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base sm:text-lg text-orange-600">₹{request.amount}</div>
                          {request.reason && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                              {request.reason}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Requested {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {!isOwner && (
                        <>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              size="sm"
                              className="flex-1 text-xs sm:text-sm bg-green-600 hover:bg-green-700"
                              onClick={() => handleRespondToRequest(request.id, 'approve')}
                            >
                              <Check className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                              Accept & Pay ₹{request.amount}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs sm:text-sm border-red-600 text-red-600 hover:bg-red-50"
                              onClick={() => handleRespondToRequest(request.id, 'reject')}
                            >
                              Decline
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                            💰 Your balance: ₹{user?.balance || 0}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Transactions Preview */}
            <Card className={isOwner ? "" : "lg:col-span-2"}>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Recent Transactions</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Latest 5 transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border rounded-lg gap-1 sm:gap-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{transaction.type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`font-semibold text-sm sm:text-base shrink-0 ${
                          transaction.type.includes('CONTRIBUTION') || transaction.type === 'DEPOSIT'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {transaction.type.includes('CONTRIBUTION') || transaction.type === 'DEPOSIT' ? '+' : '-'}
                          ₹{transaction.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    No transactions yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg">Transaction History</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Complete list of all team transactions</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                      <Filter className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Transactions</SelectItem>
                      <SelectItem value="MEMBER_CONTRIBUTION">Contributions</SelectItem>
                      <SelectItem value="TOURNAMENT_FEE">Tournament Fees</SelectItem>
                      <SelectItem value="DEPOSIT">Deposits</SelectItem>
                      <SelectItem value="WITHDRAWAL">Withdrawals</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportTransactions}
                    disabled={transactions.length === 0}
                    className="text-xs sm:text-sm"
                  >
                    <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Export</span>
                    <span className="sm:hidden">Export CSV</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {paginatedTransactions.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {paginatedTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex flex-col gap-2 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <p className="font-medium text-xs sm:text-sm">{transaction.type.replace(/_/g, ' ')}</p>
                              <Badge variant="outline" className="text-xs">
                                {transaction.type}
                              </Badge>
                            </div>
                            {transaction.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                                {transaction.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(transaction.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className={`text-base sm:text-lg font-bold shrink-0 ${
                            transaction.type.includes('CONTRIBUTION') || transaction.type === 'DEPOSIT'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {transaction.type.includes('CONTRIBUTION') || transaction.type === 'DEPOSIT' ? '+' : '-'}
                            ₹{transaction.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                      <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                        Showing {((currentPage - 1) * transactionsPerPage) + 1} to{' '}
                        {Math.min(currentPage * transactionsPerPage, filteredTransactions.length)} of{' '}
                        {filteredTransactions.length} transactions
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              return page === 1 || 
                                     page === totalPages || 
                                     Math.abs(page - currentPage) <= 1;
                            })
                            .map((page, idx, arr) => (
                              <>
                                {idx > 0 && arr[idx - 1] !== page - 1 && (
                                  <span key={`ellipsis-${page}`} className="px-1 sm:px-2 text-xs sm:text-sm">...</span>
                                )}
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className="h-8 w-8 p-0 text-xs sm:text-sm"
                                >
                                  {page}
                                </Button>
                              </>
                            ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No transactions found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">Team Roster</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{team.members?.length || 0} members</CardDescription>
                </div>
                {isOwner && (
                  <Button onClick={() => setIsAddMemberOpen(true)} size="sm" className="text-xs sm:text-sm">
                    <UserPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Add Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {team.members && team.members.length > 0 ? (
                team.members.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 shrink-0">
                        <AvatarImage src={member.user?.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs sm:text-sm">
                          {member.user?.username?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <p className="font-medium text-xs sm:text-sm truncate">{member.user?.username || 'Unknown'}</p>
                          {member.userId === team.ownerId && (
                            <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <Badge variant={member.role === "SUBSTITUTE" ? "secondary" : "default"} className="text-xs hidden sm:inline-flex">
                        {member.role}
                      </Badge>
                      {isOwner && member.userId !== team.ownerId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel className="text-xs">Member Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handlePromoteMember(member.id, member.userId)}
                              className="text-xs"
                            >
                              <Shield className="mr-2 h-3 w-3" />
                              Promote to Captain
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive text-xs"
                              onClick={() => setMemberToRemove(member)}
                            >
                              <UserMinus className="mr-2 h-3 w-3" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {!isOwner && member.userId !== user?.id && (
                        <ReportDialog
                          reportedUserId={member.userId}
                          reportedUserName={member.user?.username}
                          trigger={
                            <Button variant="ghost" size="sm" className="h-8">
                              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">No members yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Management Tab (Owner Only) */}
        {isOwner && (
          <TabsContent value="management" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Team Management</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Manage your team settings and members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={() => setIsInviteOpen(true)}
                  >
                    <Share2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Generate Invite Code
                  </Button>
                  <TeamQRDialog 
                    teamId={teamId} 
                    teamName={team.name}
                    className="w-full justify-start text-xs sm:text-sm"
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={() => setIsAddMemberOpen(true)}
                  >
                    <UserPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Add Team Member
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs sm:text-sm"
                    asChild
                  >
                    <Link href={`/dashboard/teams/${teamId}/edit`}>
                      <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Edit Team Information
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive text-base sm:text-lg">Danger Zone</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    className="w-full text-xs sm:text-sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Delete Team
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    This action cannot be undone. All team data will be permanently deleted.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Team Statistics</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Overview of your team's performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Total Members</span>
                    <span className="font-bold text-sm sm:text-base">{team.members?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Total Matches</span>
                    <span className="font-bold text-sm sm:text-base">{stats.matches}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Win Rate</span>
                    <span className="font-bold text-green-600 text-sm sm:text-base">
                      {stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Team Rank</span>
                    <span className="font-bold text-sm sm:text-base">#{stats.rank || 'Unranked'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
            <DialogDescription>
              Select users to invite to your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
            <div className="space-y-2">
              <Label htmlFor="userSearch">Search Users</Label>
              <Input
                id="userSearch"
                placeholder="Search by username, email, or game name..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
            </div>

            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto border rounded-lg">
                <div className="divide-y">
                  {allUsers
                    .filter((user) => {
                      const query = userSearchQuery.toLowerCase();
                      return (
                        user.username.toLowerCase().includes(query) ||
                        user.email.toLowerCase().includes(query) ||
                        (user.gameName && user.gameName.toLowerCase().includes(query))
                      );
                    })
                    .map((user) => {
                      const isMember = team.members?.some((m: any) => m.userId === user.id);
                      const isInvited = invitedUsers.has(user.id);

                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="w-10 h-10 shrink-0">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                                {user.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{user.username}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              {user.gameName && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.gameName} {user.gameId && `(${user.gameId})`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0">
                            {isMember ? (
                              <Badge variant="secondary" className="text-xs">
                                Member
                              </Badge>
                            ) : isInvited ? (
                              <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                                Invited
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleInviteUser(user.id)}
                                className="text-xs"
                              >
                                <UserPlus className="mr-1 h-3 w-3" />
                                Invite
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {allUsers.filter((user) => {
                    const query = userSearchQuery.toLowerCase();
                    return (
                      user.username.toLowerCase().includes(query) ||
                      user.email.toLowerCase().includes(query) ||
                      (user.gameName && user.gameName.toLowerCase().includes(query))
                    );
                  }).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {userSearchQuery ? 'No users found matching your search' : 'No users available'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddMemberOpen(false);
                setUserSearchQuery("");
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.user?.username} from the team?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingMember}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemovingMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemovingMember ? "Removing..." : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Team Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{team.name}"? This action cannot be undone.
              All team data, members, and statistics will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTeam}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={isDeletingTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingTeam ? "Deleting..." : "Delete Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Money Dialog */}
      <Dialog open={isRequestMoneyOpen} onOpenChange={setIsRequestMoneyOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Request Money from Members</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Select members and specify the amount you want to request from each
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Amount per Member (₹)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                min="1"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Reason (Optional)</Label>
              <Textarea
                placeholder="e.g., Tournament entry fee, Team equipment"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={3}
                className="text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Select Members</Label>
              <div className="border rounded-lg p-2 sm:p-4 space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
                {team.members
                  ?.filter((member: any) => member.userId !== user?.id)
                  .map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded gap-2"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={selectedMembers.includes(member.userId)}
                          onCheckedChange={() => toggleMemberSelection(member.userId)}
                        />
                        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
                          <AvatarImage src={member.user?.avatar} />
                          <AvatarFallback className="text-xs">
                            {member.user?.username?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs sm:text-sm truncate">{member.user?.username}</p>
                          <p className="text-xs text-muted-foreground">
                            Balance: ₹{member.user?.balance || 0}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{member.role}</Badge>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedMembers.length} member(s) selected
              </p>
            </div>

            {selectedMembers.length > 0 && requestAmount && (
              <div className="p-3 sm:p-4 bg-muted rounded-lg">
                <p className="text-xs sm:text-sm font-medium">Summary</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total to be collected: ₹{(parseFloat(requestAmount) * selectedMembers.length).toFixed(2)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRequestMoneyOpen(false);
                setSelectedMembers([]);
                setRequestAmount("");
                setRequestReason("");
              }}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestMoney}
              disabled={isSubmittingRequest || selectedMembers.length === 0 || !requestAmount}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {isSubmittingRequest ? "Sending..." : "Send Requests"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
