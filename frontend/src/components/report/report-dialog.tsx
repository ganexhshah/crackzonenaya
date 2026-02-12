"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Upload, X } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ReportDialogProps {
  reportedUserId?: string;
  reportedUserName?: string;
  matchId?: string;
  trigger?: React.ReactNode;
}

const reportTypes = [
  { value: "CHEATING", label: "Cheating / Hacking" },
  { value: "FAKE_PAYMENT", label: "Fake Payment Proof" },
  { value: "ABUSE", label: "Abusive Behavior" },
  { value: "PLAYER_MISCONDUCT", label: "Player Misconduct" },
  { value: "MATCH_FIXING", label: "Match Fixing" },
  { value: "OTHER", label: "Other" },
];

export function ReportDialog({
  reportedUserId,
  reportedUserName,
  matchId,
  trigger,
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    reason: "",
    description: "",
    matchId: matchId || "",
  });
  const [evidence, setEvidence] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.reason || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("type", formData.type);
      formDataToSend.append("reason", formData.reason);
      formDataToSend.append("description", formData.description);
      if (reportedUserId) {
        formDataToSend.append("reportedUserId", reportedUserId);
      }
      if (formData.matchId) {
        formDataToSend.append("matchId", formData.matchId);
      }

      evidence.forEach((file) => {
        formDataToSend.append("evidence", file);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/reports`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to submit report");
      }

      toast.success("Report submitted successfully! Our team will review it.");
      setOpen(false);
      setFormData({ type: "", reason: "", description: "", matchId: matchId || "" });
      setEvidence([]);
    } catch (error: any) {
      console.error("Failed to submit report:", error);
      toast.error(error.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (evidence.length + files.length > 5) {
        toast.error("Maximum 5 files allowed");
        return;
      }
      setEvidence([...evidence, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Report {reportedUserName ? `Player: ${reportedUserName}` : "Issue"}
          </DialogTitle>
          <DialogDescription>
            Help us maintain a fair gaming environment by reporting violations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">
              Report Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {matchId && (
            <div className="space-y-2">
              <Label htmlFor="matchId">Match ID</Label>
              <Input
                id="matchId"
                value={formData.matchId}
                onChange={(e) => setFormData({ ...formData, matchId: e.target.value })}
                placeholder="Enter match ID (optional)"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">
              Brief Reason <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Using aimbot, Fake UPI screenshot"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Detailed Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide detailed information about the incident..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Evidence (Screenshots/Videos)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload evidence (Max 5 files, 10MB each)
              </p>
              <Input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                id="evidence-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("evidence-upload")?.click()}
              >
                Choose Files
              </Button>
            </div>

            {evidence.length > 0 && (
              <div className="space-y-2 mt-2">
                {evidence.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted p-2 rounded"
                  >
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> False reports may result in penalties. Please ensure your
              report is accurate and includes evidence.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
