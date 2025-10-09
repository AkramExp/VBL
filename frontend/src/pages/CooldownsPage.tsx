import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Search, Filter, Building2, User, Calendar, AlertTriangle } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/config";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";

interface Player {
    _id: string;
    member: {
        _id: string;
        discordName: string;
        discordId: string;
    };
    status: 'available' | 'signed' | 'cooldown';
    cooldownEnds?: string;
    currentTeam?: string;
    releaseDate?: string;
    signedDate?: string;
    position?: string;
}

interface Team {
    _id: string;
    name: string;
}

export function CooldownsPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [teamFilter, setTeamFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("time-remaining");


    const fetchData = async () => {
        try {
            const [playersRes, teamsRes] = await Promise.all([
                axios.get(`${BASE_URL}/players`),
                axios.get(`${BASE_URL}/teams`)
            ]);

            setPlayers(playersRes.data);
            setTeams(teamsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Calculate cooldown start date based on player status - FIXED VERSION
    const getCooldownStartDate = (player: Player): string => {
        // For signed players, cooldown starts from when they signed
        if (player.status === 'signed' && player.signedDate) {
            return player.signedDate;
        }
        // For free agents on cooldown, use release date
        else if (player.status === 'cooldown' && player.releaseDate) {
            return player.releaseDate;
        }
        // For signed players without signedDate, fallback to current time minus some days
        else if (player.status === 'signed') {
            const fallbackDate = new Date();
            fallbackDate.setDate(fallbackDate.getDate() - 1); // Assume signed 1 day ago
            return fallbackDate.toISOString();
        }
        // For cooldown players without releaseDate
        else if (player.status === 'cooldown') {
            const fallbackDate = new Date();
            fallbackDate.setDate(fallbackDate.getDate() - 1); // Assume released 1 day ago
            return fallbackDate.toISOString();
        }
        // Ultimate fallback
        return new Date().toISOString();
    };

    // Calculate consistent cooldown end date for all players
    const getCalculatedCooldownEnds = (player: Player): string => {
        // If cooldownEnds exists and is in the future, use it
        if (player.cooldownEnds && new Date(player.cooldownEnds) > new Date()) {
            return player.cooldownEnds;
        }

        // Calculate based on start date + 7 days
        const startDate = getCooldownStartDate(player);
        const cooldownEnds = new Date(new Date(startDate).getTime() + (7 * 24 * 60 * 60 * 1000));
        return cooldownEnds.toISOString();
    };

    // Get players who are either on cooldown OR signed but still in cooldown period
    const cooldownPlayers = players.filter(player => {
        const cooldownEnds = getCalculatedCooldownEnds(player);
        return (player.status === 'cooldown' || player.status === 'signed') &&
            new Date(player.cooldownEnds) > new Date();
    });

    const getTeamName = (teamId: string) => {
        const team = teams.find(t => t._id === teamId);
        return team ? team.name : "Unknown Team";
    };

    const getTimeRemaining = (cooldownEnds: string) => {
        const cooldownEndsDate = new Date(cooldownEnds);
        const now = new Date();
        const timeLeft = cooldownEndsDate.getTime() - now.getTime();

        if (timeLeft <= 0) {
            return { hours: 0, minutes: 0, text: "Available Now", isExpired: true };
        }

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;

        let text = "";
        if (days > 0) {
            text = `${days}d ${remainingHours}h`;
        } else if (hours > 0) {
            text = `${hours}h ${minutes}m`;
        } else {
            text = `${minutes}m`;
        }

        return { hours, minutes, days, text, isExpired: false };
    };

    const getCooldownProgress = (player: Player) => {
        const startDate = new Date(getCooldownStartDate(player));
        const ends = new Date(getCalculatedCooldownEnds(player));
        const now = new Date();

        // Handle edge cases where dates might be invalid
        if (isNaN(startDate.getTime()) || isNaN(ends.getTime())) {
            return 0;
        }

        const totalDuration = ends.getTime() - startDate.getTime();

        // If total duration is invalid or zero
        if (totalDuration <= 0) return 100;

        const elapsed = now.getTime() - startDate.getTime();

        // If cooldown hasn't started yet
        if (elapsed < 0) return 0;
        // If cooldown has ended
        if (elapsed >= totalDuration) return 100;

        const progress = Math.min((elapsed / totalDuration) * 100, 100);
        return Math.round(progress);
    };

    // Get the appropriate date for display
    const getDisplayDate = (player: Player) => {
        if (player.status === 'signed') {
            return {
                date: player.signedDate || getCooldownStartDate(player),
                label: "Signed Date",
                type: "signed" as const
            };
        } else if (player.releaseDate) {
            return {
                date: player.releaseDate,
                label: "Release Date",
                type: "released" as const
            };
        } else {
            const startDate = getCooldownStartDate(player);
            return {
                date: startDate,
                label: "Cooldown Start",
                type: "calculated" as const
            };
        }
    };

    // Filter cooldown players
    const filteredPlayers = cooldownPlayers.filter(player => {
        // Search term filter
        const matchesSearch =
            player.member?.discordName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.member?.discordId?.toLowerCase().includes(searchTerm.toLowerCase());

        // Team filter
        const matchesTeam = teamFilter === "all" || player.currentTeam === teamFilter;

        return matchesSearch && matchesTeam;
    });

    // Sort cooldown players
    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        const cooldownEndsA = getCalculatedCooldownEnds(a);
        const cooldownEndsB = getCalculatedCooldownEnds(b);

        switch (sortBy) {
            case "time-remaining":
                return new Date(cooldownEndsA).getTime() - new Date(cooldownEndsB).getTime();
            case "player-name":
                return a.member.discordName.localeCompare(b.member.discordName);
            case "team-name":
                const teamA = a.currentTeam ? getTeamName(a.currentTeam) : "No Team";
                const teamB = b.currentTeam ? getTeamName(b.currentTeam) : "No Team";
                return teamA.localeCompare(teamB);
            case "release-date":
                const dateA = getDisplayDate(a);
                const dateB = getDisplayDate(b);
                return new Date(dateB.date).getTime() - new Date(dateA.date).getTime();
            default:
                return 0;
        }
    });



    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cooldowns</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">Loading cooldowns...</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
            <Header
                title="Cooldowns"
                subtitle="Players Cooldowns"
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Active Cooldowns ({cooldownPlayers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Search and Filter Section */}
                        <div className="space-y-4 mb-6">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search players by name or Discord ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Filter Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Building2 className="h-3 w-3" />
                                        Team
                                    </label>
                                    <Select value={teamFilter} onValueChange={setTeamFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by team" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Teams</SelectItem>
                                            {teams.map(team => (
                                                <SelectItem key={team._id} value={team._id}>
                                                    {team.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Sort By */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Filter className="h-3 w-3" />
                                        Sort By
                                    </label>
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="time-remaining">Time Remaining</SelectItem>
                                            <SelectItem value="player-name">Player Name</SelectItem>
                                            <SelectItem value="team-name">Team Name</SelectItem>
                                            <SelectItem value="release-date">Start Date</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Clear Filters Button */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium opacity-0">Clear</label>
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
                                            setTeamFilter("all");
                                            setSortBy("time-remaining");
                                        }}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                        disabled={searchTerm === "" && teamFilter === "all" && sortBy === "time-remaining"}
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>

                            {/* Results Count */}
                            <div className="text-sm text-muted-foreground">
                                Showing {sortedPlayers.length} of {cooldownPlayers.length} players on cooldown
                                {(searchTerm || teamFilter !== "all") && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
                                            setTeamFilter("all");
                                        }}
                                        className="ml-2 text-primary hover:underline"
                                    >
                                        Show all
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Cooldowns Table with Limited Height */}
                        <div className="rounded-md border overflow-hidden">
                            <div className="max-h-[600px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="sticky top-0 bg-background">Player</TableHead>
                                            <TableHead className="sticky top-0 bg-background">Status</TableHead>
                                            <TableHead className="sticky top-0 bg-background">Team</TableHead>
                                            <TableHead className="sticky top-0 bg-background">Time Remaining</TableHead>

                                            <TableHead className="sticky top-0 bg-background">Start Date</TableHead>
                                            <TableHead className="sticky top-0 bg-background">Available From</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedPlayers.map(player => {
                                            const calculatedCooldownEnds = getCalculatedCooldownEnds(player);
                                            const timeRemaining = getTimeRemaining(calculatedCooldownEnds);
                                            const displayDate = getDisplayDate(player);
                                            const progress = getCooldownProgress(player);

                                            return (
                                                <TableRow key={player._id} className="hover:bg-muted/50">
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <div className="font-medium">
                                                                    {player.member?.discordName}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {player.member?.discordId}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                player.status === 'cooldown'
                                                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                                            }
                                                        >
                                                            {player.status === 'cooldown' ? 'Free Agent' : 'Signed'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {player.currentTeam ? (
                                                            <Badge variant="outline" className="bg-primary/10 text-primary">
                                                                <Building2 className="h-3 w-3 mr-1" />
                                                                {getTeamName(player.currentTeam)}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">No Team</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className={`h-4 w-4 ${timeRemaining.isExpired ? 'text-green-500' :
                                                                timeRemaining.hours <= 6 ? 'text-green-500' :
                                                                    timeRemaining.hours <= 24 ? 'text-amber-500' :
                                                                        'text-orange-500'
                                                                }`} />
                                                            <span className={`font-medium ${timeRemaining.isExpired ? 'text-green-600' :
                                                                timeRemaining.hours <= 6 ? 'text-green-600' :
                                                                    timeRemaining.hours <= 24 ? 'text-amber-600' :
                                                                        'text-orange-600'
                                                                }`}>
                                                                {timeRemaining.text}
                                                            </span>
                                                            {timeRemaining.isExpired && (
                                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                                                    Available
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {new Date(displayDate.date).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {displayDate.label}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm font-medium">
                                                            {new Date(calculatedCooldownEnds).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(calculatedCooldownEnds).toLocaleTimeString()}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Empty State */}
                        {sortedPlayers.length === 0 && (
                            <div className="text-center py-12">
                                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                    {cooldownPlayers.length === 0 ? "No Active Cooldowns" : "No Cooldowns Match Your Filters"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {cooldownPlayers.length === 0
                                        ? "All players are currently available. Cooldowns will appear here when players are released from teams."
                                        : "Try adjusting your search or filters to see more cooldowns."
                                    }
                                </p>
                                {(searchTerm || teamFilter !== "all") && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
                                            setTeamFilter("all");
                                        }}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Scroll Indicator (only shows when there are more items) */}
                        {sortedPlayers.length > 8 && (
                            <div className="mt-4 text-center">
                                <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Scroll to see more cooldowns ({sortedPlayers.length} total)
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}