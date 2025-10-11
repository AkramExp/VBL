import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BASE_URL } from "@/config";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { AlertCircle, ArrowLeft, Building2, CheckCircle, Clock, Crown, Key, Plus, Search, Shield, UserPlus, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface Team {
    _id: string;
    name: string;
    password: string;
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
        discordName: string;
        discordId: string;
        member: {
            discordName: string;
        };
        status: string;
        cooldownEnds?: string;
    }>;
}

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
}

interface Member {
    _id: string;
    discordId: string;
    discordName: string;
}

// Interface for selected player with both ID and Discord ID
interface SelectedPlayer {
    playerId: string;
    discordId: string;
    discordName: string;
}

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    isAction: boolean;
}

function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'default',
    isAction
}: ConfirmationDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg p-6 w-full max-w-md">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="text-muted-foreground mt-2">{description}</p>
                </div>
                <div className="flex gap-3 justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isAction}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        disabled={isAction}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function TeamManagement() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [team, setTeam] = useState<Team | null>(null);
    const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
    const [allPlayers, setAllPlayers] = useState<Player[]>([]); // New state for all players
    const [members, setMembers] = useState<Member[]>([]);
    const [password, setPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState("");
    const [showMemberSelection, setShowMemberSelection] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [inCooldown, setInCooldown] = useState(false)
    const { toast } = useToast();
    const [isAction, setIsAction] = useState(false);
    const [newTeamPlayers, setNewTeamPlayers] = useState<SelectedPlayer[]>([]);

    // Confirmation dialog states
    const [showAddConfirmation, setShowAddConfirmation] = useState(false);
    const [showReleaseConfirmation, setShowReleaseConfirmation] = useState(false);
    const [playerToRelease, setPlayerToRelease] = useState<{ id: string; discordId: string; name: string } | null>(null);

    const MAX_PLAYERS = 12;

    const getPlayerDetails = (playerId: string): any | undefined => {
        return team.players.find(player => player._id === playerId);
    };

    const fetchMembers = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/members`);
            setMembers(response.data);
        } catch (error) {
            console.log("Error fetching members:", error);
        }
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [teamRes, playersRes, membersRes, allPlayersRes] = await Promise.all([
                    axios.get(`${BASE_URL}/teams/${id}`),
                    axios.get(`${BASE_URL}/players/available`),
                    axios.get(`${BASE_URL}/members`),
                    axios.get(`${BASE_URL}/players`)
                ]);
                setTeam(teamRes.data);
                setAvailablePlayers(playersRes.data);
                setAllPlayers(allPlayersRes.data);
                setMembers(membersRes.data);
            } catch (error) {
                console.log("Error fetching data:", error);
                toast({
                    title: "Error",
                    description: "Failed to load team data",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, toast]);

    const authenticateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!team) return;

        const res = await axios.post(`${BASE_URL}/teams/login/${team._id}`, { password });

        if (res.data.success) {
            setIsAuthenticated(true);
            toast({
                title: "Success",
                description: "Authentication successful"
            });
        } else {
            toast({
                title: "Error",
                description: "Invalid team password",
                variant: "destructive"
            });
        }
    };

    const createPlayerFromMember = async (memberId: string) => {
        try {
            setIsAction(true)
            const member = members.find(m => m._id === memberId);
            if (!member) {
                throw new Error("Member not found");
            }

            const response = await axios.post(`${BASE_URL}/players`, { memberId });
            toast({
                title: "Success",
                description: "Player created successfully"
            });

            const [playersRes, allPlayersRes] = await Promise.all([
                axios.get(`${BASE_URL}/players/available`),
                axios.get(`${BASE_URL}/players`)
            ]);
            setAvailablePlayers(playersRes.data);
            setAllPlayers(allPlayersRes.data);

            setShowMemberSelection(false)

            return {
                playerId: response.data.player._id,
                discordId: member.discordId,
                discordName: member.discordName
            };

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to create player",
                variant: "destructive"
            });
            return null;
        } finally {
            setIsAction(false)
        }
    };

    const handleAddPlayerConfirmation = () => {
        if (!selectedPlayer || !team) return;

        // Check if team is already at maximum capacity
        if (team.players.length >= MAX_PLAYERS) {
            toast({
                title: "Maximum players reached",
                description: `A team can have maximum ${MAX_PLAYERS} players`,
                variant: "destructive"
            });
            return;
        }

        // Get player name for confirmation message
        let playerName = "";
        if (newTeamPlayers.length > 0) {
            const selectedPlayerData = newTeamPlayers.find(sp => sp.playerId === selectedPlayer);
            playerName = selectedPlayerData?.discordName || "";
        } else {
            playerName = availablePlayers.find(player => player._id === selectedPlayer)?.discordName || "";
        }

        if (!playerName) {
            toast({
                title: "Error",
                description: "Could not find player information",
                variant: "destructive"
            });
            return;
        }

        setShowAddConfirmation(true);
    };

    const addPlayer = async () => {
        if (!selectedPlayer || !team) return;

        let playerToAdd = selectedPlayer;
        let discordId = "";

        if (newTeamPlayers.length > 0) {
            const selectedPlayerData = newTeamPlayers.find(sp => sp.playerId === selectedPlayer);
            if (selectedPlayerData) {
                playerToAdd = selectedPlayerData.playerId;
                discordId = selectedPlayerData.discordId;
            } else {
                // Fallback to availablePlayers
                discordId = availablePlayers.find(player => player._id === selectedPlayer)?.discordId || "";
            }
        } else {
            // Adding from availablePlayers dropdown
            discordId = availablePlayers.find(player => player._id === selectedPlayer)?.discordId || "";
        }

        try {
            setIsAction(true)
            await axios.post(`${BASE_URL}/teams/${team._id}/players`, {
                playerId: playerToAdd,
            });

            await axios.post("https://testing-bot-rt1b.onrender.com/assign-player-role", { action: "add", discordId })

            toast({
                title: "Success",
                description: "Player added to team"
            });

            // Refresh data
            const [teamRes, playersRes, allPlayersRes] = await Promise.all([
                axios.get(`${BASE_URL}/teams/${id}`),
                axios.get(`${BASE_URL}/players/available`),
                axios.get(`${BASE_URL}/players`)
            ]);
            setTeam(teamRes.data);
            setAvailablePlayers(playersRes.data);
            setAllPlayers(allPlayersRes.data);
            setSelectedPlayer("");
            setNewTeamPlayers([]); // Clear the member selection
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to add player",
                variant: "destructive"
            });
        } finally {
            setIsAction(false)
            setShowAddConfirmation(false);
        }
    };

    const handleReleasePlayerConfirmation = (playerId: string, discordId: string, playerName: string) => {
        if (!team) return;

        const player = getPlayerDetails(playerId);
        if (!player) {
            toast({
                title: "Error",
                description: "Player not found",
                variant: "destructive"
            });
            return;
        }

        if (!canReleasePlayer(player)) {
            if (player._id === team.captain._id || player._id === team.viceCaptain._id) {
                toast({
                    title: "Error",
                    description: "Cannot release captain or vice-captain",
                    variant: "destructive"
                });
            } else if (isPlayerInCooldown(player)) {
                const cooldownInfo = getCooldownInfo(player.cooldownEnds);
                toast({
                    title: "Cannot Release Player",
                    description: `Player is in cooldown period. ${cooldownInfo} remaining.`,
                    variant: "destructive"
                });
            }
            return;
        }

        setPlayerToRelease({ id: playerId, discordId, name: playerName });
        setShowReleaseConfirmation(true);
    };

    const releasePlayer = async () => {
        if (!team || !playerToRelease) return;

        try {
            setIsAction(true)
            await axios.delete(`${BASE_URL}/teams/${team._id}/players/${playerToRelease.id}`);

            await axios.post("https://testing-bot-rt1b.onrender.com/assign-player-role", { action: "remove", discordId: playerToRelease.discordId })
            toast({
                title: "Success",
                description: "Player released from team"
            });

            const [teamRes, playersRes, allPlayersRes] = await Promise.all([
                axios.get(`${BASE_URL}/teams/${id}`),
                axios.get(`${BASE_URL}/players/available`),
                axios.get(`${BASE_URL}/players`)
            ]);
            setTeam(teamRes.data);
            setAvailablePlayers(playersRes.data);
            setAllPlayers(allPlayersRes.data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to release player",
                variant: "destructive"
            });
        } finally {
            setIsAction(false)
            setShowReleaseConfirmation(false);
            setPlayerToRelease(null);
        }
    };

    const getCooldownInfo = (cooldownEnds?: string) => {
        if (cooldownEnds) {
            const cooldownDate = new Date(cooldownEnds);
            const now = new Date();
            const timeLeft = cooldownDate.getTime() - now.getTime();

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

    const isPlayerInCooldown = (player: Player): boolean => {
        if (player.cooldownEnds) {
            const cooldownEnds = new Date(player.cooldownEnds);
            const now = new Date();
            return cooldownEnds > now;
        }
        return false;
    };

    const canReleasePlayer = (player: Player): boolean => {
        if (!team) return false;

        const isCaptain = player._id === team.captain._id;
        const isViceCaptain = player._id === team.viceCaptain._id;
        const inCooldown = isPlayerInCooldown(player);

        return !isCaptain && !isViceCaptain && !inCooldown;
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
            <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-white font-bold">🏐</span>
                </div>
                <p className="text-muted-foreground">Loading team details...</p>
            </div>
        </div>
    }

    if (!team) {
        return <div>Team not found</div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-accent to-secondary p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center">Team Authentication</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center mb-4">
                            <h3 className="font-semibold">{team.name}</h3>
                            <p className="text-muted-foreground">Enter team password to manage roster</p>
                        </div>
                        <form onSubmit={authenticateTeam} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Team Password</Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter team password"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                <Key className="h-4 w-4 mr-2" />
                                Authenticate
                            </Button>
                        </form>
                        <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => navigate("/rosters")}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Rosters
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const filteredMembers = members.filter(member =>
        member?.discordName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.discordId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const membersWithoutPlayers = filteredMembers.filter(member => {
        const hasPlayerProfile = allPlayers.some(player =>
            player.member?._id === member?._id
        );

        return !hasPlayerProfile;
    });

    // Get player name for confirmation dialog
    const getSelectedPlayerName = () => {
        if (newTeamPlayers.length > 0) {
            const selectedPlayerData = newTeamPlayers.find(sp => sp.playerId === selectedPlayer);
            return selectedPlayerData?.discordName || "";
        } else {
            return availablePlayers.find(player => player._id === selectedPlayer)?.discordName || "";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
            <Header
                title={`${team.name} - Team Management`}
                subtitle="Manage your team roster"
                showAdminLogout={false}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {team.players.length >= MAX_PLAYERS && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            <span className="font-medium text-amber-800">Team Roster Full</span>
                        </div>
                        <p className="text-sm text-amber-700 mt-1">
                            Your team has reached the maximum of {MAX_PLAYERS} players. Release players before adding new ones.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Current Roster - Takes 2/3 width */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-md sm:text-xl">
                                    <Users className="h-5 w-5" />
                                    Current Roster ({team.players.length}/{MAX_PLAYERS} players)
                                    {team.players.length >= MAX_PLAYERS && (
                                        <Badge variant="destructive" className="ml-2">
                                            Full
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Player</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Cooldown</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {team.players.map(player => {
                                                const isCaptain = player._id === team.captain._id;
                                                const isViceCaptain = player._id === team.viceCaptain._id;
                                                const canRelease = !isCaptain && !isViceCaptain && !player.cooldownEnds;
                                                const cooldownInfo = getCooldownInfo(player.cooldownEnds);

                                                return (
                                                    <TableRow key={player._id}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                                {player?.discordName}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {isCaptain && (
                                                                <Badge className="bg-yellow-500 text-white">
                                                                    <Crown className="h-3 w-3 sm:mr-1" />
                                                                    <span className="hidden sm:block">Captain</span>
                                                                </Badge>
                                                            )}
                                                            {isViceCaptain && (
                                                                <Badge className="bg-blue-500 text-white">
                                                                    <Shield className="h-3 w-3 sm:mr-1" />
                                                                    <span className="hidden sm:block">Vice Captain</span>
                                                                </Badge>
                                                            )}
                                                            {!isCaptain && !isViceCaptain && (
                                                                <Badge variant="outline">Player</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getTimeRemaining(player.cooldownEnds).isExpired ? (
                                                                <Badge variant="default" className="bg-green-500">Active</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-orange-100 text-orange-700">
                                                                    Cooldown
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {!getTimeRemaining(player.cooldownEnds).isExpired ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-3 w-3 text-orange-500" />
                                                                    <span className="text-sm">{getTimeRemaining(player.cooldownEnds).text}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {canRelease ? (
                                                                <Button
                                                                    disabled={isAction}
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleReleasePlayerConfirmation(
                                                                        // @ts-ignore
                                                                        player._id,
                                                                        // @ts-ignore
                                                                        player.discordId,
                                                                        player.discordName
                                                                    )}
                                                                >
                                                                    Release
                                                                </Button>
                                                            ) : <span className="text-xs text-muted-foreground">Cannot release</span>}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Add Player Section - Takes 1/3 width */}
                    <div className="space-y-6">
                        {/* Add Player Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="h-5 w-5" />
                                    Add Player to Team
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Select Available Player</Label>
                                    <select
                                        value={selectedPlayer}
                                        onChange={(e) => setSelectedPlayer(e.target.value)}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="">Choose a player...</option>
                                        {/* Show selected members first */}
                                        {newTeamPlayers.map(player => (
                                            <option key={player.playerId} value={player.playerId}>
                                                {player.discordName}
                                            </option>
                                        ))}
                                        {/* Then show available players */}
                                        {availablePlayers
                                            .filter(player => !newTeamPlayers.some(sp => sp.playerId === player._id))
                                            .map(player => (
                                                <option key={player._id} value={player._id}>
                                                    {player?.discordName}
                                                    {player.status === 'cooldown' && ' (Cooldown)'}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <Button
                                    onClick={handleAddPlayerConfirmation}
                                    disabled={!selectedPlayer || team.players.length >= MAX_PLAYERS || isAction}
                                    className="w-full"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Selected Player to Team
                                </Button>

                                <div className="text-center">
                                    <span className="text-sm text-muted-foreground">or</span>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        fetchMembers();
                                        setShowMemberSelection(true);
                                    }}
                                    disabled={team.players.length >= MAX_PLAYERS}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {newTeamPlayers.length > 0 ? "Add More Members" : "Create New Player from Member"}
                                </Button>

                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>• New players will have a 2-day cooldown</p>
                                    <p>• Released players cannot join other teams for 2 days</p>
                                    <p>• Maximum {MAX_PLAYERS} players per team</p>
                                    <p>• Select multiple members and add them all at once</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Member Selection Modal */}
                {showMemberSelection && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Create New Player from Member</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            {team.players.length}/{MAX_PLAYERS} players
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setShowMemberSelection(false);
                                                setSearchTerm("");
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Search Bar */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                        <Input
                                            placeholder="Search members by name or Discord ID..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                        {searchTerm && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSearchTerm("")}
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Team Size Warning in Modal */}
                                    {team.players.length >= MAX_PLAYERS && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                                <span className="font-medium text-red-800">Maximum Players Reached</span>
                                            </div>
                                            <p className="text-sm text-red-700 mt-1">
                                                Cannot add more than {MAX_PLAYERS} players to a team
                                            </p>
                                        </div>
                                    )}

                                    {/* Members List */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <Label>Select members to create players:</Label>
                                            <span className="text-sm text-muted-foreground">
                                                {membersWithoutPlayers.length} members found
                                            </span>
                                        </div>

                                        <div className="max-h-96 overflow-y-auto border rounded">
                                            {membersWithoutPlayers.length > 0 ? (
                                                <div className="divide-y">
                                                    {membersWithoutPlayers.map(member => {
                                                        const isSelected = newTeamPlayers.some(sp =>
                                                            sp.discordId === member.discordId
                                                        );
                                                        const canSelect = team.players.length < MAX_PLAYERS &&
                                                            newTeamPlayers.length < (MAX_PLAYERS - team.players.length);

                                                        return (
                                                            <div
                                                                key={member._id}
                                                                className={`p-4 cursor-pointer transition-colors ${isSelected
                                                                    ? 'bg-green-50 border-l-4 border-l-green-500'
                                                                    : canSelect
                                                                        ? 'hover:bg-muted cursor-pointer'
                                                                        : 'bg-gray-50 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <div className="font-medium flex items-center gap-2">
                                                                            {member.discordName}
                                                                            {isSelected && (
                                                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                                            )}
                                                                        </div>
                                                                        <div className="text-sm text-muted-foreground">
                                                                            Discord ID: {member.discordId}
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant={isSelected ? "default" : "outline"}
                                                                        size="sm"
                                                                        disabled={!canSelect && !isSelected || isAction}
                                                                        onClick={() => canSelect && createPlayerFromMember(member._id)}
                                                                    >
                                                                        <UserPlus className="h-4 w-4 mr-2" />
                                                                        {!canSelect ? "Full" : "Add"}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                    <p className="text-muted-foreground">
                                                        {searchTerm
                                                            ? `No members found matching "${searchTerm}"`
                                                            : "All members already have player profiles"
                                                        }
                                                    </p>
                                                    {searchTerm && (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setSearchTerm("")}
                                                            className="mt-2"
                                                        >
                                                            Clear search
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Add Player Confirmation Dialog */}
                <ConfirmationDialog
                    isOpen={showAddConfirmation}
                    onClose={() => setShowAddConfirmation(false)}
                    onConfirm={addPlayer}
                    title="Add Player to Team"
                    description={`Are you sure you want to add "${getSelectedPlayerName()}" to ${team.name}?`}
                    confirmText="Add Player"
                    cancelText="Cancel"
                    isAction={isAction}
                />

                {/* Release Player Confirmation Dialog */}
                <ConfirmationDialog
                    isOpen={showReleaseConfirmation}
                    onClose={() => {
                        setShowReleaseConfirmation(false);
                        setPlayerToRelease(null);
                    }}
                    onConfirm={releasePlayer}
                    title="Release Player from Team"
                    description={`Are you sure you want to release "${playerToRelease?.name}" from ${team.name}? This action cannot be undone.`}
                    confirmText="Release Player"
                    cancelText="Cancel"
                    variant="destructive"
                    isAction={isAction}
                />
            </main>
        </div>
    );
}

export default TeamManagement;