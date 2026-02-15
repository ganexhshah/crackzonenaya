"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  MessageSquare,
  Ban,
} from "lucide-react";
import { transactionReportService, TransactionReport } from "@/services/transaction-report.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<TransactionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<TransactionReport | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await transactionReportService.getMyReports();
      setReports(data);
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to cancel this report? This action cannot be undone.')) {
      return;
    }

    try {
      setCancelling(true);
      await transactionReportService.cancelReport(reportId);
      toast.success('Report cancelled successfully');
      await fetchReports();
      setSelectedReport(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel report');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'UNDER_REVIEW':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Report History</h1>
            <p className="text-muted-foreground mt-1">View all your transaction issue reports</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (selectedReport) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Button>
        </div>

        {/* Report Details */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(selectedReport.status)}
                  <CardTitle className="text-xl sm:text-2xl">Report Details</CardTitle>
                </div>
                <Badge className={getStatusColor(selectedReport.status)}>
                  {selectedReport.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Issue Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Issue Type</h3>
                <p className="text-base capitalize">
                  {selectedReport.issueType.replace(/_/g, ' ')}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-base whitespace-pre-wrap">{selectedReport.description}</p>
              </div>

              <Separator />

              {/* Transaction Details */}
              {selectedReport.transaction && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="text-sm font-medium mb-3">Transaction Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="font-medium">रु {Math.abs(selectedReport.transaction.amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Reference</p>
                        <p className="font-medium text-sm break-all">
                          {selectedReport.transaction.reference || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Type:</span>
                      <Badge variant="outline" className="capitalize">
                        {selectedReport.transaction.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <Badge variant="outline">
                        {selectedReport.transaction.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Timeline */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="font-medium">{formatDate(selectedReport.createdAt)}</span>
                  </div>
                  {selectedReport.updatedAt !== selectedReport.createdAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="font-medium">{formatDate(selectedReport.updatedAt)}</span>
                    </div>
                  )}
                  {selectedReport.resolvedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-muted-foreground">Resolved:</span>
                      <span className="font-medium">{formatDate(selectedReport.resolvedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Response */}
              {selectedReport.adminRemark && (
                <>
                  <Separator />
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2 mb-2">
                      <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Admin Response
                      </h3>
                    </div>
                    <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap ml-7">
                      {selectedReport.adminRemark}
                    </p>
                  </div>
                </>
              )}

              {/* Cancel Button for Pending Reports */}
              {selectedReport.status === 'PENDING' && (
                <>
                  <Separator />
                  <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                    <p className="text-sm text-yellow-900 dark:text-yellow-100 mb-3">
                      If you want to cancel this report, you can do so below. This action cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => handleCancelReport(selectedReport.id)}
                      disabled={cancelling}
                      className="w-full sm:w-auto"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      {cancelling ? 'Cancelling...' : 'Cancel Report'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Report History</h1>
          <p className="text-muted-foreground mt-1">View all your transaction issue reports</p>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No reports yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                You haven't submitted any transaction issue reports
              </p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card 
              key={report.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedReport(report)}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      {getStatusIcon(report.status)}
                      <Badge className={getStatusColor(report.status)}>
                        {report.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {formatDate(report.createdAt)}
                      </span>
                    </div>

                    <div>
                      <p className="font-medium text-base capitalize mb-1">
                        {report.issueType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.description}
                      </p>
                    </div>

                    {report.transaction && (
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span>Amount: रु {Math.abs(report.transaction.amount)}</span>
                        <span>•</span>
                        <span className="truncate">Ref: {report.transaction.reference}</span>
                      </div>
                    )}

                    {report.adminRemark && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                        <MessageSquare className="w-4 h-4" />
                        <span>Admin responded</span>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
