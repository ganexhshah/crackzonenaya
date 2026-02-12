"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  Shield,
  CreditCard,
  Trophy,
  AlertCircle,
  FileText,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const categories = [
  { id: "ACCOUNT", label: "Account Issues", icon: Users, color: "text-blue-600" },
  { id: "PAYMENT", label: "Payment & Entry Fee", icon: CreditCard, color: "text-green-600" },
  { id: "TOURNAMENT", label: "Tournament", icon: Trophy, color: "text-yellow-600" },
  { id: "MATCH_RULES", label: "Match Rules", icon: FileText, color: "text-purple-600" },
  { id: "PRIZES", label: "Prize Distribution", icon: Trophy, color: "text-orange-600" },
  { id: "REFUND", label: "Refund Policy", icon: CreditCard, color: "text-red-600" },
  { id: "CHEATING", label: "Reporting Cheating", icon: Shield, color: "text-red-700" },
  { id: "TECHNICAL", label: "Technical Support", icon: AlertCircle, color: "text-gray-600" },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const data = await api.get("/support/faqs");
      setFaqs(data as any[]);
    } catch (error) {
      console.error("Failed to fetch FAQs:", error);
      // Use default FAQs if API fails
      setFaqs(getDefaultFAQs());
    } finally {
      setLoading(false);
    }
  };

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedFAQs = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-xl text-blue-100 mb-8">
              Find answers to your questions or get in touch with our support team
            </p>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg bg-white text-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === null ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Categories
                </Button>
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <Icon className={`w-4 h-4 mr-2 ${category.color}`} />
                      {category.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gray-800/50 border-gray-700 mt-4">
              <CardHeader>
                <CardTitle className="text-white text-sm">Need More Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start" size="sm">
                  <Link href="/support/ticket">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Create Ticket
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start" size="sm">
                  <Link href="/contact">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Us
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - FAQs */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading FAQs...</p>
              </div>
            ) : filteredFAQs.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="py-12 text-center">
                  <HelpCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                  <p className="text-gray-400 mb-6">
                    Try adjusting your search or browse all categories
                  </p>
                  <Button onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedFAQs).map(([categoryId, categoryFAQs]) => {
                  const category = categories.find((c) => c.id === categoryId);
                  if (!category) return null;
                  const Icon = category.icon;
                  const faqList = categoryFAQs as any[];

                  return (
                    <Card key={categoryId} className="bg-gray-800/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <Icon className={`w-5 h-5 ${category.color}`} />
                          {category.label}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          {faqList.length} question{faqList.length !== 1 ? "s" : ""}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="single" collapsible className="space-y-2">
                          {faqList.map((faq, index) => (
                            <AccordionItem
                              key={faq.id}
                              value={`${categoryId}-${index}`}
                              className="border border-gray-700 rounded-lg px-4 bg-gray-900/30"
                            >
                              <AccordionTrigger className="text-left text-white hover:no-underline">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-gray-300 pt-4">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Still Need Help */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 mt-8">
              <CardContent className="py-8 text-center text-white">
                <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
                <p className="text-blue-100 mb-6">
                  Our support team is here to assist you
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/support/ticket">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Create Support Ticket
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Link href="/contact">
                      <Mail className="w-5 h-5 mr-2" />
                      Contact Us
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDefaultFAQs() {
  return [
    {
      id: "1",
      category: "ACCOUNT",
      question: "How do I create an account?",
      answer: "Click on the 'Register' button in the top right corner, fill in your details including email, username, and password. You'll receive a verification email to activate your account.",
    },
    {
      id: "2",
      category: "ACCOUNT",
      question: "I forgot my password. How can I reset it?",
      answer: "Click on 'Forgot Password' on the login page, enter your email address, and we'll send you a password reset link. Follow the instructions in the email to set a new password.",
    },
    {
      id: "3",
      category: "PAYMENT",
      question: "What payment methods do you accept?",
      answer: "We accept UPI, bank transfers, and various digital wallets. All payment methods are displayed during the checkout process.",
    },
    {
      id: "4",
      category: "PAYMENT",
      question: "How do I add money to my wallet?",
      answer: "Go to your Dashboard > Wallet, click 'Add Money', enter the amount, and choose your preferred payment method. Follow the payment instructions to complete the transaction.",
    },
    {
      id: "5",
      category: "TOURNAMENT",
      question: "How do I join a tournament?",
      answer: "Browse available tournaments, click on the one you want to join, review the details and entry fee, then click 'Register'. Make sure you have sufficient balance in your wallet to pay the entry fee.",
    },
    {
      id: "6",
      category: "TOURNAMENT",
      question: "Can I cancel my tournament registration?",
      answer: "Yes, you can cancel your registration before the tournament starts. Go to your registered tournaments, find the tournament, and click 'Cancel Registration'. Refund policies apply based on the cancellation time.",
    },
    {
      id: "7",
      category: "MATCH_RULES",
      question: "What are the general match rules?",
      answer: "All players must join the match room 10 minutes before start time. Use of cheats, hacks, or exploits is strictly prohibited. Follow fair play guidelines and respect other players.",
    },
    {
      id: "8",
      category: "MATCH_RULES",
      question: "What happens if I'm late to a match?",
      answer: "If you're more than 10 minutes late, you may forfeit the match. Contact support immediately if you have technical issues preventing you from joining on time.",
    },
    {
      id: "9",
      category: "PRIZES",
      question: "How and when will I receive my prize money?",
      answer: "Prize money is credited to your wallet within 24-48 hours after the tournament ends. You can then withdraw it to your bank account or UPI.",
    },
    {
      id: "10",
      category: "PRIZES",
      question: "Is there a minimum withdrawal amount?",
      answer: "Yes, the minimum withdrawal amount is ₹100. There are no fees for withdrawals above ₹500.",
    },
    {
      id: "11",
      category: "REFUND",
      question: "What is your refund policy?",
      answer: "Full refunds are available if you cancel 24 hours before the tournament. 50% refund for cancellations 12-24 hours before. No refunds for cancellations less than 12 hours before the tournament starts.",
    },
    {
      id: "12",
      category: "REFUND",
      question: "How long does a refund take?",
      answer: "Refunds are processed within 5-7 business days and will be credited back to your original payment method or wallet.",
    },
    {
      id: "13",
      category: "CHEATING",
      question: "How do I report a cheater?",
      answer: "Click on the player's profile, select 'Report Player', choose 'Cheating' as the reason, provide evidence (screenshots/videos), and submit. Our team will investigate within 24 hours.",
    },
    {
      id: "14",
      category: "CHEATING",
      question: "What happens to reported players?",
      answer: "Reported players are investigated by our anti-cheat team. If found guilty, they face penalties ranging from temporary suspension to permanent ban, depending on the severity.",
    },
    {
      id: "15",
      category: "TECHNICAL",
      question: "The app is not loading. What should I do?",
      answer: "Try clearing your browser cache, checking your internet connection, or using a different browser. If the issue persists, contact our support team with details about your device and browser.",
    },
  ];
}
