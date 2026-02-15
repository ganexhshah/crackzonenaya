"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  QrCode,
  CreditCard,
  Upload,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminService, AdminTransaction } from "@/services/admin.service";
import { paymentMethodService, PaymentMethod } from "@/services/payment-method.service";
import { transactionReportService, TransactionReport } from "@/services/transaction-report.service";
import { toast } from "sonner";

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [reports, setReports] = useState<TransactionReport[]>([]);
  const [reportStats, setReportStats] = useState({ total: 0, pending: 0, underReview: 0, resolved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [reportFilterStatus, setReportFilterStatus] = useState("all");
  
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: string;
    transaction: AdminTransaction | null;
  }>({ open: false, action: "", transaction: null });

  const [transactionDetailsDialog, setTransactionDetailsDialog] = useState<{
    open: boolean;
    transaction: AdminTransaction | null;
    userTransactions: AdminTransaction[];
    loading: boolean;
  }>({ open: false, transaction: null, userTransactions: [], loading: false });

  const [reportDialog, setReportDialog] = useState<{
    open: boolean;
    report: TransactionReport | null;
  }>({ open: false, report: null });

  const [reportForm, setReportForm] = useState({
    status: "",
    adminRemark: "",
  });

  const [methodDialog, setMethodDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    method: PaymentMethod | null;
  }>({ open: false, mode: "add", method: null });

  const [methodForm, setMethodForm] = useState({
    name: "",
    type: "UPI" as "UPI" | "BANK" | "WALLET",
    accountNumber: "",
    accountName: "",
    upiId: "",
  });

  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTransactions();
    loadPaymentMethods();
    loadReports();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllTransactions();
      setTransactions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const data = await paymentMethodService.getAllPaymentMethods();
      setPaymentMethods(data);
    } catch (err: any) {
      console.error('Failed to load payment methods:', err);
      toast.error('Failed to load payment methods');
    }
  };

  const loadReports = async () => {
    try {
      const [reportsData, statsData] = await Promise.all([
        transactionReportService.adminGetAllReports(),
        transactionReportService.adminGetReportStats(),
      ]);
      setReports(reportsData);
      setReportStats(statsData);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      toast.error('Failed to load reports');
    }
  };

  const handleReportUpdate = async () => {
    if (!reportDialog.report || !reportForm.status) {
      toast.error("Please select a status");
      return;
    }

    try {
      setUpdating(true);
      await transactionReportService.adminUpdateReport(reportDialog.report.id, {
        status: reportForm.status as any,
        adminRemark: reportForm.adminRemark || undefined,
      });
      toast.success("Report updated successfully");
      await loadReports();
      setReportDialog({ open: false, report: null });
      setReportForm({ status: "", adminRemark: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update report");
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = async (transactionId: string, status: string) => {
    try {
      setUpdating(true);
      await adminService.updateTransactionStatus(transactionId, status);
      toast.success(`Transaction ${status.toLowerCase()}`);
      loadTransactions();
      setActionDialog({ open: false, action: "", transaction: null });
    } catch (err: any) {
      toast.error(err.message || "Failed to update transaction");
    } finally {
      setUpdating(false);
    }
  };

  const handleViewTransactionDetails = async (transaction: AdminTransaction) => {
    setTransactionDetailsDialog({
      open: true,
      transaction,
      userTransactions: [],
      loading: true,
    });

    try {
      // Get all transactions for this user
      const allTransactions = await adminService.getAllTransactions();
      const userTransactions = allTransactions.filter(
        (t) => t.userId === transaction.userId
      );
      
      setTransactionDetailsDialog((prev) => ({
        ...prev,
        userTransactions,
        loading: false,
      }));
    } catch (err: any) {
      toast.error("Failed to load user transactions");
      setTransactionDetailsDialog((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setQrFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMethod = () => {
    setMethodDialog({ open: true, mode: "add", method: null });
    setMethodForm({
      name: "",
      type: "UPI",
      accountNumber: "",
      accountName: "",
      upiId: "",
    });
    setQrPreview(null);
    setQrFile(null);
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setMethodDialog({ open: true, mode: "edit", method });
    setMethodForm({
      name: method.name,
      type: method.type,
      accountNumber: method.accountNumber || "",
      accountName: method.accountName || "",
      upiId: method.upiId || "",
    });
    setQrPreview(method.qrCodeUrl || null);
    setQrFile(null);
  };

  const handleSaveMethod = async () => {
    try {
      setSaving(true);

      if (!methodForm.name || !methodForm.type) {
        toast.error('Name and type are required');
        return;
      }

      if (methodDialog.mode === "add") {
        await paymentMethodService.createPaymentMethod({
          ...methodForm,
          qrCodeFile: qrFile || undefined,
        });
        toast.success("Payment method added successfully");
      } else if (methodDialog.method) {
        await paymentMethodService.updatePaymentMethod({
          id: methodDialog.method.id,
          ...methodForm,
          qrCodeFile: qrFile || undefined,
        });
        toast.success("Payment method updated successfully");
      }

      await loadPaymentMethods();
      setMethodDialog({ open: false, mode: "add", method: null });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    try {
      await paymentMethodService.deletePaymentMethod(id);
      toast.success("Payment method deleted");
      await loadPaymentMethods();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete payment method');
    }
  };

  const handleToggleMethod = async (id: string) => {
    try {
      await paymentMethodService.togglePaymentMethod(id);
      toast.success("Payment method status updated");
      await loadPaymentMethods();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment method');
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.reference.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || txn.status === filterStatus;
    const matchesType = filterType === "all" || txn.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: transactions.length,
    pending: transactions.filter((t) => t.status === "PENDING").length,
    completed: transactions.filter((t) => t.status === "COMPLETED").length,
    failed: transactions.filter((t) => t.status === "FAILED").length,
    totalAmount: transactions
      .filter((t) => t.status === "COMPLETED" && t.type === "DEPOSIT")
      .reduce((sum, t) => sum + t.amount, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "FAILED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "DEPOSIT"
      ? "bg-blue-100 text-blue-700"
      : "bg-purple-100 text-purple-700";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-muted-foreground">Manage transactions and payment methods</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">
            Reports
            {reportStats.pending > 0 && (
              <Badge variant="destructive" className="ml-2">
                {reportStats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-bold mt-1">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold mt-1 text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Failed</div>
                <div className="text-2xl font-bold mt-1 text-red-600">{stats.failed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-2xl font-bold mt-1 text-green-600">रु {stats.totalAmount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, email, reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-37.5">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="DEPOSIT">Deposit</SelectItem>
                    <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-37.5">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <div className="space-y-4">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((txn) => (
                <Card key={txn.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        {/* User Avatar */}
                        <div className="flex-shrink-0">
                          {txn.user.avatar ? (
                            <img
                              src={txn.user.avatar}
                              alt={txn.user.username}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold border-2 border-gray-200 dark:border-gray-700">
                              {txn.user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        {/* Transaction Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={getTypeColor(txn.type)}>{txn.type}</Badge>
                            <Badge className={getStatusColor(txn.status)}>{txn.status}</Badge>
                          </div>
                          <h3 className="font-semibold">{txn.user.username}</h3>
                          <p className="text-sm text-muted-foreground truncate">{txn.user.email}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Reference: {txn.reference}
                          </p>
                          {txn.description && (
                            <p className="text-sm text-muted-foreground mt-1">{txn.description}</p>
                          )}
                          {txn.receiptUrl && (
                            <div className="mt-2">
                              <a
                                href={txn.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <ImageIcon className="w-4 h-4" />
                                View Receipt
                              </a>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(txn.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-2xl font-bold">रु {txn.amount}</div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewTransactionDetails(txn)}
                          className="w-full"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {txn.status === "PENDING" && (
                          <div className="flex gap-2 w-full">
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1"
                              onClick={() =>
                                setActionDialog({ open: true, action: "approve", transaction: txn })
                              }
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() =>
                                setActionDialog({ open: true, action: "reject", transaction: txn })
                              }
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No transactions found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Reports</div>
                <div className="text-2xl font-bold mt-1">{reportStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-2xl font-bold mt-1 text-orange-600">{reportStats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Under Review</div>
                <div className="text-2xl font-bold mt-1 text-blue-600">{reportStats.underReview}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Resolved</div>
                <div className="text-2xl font-bold mt-1 text-green-600">{reportStats.resolved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Rejected</div>
                <div className="text-2xl font-bold mt-1 text-red-600">{reportStats.rejected}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <Card>
            <CardContent className="p-4">
              <Select value={reportFilterStatus} onValueChange={setReportFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="space-y-4">
            {reports
              .filter((r) => reportFilterStatus === "all" || r.status === reportFilterStatus)
              .map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant={
                                report.status === 'RESOLVED'
                                  ? 'default'
                                  : report.status === 'REJECTED'
                                  ? 'destructive'
                                  : report.status === 'UNDER_REVIEW'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {report.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(report.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div>
                            <p className="font-semibold capitalize">
                              {report.issueType.replace(/_/g, ' ')}
                            </p>
                            {report.transaction?.user && (
                              <p className="text-sm text-muted-foreground">
                                User: {report.transaction.user.username} ({report.transaction.user.email})
                              </p>
                            )}
                          </div>

                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Description:</p>
                            <p className="text-sm text-muted-foreground">{report.description}</p>
                          </div>

                          {report.transaction && (
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <span>Amount: रु {Math.abs(report.transaction.amount)}</span>
                              <span>•</span>
                              <span>Ref: {report.transaction.reference}</span>
                              <span>•</span>
                              <Badge variant="outline">{report.transaction.status}</Badge>
                            </div>
                          )}

                          {report.adminRemark && (
                            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">
                                Admin Response:
                              </p>
                              <p className="text-sm text-blue-900 dark:text-blue-100">{report.adminRemark}</p>
                            </div>
                          )}
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setReportDialog({ open: true, report });
                            setReportForm({
                              status: report.status,
                              adminRemark: report.adminRemark || "",
                            });
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Respond
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {reports.filter((r) => reportFilterStatus === "all" || r.status === reportFilterStatus).length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No reports found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="methods" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Payment Methods</h2>
              <p className="text-muted-foreground">Manage available payment options</p>
            </div>
            <Button onClick={handleAddMethod}>
              <Plus className="w-4 h-4 mr-2" />
              Add Method
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
              <Card key={method.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {method.type === "UPI" ? (
                        <QrCode className="w-5 h-5" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                      <CardTitle className="text-lg">{method.name}</CardTitle>
                    </div>
                    <Badge variant={method.isActive ? "default" : "secondary"}>
                      {method.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{method.type}</p>
                  </div>

                  {method.upiId && (
                    <div>
                      <p className="text-sm text-muted-foreground">UPI ID</p>
                      <p className="font-medium">{method.upiId}</p>
                    </div>
                  )}

                  {method.accountNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Account Number</p>
                      <p className="font-medium">{method.accountNumber}</p>
                    </div>
                  )}

                  {method.accountName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Account Name</p>
                      <p className="font-medium">{method.accountName}</p>
                    </div>
                  )}

                  {method.qrCodeUrl && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">QR Code</p>
                      <img
                        src={method.qrCodeUrl}
                        alt="QR Code"
                        className="w-32 h-32 object-contain border rounded"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEditMethod(method)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleMethod(method.id)}
                    >
                      {method.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteMethod(method.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {paymentMethods.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <QrCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No payment methods configured</p>
                <Button onClick={handleAddMethod}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Method
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => !open && !updating && setActionDialog({ open: false, action: "", transaction: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "approve" ? "Approve Transaction" : "Reject Transaction"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionDialog.action} this transaction of रु{" "}
              {actionDialog.transaction?.amount} for {actionDialog.transaction?.user.username}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, action: "", transaction: null })}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.action === "approve" ? "default" : "destructive"}
              onClick={() => {
                if (actionDialog.transaction) {
                  handleStatusUpdate(
                    actionDialog.transaction.id,
                    actionDialog.action === "approve" ? "COMPLETED" : "FAILED"
                  );
                }
              }}
              disabled={updating}
            >
              {updating ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog
        open={methodDialog.open}
        onOpenChange={(open) => !open && setMethodDialog({ open: false, mode: "add", method: null })}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {methodDialog.mode === "add" ? "Add Payment Method" : "Edit Payment Method"}
            </DialogTitle>
            <DialogDescription>
              Configure payment method details and upload QR code
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Method Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., PhonePe, Paytm"
                  value={methodForm.name}
                  onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={methodForm.type}
                  onValueChange={(value) => setMethodForm({ ...methodForm, type: value as "UPI" | "BANK" | "WALLET" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                    <SelectItem value="WALLET">Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {methodForm.type === "UPI" && (
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  placeholder="merchant@upi"
                  value={methodForm.upiId}
                  onChange={(e) => setMethodForm({ ...methodForm, upiId: e.target.value })}
                />
              </div>
            )}

            {methodForm.type === "BANK" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="Account holder name"
                    value={methodForm.accountName}
                    onChange={(e) => setMethodForm({ ...methodForm, accountName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Bank account number"
                    value={methodForm.accountNumber}
                    onChange={(e) => setMethodForm({ ...methodForm, accountNumber: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>QR Code</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {qrPreview ? (
                  <div className="space-y-4">
                    <img
                      src={qrPreview}
                      alt="QR Preview"
                      className="w-48 h-48 object-contain mx-auto border rounded"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQrPreview(null);
                        setQrFile(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload QR code image</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMethodDialog({ open: false, mode: "add", method: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveMethod} disabled={!methodForm.name || saving}>
              {saving ? "Saving..." : methodDialog.mode === "add" ? "Add Method" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Response Dialog */}
      <Dialog
        open={reportDialog.open}
        onOpenChange={(open) => !open && setReportDialog({ open: false, report: null })}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Respond to Report</DialogTitle>
            <DialogDescription>
              Update the status and provide feedback to the user
            </DialogDescription>
          </DialogHeader>

          {reportDialog.report && (
            <div className="space-y-4">
              {/* Report Details */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-sm font-medium">Issue Type</p>
                  <p className="text-sm capitalize">{reportDialog.report.issueType.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">User Description</p>
                  <p className="text-sm text-muted-foreground">{reportDialog.report.description}</p>
                </div>
                {reportDialog.report.transaction && (
                  <div className="flex gap-4 text-sm">
                    <span>Amount: रु {Math.abs(reportDialog.report.transaction.amount)}</span>
                    <span>Ref: {reportDialog.report.transaction.reference}</span>
                  </div>
                )}
              </div>

              {/* Status Selection */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={reportForm.status}
                  onValueChange={(value) => setReportForm({ ...reportForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Remark */}
              <div className="space-y-2">
                <Label htmlFor="adminRemark">Admin Response</Label>
                <Textarea
                  id="adminRemark"
                  placeholder="Provide feedback or explanation to the user..."
                  value={reportForm.adminRemark}
                  onChange={(e) => setReportForm({ ...reportForm, adminRemark: e.target.value })}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  This message will be sent to the user via email
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReportDialog({ open: false, report: null })}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button onClick={handleReportUpdate} disabled={updating || !reportForm.status}>
              {updating ? "Updating..." : "Update Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Dialog */}
      <Dialog
        open={transactionDetailsDialog.open}
        onOpenChange={(open) => !open && setTransactionDetailsDialog({ open: false, transaction: null, userTransactions: [], loading: false })}
      >
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete user profile and transaction history
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {transactionDetailsDialog.transaction && (
              <div className="space-y-6 pb-4">
                {/* Current Transaction */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-lg">Current Transaction</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <Badge className={getTypeColor(transactionDetailsDialog.transaction.type)}>
                        {transactionDetailsDialog.transaction.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(transactionDetailsDialog.transaction.status)}>
                        {transactionDetailsDialog.transaction.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold text-lg">रु {transactionDetailsDialog.transaction.amount}</p>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <p className="text-sm text-muted-foreground">Reference</p>
                      <p className="font-medium text-sm break-all">{transactionDetailsDialog.transaction.reference}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm">{transactionDetailsDialog.transaction.description}</p>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="text-sm">{new Date(transactionDetailsDialog.transaction.createdAt).toLocaleString()}</p>
                    </div>
                    {transactionDetailsDialog.transaction.receiptUrl && (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <p className="text-sm text-muted-foreground mb-2">Receipt</p>
                        <a
                          href={transactionDetailsDialog.transaction.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <img
                            src={transactionDetailsDialog.transaction.receiptUrl}
                            alt="Receipt"
                            className="max-w-full sm:max-w-xs border rounded hover:opacity-80 transition-opacity"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Profile */}
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-lg">User Profile</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Avatar */}
                    <div className="flex justify-center sm:justify-start flex-shrink-0">
                      {transactionDetailsDialog.transaction.user.avatar ? (
                        <img
                          src={transactionDetailsDialog.transaction.user.avatar}
                          alt={transactionDetailsDialog.transaction.user.username}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold border-4 border-white dark:border-gray-800 shadow-lg">
                          {transactionDetailsDialog.transaction.user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Username</p>
                        <p className="font-medium break-words">{transactionDetailsDialog.transaction.user.username}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium break-all text-sm">{transactionDetailsDialog.transaction.user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">User ID</p>
                        <p className="text-xs font-mono break-all">{transactionDetailsDialog.transaction.user.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="font-semibold text-lg sm:text-xl text-green-600 dark:text-green-400">
                          रु {transactionDetailsDialog.transaction.user.balance?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Activity Stats */}
                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-lg">User Activity</h3>
                  {transactionDetailsDialog.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Transactions</p>
                        <p className="text-xl sm:text-2xl font-bold">{transactionDetailsDialog.userTransactions.length}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Deposits</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">
                          {transactionDetailsDialog.userTransactions.filter((t) => t.type === "DEPOSIT").length}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Withdrawals</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-600">
                          {transactionDetailsDialog.userTransactions.filter((t) => t.type === "WITHDRAWAL").length}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                        <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                          {transactionDetailsDialog.userTransactions.filter((t) => t.status === "PENDING").length}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* All User Transactions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">All User Transactions</h3>
                  {transactionDetailsDialog.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : transactionDetailsDialog.userTransactions.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {transactionDetailsDialog.userTransactions.map((txn) => (
                        <button
                          key={txn.id}
                          onClick={() => handleViewTransactionDetails(txn)}
                          className={`w-full p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                            txn.id === transactionDetailsDialog.transaction?.id
                              ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400"
                              : "bg-muted/30 hover:bg-muted/50 border-transparent"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge className={getTypeColor(txn.type)} variant="outline">
                                  {txn.type}
                                </Badge>
                                <Badge className={getStatusColor(txn.status)} variant="outline">
                                  {txn.status}
                                </Badge>
                                {txn.id === transactionDetailsDialog.transaction?.id && (
                                  <Badge variant="default" className="text-xs">Current</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{txn.reference}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(txn.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-base sm:text-lg">रु {txn.amount}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No transactions found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setTransactionDetailsDialog({ open: false, transaction: null, userTransactions: [], loading: false })}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
