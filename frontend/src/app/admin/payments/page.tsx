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
import { toast } from "sonner";

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: string;
    transaction: AdminTransaction | null;
  }>({ open: false, action: "", transaction: null });

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
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeColor(txn.type)}>{txn.type}</Badge>
                          <Badge className={getStatusColor(txn.status)}>{txn.status}</Badge>
                        </div>
                        <h3 className="font-semibold">{txn.user.username}</h3>
                        <p className="text-sm text-muted-foreground">{txn.user.email}</p>
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

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-2xl font-bold">रु {txn.amount}</div>
                        {txn.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
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
    </div>
  );
}
