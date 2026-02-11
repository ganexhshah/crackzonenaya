import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Users, Zap, Shield, Target, Gamepad2, 
  TrendingUp, Award, Wallet, Clock, Star, ArrowRight 
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold text-white">CrackZone</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-gray-300 hover:text-white">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center space-y-8">
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 px-4 py-1">
              🎮 The Ultimate Gaming Platform
            </Badge>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-tight">
              Compete, Win,
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Dominate
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Join thousands of gamers in competitive scrims, tournaments, and practice matches. 
              Build your team, track your stats, and climb the leaderboards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-lg px-8 h-14">
                <Link href="/auth/register">
                  Start Playing Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-gray-700 text-white hover:bg-gray-800 text-lg px-8 h-14">
                <Link href="/dashboard/scrims">
                  Browse Scrims
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-8 pt-8 text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>10K+ Players</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>500+ Tournaments</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-500" />
                <span>₹10L+ Prize Pool</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              Why Choose CrackZone?
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to level up your gaming career
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-600/50 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-blue-500" />
                </div>
                <CardTitle className="text-white">Competitive Scrims</CardTitle>
                <CardDescription className="text-gray-400">
                  Join daily scrims with real prize pools. Solo, duo, or squad modes available.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-600/50 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <CardTitle className="text-white">Team Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Create and manage your esports team. Invite players, track performance, and grow together.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-green-600/50 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-green-500" />
                </div>
                <CardTitle className="text-white">Secure Wallet</CardTitle>
                <CardDescription className="text-gray-400">
                  Integrated wallet system for entry fees and instant prize payouts. Safe and transparent.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-yellow-600/50 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-yellow-500" />
                </div>
                <CardTitle className="text-white">Live Stats Tracking</CardTitle>
                <CardDescription className="text-gray-400">
                  Real-time performance analytics. Track kills, wins, and climb the leaderboards.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-red-600/50 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-500" />
                </div>
                <CardTitle className="text-white">Anti-Cheat System</CardTitle>
                <CardDescription className="text-gray-400">
                  Fair play guaranteed. Advanced detection and manual review for all matches.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 hover:border-orange-600/50 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
                <CardTitle className="text-white">24/7 Tournaments</CardTitle>
                <CardDescription className="text-gray-400">
                  Never miss a match. Tournaments running around the clock for all skill levels.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-gray-400">
              Simple steps to start your competitive gaming journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-xl font-bold text-white">Create Account</h3>
              <p className="text-gray-400">
                Sign up with your email or phone. Add your gaming profile and you're ready to go.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-xl font-bold text-white">Join or Create Team</h3>
              <p className="text-gray-400">
                Build your squad or join an existing team. Solo players can compete individually.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-xl font-bold text-white">Compete & Win</h3>
              <p className="text-gray-400">
                Register for scrims, play your best, and earn prizes. Track your progress and improve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <Star className="w-16 h-16 text-yellow-500 mx-auto" />
          <h2 className="text-3xl sm:text-5xl font-bold text-white">
            Ready to Become a Champion?
          </h2>
          <p className="text-xl text-gray-300">
            Join the fastest-growing competitive gaming platform. Your next victory awaits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-lg px-8 h-14">
              <Link href="/auth/register">
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-gray-700 text-white hover:bg-gray-800 text-lg px-8 h-14">
              <Link href="/dashboard">
                Explore Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-blue-500" />
                <span className="text-lg font-bold text-white">CrackZone</span>
              </div>
              <p className="text-gray-400 text-sm">
                The ultimate platform for competitive gaming. Join, compete, and win.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/dashboard/scrims" className="hover:text-white">Scrims</Link></li>
                <li><Link href="/dashboard/tournaments" className="hover:text-white">Tournaments</Link></li>
                <li><Link href="/dashboard/teams" className="hover:text-white">Teams</Link></li>
                <li><Link href="/dashboard/stats" className="hover:text-white">Leaderboards</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Account</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/auth/login" className="hover:text-white">Login</Link></li>
                <li><Link href="/auth/register" className="hover:text-white">Register</Link></li>
                <li><Link href="/dashboard/wallet" className="hover:text-white">Wallet</Link></li>
                <li><Link href="/dashboard/settings" className="hover:text-white">Settings</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Rules & Guidelines</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Report Issue</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 CrackZone. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
