import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Edit, Trophy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Fixture } from "./FixtureManager";
import axios from "axios";
import { BASE_URL } from "@/config";

interface FixturesTableProps {
  fixtures: Fixture[];
  getFixtures: any
}

export function FixturesTable({ fixtures, getFixtures }: FixturesTableProps) {
  const [editingFixture, setEditingFixture] = useState<Fixture | null>(null);
  const [winner, setWinner] = useState("");
  const [set1Team1, setSet1Team1] = useState("");
  const [set1Team2, setSet1Team2] = useState("");
  const [set2Team1, setSet2Team1] = useState("");
  const [set2Team2, setSet2Team2] = useState("");
  const [set3Team1, setSet3Team1] = useState("");
  const [set3Team2, setSet3Team2] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false); // Added for dialog control
  const { toast } = useToast();

  const handleEditResult = (fixture: Fixture) => {
    setEditingFixture(fixture);
    setWinner(fixture.result?.winner || "");
    setSet1Team1(fixture.result?.sets?.set1?.team1Score?.toString() || "");
    setSet1Team2(fixture.result?.sets?.set1?.team2Score?.toString() || "");
    setSet2Team1(fixture.result?.sets?.set2?.team1Score?.toString() || "");
    setSet2Team2(fixture.result?.sets?.set2?.team2Score?.toString() || "");
    setSet3Team1(fixture.result?.sets?.set3?.team1Score?.toString() || "");
    setSet3Team2(fixture.result?.sets?.set3?.team2Score?.toString() || "");
    setDialogOpen(true); // Open dialog
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
    setDialogOpen(false); // Close dialog

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
      <Badge
        className="bg-result-win text-white hover:bg-result-win/90"
      >
        {fixture.result?.winner} Won
      </Badge>
    );
  };

  const fixturesByStage = fixtures.reduce((acc, fixture) => {
    const stageName = fixture.stage?.name || 'Uncategorized';
    if (!acc[stageName]) {
      acc[stageName] = [];
    }
    acc[stageName].push(fixture);
    return acc;
  }, {} as Record<string, Fixture[]>);

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
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Fixtures & Results ({fixtures.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.entries(fixturesByStage).map(([stageName, stageFixtures]) => (
          <div key={stageName} className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {stageName}
              </Badge>
              <span className="text-muted-foreground text-sm">
                ({stageFixtures.length} fixtures)
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
        ))}

        {/* Dialog remains the same */}
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