"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MoreVertical, Edit, Ban, Eye, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const teams = [
  {
    id: 1,
    name: "Team Alpha",
    tag: "ALPH",
    captain: "CaptainX",
    members: 4,
    substitute: 1,
    matches: 28,
    wins: 12,
    points: 1245,
    status: "active",
  },
  {
    id: 2,
    name: "Phoenix Squad",
    tag: "PHNX",
    captain: "PhoenixKing",
    members: 4,
    substitute: 0,
    matches: 35,
    wins: 18,
    points: 1567,
    status: "active",
  },
  {
    id: 3,
    name: "Dark Knights",
    tag: "DKNK",
    captain: "DarkLord",
    members: 3,
    substitute: 0,
    matches: 15,
    wins: 3,
    points: 456,
    status: "suspended",
  },
];

export default function AdminTeamsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "suspended":
        return "bg-red-100 text-red-700";
      case "banned":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground">Manage teams and rosters</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Teams</div>
            <div className="text-2xl font-bold mt-1">456</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold mt-1">432</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Suspended</div>
            <div className="text-2xl font-bold mt-1">18</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Banned</div>
            <div className="text-2xl font-bold mt-1">6</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by team name, tag, captain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teams List */}
      <div className="space-y-4">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{team.name}</h3>
                        <Badge variant="outline">{team.tag}</Badge>
                        <Badge className={getStatusColor(team.status)}>{team.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Captain: {team.captain}</p>
                      <p className="text-sm text-muted-foreground">
                        {team.members} members • {team.substitute} substitute
                      </p>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Matches: </span>
                          <span className="font-medium">{team.matches}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Wins: </span>
                          <span className="font-medium">{team.wins}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Points: </span>
                          <span className="font-medium">{team.points}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Roster
                      </DropdownMenuItem>
                      {team.status === "active" ? (
                        <DropdownMenuItem className="text-red-600">
                          <Ban className="w-4 h-4 mr-2" />
                          Suspend Team
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="text-green-600">
                          <Users className="w-4 h-4 mr-2" />
                          Activate Team
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
