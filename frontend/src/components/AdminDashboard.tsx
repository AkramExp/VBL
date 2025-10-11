import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Calendar, FileText, Settings, Menu, X, BarChart3 } from "lucide-react";
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
    const [isMobile, setIsMobile] = useState(false);

    // State for data needed by components
    const [teams, setTeams] = useState<string[]>([]);
    const [fixtures, setFixtures] = useState<any[]>([]);
    const [stages, setStages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Check mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
        { id: 'teams' as ActiveSection, label: 'Teams', icon: Users, color: 'text-blue-600', fullLabel: 'Team Management' },
        { id: 'players' as ActiveSection, label: 'Players', icon: Users, color: 'text-green-600', fullLabel: 'Player Management' },
        { id: 'fixtures' as ActiveSection, label: 'Fixtures', icon: Calendar, color: 'text-purple-600', fullLabel: 'Fixture Management' },
        { id: 'stages' as ActiveSection, label: 'Stages', icon: Trophy, color: 'text-yellow-600', fullLabel: 'Stage Management' },
        { id: 'transactions' as ActiveSection, label: 'Transactions', icon: FileText, color: 'text-gray-600', fullLabel: 'Transaction Log' },
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
                return <FixtureManager teams={teams} stages={stages} getFixtures={getFixtures} fixtures={fixtures} />;
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

            {/* Mobile Header Bar */}
            <div className="md:hidden bg-background border-b shadow-sm">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-muted-foreground">
                                {navigationItems.find(item => item.id === activeSection)?.fullLabel}
                            </span>
                        </div>
                    </div>

                    {/* Mobile Quick Stats */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{teams.length}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{fixtures.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 md:py-8">
                <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                    {/* Sidebar Overlay */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    {/* Sidebar */}
                    <div className={`
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                        md:translate-x-0 transition-transform duration-300 ease-in-out
                        md:w-64 flex-shrink-0
                        fixed md:static inset-y-0 left-0 z-50 bg-background md:bg-transparent
                        border-r md:border-r-0 p-4 md:p-0 w-72 md:z-0 
                        overflow-y-auto
                    `}>
                        <div className="flex items-center justify-between mb-6 md:hidden">
                            <h2 className="text-lg font-semibold">Navigation</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarOpen(false)}
                                className="p-2"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="space-y-1">
                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeSection === item.id;
                                return (
                                    <Button
                                        key={item.id}
                                        variant={isActive ? "secondary" : "ghost"}
                                        className="w-full justify-start gap-3 h-11"
                                        onClick={() => {
                                            setActiveSection(item.id);
                                            setSidebarOpen(false);
                                        }}
                                    >
                                        <Icon className={`h-4 w-4 ${item.color} ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                                        <span className="text-sm">{item.label}</span>
                                        {isActive && (
                                            <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                                        )}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* Quick Stats */}
                        <Card className="mt-6 md:mt-8">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    Quick Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-3 w-3 text-blue-600" />
                                        <span>Active Teams</span>
                                    </div>
                                    <Badge variant="outline" className="font-mono">
                                        {teams.length}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-3 w-3 text-purple-600" />
                                        <span>Total Fixtures</span>
                                    </div>
                                    <Badge variant="outline" className="font-mono">
                                        {fixtures.length}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Trophy className="h-3 w-3 text-yellow-600" />
                                        <span>Stages</span>
                                    </div>
                                    <Badge variant="outline" className="font-mono">
                                        {stages.length}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Mobile Logout Button */}
                        <div className="mt-6 md:hidden">
                            <Button
                                variant="outline"
                                className="w-full justify-center"
                                onClick={onLogout}
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        {/* Desktop Section Title */}
                        <div className="hidden md:block mb-6">
                            <h1 className="text-2xl font-bold text-foreground">
                                {navigationItems.find(item => item.id === activeSection)?.fullLabel}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Manage your {activeSection} and view related statistics
                            </p>
                        </div>

                        {/* Content */}
                        <div className="bg-transparent rounded-lg">
                            {renderActiveSection()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Bar
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-40">
                <div className="flex justify-around p-2">
                    {navigationItems.slice(0, 3).map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`flex flex-col items-center p-2 rounded-lg min-w-[60px] transition-colors ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${item.color} ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                                <span className="text-xs mt-1 font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="flex flex-col items-center p-2 rounded-lg min-w-[60px] text-muted-foreground"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="text-xs mt-1 font-medium">More</span>
                    </button>
                </div>
            </div> */}
        </div>
    );
}