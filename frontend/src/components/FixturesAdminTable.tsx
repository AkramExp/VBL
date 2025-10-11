import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Edit, Trophy, Trash2, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Fixture } from "./FixtureManager";
import axios from "axios";
import { BASE_URL } from "@/config";

interface FixturesTableProps {
    fixtures: Fixture[];
    getFixtures: any;
}

export function FixturesAdminTable({ fixtures, getFixtures }: FixturesTableProps) {
    const [editingFixture, setEditingFixture] = useState<Fixture | null>(null);
    const [winner, setWinner] = useState("");
    const [set1Team1, setSet1Team1] = useState("");
    const [set1Team2, setSet1Team2] = useState("");
    const [set2Team1, setSet2Team1] = useState("");
    const [set2Team2, setSet2Team2] = useState("");
    const [set3Team1, setSet3Team1] = useState("");
    const [set3Team2, setSet3Team2] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [selectedStages, setSelectedStages] = useState<string[]>([]);
    const [resultFilter, setResultFilter] = useState<string>("all");

    const { toast } = useToast();

    // Get unique teams and stages for filters
    const allTeams = Array.from(new Set(fixtures.flatMap(fixture => [fixture.team1.name, fixture.team2.name])));
    const allStages = Array.from(new Set(fixtures.map(fixture => fixture.stage?._id).filter(Boolean)));

    // Filter functions
    const toggleTeamSelection = (team: string) => {
        if (selectedTeams.includes(team)) {
            setSelectedTeams(selectedTeams.filter(t => t !== team));
        } else {
            setSelectedTeams([...selectedTeams, team]);
        }
    };

    const toggleStageSelection = (stageId: string) => {
        if (selectedStages.includes(stageId)) {
            setSelectedStages(selectedStages.filter(s => s !== stageId));
        } else {
            setSelectedStages([...selectedStages, stageId]);
        }
    };

    const clearAllFilters = () => {
        setSelectedTeams([]);
        setSelectedStages([]);
        setResultFilter("all");
    };

    // Apply filters
    const filteredFixtures = fixtures.filter(fixture => {
        // Filter by teams
        if (selectedTeams.length > 0) {
            const hasSelectedTeam = selectedTeams.includes(fixture.team1.name) || selectedTeams.includes(fixture.team2.name);
            if (!hasSelectedTeam) return false;
        }

        // Filter by stages
        if (selectedStages.length > 0) {
            if (!fixture.stage?._id || !selectedStages.includes(fixture.stage._id)) return false;
        }

        // Filter by result status
        if (resultFilter === "played" && !fixture.result) return false;
        if (resultFilter === "not-played" && fixture.result) return false;

        return true;
    });

    const handleEditResult = (fixture: Fixture) => {
        setEditingFixture(fixture);
        setWinner(fixture.result?.winner || "");
        setSet1Team1(fixture.result?.sets?.set1?.team1Score?.toString() || "");
        setSet1Team2(fixture.result?.sets?.set1?.team2Score?.toString() || "");
        setSet2Team1(fixture.result?.sets?.set2?.team1Score?.toString() || "");
        setSet2Team2(fixture.result?.sets?.set2?.team2Score?.toString() || "");
        setSet3Team1(fixture.result?.sets?.set3?.team1Score?.toString() || "");
        setSet3Team2(fixture.result?.sets?.set3?.team2Score?.toString() || "");
        setDialogOpen(true);
    };

    const handleSaveResult = async () => {
        if (!editingFixture || !winner) {
            toast({
                title: "Missing information",
                description: "Please select a winner",
                variant: "destructive",
            });
            return;
        }

        const sets: any = {};
        if (set1Team1 && set1Team2) {
            sets.set1 = { team1Score: parseInt(set1Team1), team2Score: parseInt(set1Team2) };
        }
        if (set2Team1 && set2Team2) {
            sets.set2 = { team1Score: parseInt(set2Team1), team2Score: parseInt(set2Team2) };
        }
        if (set3Team1 && set3Team2) {
            sets.set3 = { team1Score: parseInt(set3Team1), team2Score: parseInt(set3Team2) };
        }

        await axios.put(`${BASE_URL}/fixtures/${editingFixture._id}`, { result: { winner, sets } });

        getFixtures();
        setEditingFixture(null);
        setWinner("");
        setSet1Team1("");
        setSet1Team2("");
        setSet2Team1("");
        setSet2Team2("");
        setSet3Team1("");
        setSet3Team2("");
        setDialogOpen(false);

        toast({
            title: "Result updated",
            description: `Result for ${editingFixture.team1.name} vs ${editingFixture.team2.name} has been updated`,
        });
    };

    const handleDeleteFixture = async (fixtureId: string) => {
        await axios.delete(`${BASE_URL}/fixtures/${fixtureId}`);
        getFixtures();
        toast({
            title: "Fixture deleted",
            description: "The fixture has been deleted.",
            variant: "destructive",
        });
    };

    const formatScore = (fixture: Fixture) => {
        if (!fixture.result?.sets) return "-";

        const sets = [];
        if (fixture.result?.sets.set1) {
            sets.push(`${fixture.result?.sets.set1.team1Score}-${fixture.result?.sets.set1.team2Score}`);
        }
        if (fixture.result?.sets.set2) {
            sets.push(`${fixture.result?.sets.set2.team1Score}-${fixture.result?.sets.set2.team2Score}`);
        }
        if (fixture.result?.sets.set3) {
            sets.push(`${fixture.result?.sets.set3.team1Score}-${fixture.result?.sets.set3.team2Score}`);
        }

        return sets.length > 0 ? sets.join(", ") : "-";
    };

    const getResultBadge = (fixture: Fixture) => {
        if (!fixture.result) {
            return <Badge variant="outline">Not Played</Badge>;
        }

        return (
            <Badge className="bg-result-win text-white hover:bg-result-win/90">
                {fixture.result?.winner} Won
            </Badge>
        );
    };

    const fixturesByStage = filteredFixtures.reduce((acc, fixture) => {
        const stageName = fixture.stage?.name || 'Uncategorized';
        if (!acc[stageName]) {
            acc[stageName] = [];
        }
        acc[stageName].push(fixture);
        return acc;
    }, {} as Record<string, Fixture[]>);

    const hasActiveFilters = selectedTeams.length > 0 || selectedStages.length > 0 || resultFilter !== "all";

    if (fixtures.length === 0) {
        return (
            <Card className="shadow-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Fixtures & Results
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        No fixtures scheduled yet. Add some fixtures to get started!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-card">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Fixtures & Results ({filteredFixtures.length}/{fixtures.length})
                    </CardTitle>

                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 w-full sm:w-auto"
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                        {showFilters ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="ml-2">
                                {selectedTeams.length + selectedStages.length + (resultFilter !== "all" ? 1 : 0)}
                            </Badge>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Filters Panel */}
                {showFilters && (
                    <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Filter fixtures:</h3>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                                    <X className="h-4 w-4 mr-1" />
                                    Clear all
                                </Button>
                            )}
                        </div>

                        {/* Team Filter */}
                        <div className="mb-4">
                            <h4 className="font-medium text-sm mb-2">Teams:</h4>
                            <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                                {allTeams.map((team) => (
                                    <Badge
                                        key={team}
                                        variant={selectedTeams.includes(team) ? "default" : "outline"}
                                        className={`px-3 py-1 cursor-pointer transition-all flex-shrink-0 ${selectedTeams.includes(team)
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "hover:bg-muted"
                                            }`}
                                        onClick={() => toggleTeamSelection(team)}
                                    >
                                        {team}

                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Stage Filter */}
                        <div className="mb-2">
                            <h4 className="font-medium text-sm mb-2">Stages:</h4>
                            <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                                {fixtures
                                    .filter(fixture => fixture.stage)
                                    .reduce((uniqueStages, fixture) => {
                                        if (!uniqueStages.find(s => s._id === fixture.stage._id)) {
                                            uniqueStages.push(fixture.stage);
                                        }
                                        return uniqueStages;
                                    }, [] as any[])
                                    .map((stage) => (
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

                {/* Fixtures Table */}
                {Object.keys(fixturesByStage).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No fixtures match the current filters.</p>
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={clearAllFilters} className="mt-2">
                                Clear filters to see all fixtures
                            </Button>
                        )}
                    </div>
                ) : (
                    Object.entries(fixturesByStage).map(([stageName, stageFixtures]) => (
                        <div key={stageName} className="mb-8">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Badge variant="secondary" className="text-sm">
                                    {stageName}
                                </Badge>
                                <span className="text-muted-foreground text-sm">
                                    ({stageFixtures.length} fixture{stageFixtures.length !== 1 ? 's' : ''})
                                </span>
                            </h3>

                            <div className="rounded-md border overflow-x-auto mb-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="text-center">Teams</TableHead>
                                            <TableHead className="text-center">Result</TableHead>
                                            <TableHead className="text-center">Score</TableHead>
                                            <TableHead className="text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stageFixtures.map((fixture) => (
                                            <TableRow key={fixture._id} className="hover:bg-muted/30">
                                                <TableCell className="text-center">
                                                    <div className="font-medium">
                                                        {fixture.team1.name} <span className="text-muted-foreground">vs</span> {fixture.team2.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {getResultBadge(fixture)}
                                                </TableCell>
                                                <TableCell className="font-mono text-center">
                                                    {formatScore(fixture)}
                                                </TableCell>
                                                <TableCell className="text-center flex gap-2 justify-center">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { handleEditResult(fixture) }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteFixture(fixture._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ))
                )}

                {/* Edit Result Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Match Result</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <h3 className="font-semibold text-lg">
                                    {editingFixture?.team1.name} vs {editingFixture?.team2.name}
                                </h3>
                            </div>
                            <div className="space-y-2">
                                <Label>Winner</Label>
                                <Select value={winner} onValueChange={setWinner}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select winner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {editingFixture?.team1 && (
                                            <SelectItem value={editingFixture.team1.name}>
                                                {editingFixture.team1.name}
                                            </SelectItem>
                                        )}
                                        {editingFixture?.team2 && (
                                            <SelectItem value={editingFixture.team2.name}>
                                                {editingFixture.team2.name}
                                            </SelectItem>
                                        )}
                                        <SelectItem value="Draw">Draw</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-4">
                                <Label>Sets Scores</Label>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-2 items-center">
                                        <Label className="text-sm">Set 1:</Label>
                                        <Input
                                            type="number"
                                            placeholder={editingFixture?.team1.name}
                                            value={set1Team1}
                                            onChange={(e) => setSet1Team1(e.target.value)}
                                            className="text-center"
                                        />
                                        <Input
                                            type="number"
                                            placeholder={editingFixture?.team2.name}
                                            value={set1Team2}
                                            onChange={(e) => setSet1Team2(e.target.value)}
                                            className="text-center"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 items-center">
                                        <Label className="text-sm">Set 2:</Label>
                                        <Input
                                            type="number"
                                            placeholder={editingFixture?.team1.name}
                                            value={set2Team1}
                                            onChange={(e) => setSet2Team1(e.target.value)}
                                            className="text-center"
                                        />
                                        <Input
                                            type="number"
                                            placeholder={editingFixture?.team2.name}
                                            value={set2Team2}
                                            onChange={(e) => setSet2Team2(e.target.value)}
                                            className="text-center"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 items-center">
                                        <Label className="text-sm">Set 3:</Label>
                                        <Input
                                            type="number"
                                            placeholder={editingFixture?.team1.name}
                                            value={set3Team1}
                                            onChange={(e) => setSet3Team1(e.target.value)}
                                            className="text-center"
                                        />
                                        <Input
                                            type="number"
                                            placeholder={editingFixture?.team2.name}
                                            value={set3Team2}
                                            onChange={(e) => setSet3Team2(e.target.value)}
                                            className="text-center"
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={handleSaveResult}
                                className="w-full bg-secondary hover:bg-secondary/90"
                            >
                                Save Result
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}