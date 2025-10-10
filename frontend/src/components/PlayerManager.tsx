import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, Clock, Building2, UserX, UserCheck, Search, Filter, Edit, Save, X, Trash2, Crown, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { BASE_URL } from "@/config";

interface Player {
    _id: string;
    discordName: string;
    discordId: string;
    member: {
        _id: string;
        discordName: string;
        discordId: string;
    };
    status: 'available' | 'signed' | 'cooldown';
    cooldownEnds?: string;
    currentTeam?: string;
    joinDate?: string;
    releaseDate?: string;
    isCaptain?: boolean;
    isViceCaptain?: boolean;
}

interface Team {
    _id: string;
    name: string;
    captain: {
        _id: string;
    };
    viceCaptain: {
        _id: string;
    };
    players: Array<{
        _id: string;
    }>;
}

export function PlayerManager() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [teamFilter, setTeamFilter] = useState<string>("all");
    const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
    const [newTeamId, setNewTeamId] = useState<string>("no-team");
    const { toast } = useToast();

    const MAX_PLAYERS = 12;

    const fetchData = async () => {
        try {
            const [playersRes, teamsRes] = await Promise.all([
                axios.get(`${BASE_URL}/players`),
                axios.get(`${BASE_URL}/teams`)
            ]);

            // Enhance players with captain/vice-captain information
            const enhancedPlayers = playersRes.data.map((player: Player) => {
                const playerTeam = teamsRes.data.find((team: Team) => team._id === player.currentTeam);
                return {
                    ...player,
                    isCaptain: playerTeam?.captain?._id === player._id,
                    isViceCaptain: playerTeam?.viceCaptain?._id === player._id
                };
            });

            setPlayers(enhancedPlayers);
            setTeams(teamsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                title: "Error",
                description: "Failed to fetch data",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getTeamName = (teamId: string) => {
        const team = teams.find(t => t._id === teamId);
        return team ? team.name : "Unknown Team";
    };

    const getTeamPlayerCount = (teamId: string) => {
        const team = teams.find(t => t._id === teamId);
        return team ? team.players.length : 0;
    };

    const isTeamFull = (teamId: string) => {
        return getTeamPlayerCount(teamId) >= MAX_PLAYERS;
    };

    const getTeamForPlayer = (player: Player) => {
        if (!player.currentTeam) return null;
        return teams.find(t => t._id === player.currentTeam);
    };

    const isPlayerCaptainOrViceCaptain = (player: Player): boolean => {
        return !!(player.isCaptain || player.isViceCaptain);
    };

    const getRoleBadge = (player: Player) => {
        if (player.isCaptain) {
            return (
                <Badge className="bg-yellow-500 text-white ml-2">
                    C
                </Badge>
            );
        }
        if (player.isViceCaptain) {
            return (
                <Badge className="bg-purple-500 text-white ml-2">
                    VC
                </Badge>
            );
        }
        return null;
    };

    const getStatusBadge = (player: Player) => {
        switch (player.status) {
            case 'available':
                return (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Available
                    </Badge>
                );
            case 'signed':
                return (
                    <Badge className="bg-blue-500 text-white">
                        <Building2 className="h-3 w-3 mr-1" />
                        Signed
                    </Badge>
                );
            case 'cooldown':
                return (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Cooldown
                    </Badge>
                );
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const getCooldownInfo = (player: Player) => {
        if (player.status === 'cooldown' && player.cooldownEnds) {
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

    const startEditing = (player: Player) => {
        // Check if player is captain or vice-captain
        if (isPlayerCaptainOrViceCaptain(player)) {
            toast({
                title: "Cannot Edit Team",
                description: "Cannot change team for captain or vice-captain. Please reassign their role first.",
                variant: "destructive"
            });
            return;
        }

        setEditingPlayer(player._id);
        setNewTeamId(player.currentTeam || "no-team");
    };

    const cancelEditing = () => {
        setEditingPlayer(null);
        setNewTeamId("no-team");
    };

    const updatePlayerTeam = async (playerId: string) => {
        try {
            const player = players.find(p => p._id === playerId);
            if (!player) return;

            // Check if player is captain or vice-captain
            if (isPlayerCaptainOrViceCaptain(player)) {
                toast({
                    title: "Cannot Change Team",
                    description: "Cannot change team for captain or vice-captain. Please reassign their role first.",
                    variant: "destructive"
                });
                return;
            }

            // Convert "no-team" back to null for the API
            const teamIdToSend = newTeamId === "no-team" ? null : newTeamId;

            // Check if target team is full (only if moving to a new team)
            if (teamIdToSend && teamIdToSend !== player.currentTeam) {
                if (isTeamFull(teamIdToSend)) {
                    toast({
                        title: "Team Full",
                        description: `Cannot add player to ${getTeamName(teamIdToSend)} - team already has ${MAX_PLAYERS} players`,
                        variant: "destructive"
                    });
                    return;
                }
            }

            // If removing from team (setting to "no-team")
            if (teamIdToSend === null) {
                await axios.put(`${BASE_URL}/players/${playerId}/team`, {
                    teamId: null,
                    applyCooldown: false
                });

                await axios.post("https://testing-bot-rt1b.onrender.com/assign-player-role", { action: "remove", discordId: player.discordId });

                toast({
                    title: "Success",
                    description: "Player removed from team without cooldown"
                });
            }
            // If changing team
            else if (teamIdToSend !== player.currentTeam) {
                await axios.put(`${BASE_URL}/players/${playerId}/team`, {
                    teamId: teamIdToSend,
                    applyCooldown: false
                });

                await axios.post("https://testing-bot-rt1b.onrender.com/assign-player-role", { action: "add", discordId: player.discordId })

                toast({
                    title: "Success",
                    description: `Player team changed to ${getTeamName(teamIdToSend)} without cooldown`
                });
            }

            // Refresh data
            await fetchData();
            setEditingPlayer(null);
            setNewTeamId("no-team");

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to update player team",
                variant: "destructive"
            });
        }
    };

    const removeFromTeam = async (playerId: string) => {
        try {
            const player = players.find(p => p._id === playerId);
            if (!player) return;

            // Check if player is captain or vice-captain
            if (isPlayerCaptainOrViceCaptain(player)) {
                toast({
                    title: "Cannot Remove from Team",
                    description: "Cannot remove captain or vice-captain from team. Please reassign their role first.",
                    variant: "destructive"
                });
                return;
            }

            await axios.put(`${BASE_URL}/players/${playerId}/team`, {
                teamId: null,
                applyCooldown: false
            });

            toast({
                title: "Success",
                description: "Player removed from team without cooldown"
            });

            // Refresh data
            await fetchData();

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to remove player from team",
                variant: "destructive"
            });
        }
    };

    // Filter players based on search term and filters
    const filteredPlayers = players.filter(player => {
        // Search term filter (discord name)
        const matchesSearch = player.discordName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player?.discordId?.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter
        const matchesStatus = statusFilter === "all" || player.status === statusFilter;

        // Team filter
        let matchesTeam = true;
        if (teamFilter === "no-team") {
            matchesTeam = !player.currentTeam;
        } else if (teamFilter !== "all") {
            matchesTeam = player.currentTeam === teamFilter;
        }

        return matchesSearch && matchesStatus && matchesTeam;
    });

    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        const statusOrder = { 'signed': 0, 'cooldown': 1, 'available': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Player Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">Loading players...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-md sm:text-xl">
                        <Users className="h-5 w-5" />
                        Player Management ({players.length} players)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Search and Filter Section */}
                    <div className="space-y-4 mb-6">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search players by Discord name or ID..."
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
                            {/* Status Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Filter className="h-3 w-3" />
                                    Status
                                </label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="signed">Signed</SelectItem>
                                        <SelectItem value="cooldown">Cooldown</SelectItem>
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
                                        <SelectItem value="no-team">No Team</SelectItem>
                                        {teams.map(team => (
                                            <SelectItem
                                                key={team._id}
                                                value={team._id}
                                            >
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
                                        setStatusFilter("all");
                                        setTeamFilter("all");
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                    disabled={searchTerm === "" && statusFilter === "all" && teamFilter === "all"}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>

                        {/* Results Count */}
                        <div className="text-sm text-muted-foreground">
                            Showing {sortedPlayers.length} of {players.length} players
                            {(searchTerm || statusFilter !== "all" || teamFilter !== "all") && (
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setStatusFilter("all");
                                        setTeamFilter("all");
                                    }}
                                    className="ml-2 text-primary hover:underline"
                                >
                                    Show all
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Players Table */}
                    <div className="rounded-md border overflow-x-auto max-h-[600px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">Player Name</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">Team & Role</TableHead>
                                    <TableHead className="text-center">Cooldown</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedPlayers.map(player => {
                                    const cooldownInfo = getCooldownInfo(player);
                                    const isEditing = editingPlayer === player._id;
                                    const isCaptainOrViceCaptain = isPlayerCaptainOrViceCaptain(player);

                                    return (
                                        <TableRow key={player._id} className="hover:bg-muted/50">
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {player?.discordName}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    {getStatusBadge(player)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Select value={newTeamId} onValueChange={setNewTeamId}>
                                                            <SelectTrigger className="w-48">
                                                                <SelectValue placeholder="Select team" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="no-team">No Team</SelectItem>
                                                                {teams.map(team => (
                                                                    <SelectItem
                                                                        key={team._id}
                                                                        value={team._id}
                                                                        disabled={isTeamFull(team._id) && team._id !== player.currentTeam}
                                                                    >
                                                                        {team.name}
                                                                        {isTeamFull(team._id) && ` (Full - ${team.players.length}/${MAX_PLAYERS})`}
                                                                        {!isTeamFull(team._id) && ` (${team.players.length}/${MAX_PLAYERS})`}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 pl-10">
                                                        {player.currentTeam ? (
                                                            <>
                                                                <Badge variant="outline" className="bg-primary/10 text-primary">
                                                                    <Building2 className="h-3 w-3 mr-1" />
                                                                    {getTeamName(player.currentTeam)}
                                                                    <span className="ml-1 text-xs">
                                                                        ({getTeamPlayerCount(player.currentTeam)}/{MAX_PLAYERS})
                                                                    </span>
                                                                </Badge>
                                                                {getRoleBadge(player)}
                                                            </>
                                                        ) : (
                                                            <span className="text-muted-foreground flex items-center gap-1">
                                                                <UserX className="h-3 w-3" />
                                                                No Team
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {cooldownInfo ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Clock className="h-3 w-3 text-orange-500" />
                                                        <span className="text-sm">{cooldownInfo} left</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-1">
                                                    {isEditing ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => updatePlayerTeam(player._id)}
                                                                disabled={
                                                                    newTeamId === (player.currentTeam || "no-team") ||
                                                                    (newTeamId !== "no-team" && isTeamFull(newTeamId) && newTeamId !== player.currentTeam)
                                                                }
                                                                title={
                                                                    newTeamId !== "no-team" && isTeamFull(newTeamId) && newTeamId !== player.currentTeam
                                                                        ? `Team is full (${MAX_PLAYERS} players)`
                                                                        : "Save changes"
                                                                }
                                                            >
                                                                <Save className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={cancelEditing}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => startEditing(player)}
                                                                disabled={isCaptainOrViceCaptain}
                                                                title={isCaptainOrViceCaptain ? "Cannot edit captain/vice-captain" : "Edit team"}
                                                            >
                                                                <Edit className="h-3 w-3" />
                                                            </Button>
                                                            {player.currentTeam && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => removeFromTeam(player._id)}
                                                                    disabled={isCaptainOrViceCaptain}
                                                                    title={isCaptainOrViceCaptain ? "Cannot remove captain/vice-captain" : "Remove from team"}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Empty State */}
                    {sortedPlayers.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                {players.length === 0 ? "No Players Found" : "No Players Match Your Filters"}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {players.length === 0
                                    ? "Players will appear here once they are created through team management."
                                    : "Try adjusting your search or filters to see more players."
                                }
                            </p>
                            {(searchTerm || statusFilter !== "all" || teamFilter !== "all") && (
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setStatusFilter("all");
                                        setTeamFilter("all");
                                    }}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Summary Stats */}
                    {sortedPlayers.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                    <span className="font-medium text-green-700">Available</span>
                                </div>
                                <div className="text-2xl font-bold text-green-600 mt-1">
                                    {players.filter(p => p.status === 'available').length}
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-700">Signed</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-600 mt-1">
                                    {players.filter(p => p.status === 'signed').length}
                                </div>
                            </div>

                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                    <span className="font-medium text-orange-700">Cooldown</span>
                                </div>
                                <div className="text-2xl font-bold text-orange-600 mt-1">
                                    {players.filter(p => p.status === 'cooldown').length}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}