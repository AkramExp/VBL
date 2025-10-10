import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, ArrowUpRight, ArrowDownLeft, Search, Filter, Building2 } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/config";

interface Transaction {
    _id: string;
    type: 'signing' | 'release';
    player: any;
    team: any;
    details: string;
    timestamp: string;
}

interface Team {
    _id: string;
    name: string;
}

export function TransactionLog() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [teamFilter, setTeamFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [transactionsRes, teamsRes] = await Promise.all([
                    axios.get(`${BASE_URL}/transactions`),
                    axios.get(`${BASE_URL}/teams`)
                ]);
                setTransactions(transactionsRes.data);
                setTeams(teamsRes.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter transactions
    const filteredTransactions = transactions.filter(transaction => {
        // Search filter (player name or details)
        const matchesSearch =
            transaction.player?.discordName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.details?.toLowerCase().includes(searchTerm.toLowerCase());

        // Team filter
        const matchesTeam = teamFilter === "all" || transaction.team?._id === teamFilter;

        // Type filter
        const matchesType = typeFilter === "all" || transaction.type === typeFilter;

        return matchesSearch && matchesTeam && matchesType;
    });

    // Sort by timestamp (newest first)
    const sortedTransactions = [...filteredTransactions].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Transaction Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">Loading...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-md sm:text-xl">
                    <FileText className="h-5 w-5" />
                    Transaction Log ({transactions.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Search and Filter Section */}
                <div className="space-y-4 mb-6">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search by player name or transaction details..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 text-sm sm:text-md"
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
                        {/* Type Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Filter className="h-3 w-3" />
                                Type
                            </label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="signing">Signings</SelectItem>
                                    <SelectItem value="release">Releases</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Team Filter */}
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

                        {/* Clear Filters Button */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium opacity-0">Clear</label>
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setTeamFilter("all");
                                    setTypeFilter("all");
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                disabled={searchTerm === "" && teamFilter === "all" && typeFilter === "all"}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="text-sm text-muted-foreground">
                        Showing {sortedTransactions.length} of {transactions.length} transactions
                        {(searchTerm || teamFilter !== "all" || typeFilter !== "all") && (
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setTeamFilter("all");
                                    setTypeFilter("all");
                                }}
                                className="ml-2 text-primary hover:underline"
                            >
                                Show all
                            </button>
                        )}
                    </div>
                </div>

                {/* Transactions List with Limited Height */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {sortedTransactions.map(transaction => (
                        <div key={transaction._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors w-full">
                            <div className="flex items-center gap-4 flex-1">
                                {transaction.type === 'signing' ? (
                                    <ArrowUpRight className="h-6 w-6 text-green-600 flex-shrink-0" />
                                ) : (
                                    <ArrowDownLeft className="h-6 w-6 text-red-600 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate text-sm sm:text-md">
                                        {transaction.player?.discordName || "Unknown Player"}
                                    </div>
                                    <div className="text-xs sm:text-sm text-muted-foreground truncate">
                                        {transaction.details}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                        <span>{formatDate(transaction.timestamp)}</span>
                                        {transaction.team && (
                                            <span className="flex items-center gap-1">
                                                <Building2 className="h-3 w-3" />
                                                {transaction.team.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Badge
                                variant={transaction.type === 'signing' ? 'default' : 'destructive'}
                                className="flex-shrink-0 ml-2 hidden sm:block"
                            >
                                {transaction.type === 'signing' ? 'SIGNING' : 'RELEASE'}
                            </Badge>
                        </div>
                    ))}

                    {sortedTransactions.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium mb-2">
                                {transactions.length === 0 ? "No Transactions Yet" : "No Transactions Match Your Filters"}
                            </h3>
                            <p className="mb-4">
                                {transactions.length === 0
                                    ? "Transaction history will appear here when players are signed or released."
                                    : "Try adjusting your search or filters to see more transactions."
                                }
                            </p>
                            {(searchTerm || teamFilter !== "all" || typeFilter !== "all") && (
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setTeamFilter("all");
                                        setTypeFilter("all");
                                    }}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Summary Stats */}
                {sortedTransactions.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-700">Signings</span>
                            </div>
                            <div className="text-2xl font-bold text-green-600 mt-1">
                                {transactions.filter(t => t.type === 'signing').length}
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <ArrowDownLeft className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-red-700">Releases</span>
                            </div>
                            <div className="text-2xl font-bold text-red-600 mt-1">
                                {transactions.filter(t => t.type === 'release').length}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}