"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  AlertCircle,
  FileText,
} from "lucide-react";
import { walletService, WalletData, Transaction } from "@/services/wallet.service";
import { paymentMethodService, PaymentMethod } from "@/services/payment-method.service";
import { transactionReportService, TransactionReport } from "@/services/transaction-report.service";
import { toast } from "sonner";
import { getCachedPageData, setCachedPageData } from "@/lib/page-cache";
import { useRouter } from "next/navigation";

const WALLET_CACHE_KEY = "dashboard:wallet";
const WALLET_CACHE_TTL_MS = 2 * 60 * 1000;

export default function WalletPage() {
  const router = useRouter();
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    currency: "रु",
    pendingAmount: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
  const [reportTransaction, setReportTransaction] = useState<Transaction | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  useEffect(() => {
    const cached = getCachedPageData<{ walletData: WalletData; transactions: Transaction[] }>(
      WALLET_CACHE_KEY,
      WALLET_CACHE_TTL_MS
    );
    if (cached) {
      setWalletData(cached.walletData);
      setTransactions(cached.transactions);
      void fetchWalletData();
      return;
    }
    void fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [wallet, txns] = await Promise.all([
        walletService.getWallet(),
        walletService.getTransactions(),
      ]);
      setWalletData(wallet);
      setTransactions(txns);
      setCachedPageData(WALLET_CACHE_KEY, { walletData: wallet, transactions: txns });
    } catch (error: any) {
      console.error('Failed to fetch wallet data:', error);
      toast.error('Failed to load wallet data');
    }
  };

  const refreshBalance = async () => {
    try {
      setBalanceLoading(true);
      const wallet = await walletService.getWallet();
      setWalletData(wallet);
    } catch (error: any) {
      console.error('Failed to refresh balance:', error);
      toast.error('Failed to refresh balance');
    } finally {
      setBalanceLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Wallet</h1>
          <p className="text-muted-foreground mt-1">
            Manage your funds and transactions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/reports')}
        >
          <FileText className="w-4 h-4 mr-2" />
          Report History
        </Button>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div>
              <p className="text-white/80 text-xs sm:text-sm mb-2">Available Balance</p>
              <div className="flex items-baseline gap-2">
                {balanceLoading ? (
                  <div className="h-10 sm:h-12 w-32 sm:w-48 bg-white/20 rounded animate-pulse" />
                ) : (
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold">
                    {walletData.currency} {walletData.balance.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <Wallet className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white/50 flex-shrink-0" />
          </div>

          {walletData.pendingAmount > 0 && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/80 mb-4 sm:mb-6">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              {balanceLoading ? (
                <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
              ) : (
                <span>Pending: {walletData.currency} {walletData.pendingAmount}</span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="w-full h-11 sm:h-10 text-sm sm:text-base">
                  <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                  Add Money
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
                <AddMoneyDialog 
                  onClose={() => {
                    setIsAddMoneyOpen(false);
                    refreshBalance();
                  }} 
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="w-full h-11 sm:h-10 text-sm sm:text-base">
                  <Minus className="mr-1 sm:mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
                <WithdrawDialog 
                  onClose={() => {
                    setIsWithdrawOpen(false);
                    refreshBalance();
                  }}
                  walletBalance={walletData.balance}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Transaction History</CardTitle>
          <CardDescription className="text-sm">View all your wallet transactions</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm px-2 py-2">All</TabsTrigger>
              <TabsTrigger value="deposit" className="text-xs sm:text-sm px-2 py-2">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawal" className="text-xs sm:text-sm px-2 py-2">Withdrawals</TabsTrigger>
              <TabsTrigger value="payment" className="text-xs sm:text-sm px-2 py-2">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onViewReceipt={setSelectedReceipt}
                    formatDate={formatDate}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="deposit" className="space-y-3">
              {transactions.filter((t) => t.type === "deposit").length > 0 ? (
                transactions
                  .filter((t) => t.type === "deposit")
                  .map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onViewReceipt={setSelectedReceipt}
                      formatDate={formatDate}
                    />
                  ))
              ) : (
                <div className="text-center py-12">
                  <ArrowDownLeft className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No deposits yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="withdrawal" className="space-y-3">
              {transactions.filter((t) => t.type === "withdrawal").length > 0 ? (
                transactions
                  .filter((t) => t.type === "withdrawal")
                  .map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onViewReceipt={setSelectedReceipt}
                      formatDate={formatDate}
                    />
                  ))
              ) : (
                <div className="text-center py-12">
                  <ArrowUpRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No withdrawals yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="payment" className="space-y-3">
              {transactions.filter((t) => t.type === "payment").length > 0 ? (
                transactions
                  .filter((t) => t.type === "payment")
                  .map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onViewReceipt={setSelectedReceipt}
                      formatDate={formatDate}
                    />
                  ))
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No payments yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Receipt Preview Dialog */}
      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg md:text-xl">Transaction Receipt</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm break-all">
              Transaction ID: {selectedReceipt?.reference}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs sm:text-sm">Type</p>
                <p className="font-medium text-sm sm:text-base capitalize">{selectedReceipt?.type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs sm:text-sm">Amount</p>
                <p className="font-medium text-sm sm:text-base">रु {Math.abs(selectedReceipt?.amount || 0)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs sm:text-sm">Method</p>
                <p className="font-medium text-sm sm:text-base truncate">{selectedReceipt?.method}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs sm:text-sm">Status</p>
                <Badge
                  variant={
                    selectedReceipt?.status === "Verified"
                      ? "default"
                      : selectedReceipt?.status === "Pending"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-xs"
                >
                  {selectedReceipt?.status}
                </Badge>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-muted-foreground text-xs sm:text-sm">Date</p>
                <p className="font-medium text-sm sm:text-base">{formatDate(selectedReceipt?.date)}</p>
              </div>
            </div>

            {/* Payment Screenshot */}
            {selectedReceipt?.receiptUrl && (
              <div className="space-y-2 sm:space-y-3">
                <p className="text-sm sm:text-base font-medium">Payment Screenshot</p>
                <div className="border-2 rounded-lg overflow-hidden bg-muted/30">
                  <img
                    src={selectedReceipt.receiptUrl}
                    alt="Payment Receipt"
                    className="w-full h-auto object-contain"
                  />
                </div>
                <a
                  href={selectedReceipt.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center gap-1.5 pt-1"
                >
                  <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Open in new tab</span>
                </a>
              </div>
            )}

            {/* Report Issue */}
            {selectedReceipt?.status === "Pending" && (
              <div className="pt-3 sm:pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-11 text-sm sm:text-base"
                  onClick={() => {
                    setReportTransaction(selectedReceipt);
                    setIsReportIssueOpen(true);
                    setSelectedReceipt(null);
                  }}
                >
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  Report an Issue
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Issue Dialog */}
      <Dialog open={isReportIssueOpen} onOpenChange={setIsReportIssueOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <ReportIssueDialog
            transaction={reportTransaction}
            onClose={() => {
              setIsReportIssueOpen(false);
              setReportTransaction(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransactionCard({ transaction, onViewReceipt, formatDate }: any) {
  const isDeposit = transaction.type === "deposit";
  const isWithdrawal = transaction.type === "withdrawal";
  const isPayment = transaction.type === "payment";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${
            isDeposit
              ? "bg-green-100 dark:bg-green-900"
              : isWithdrawal
              ? "bg-orange-100 dark:bg-orange-900"
              : "bg-blue-100 dark:bg-blue-900"
          }`}
        >
          {isDeposit ? (
            <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : isWithdrawal ? (
            <ArrowUpRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          ) : (
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium capitalize truncate">
            {transaction.description || transaction.type}
          </p>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="truncate">{transaction.method}</span>
            <span className="hidden sm:inline">•</span>
            <span className="truncate">{formatDate(transaction.date)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 sm:text-right">
        <div>
          <p
            className={`font-semibold text-sm sm:text-base ${
              isDeposit ? "text-green-600" : isPayment ? "text-red-600" : ""
            }`}
          >
            {isDeposit ? "+" : ""}
            {transaction.amount > 0 ? transaction.amount : Math.abs(transaction.amount)} रु
          </p>
          <Badge
            variant={
              transaction.status === "Verified"
                ? "default"
                : transaction.status === "Pending"
                ? "secondary"
                : "destructive"
            }
            className="text-xs"
          >
            {transaction.status === "Verified" && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {transaction.status === "Pending" && <Clock className="h-3 w-3 mr-1" />}
            {transaction.status === "Failed" && <XCircle className="h-3 w-3 mr-1" />}
            {transaction.status}
          </Badge>
        </div>
        {transaction.transactionId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewReceipt(transaction)}
            className="flex-shrink-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function AddMoneyDialog({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [step, setStep] = useState<"amount" | "payment" | "success">("amount");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const methods = await paymentMethodService.getActivePaymentMethods();
      setPaymentMethods(methods);
    } catch (error: any) {
      console.error('Failed to fetch payment methods:', error);
      toast.error('Failed to load payment methods');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      if (screenshotPreviewUrl) {
        URL.revokeObjectURL(screenshotPreviewUrl);
      }
      setScreenshot(file);
      setScreenshotPreviewUrl(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    return () => {
      if (screenshotPreviewUrl) {
        URL.revokeObjectURL(screenshotPreviewUrl);
      }
    };
  }, [screenshotPreviewUrl]);

  const handleSubmit = async () => {
    if (!screenshot || !transactionId) {
      toast.error("Please upload screenshot and enter transaction ID");
      return;
    }

    try {
      setSubmitting(true);
      await walletService.submitDeposit({
        amount: Number(amount),
        method: selectedMethod?.name || '',
        transactionId,
        screenshot,
      });
      setStep("success");
      toast.success("Payment submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Payment Submitted!</DialogTitle>
          <DialogDescription>Your payment is being verified</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="font-medium">Payment verification in progress</p>
            <p className="text-sm text-muted-foreground">
              Your funds will be added to your wallet once verified (usually within 24 hours)
            </p>
          </div>
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </>
    );
  }

  if (step === "payment" && selectedMethod) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Complete Payment - {selectedMethod.name}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">Amount: रु {amount}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          {/* Payment Method Info */}
          <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Payment Method</span>
              <span className="font-medium text-sm sm:text-base">{selectedMethod.name}</span>
            </div>
            {selectedMethod.upiId && (
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">UPI ID</span>
                <span className="font-mono text-xs sm:text-sm break-all">{selectedMethod.upiId}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Amount</span>
              <span className="font-bold text-base sm:text-lg">रु {amount}</span>
            </div>
          </div>

          {/* QR Code */}
          {selectedMethod.qrCodeUrl && (
            <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center bg-white dark:bg-muted">
              <img
                src={selectedMethod.qrCodeUrl}
                alt={`${selectedMethod.name} QR Code`}
                className="w-48 h-48 sm:w-64 sm:h-64 mx-auto object-contain rounded-lg"
                id="payment-qr-code"
              />
              <p className="text-xs sm:text-sm font-medium mt-3 sm:mt-4">Scan to pay रु {amount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use your {selectedMethod.name} app to scan and pay
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={async () => {
                  try {
                    const response = await fetch(selectedMethod.qrCodeUrl!);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${selectedMethod.name}-QR-Code.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    toast.success('QR code downloaded');
                  } catch (error) {
                    toast.error('Failed to download QR code');
                  }
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          )}

          <Separator />

          {/* Upload Screenshot */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Upload Payment Screenshot *</Label>
            {screenshot ? (
              <div className="space-y-2">
                <div className="border rounded-lg p-3 sm:p-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium truncate pr-2">{screenshot.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (screenshotPreviewUrl) {
                          URL.revokeObjectURL(screenshotPreviewUrl);
                        }
                        setScreenshot(null);
                        setScreenshotPreviewUrl(null);
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(screenshot.size / 1024).toFixed(2)} KB
                  </p>
                  {screenshotPreviewUrl && (
                    <div className="mt-3 border rounded-md overflow-hidden bg-background">
                      <img
                        src={screenshotPreviewUrl}
                        alt="Payment screenshot preview"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="screenshot"
                />
                <label htmlFor="screenshot" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs sm:text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG (Max 5MB)</p>
                </label>
              </div>
            )}
          </div>

          {/* Transaction ID */}
          <div className="space-y-2">
            <Label htmlFor="txnId" className="text-sm sm:text-base">Transaction ID *</Label>
            <Input
              id="txnId"
              placeholder="Enter transaction ID from payment app"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="text-sm sm:text-base"
            />
            <p className="text-xs text-muted-foreground">
              Find this in your payment app after completing the transaction
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 h-11 sm:h-12 text-sm sm:text-base" onClick={() => setStep("amount")}>
              Back
            </Button>
            <Button 
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base" 
              onClick={handleSubmit} 
              disabled={submitting || !screenshot || !transactionId}
            >
              {submitting ? "Submitting..." : "Submit Payment"}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl">Add Money</DialogTitle>
        <DialogDescription className="text-xs sm:text-sm">Choose amount and payment method</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm sm:text-base">Amount (रु)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            className="text-base sm:text-lg h-11 sm:h-12"
          />
          <p className="text-xs sm:text-sm text-muted-foreground">
            Minimum deposit: रु 100
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm sm:text-base">Payment Method</Label>
          {paymentMethods.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentMethods.filter(m => m.isActive).map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method)}
                  className={`p-3 sm:p-4 border-2 rounded-lg transition-all hover:scale-105 ${
                    selectedMethod?.id === method.id
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold text-sm sm:text-base">{method.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{method.type}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 sm:p-8 border-2 border-dashed rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground">
                No payment methods available. Please contact admin.
              </p>
            </div>
          )}
        </div>

        <Button
          className="w-full h-11 sm:h-12 text-sm sm:text-base"
          onClick={() => setStep("payment")}
          disabled={!amount || Number(amount) < 100 || !selectedMethod}
        >
          Continue to Payment
        </Button>
      </div>
    </>
  );
}

function WithdrawDialog({ onClose, walletBalance }: { onClose: () => void; walletBalance: number }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"esewa" | "khalti">("esewa");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !accountNumber) {
      toast.error("Please fill all fields");
      return;
    }

    if (Number(amount) > walletBalance) {
      toast.error("Insufficient balance");
      return;
    }

    if (Number(amount) < 100) {
      toast.error("Minimum withdrawal amount is रु 100");
      return;
    }

    try {
      setSubmitting(true);
      await walletService.submitWithdrawal({
        amount: Number(amount),
        method,
        accountNumber,
      });
      toast.success("Withdrawal request submitted!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit withdrawal request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl">Withdraw Money</DialogTitle>
        <DialogDescription className="text-xs sm:text-sm">
          Available Balance: रु {walletBalance.toFixed(2)}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="withdrawAmount" className="text-sm sm:text-base">Amount (रु)</Label>
          <Input
            id="withdrawAmount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            max={walletBalance}
            className="text-base sm:text-lg h-11 sm:h-12"
          />
          <p className="text-xs sm:text-sm text-muted-foreground">
            Minimum withdrawal: रु 100
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm sm:text-base">Withdrawal Method</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setMethod("esewa")}
              className={`p-3 sm:p-4 border-2 rounded-lg transition-all ${
                method === "esewa"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="font-semibold text-sm sm:text-base">eSewa</p>
            </button>
            <button
              onClick={() => setMethod("khalti")}
              className={`p-3 sm:p-4 border-2 rounded-lg transition-all ${
                method === "khalti"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="font-semibold text-sm sm:text-base">Khalti</p>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumber" className="text-sm sm:text-base">
            {method === "esewa" ? "eSewa" : "Khalti"} Number
          </Label>
          <Input
            id="accountNumber"
            placeholder="Enter your account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="text-sm sm:text-base h-11 sm:h-12"
          />
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
          <p className="text-xs sm:text-sm text-yellow-900 dark:text-yellow-100">
            <strong>Note:</strong> Withdrawal requests are processed within 24-48 hours
          </p>
        </div>

        <Button className="w-full h-11 sm:h-12 text-sm sm:text-base" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Withdrawal Request"}
        </Button>
      </div>
    </>
  );
}


function ReportIssueDialog({ transaction, onClose }: { transaction: Transaction | null; onClose: () => void }) {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!issueType || !description) {
      toast.error("Please fill all fields");
      return;
    }

    if (!transaction) {
      toast.error("Transaction not found");
      return;
    }

    try {
      setSubmitting(true);
      await transactionReportService.createReport({
        transactionId: transaction.id,
        issueType,
        description,
      });
      toast.success("Issue reported successfully. Our team will review it shortly.");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base sm:text-lg md:text-xl">Report Transaction Issue</DialogTitle>
        <DialogDescription className="text-xs sm:text-sm">
          Transaction ID: {transaction?.reference || 'N/A'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        {/* Transaction Details */}
        <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium">रु {Math.abs(transaction?.amount || 0)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium capitalize">{transaction?.type}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="secondary" className="text-xs">
              {transaction?.status}
            </Badge>
          </div>
        </div>

        {/* Issue Type */}
        <div className="space-y-2">
          <Label htmlFor="issueType" className="text-sm sm:text-base">Issue Type *</Label>
          <Select value={issueType} onValueChange={setIssueType}>
            <SelectTrigger className="h-10 sm:h-11">
              <SelectValue placeholder="Select issue type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="payment_not_received">Payment Not Received</SelectItem>
              <SelectItem value="wrong_amount">Wrong Amount Credited</SelectItem>
              <SelectItem value="duplicate_charge">Duplicate Charge</SelectItem>
              <SelectItem value="payment_failed">Payment Failed But Amount Deducted</SelectItem>
              <SelectItem value="withdrawal_delayed">Withdrawal Delayed</SelectItem>
              <SelectItem value="other">Other Issue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm sm:text-base">Description *</Label>
          <Textarea
            id="description"
            placeholder="Please describe your issue in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="text-sm sm:text-base resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Include any relevant details like transaction time, payment method, etc.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> Our support team will review your issue within 24 hours and contact you via email.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
            onClick={handleSubmit}
            disabled={submitting || !issueType || !description}
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </div>
    </>
  );
}
