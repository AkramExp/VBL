import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BASE_URL } from "@/config";
import axios from "axios";
import { Award, BarChart3, TrendingUp, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

interface TeamStats {
    name: any;
    wins: number;
    losses: number;
    draws: number;
    points: number;
    matchesPlayed: number;
}

interface Fixture {
    _id: string;
    team1: any;
    team2: any;
    result?: {
        winner: string;
        sets: {
            set1?: { team1Score: number; team2Score: number };
            set2?: { team1Score: number; team2Score: number };
            set3?: { team1Score: number; team2Score: number };
        };
    };
}

export function TeamRankings() {
    const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [teams, setTeams] = useState<any[]>([]);

    const getFixtures = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/fixtures`);
            setFixtures(response.data);
        } catch (error) {
            console.error("Error fetching fixtures:", error);
        }
    };

    const getTeams = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/teams`);
            setTeams(response.data);
        } catch (error) {
            console.error("Error fetching teams:", error);
        }
    };

    const calculateTeamStats = () => {
        const stats: { [key: string]: TeamStats } = {};

        // Initialize all teams with zero stats
        teams.forEach(team => {
            stats[team._id] = {
                name: team.name,
                wins: 0,
                losses: 0,
                draws: 0,
                points: 0,
                matchesPlayed: 0
            };
        });


        // Calculate stats from fixtures
        fixtures.forEach(fixture => {
            if (fixture.result) {
                const team1 = fixture.team1.name;
                const team2 = fixture.team2.name;

                // Increment matches played
                stats[team1].matchesPlayed++;
                stats[team2].matchesPlayed++;

                if (fixture.result.winner === "Draw") {
                    // Draw
                    stats[team1].draws++;
                    stats[team2].draws++;
                    stats[team1].points += 1;
                    stats[team2].points += 1;
                } else if (fixture.result.winner === team1) {
                    // Team1 wins
                    stats[team1].wins++;
                    stats[team2].losses++;
                    stats[team1].points += 2;
                } else if (fixture.result.winner === team2) {
                    // Team2 wins
                    stats[team2].wins++;
                    stats[team1].losses++;
                    stats[team2].points += 2;
                }
            }
        });

        // Convert to array and sort by points (descending)
        const sortedStats = Object.values(stats).sort((a, b) => {
            // First sort by points
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            // If points are equal, sort by wins
            if (b.wins !== a.wins) {
                return b.wins - a.wins;
            }
            // If wins are equal, sort by name
            return a.name.localeCompare(b.name);
        });

        setTeamStats(sortedStats);
        setIsLoading(false);
    };

    useEffect(() => {
        getFixtures();
        getTeams();
    }, []);

    useEffect(() => {
        if (fixtures.length > 0 && teams.length > 0) {
            calculateTeamStats();
        }
    }, [fixtures, teams]);


    const getRankBadge = (index: number) => {
        if (index === 0) return <Badge className="bg-yellow-500 text-white">1st</Badge>;
        if (index === 1) return <Badge className="bg-gray-400 text-white">2nd</Badge>;
        if (index === 2) return <Badge className="bg-amber-700 text-white">3rd</Badge>;
        return <span className="text-muted-foreground">#{index + 1}</span>;
    };

    const getWinPercentage = (stats: TeamStats) => {
        if (stats.matchesPlayed === 0) return 0;
        return ((stats.wins / stats.matchesPlayed) * 100).toFixed(1);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white font-bold">🏐</span>
                    </div>
                    <p className="text-muted-foreground">Loading team rankings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
            {/* Header */}
            <Header
                title="Indian Volleyball League"
                subtitle="Team Rankings & Standings"
            />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="shadow-card hidden md:block">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Trophy className="h-4 w-4" />
                                Total Teams
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{teams.length}</div>
                            <p className="text-xs text-muted-foreground">Registered teams</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-card hidden md:block">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Matches Played
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {fixtures.filter(f => f.result).length}
                            </div>
                            <p className="text-xs text-muted-foreground">Completed matches</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Leading Team
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold truncate">
                                {teamStats[0]?.name || 'No data'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {teamStats[0]?.points || 0} points
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                Top Win Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold truncate">
                                {teamStats[0]?.name.name || 'No data'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {/* @ts-ignore */}
                                {getWinPercentage(teamStats[0] || { matchesPlayed: 0, wins: 0 })}% wins
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Rankings Table */}
                <Card className="shadow-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5" />
                            Team Standings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-12">Rank</TableHead>
                                        <TableHead>Team</TableHead>
                                        <TableHead className="text-center">Played</TableHead>
                                        <TableHead className="text-center">Wins</TableHead>
                                        <TableHead className="text-center">Losses</TableHead>
                                        <TableHead className="text-center">Draws</TableHead>
                                        <TableHead className="text-center">Win %</TableHead>
                                        <TableHead className="text-center">Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamStats.map((team, index) => (
                                        <TableRow key={team.name.name} className="hover:bg-muted/30">
                                            <TableCell className="font-medium">
                                                {getRankBadge(index)}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {team.name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {team.matchesPlayed}
                                            </TableCell>
                                            <TableCell className="text-center text-green-600 font-medium">
                                                {team.wins}
                                            </TableCell>
                                            <TableCell className="text-center text-red-600">
                                                {team.losses}
                                            </TableCell>
                                            <TableCell className="text-center text-yellow-600">
                                                {team.draws}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getWinPercentage(team)}%
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-primary">
                                                {team.points}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Scoring System Explanation */}
                        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                Scoring System
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-green-600">Win</Badge>
                                    <span>2 points</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-yellow-500">Draw</Badge>
                                    <span>1 point</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-red-600">Loss</Badge>
                                    <span>0 points</span>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        {teamStats.length === 0 && (
                            <div className="text-center py-8">
                                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No match results yet.</p>
                                <p className="text-sm text-muted-foreground">
                                    Rankings will appear once matches are completed.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="text-center text-muted-foreground">
                        <p>&copy; 2025 Indian Volleyball League. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default TeamRankings;