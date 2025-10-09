import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Calendar, FileText, Settings, Menu, X } from "lucide-react";
import { TeamManager } from "./TeamManager";
import { FixtureManager } from "./FixtureManager";
import { StageManager } from "./StageManager";
import { Header } from "./Header";
import axios from "axios";
import { BASE_URL } from "@/config";
import { PlayerManager } from "./PlayerManager";
import { TransactionLog } from "./TransactionLog";

interface AdminDashboardProps {
    onLogout: () => void;
}

type ActiveSection = 'teams' | 'fixtures' | 'stages' | 'players' | 'transactions';

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
    const [activeSection, setActiveSection] = useState<ActiveSection>('teams');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // State for data needed by components
    const [teams, setTeams] = useState<string[]>([]);
    const [fixtures, setFixtures] = useState<any[]>([]);
    const [stages, setStages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch initial data
    const fetchData = async () => {
        try {
            const [teamsRes, fixturesRes, stagesRes] = await Promise.all([
                axios.get(`${BASE_URL}/teams`),
                axios.get(`${BASE_URL}/fixtures`),
                axios.get(`${BASE_URL}/stages`)
            ]);

            // For TeamManager, we need team names array
            const teamNames = teamsRes.data.map((team: any) => team.name);
            setTeams(teamNames);
            setFixtures(fixturesRes.data);
            setStages(stagesRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Refetch functions to pass to components
    const getTeams = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/teams`);
            const teamNames = response.data.map((team: any) => team.name);
            setTeams(teamNames);
        } catch (error) {
            console.error("Error fetching teams:", error);
        }
    };

    const getFixtures = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/fixtures`);
            setFixtures(response.data);
        } catch (error) {
            console.error("Error fetching fixtures:", error);
        }
    };

    const getStages = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/stages`);
            setStages(response.data);
        } catch (error) {
            console.error("Error fetching stages:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const navigationItems = [
        { id: 'teams' as ActiveSection, label: 'Team Management', icon: Users, color: 'text-blue-600' },
        { id: 'players' as ActiveSection, label: 'Player Management', icon: Users, color: 'text-green-600' },
        { id: 'fixtures' as ActiveSection, label: 'Fixture Management', icon: Calendar, color: 'text-purple-600' },
        { id: 'stages' as ActiveSection, label: 'Stage Management', icon: Trophy, color: 'text-yellow-600' },
        { id: 'transactions' as ActiveSection, label: 'Transaction Log', icon: FileText, color: 'text-gray-600' },
    ];

    const renderActiveSection = () => {
        if (isLoading) {
            return (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center">Loading...</div>
                    </CardContent>
                </Card>
            );
        }

        switch (activeSection) {
            case 'teams':
                return <TeamManager />;
            case 'players':
                return <PlayerManager />;
            case 'fixtures':
                return <FixtureManager teams={teams} stages={stages} getFixtures={getFixtures} />;
            case 'stages':
                return <StageManager stages={stages} getStages={getStages} getFixtures={getFixtures} />;
            case 'transactions':
                return <TransactionLog />;
            default:
                return <TeamManager />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
            {/* Use Header Component */}
            <Header
                title="Indian Volleyball League"
                subtitle="Admin Management System"
                showAdminLogout={true}
                onLogout={onLogout}
            />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <div className={`
                        ${sidebarOpen ? 'block' : 'hidden'} 
                        md:block md:w-64 flex-shrink-0
                        fixed md:static inset-0 z-30 bg-white md:bg-transparent
                        border-r md:border-r-0 p-4 md:p-0
                    `}>
                        {sidebarOpen && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarOpen(false)}
                                className="absolute top-4 right-4 md:hidden"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                        <div className="space-y-2">
                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Button
                                        key={item.id}
                                        variant={activeSection === item.id ? "secondary" : "ghost"}
                                        className="w-full justify-start gap-3"
                                        onClick={() => {
                                            setActiveSection(item.id);
                                            setSidebarOpen(false);
                                        }}
                                    >
                                        <Icon className={`h-4 w-4 ${item.color}`} />
                                        {item.label}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* Quick Stats */}
                        <Card className="mt-8 hidden md:block">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span>Active Teams:</span>
                                    <Badge variant="outline">{teams.length}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Fixtures:</span>
                                    <Badge variant="outline">{fixtures.length}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span>Stages:</span>
                                    <Badge variant="outline">{stages.length}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        {renderActiveSection()}
                    </div>
                </div>
            </div>
        </div>
    );
}