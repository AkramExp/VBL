import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, FileText, Clock, Calendar, ArrowRight, Volleyball, Star, TrendingUp, Shield, Award } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "@/config";
import { EnhancedHeader } from "@/components/EnhancedHeader";
import { Header } from "@/components/Header";

interface Fixture {
    _id: string;
    team1: any;
    team2: any;
    stage?: any;
    result?: any;
    createdAt: string;
}

interface Team {
    _id: string;
    name: string;
    players: any[];
    captain: any;
}

interface TeamStats {
    name: Team;
    wins: number;
    losses: number;
    draws: number;
    points: number;
    matchesPlayed: number;
    averagePointDifferential: number;
}

interface Transaction {
    _id: string;
    type: 'signing' | 'release';
    player: any;
    team: any;
    timestamp: string;
}

interface Player {
    _id: string;
    discordName: string;
    status: string;
    currentTeam?: string;
}

export function HomePage() {
    const [recentFixtures, setRecentFixtures] = useState<Fixture[]>([]);
    const [upcomingFixtures, setUpcomingFixtures] = useState<Fixture[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [featuredPlayers, setFeaturedPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTeams: 0,
        totalPlayers: 0,
        activeMatches: 0,
        completedMatches: 0
    });

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const [
                    fixturesRes,
                    teamsRes,
                    transactionsRes,
                    playersRes
                ] = await Promise.all([
                    axios.get(`${BASE_URL}/fixtures`),
                    axios.get(`${BASE_URL}/teams`),
                    axios.get(`${BASE_URL}/transactions`),
                    axios.get(`${BASE_URL}/players`)
                ]);

                const fixtures: Fixture[] = fixturesRes.data;
                const teamsData: Team[] = teamsRes.data;
                const transactions: Transaction[] = transactionsRes.data;
                const players: Player[] = playersRes.data;

                // Process fixtures - get most recent completed and upcoming
                const completedFixtures = fixtures
                    .filter(f => f.result)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 2);

                const upcoming = fixtures
                    .filter(f => !f.result)
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .slice(0, 3);

                setRecentFixtures(completedFixtures);
                setUpcomingFixtures(upcoming);
                setTeams(teamsData);

                // Calculate team stats using the ranking logic
                const calculatedTeamStats = calculateTeamStats(fixtures, teamsData);
                setTeamStats(calculatedTeamStats);

                setRecentTransactions(transactions.slice(0, 4));

                // Get featured players (captains for demo)
                const captains = players.filter(player =>
                    teamsData.some(team => team.captain?._id === player._id)
                ).slice(0, 3);
                setFeaturedPlayers(captains);

                // Calculate stats
                const completedMatches = fixtures.filter(f => f.result).length;
                const activeMatches = fixtures.filter(f => !f.result).length;

                setStats({
                    totalTeams: teamsData.length,
                    totalPlayers: players.length,
                    activeMatches,
                    completedMatches
                });

            } catch (error) {
                console.log("Error fetching home data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    // Team ranking calculation logic (from TeamRankings)
    const calculateTeamStats = (fixtures: Fixture[], teamsData: Team[]): TeamStats[] => {
        const stats: { [key: string]: TeamStats } = {};

        // Initialize all teams with zero stats
        teamsData.forEach((team: any) => {
            stats[team.name] = {
                name: team,
                wins: 0,
                losses: 0,
                draws: 0,
                points: 0,
                matchesPlayed: 0,
                averagePointDifferential: 0
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

                let team1Scores = [];
                let team2Scores = [];

                // Collect scores from all sets
                for (let i = 1; i <= 3; i++) {
                    const set = fixture.result.sets[`set${i}`];
                    if (set) {
                        team1Scores.push(set.team1Score);
                        team2Scores.push(set.team2Score);
                    }
                }

                // Calculate averages
                const team1Avg = team1Scores.length > 0 ?
                    team1Scores.reduce((sum, score) => sum + score, 0) / team1Scores.length : 0;
                const team2Avg = team2Scores.length > 0 ?
                    team2Scores.reduce((sum, score) => sum + score, 0) / team2Scores.length : 0;

                // Update average point differential
                stats[team1].averagePointDifferential += (team1Avg - team2Avg);
                stats[team2].averagePointDifferential += (team2Avg - team1Avg);

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
        const sortedStats = Object.values(stats).sort((a: any, b: any) => {
            // First sort by points
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            // If points are equal, sort by wins
            if (b.wins !== a.wins) {
                return b.wins - a.wins;
            }
            // If wins are equal, sort by name
            return a.name.name.localeCompare(b.name.name);
        });

        return sortedStats;
    };

    const getResultBadge = (fixture: Fixture) => {
        if (!fixture.result) {
            return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Upcoming</Badge>;
        }

        if (fixture.result.winner === "Draw") {
            return <Badge className="bg-yellow-500 text-white">Draw</Badge>;
        }

        const isWinnerTeam1 = fixture.result.winner === fixture.team1.name;
        return (
            <Badge className={`${isWinnerTeam1 ? 'bg-green-600' : 'bg-blue-600'} text-white`}>
                {fixture.result.winner} Won
            </Badge>
        );
    };

    const formatScore = (fixture: Fixture) => {
        if (!fixture.result?.sets) return null;

        const sets = [];
        if (fixture.result.sets.set1) {
            sets.push(`${fixture.result.sets.set1.team1Score}-${fixture.result.sets.set1.team2Score}`);
        }
        if (fixture.result.sets.set2) {
            sets.push(`${fixture.result.sets.set2.team1Score}-${fixture.result.sets.set2.team2Score}`);
        }
        if (fixture.result.sets.set3) {
            sets.push(`${fixture.result.sets.set3.team1Score}-${fixture.result.sets.set3.team2Score}`);
        }

        return sets.length > 0 ? sets.join(" • ") : null;
    };

    const getMatchCard = (fixture: Fixture, isUpcoming: boolean = false) => (
        <div key={fixture._id} className="bg-gradient-to-br from-white to-gray-50/50 border rounded-xl p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isUpcoming ? 'bg-blue-400' : 'bg-green-400'}`} />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {fixture.stage?.name || "Match"}
                    </span>
                </div>
                {getResultBadge(fixture)}
            </div>

            <div className="text-center space-y-2">
                <div className="flex items-center justify-between">
                    <div className="text-left flex-1">
                        <div className="font-semibold text-sm text-gray-900">{fixture.team1.name}</div>
                        <div className="text-xs text-muted-foreground">Team 1</div>
                    </div>

                    <div className="mx-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Volleyball className="h-5 w-5 text-primary" />
                        </div>
                    </div>

                    <div className="text-right flex-1">
                        <div className="font-semibold text-sm text-gray-900">{fixture.team2.name}</div>
                        <div className="text-xs text-muted-foreground">Team 2</div>
                    </div>
                </div>

                {!isUpcoming && fixture.result && (
                    <div className="pt-2 border-t">
                        <div className="font-mono text-sm font-bold text-gray-900">
                            {formatScore(fixture)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const getWinPercentage = (stats: TeamStats) => {
        if (stats.matchesPlayed === 0) return 0;
        return ((stats.wins / stats.matchesPlayed) * 100).toFixed(1);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-blue-50/30 to-green-50/20">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Volleyball className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-muted-foreground">Loading league dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-green-50/20 pb-6">
            {/* Enhanced Header */}
            <Header title="Indian Volleyball League" subtitle="League Summary" />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 relative z-10">
                {/* Stats Grid - Enhanced */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Total Teams</p>
                                    <h3 className="text-3xl font-bold mt-2">{stats.totalTeams}</h3>
                                    <p className="text-blue-100/80 text-xs mt-1">Active in league</p>
                                </div>
                                <div className="w-12 h-12 sm:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Shield className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">Total Players</p>
                                    <h3 className="text-3xl font-bold mt-2">{stats.totalPlayers}</h3>
                                    <p className="text-green-100/80 text-xs mt-1">Registered athletes</p>
                                </div>
                                <div className="w-12 h-12 sm:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Users className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">Active Matches</p>
                                    <h3 className="text-3xl font-bold mt-2">{stats.activeMatches}</h3>
                                    <p className="text-purple-100/80 text-xs mt-1">Scheduled</p>
                                </div>
                                <div className="w-12 h-12 sm:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Calendar className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm font-medium">Completed</p>
                                    <h3 className="text-3xl font-bold mt-2">{stats.completedMatches}</h3>
                                    <p className="text-orange-100/80 text-xs mt-1">Matches played</p>
                                </div>
                                <div className="w-12 h-12 sm:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Trophy className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column - Matches */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Upcoming Matches Section */}
                        <Card className="shadow-lg border-0">
                            <CardHeader className="pb-4 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Upcoming Matches</CardTitle>
                                            <CardDescription>Next scheduled fixtures</CardDescription>
                                        </div>
                                    </div>
                                    <Link to="/fixtures">
                                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                            View All <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {upcomingFixtures.length > 0 ? (
                                    <div className="space-y-4">
                                        {upcomingFixtures.map(fixture => getMatchCard(fixture, true))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                        <p className="text-muted-foreground">No upcoming matches scheduled</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Results & Activity Combined */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Recent Results */}
                            <Card className="shadow-lg border-0">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <Trophy className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Recent Results</CardTitle>
                                            <CardDescription>Latest match outcomes</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {recentFixtures.length > 0 ? (
                                        <div className="space-y-4">
                                            {recentFixtures.map(fixture => getMatchCard(fixture))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                            <p className="text-muted-foreground text-sm">No recent matches</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Recent Transactions */}
                            <Card className="shadow-lg border-0">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <TrendingUp className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Recent Activity</CardTitle>
                                            <CardDescription>Player movements</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {recentTransactions.length > 0 ? (
                                        <div className="space-y-3">
                                            {recentTransactions.map(transaction => (
                                                <div key={transaction._id} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-lg border">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${transaction.type === 'signing' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                        }`}>
                                                        {transaction.type === 'signing' ? '➕' : '➖'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm truncate">
                                                            {transaction.player?.discordName}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {transaction.team?.name}
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant={transaction.type === 'signing' ? 'default' : 'destructive'}
                                                        className="text-xs"
                                                    >
                                                        {transaction.type}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                            <p className="text-muted-foreground text-sm">No recent activity</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column - Teams & Quick Actions */}
                    <div className="space-y-8">
                        {/* Top Teams based on actual rankings */}
                        <Card className="shadow-lg border-0">
                            <CardHeader className="pb-4 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <Award className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Top Teams</CardTitle>
                                            <CardDescription>League standings</CardDescription>
                                        </div>
                                    </div>
                                    <Link to="/rankings">
                                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                            View All <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {teamStats.length > 0 ? (
                                    <div className="space-y-4">
                                        {teamStats.slice(0, 3).map((team, index) => (
                                            <div key={team.name._id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border hover:shadow-md transition-all duration-200">
                                                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg ${index === 0 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                                                    index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                                                        'bg-gradient-to-br from-amber-700 to-amber-800'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-900 truncate">{team.name.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {team.points} pts • {getWinPercentage(team)}% wins
                                                    </div>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                                            {team.wins}W
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                                                            {team.losses}L
                                                        </Badge>
                                                        {team.draws > 0 && (
                                                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                                                                {team.draws}D
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <Link to={`/team/${team.name._id}/view`}>
                                                    <Button variant="outline" size="sm">
                                                        View
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                        <p className="text-muted-foreground">No team data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Star className="h-5 w-5 text-yellow-400" />
                                    Quick Access
                                </CardTitle>
                                <CardDescription className="text-gray-300">
                                    Navigate to key sections
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    <Link to="/fixtures">
                                        <Button className="w-full h-14 bg-white/10 hover:bg-white/20 text-white border-0 flex flex-col gap-1 backdrop-blur-sm">
                                            <Calendar className="h-5 w-5" />
                                            <span className="text-xs">Fixtures</span>
                                        </Button>
                                    </Link>
                                    <Link to="/teams">
                                        <Button className="w-full h-14 bg-white/10 hover:bg-white/20 text-white border-0 flex flex-col gap-1 backdrop-blur-sm">
                                            <Users className="h-5 w-5" />
                                            <span className="text-xs">Teams</span>
                                        </Button>
                                    </Link>
                                    <Link to="/transactions">
                                        <Button className="w-full h-14 bg-white/10 hover:bg-white/20 text-white border-0 flex flex-col gap-1 backdrop-blur-sm">
                                            <FileText className="h-5 w-5" />
                                            <span className="text-xs">Transactions</span>
                                        </Button>
                                    </Link>
                                    <Link to="/cooldowns">
                                        <Button className="w-full h-14 bg-white/10 hover:bg-white/20 text-white border-0 flex flex-col gap-1 backdrop-blur-sm">
                                            <Clock className="h-5 w-5" />
                                            <span className="text-xs">Cooldowns</span>
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        {/* League Info */}
                        {/* <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-100">
                            <CardContent className="p-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Volleyball className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Indian Volleyball League</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Professional volleyball league featuring top teams and players from across the region.
                                    </p>

                                </div>
                            </CardContent>
                        </Card> */}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default HomePage;