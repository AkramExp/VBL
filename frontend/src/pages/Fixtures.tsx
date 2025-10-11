import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Filter, X, ChevronDown, ChevronUp, Smartphone, ChevronRight, Search } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/config";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";

interface Fixture {
    _id: string;
    team1: any;
    team2: any;
    stage?: any;
    result?: {
        winner: string;
        sets: {
            set1?: { team1Score: number; team2Score: number };
            set2?: { team1Score: number; team2Score: number };
            set3?: { team1Score: number; team2Score: number };
        };
    };
}

interface Stage {
    _id: string;
    name: string;
    description?: string;
    order: number;
}

export function Fixtures() {
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [teams, setTeams] = useState<string[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [selectedStages, setSelectedStages] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState(""); // New search state
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        'upcoming': true,
        'results': true
    });
    const [expandedStages, setExpandedStages] = useState<{ [key: string]: boolean }>({});

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

    const getStages = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/stages`);
            setStages(response.data);
        } catch (error) {
            console.error("Error fetching stages:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getFixtures();
        getTeams();
        getStages();

        // Check if mobile on mount and on resize
        const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);

        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const toggleTeamSelection = (team: any) => {
        if (selectedTeams.includes(team.name)) {
            setSelectedTeams(selectedTeams.filter(t => t !== team.name));
        } else {
            setSelectedTeams([...selectedTeams, team.name]);
        }
    };

    const toggleStageSelection = (stageId: string) => {
        if (selectedStages.includes(stageId)) {
            setSelectedStages(selectedStages.filter(s => s !== stageId));
        } else {
            setSelectedStages([...selectedStages, stageId]);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const toggleStage = (stageName: string) => {
        setExpandedStages(prev => ({
            ...prev,
            [stageName]: !prev[stageName]
        }));
    };

    const formatScoreMobile = (fixture: Fixture) => {
        if (!fixture.result?.sets) return "-";

        const sets = [];
        if (fixture.result?.sets.set1) {
            sets.push(`${fixture.result.sets.set1.team1Score}-${fixture.result.sets.set1.team2Score}`);
        }
        if (fixture.result?.sets.set2) {
            sets.push(`${fixture.result.sets.set2.team1Score}-${fixture.result.sets.set2.team2Score}`);
        }
        if (fixture.result?.sets.set3) {
            sets.push(`${fixture.result.sets.set3.team1Score}-${fixture.result.sets.set3.team2Score}`);
        }

        return sets.length > 0 ? sets.join(", ") : "-";
    };

    const formatScoreDesktop = (fixture: Fixture) => {
        if (!fixture.result?.sets) return "-";

        const sets = [];
        if (fixture.result?.sets.set1) {
            const set1 = fixture.result.sets.set1;
            const set1Winner = set1.team1Score > set1.team2Score ? fixture.team1.name : fixture.team2.name;
            sets.push(`Set 1: ${set1.team1Score}-${set1.team2Score} (${set1Winner})`);
        }
        if (fixture.result?.sets.set2) {
            const set2 = fixture.result.sets.set2;
            const set2Winner = set2.team1Score > set2.team2Score ? fixture.team1.name : fixture.team2.name;
            sets.push(`Set 2: ${set2.team1Score}-${set2.team2Score} (${set2Winner})`);
        }
        if (fixture.result?.sets.set3) {
            const set3 = fixture.result.sets.set3;
            const set3Winner = set3.team1Score > set3.team2Score ? fixture.team1.name : fixture.team2.name;
            sets.push(`Set 3: ${set3.team1Score}-${set3.team2Score} (${set3Winner})`);
        }

        return sets.length > 0 ? (
            <div className="space-y-1">
                {sets.map((set, index) => (
                    <div key={index} className="text-sm">{set}</div>
                ))}
            </div>
        ) : "-";
    };

    const getResultBadge = (fixture: Fixture) => {
        if (!fixture.result) {
            return <Badge variant="outline">Scheduled</Badge>;
        }

        if (fixture.result.winner === "Draw") {
            return <Badge className="bg-yellow-500 text-white hover:bg-yellow-500/90">Draw</Badge>;
        }

        const isWinnerTeam1 = fixture.result.winner === fixture.team1.name;

        return (
            <Badge className={`${isWinnerTeam1 ? 'bg-green-600' : 'bg-blue-600'} text-white hover:opacity-90`}>
                {fixture.result.winner} Won
            </Badge>
        );
    };

    const filterFixturesByTeamsAndStages = (fixtures: Fixture[]) => {
        let filteredFixtures = fixtures;

        // Filter by teams
        if (selectedTeams.length > 0) {
            filteredFixtures = filteredFixtures.filter(fixture =>
                selectedTeams.includes(fixture.team1.name) ||
                selectedTeams.includes(fixture.team2.name)
            );
        }

        // Filter by stages
        if (selectedStages.length > 0) {
            filteredFixtures = filteredFixtures.filter(fixture =>
                selectedStages.includes(fixture.stage?._id)
            );
        }

        // Filter by search query
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase().trim();
            filteredFixtures = filteredFixtures.filter(fixture =>
                fixture.team1.name.toLowerCase().includes(query) ||
                fixture.team2.name.toLowerCase().includes(query) ||
                fixture.stage?.name.toLowerCase().includes(query)
            );
        }

        return filteredFixtures;
    };

    // Clear all filters
    const clearAllFilters = () => {
        setSelectedTeams([]);
        setSelectedStages([]);
        setSearchQuery("");
    };

    // Group fixtures by stage
    const fixturesByStage = filterFixturesByTeamsAndStages(fixtures).reduce((acc, fixture) => {
        const stageName = fixture.stage?.name || 'Uncategorized';
        if (!acc[stageName]) {
            acc[stageName] = [];
        }
        acc[stageName].push(fixture);
        return acc;
    }, {} as Record<string, Fixture[]>);

    const getUpcomingFixtures = () => {
        return Object.values(fixturesByStage).flat().filter(fixture => !fixture.result);
    };

    const getCompletedFixtures = () => {
        return Object.values(fixturesByStage).flat().filter(fixture => fixture.result);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white font-bold">🏐</span>
                    </div>
                    <p className="text-muted-foreground">Loading fixtures...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[110vh] bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
            {/* Header */}
            <Header
                title="Indian Volleyball League"
                subtitle="Fixtures & Results"
            />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filter Section */}
                <div className="mb-6 space-y-4">
                    {/* Filter Toggle and Clear Filters */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                            {showFilters ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                            {(selectedTeams.length > 0 || selectedStages.length > 0 || searchQuery) && (
                                <Badge variant="secondary" className="ml-2">
                                    {selectedTeams.length + selectedStages.length + (searchQuery ? 1 : 0)}
                                </Badge>
                            )}
                        </Button>

                        {(selectedTeams.length > 0 || selectedStages.length > 0 || searchQuery) && (
                            <Button
                                variant="ghost"
                                onClick={clearAllFilters}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Clear all
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Filter by:</h3>
                        </div>

                        {/* Team Filter */}
                        <div className="mb-4">
                            <h4 className="font-medium text-sm mb-2">Teams:</h4>
                            <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                                {teams.map((team: any) => (
                                    <Badge
                                        key={team.name}
                                        variant={selectedTeams.includes(team.name) ? "default" : "outline"}
                                        className={`px-3 py-1 cursor-pointer transition-all flex-shrink-0 ${selectedTeams.includes(team.name)
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "hover:bg-muted"
                                            }`}
                                        onClick={() => toggleTeamSelection(team)}
                                    >
                                        {team.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Stage Filter */}
                        <div>
                            <h4 className="font-medium text-sm mb-2">Stages:</h4>
                            <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                                {stages.map((stage) => (
                                    <Badge
                                        key={stage._id}
                                        variant={selectedStages.includes(stage._id) ? "default" : "outline"}
                                        className={`px-3 py-1 cursor-pointer transition-all flex-shrink-0 ${selectedStages.includes(stage._id)
                                            ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                            : "hover:bg-muted"
                                            }`}
                                        onClick={() => toggleStageSelection(stage._id)}
                                    >
                                        {stage.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Upcoming Fixtures Section */}
                    {getUpcomingFixtures().length > 0 && (
                        <section>
                            <Card className="shadow-card">
                                <CardHeader className="cursor-pointer" onClick={() => toggleSection('upcoming')}>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                            <Trophy className="h-5 w-5" />
                                            Upcoming Matches ({getUpcomingFixtures().length})
                                        </CardTitle>
                                        <Button variant="ghost" size="sm">
                                            {expandedSections.upcoming ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </CardHeader>
                                {expandedSections.upcoming && (
                                    <CardContent>
                                        {Object.entries(fixturesByStage).map(([stageName, stageFixtures]) => {
                                            const upcomingStageFixtures = stageFixtures.filter(fixture => !fixture.result);

                                            if (upcomingStageFixtures.length === 0) return null;

                                            const isStageExpanded = expandedStages[`upcoming-${stageName}`] ?? true;

                                            return (
                                                <div key={stageName} className="mb-6">
                                                    <div
                                                        className="flex items-center justify-between mb-4 cursor-pointer"
                                                        onClick={() => toggleStage(`upcoming-${stageName}`)}
                                                    >
                                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                                            <Badge variant="secondary" className="text-sm">
                                                                {stageName}
                                                            </Badge>
                                                            <span className="text-muted-foreground text-sm">
                                                                ({upcomingStageFixtures.length} matches)
                                                            </span>
                                                        </h3>
                                                        <Button variant="ghost" size="sm">
                                                            {isStageExpanded ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>

                                                    {isStageExpanded && (
                                                        <div className="rounded-md border overflow-x-auto">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="bg-muted/50">
                                                                        <TableHead className="text-center">Match</TableHead>
                                                                        <TableHead className="text-center">Status</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {upcomingStageFixtures.map((fixture) => (
                                                                        <TableRow key={fixture._id} className="hover:bg-muted/30">
                                                                            <TableCell className="text-center">
                                                                                <div className="font-medium">
                                                                                    {fixture.team1.name} <span className="text-muted-foreground">vs</span> {fixture.team2.name}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                {getResultBadge(fixture)}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                )}
                            </Card>
                        </section>
                    )}

                    {/* Completed Fixtures Section */}
                    {getCompletedFixtures().length > 0 && (
                        <section>
                            <Card className="shadow-card">
                                <CardHeader className="cursor-pointer" onClick={() => toggleSection('results')}>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                            <Trophy className="h-5 w-5" />
                                            Match Results ({getCompletedFixtures().length})
                                        </CardTitle>
                                        <Button variant="ghost" size="sm">
                                            {expandedSections.results ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </CardHeader>
                                {expandedSections.results && (
                                    <CardContent>
                                        {Object.entries(fixturesByStage).map(([stageName, stageFixtures]) => {
                                            const completedStageFixtures = stageFixtures.filter(fixture => fixture.result);

                                            if (completedStageFixtures.length === 0) return null;

                                            const isStageExpanded = expandedStages[`results-${stageName}`] ?? true;

                                            return (
                                                <div key={stageName} className="mb-6">
                                                    <div
                                                        className="flex items-center justify-between mb-4 cursor-pointer"
                                                        onClick={() => { toggleStage(`results-${stageName}`) }}
                                                    >
                                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                                            <Badge variant="secondary" className="text-sm">
                                                                {stageName}
                                                            </Badge>
                                                            <span className="text-muted-foreground text-sm">
                                                                ({completedStageFixtures.length} matches)
                                                            </span>
                                                        </h3>
                                                        <Button variant="ghost" size="sm" >
                                                            {isStageExpanded ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>

                                                    {isStageExpanded && (
                                                        isMobile ? (
                                                            // Mobile View - Card Layout
                                                            <div className="space-y-3">
                                                                {completedStageFixtures.map((fixture) => (
                                                                    <div key={fixture._id} className="border rounded-lg p-4 bg-card">
                                                                        <div className="flex justify-between items-start mb-3">
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-center mb-2">
                                                                                    {fixture.team1.name} <span className="text-muted-foreground">vs</span> {fixture.team2.name}
                                                                                </div>
                                                                                <div className="flex justify-center mb-2">
                                                                                    {getResultBadge(fixture)}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="grid grid-cols-3 gap-2 text-center">
                                                                            {fixture.result?.sets.set1 && (
                                                                                <div className="bg-muted p-2 rounded">
                                                                                    <div className="text-xs text-muted-foreground">Set 1</div>
                                                                                    <div className="font-mono text-sm">
                                                                                        {fixture.result.sets.set1.team1Score}-{fixture.result.sets.set1.team2Score}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {fixture.result?.sets.set2 && (
                                                                                <div className="bg-muted p-2 rounded">
                                                                                    <div className="text-xs text-muted-foreground">Set 2</div>
                                                                                    <div className="font-mono text-sm">
                                                                                        {fixture.result.sets.set2.team1Score}-{fixture.result.sets.set2.team2Score}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {fixture.result?.sets.set3 && (
                                                                                <div className="bg-muted p-2 rounded">
                                                                                    <div className="text-xs text-muted-foreground">Set 3</div>
                                                                                    <div className="font-mono text-sm">
                                                                                        {fixture.result.sets.set3.team1Score}-{fixture.result.sets.set3.team2Score}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {fixture.result?.winner && (
                                                                            <div className="mt-3 text-center">
                                                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                                    Winner: {fixture.result.winner}
                                                                                </Badge>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            // Desktop View - Table Layout
                                                            <div className="rounded-md border overflow-x-auto">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow className="bg-muted/50">
                                                                            <TableHead className="text-center">Match</TableHead>
                                                                            <TableHead className="text-center">Result</TableHead>
                                                                            <TableHead className="text-center">Score (Set Winners)</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {completedStageFixtures.map((fixture) => (
                                                                            <TableRow key={fixture._id} className="hover:bg-muted/30">
                                                                                <TableCell className="text-center">
                                                                                    <div className="font-medium">
                                                                                        {fixture.team1.name} <span className="text-muted-foreground">vs</span> {fixture.team2.name}
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-center">
                                                                                    {getResultBadge(fixture)}
                                                                                </TableCell>
                                                                                <TableCell className="text-center">
                                                                                    {formatScoreDesktop(fixture)}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                )}
                            </Card>
                        </section>
                    )}

                    {/* Empty states */}
                    {fixtures.length === 0 ? (
                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5" />
                                    Fixtures & Results
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-center py-8">
                                    No fixtures scheduled yet. Check back later for updates!
                                </p>
                            </CardContent>
                        </Card>
                    ) : getUpcomingFixtures().length === 0 && getCompletedFixtures().length === 0 ? (
                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5" />
                                    No Matches Found
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-center py-8">
                                    No matches found for the selected filters. Try different filters.
                                </p>
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            </main>
        </div>
    );
}

export default Fixtures;