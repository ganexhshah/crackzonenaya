"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Ticket,
  Upload,
  X,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const categories = [
  { value: "PAYMENT", label: "Payment Issue" },
  { value: "MATCH_ISSUE", label: "Match Issue" },
  { value: "BAN_APPEAL", label: "Ban Appeal" },
  { value: "TECHNICAL", label: "Technical Support" },
  { value: "ACCOUNT", label: "Account Issue" },
  { value: "REFUND", label: "Refund Request" },
  { value: "REPORT", label: "Report Player" },
  { value: "OTHER", label: "Other" },
];

const priorities = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export default function CreateTicketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    category: "",
    priority: "MEDIUM",
    subject: "",
    description: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyTickets();
    }
  }, [user]);

  const fetchMyTickets = async () => {
    try {
      setLoadingTickets(true);
      const data = await api.get("/support/tickets");
      setMyTickets(data as any[]);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to create a ticket");
      router.push("/auth/login");
      return;
    }

    if (!formData.category || !formData.subject || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("category", formData.category);
      formDataToSend.append("priority", formData.priority);
      formDataToSend.append("subject", formData.subject);
      formDataToSend.append("description", formData.description);

      attachments.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/tickets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to create ticket");
      }

      const ticket = await response.json();
      toast.success("Ticket created successfully!");
      router.push(`/support/ticket/${ticket.id}`);
    } catch (error: any) {
      console.error("Failed to create ticket:", error);
      toast.error(error.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (attachments.length + files.length > 5) {
        toast.error("Maximum 5 files allowed");
        return;
      }
      setAttachments([...attachments, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-500";
      case "IN_PROGRESS":
        return "bg-yellow-500";
      case "WAITING_USER":
        return "bg-orange-500";
      case "RESOLVED":
        return "bg-green-500";
      case "CLOSED":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Ticket className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Support Tickets</h1>
            <p className="text-xl text-blue-100">
              Create a ticket and our team will assist you
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <Button asChild variant="ghost" className="mb-6">
            <Link href="/help">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Help Center
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Ticket Form */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Create New Ticket</CardTitle>
                  <CardDescription className="text-gray-400">
                    Provide details about your issue and we'll get back to you soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-white">
                          Category <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority" className="text-white">
                          Priority
                        </Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) =>
                            setFormData({ ...formData, priority: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {priorities.map((priority) => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-white">
                        Subject <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        placeholder="Brief description of your issue"
                        required
                        className="bg-gray-900/50 border-gray-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-white">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Provide detailed information about your issue..."
                        rows={6}
                        required
                        className="bg-gray-900/50 border-gray-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">
                        Attachments (Optional)
                      </Label>
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 mb-2">
                          Upload screenshots or files (Max 5 files, 10MB each)
                        </p>
                        <Input
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("file-upload")?.click()}
                        >
                          Choose Files
                        </Button>
                      </div>

                      {attachments.length > 0 && (
                        <div className="space-y-2 mt-4">
                          {attachments.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg"
                            >
                              <span className="text-sm text-gray-300 truncate">
                                {file.name}
                              </span>
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

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Creating Ticket...
                        </>
                      ) : (
                        <>
                          <Ticket className="w-5 h-5 mr-2" />
                          Create Ticket
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* My Tickets Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">My Tickets</CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Recent support tickets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTickets ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : myTickets.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No tickets yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myTickets.slice(0, 5).map((ticket) => (
                        <Link
                          key={ticket.id}
                          href={`/support/ticket/${ticket.id}`}
                          className="block p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs font-mono text-gray-400">
                              {ticket.ticketNumber}
                            </span>
                            <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-white font-medium line-clamp-1 mb-1">
                            {ticket.subject}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </div>
                        </Link>
                      ))}
                      {myTickets.length > 5 && (
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href="/support/tickets">View All Tickets</Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Help Card */}
              <Card className="bg-gray-800/50 border-gray-700 mt-4">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Need Quick Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <Link href="/help">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Browse FAQ
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <Link href="/contact">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Contact Us
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
