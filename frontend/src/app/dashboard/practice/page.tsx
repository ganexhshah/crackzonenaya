import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, Target, Zap, Users } from "lucide-react";

export default function PracticePage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Practice Mode</h1>
        <p className="text-muted-foreground mt-1">
          Improve your skills with practice sessions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <Target className="h-12 w-12 text-blue-500 mb-2" />
            <CardTitle>Aim Training</CardTitle>
            <CardDescription>Improve your accuracy and reflexes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Start Training</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Zap className="h-12 w-12 text-yellow-500 mb-2" />
            <CardTitle>Quick Match</CardTitle>
            <CardDescription>Jump into a practice match</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Play Now</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-12 w-12 text-green-500 mb-2" />
            <CardTitle>Team Practice</CardTitle>
            <CardDescription>Practice with your team</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Create Session</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Practice History</CardTitle>
          <CardDescription>Your recent practice sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No practice sessions yet</p>
            <p className="text-sm mt-2">Start practicing to track your progress</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
