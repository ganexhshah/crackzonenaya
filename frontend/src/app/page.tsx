import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus, KeyRound, ShieldCheck, Mail } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            Next.js + shadcn/ui + Tailwind CSS
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Using DM Sans font family
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Pages</CardTitle>
            <CardDescription>
              Complete authentication system with all pages
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild variant="default" className="h-auto py-4 flex-col items-start">
              <Link href="/auth/login">
                <div className="flex items-center gap-2 mb-2">
                  <LogIn className="h-5 w-5" />
                  <span className="font-semibold">Login Page</span>
                </div>
                <span className="text-xs text-left opacity-80">
                  Email/Phone, password, remember me, social login
                </span>
              </Link>
            </Button>

            <Button asChild variant="default" className="h-auto py-4 flex-col items-start">
              <Link href="/auth/register">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="h-5 w-5" />
                  <span className="font-semibold">Register Page</span>
                </div>
                <span className="text-xs text-left opacity-80">
                  Full name, IGN, UID, email, password strength meter
                </span>
              </Link>
            </Button>

            <Button asChild variant="default" className="h-auto py-4 flex-col items-start">
              <Link href="/auth/verify-otp">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-semibold">OTP Verification</span>
                </div>
                <span className="text-xs text-left opacity-80">
                  6-digit OTP input, countdown timer, resend option
                </span>
              </Link>
            </Button>

            <Button asChild variant="default" className="h-auto py-4 flex-col items-start">
              <Link href="/auth/forgot-password">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5" />
                  <span className="font-semibold">Forgot Password</span>
                </div>
                <span className="text-xs text-left opacity-80">
                  Email input, send reset link, success message
                </span>
              </Link>
            </Button>

            <Button asChild variant="default" className="h-auto py-4 flex-col items-start">
              <Link href="/auth/reset-password">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="h-5 w-5" />
                  <span className="font-semibold">Reset Password</span>
                </div>
                <span className="text-xs text-left opacity-80">
                  New password, confirm password, strength meter, success redirect
                </span>
              </Link>
            </Button>

            <Button asChild variant="secondary" className="h-auto py-4 flex-col items-start">
              <Link href="/profile/setup">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="h-5 w-5" />
                  <span className="font-semibold">Profile Setup</span>
                </div>
                <span className="text-xs text-left opacity-80">
                  IGN, UID, profile picture upload
                </span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>
              View your gaming profile and stats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Example Card Component</CardTitle>
            <CardDescription>
              This is a demo of shadcn/ui components with Tailwind CSS styling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" placeholder="Enter your name" />
            </div>
            <div className="flex gap-2">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Font Weights Demo</CardTitle>
            <CardDescription>DM Sans supports weights from 100 to 1000</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-thin">Thin (100)</p>
            <p className="font-extralight">Extra Light (200)</p>
            <p className="font-light">Light (300)</p>
            <p className="font-normal">Normal (400)</p>
            <p className="font-medium">Medium (500)</p>
            <p className="font-semibold">Semibold (600)</p>
            <p className="font-bold">Bold (700)</p>
            <p className="font-extrabold">Extra Bold (800)</p>
            <p className="font-black">Black (900)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
