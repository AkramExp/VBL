import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Crown, Shield, User, Settings, Eye } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/config";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";

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
        member: {
            discordName: string;
        };
    }>;
}

export function TeamRosters() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/teams`);
                setTeams(response.data);
            } catch (error) {
                console.error("Error fetching teams:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeams();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white font-bold">🏐</span>
                    </div>
                    <p className="text-muted-foreground">Loading team rosters...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
            <Header
                title="Indian Volleyball League"
                subtitle="Team Rosters"
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map(team => (
                        <Card key={team._id} className="shadow-card hover:shadow-lg transition-shadow border-2">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold text-primary">
                                        {team.name}
                                    </CardTitle>
                                    <Badge variant="secondary" className="text-sm">
                                        {team.players.length} players
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Team Players List */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            Team Roster
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Crown className="h-3 w-3 text-yellow-600" />
                                            <span>Captain</span>
                                            <Shield className="h-3 w-3 text-blue-600 ml-2" />
                                            <span>Vice Captain</span>
                                        </div>
                                    </div>

                                    {/* Players container with hidden scrollbar */}
                                    <div className="border rounded-lg bg-muted/30 p-3 max-h-64 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none]">
                                        {/* @ts-ignore */}
                                        <style jsx>{`
                                            div::-webkit-scrollbar {
                                                display: none;
                                            }
                                        `}</style>
                                        <div className="space-y-2">
                                            {team.players.map(player => {
                                                const isCaptain = player._id === team.captain._id;
                                                const isViceCaptain = player._id === team.viceCaptain._id;

                                                return (
                                                    <div
                                                        key={player._id}
                                                        className="flex items-center justify-between p-2 bg-background rounded border hover:bg-muted/50 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium text-sm">
                                                                {player?.member?.discordName}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {isCaptain && (
                                                                <Badge
                                                                    className="bg-yellow-500 text-white border-0 text-xs px-2 py-1"
                                                                    title="Captain"
                                                                >
                                                                    <Crown className="h-3 w-3 mr-1" />
                                                                    C
                                                                </Badge>
                                                            )}
                                                            {isViceCaptain && (
                                                                <Badge
                                                                    className="bg-blue-500 text-white border-0 text-xs px-2 py-1"
                                                                    title="Vice Captain"
                                                                >
                                                                    <Shield className="h-3 w-3 mr-1" />
                                                                    VC
                                                                </Badge>
                                                            )}
                                                            {!isCaptain && !isViceCaptain && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs px-2 py-1 text-muted-foreground"
                                                                >
                                                                    Player
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Team Management Buttons */}
                                <div className="flex gap-2 pt-2">
                                    <Link to={`/team/${team._id}/manage`} className="flex-1">
                                        <Button className="w-full bg-primary hover:bg-primary/90" size="sm">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Manage Team
                                        </Button>
                                    </Link>
                                    <Link to={`/team/${team._id}/view`} className="flex-1">
                                        <Button variant="outline" className="w-full" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {teams.length === 0 && (
                    <Card className="text-center py-12">
                        <CardContent>
                            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Teams Yet</h3>
                            <p className="text-muted-foreground">Teams will appear here once they are created by the admin.</p>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}

export default TeamRosters;