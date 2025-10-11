import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Users, Crown, Shield, Calendar, ArrowUpRight, ArrowDownLeft, Clock, Building2, ArrowLeft, User, FileText } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/config";

interface Team {
    _id: string;
    name: string;
    captain: {
        _id: string;
        member: {
            discordName: string;
        };
    };
    viceCaptain: {
        _id: string;
        member: {
            discordName: string;
        };
    };
    players: Array<{
        _id: string;
        discordId: string;
        discordName: string;
        member: {
            discordName: string;
            discordId: string;
        };
        status: string;
        joinDate?: string;
        cooldownEnds?: string;
    }>;
}

interface Transaction {
    _id: string;
    type: 'signing' | 'release';
    player: {
        _id: string;
        discordName: string;
        member: {
            discordName: string;
        };
    };
    team: {
        _id: string;
        name: string;
    };
    details: string;
    timestamp: string;
}

export function TeamDetails() {
    const { id } = useParams();
    const [team, setTeam] = useState<Team | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'players' | 'transactions'>('players');

    const isPlayerInCooldown = (player: any): boolean => {
        if (player.cooldownEnds) {
            const cooldownEnds = new Date(player.cooldownEnds);
            const now = new Date();

            return cooldownEnds > now;
        }
        return false;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [teamRes, transactionsRes] = await Promise.all([
                    axios.get(`${BASE_URL}/teams/${id}`),
                    axios.get(`${BASE_URL}/transactions`)
                ]);

                setTeam(teamRes.data);
                // Filter transactions for this specific team
                const teamTransactions = transactionsRes.data.filter(
                    (transaction: Transaction) => transaction.team._id === id
                );
                setTransactions(teamTransactions);
            } catch (error) {
                console.log("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCooldownInfo = (player: any) => {
        if (player.cooldownEnds) {
            const cooldownEnds = new Date(player.cooldownEnds);
            const now = new Date();
            const timeLeft = cooldownEnds.getTime() - now.getTime();

            if (timeLeft > 0) {
                const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
                const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

                if (daysLeft > 1) {
                    return `${daysLeft} days`;
                } else {
                    return `${hoursLeft} hours`;
                }
            }
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white font-bold">🏐</span>
                    </div>
                    <p className="text-muted-foreground">Loading team details...</p>
                </div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white font-bold">🏐</span>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Team Not Found</h1>
                    <p className="text-muted-foreground mb-4">The team you're looking for doesn't exist.</p>
                    <Link to="/rosters">
                        <Button>Back to Rosters</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
            <Header
                title={team.name}
                subtitle="Team Details & History"
            />

            <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
                {/* Back Button */}
                <div className="mb-4 sm:mb-6">
                    <Link to="/rosters">
                        <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back to All Teams</span>
                            <span className="sm:hidden">Back</span>
                        </Button>
                    </Link>
                </div>



                {/* Tab Navigation - Mobile Responsive */}
                <div className="flex border-b mb-4 sm:mb-6 overflow-x-auto">
                    <button
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap flex-1 sm:flex-none justify-center ${activeTab === 'players'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        onClick={() => setActiveTab('players')}
                    >
                        <Users className="h-4 w-4" />
                        <span className="text-sm sm:text-base">Players</span>
                    </button>
                    <button
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap flex-1 sm:flex-none justify-center ${activeTab === 'transactions'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        onClick={() => setActiveTab('transactions')}
                    >
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm sm:text-base">History</span>
                        <Badge variant="secondary" className="ml-1 text-xs">
                            {transactions.length}
                        </Badge>
                    </button>
                </div>

                {/* Players Tab */}
                {activeTab === 'players' && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                                Team Roster ({team.players.length} players)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6">
                            {/* Mobile View - Card Layout */}
                            <div className="sm:hidden space-y-3 p-4">
                                {team.players.map(player => {
                                    const isCaptain = player._id === team.captain._id;
                                    const isViceCaptain = player._id === team.viceCaptain._id;
                                    const cooldownInfo = getCooldownInfo(player);
                                    const joinDate = player.joinDate ? formatDate(player.joinDate) : '-';

                                    return (
                                        <div key={player._id} className="border rounded-lg p-3 bg-card space-y-2">
                                            {/* Player Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{player?.discordName}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    {isCaptain && (
                                                        <Badge className="bg-yellow-500 text-white text-xs">
                                                            <Crown className="h-3 w-3 mr-1" />
                                                            C
                                                        </Badge>
                                                    )}
                                                    {isViceCaptain && (
                                                        <Badge className="bg-blue-500 text-white text-xs">
                                                            <Shield className="h-3 w-3 mr-1" />
                                                            VC
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Player Details */}
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <div className="text-muted-foreground">Status</div>
                                                    <div>
                                                        {isPlayerInCooldown(player) === true ? (
                                                            <Badge variant="outline" className="bg-orange-100 text-orange-700 text-xs">
                                                                Cooldown
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="default" className="bg-green-500 text-xs">Active</Badge>
                                                        )
                                                        }
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Join Date</div>
                                                    <div className="text-xs">{joinDate}</div>
                                                </div>
                                            </div>

                                            {/* Cooldown Info */}
                                            {cooldownInfo && (
                                                <div className="flex items-center gap-2 text-sm bg-orange-50 p-2 rounded">
                                                    <Clock className="h-3 w-3 text-orange-500" />
                                                    <span>{cooldownInfo} cooldown left</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop View - Table Layout */}
                            <div className="hidden sm:block rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Player Name</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Join Date</TableHead>
                                            <TableHead>Cooldown</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {team.players.map(player => {
                                            const isCaptain = player._id === team.captain._id;
                                            const isViceCaptain = player._id === team.viceCaptain._id;
                                            const cooldownInfo = getCooldownInfo(player);
                                            const joinDate = player.joinDate ? formatDate(player.joinDate) : '-';

                                            return (
                                                <TableRow key={player._id} className="hover:bg-muted/50">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                                            {player?.discordName}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            {isCaptain && (
                                                                <Badge className="bg-yellow-500 text-white">
                                                                    <Crown className="h-3 w-3 mr-1" />
                                                                    Captain
                                                                </Badge>
                                                            )}
                                                            {isViceCaptain && (
                                                                <Badge className="bg-blue-500 text-white">
                                                                    <Shield className="h-3 w-3 mr-1" />
                                                                    Vice Captain
                                                                </Badge>
                                                            )}
                                                            {!isCaptain && !isViceCaptain && (
                                                                <Badge variant="outline">Player</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {isPlayerInCooldown(player) ? <Badge variant="outline" className="bg-orange-100 text-orange-700">
                                                            Cooldown
                                                        </Badge> : (
                                                            <Badge variant="default" className="bg-green-500">Active</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-muted-foreground">{joinDate}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {cooldownInfo ? (
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-3 w-3 text-orange-500" />
                                                                <span className="text-sm">{cooldownInfo} left</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Transactions Tab */}
                {activeTab === 'transactions' && (
                    <Card className="max-h-[80vh] overflow-y-auto">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                                Transaction History ({transactions.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {transactions.length > 0 ? (
                                <div className="space-y-3">
                                    {transactions.map(transaction => (
                                        <div
                                            key={transaction._id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/30 transition-colors gap-3"
                                        >
                                            <div className="flex items-start sm:items-center gap-3 flex-1">
                                                {transaction.type === 'signing' ? (
                                                    <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 mt-1 sm:mt-0" />
                                                ) : (
                                                    <ArrowDownLeft className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0 mt-1 sm:mt-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm sm:text-base">
                                                        {transaction.player?.discordName}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                                                        {transaction.details}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(transaction.timestamp)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="self-start sm:self-center">
                                                <Badge
                                                    variant={transaction.type === 'signing' ? 'default' : 'destructive'}
                                                    className="text-xs sm:text-sm"
                                                >
                                                    {transaction.type === 'signing' ? 'SIGNING' : 'RELEASE'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 sm:py-12">
                                    <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                        No Transactions Yet
                                    </h3>
                                    <p className="text-muted-foreground text-sm sm:text-base">
                                        Transaction history will appear here once players are signed or released.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

            </main>
        </div>
    );
}

export default TeamDetails;