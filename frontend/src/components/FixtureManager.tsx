import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { BASE_URL } from "@/config";

export interface Fixture {
  _id: string;
  stage: any;
  team1: any;
  team2: any;
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

interface FixtureManagerProps {
  teams: string[];
  stages: Stage[];
  getFixtures: () => void;
}

export function FixtureManager({ teams, stages, getFixtures }: FixtureManagerProps) {
  const [selectedStage, setSelectedStage] = useState("");
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const { toast } = useToast();

  const handleAddFixture = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStage || !team1 || !team2) {
      toast({
        title: "Missing information",
        description: "Please select a stage and both teams",
        variant: "destructive",
      });
      return;
    }

    if (team1 === team2) {
      toast({
        title: "Invalid fixture",
        description: "A team cannot play against itself",
        variant: "destructive",
      });
      return;
    }

    await axios.post(`${BASE_URL}/fixtures`, {
      stageId: selectedStage,
      team1,
      team2
    });

    getFixtures();
    setSelectedStage("");
    setTeam1("");
    setTeam2("");

    toast({
      title: "Fixture added",
      description: `${team1} vs ${team2} has been scheduled`,
    });
  };

  if (teams.length < 2 || stages.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            Add Fixture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {teams.length < 2 ? "Add at least 2 teams" : "Add at least 1 stage"} before creating fixtures
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          Add Fixture
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddFixture} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage._id} value={stage._id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="team1">Team 1</Label>
              <Select value={team1} onValueChange={setTeam1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team 1" />
                </SelectTrigger>
                <SelectContent>
                  {teams.filter(team => team.trim() !== "").map((team) => (
                    <SelectItem key={team} value={team} disabled={team === team2}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team2">Team 2</Label>
              <Select value={team2} onValueChange={setTeam2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team 2" />
                </SelectTrigger>
                <SelectContent>
                  {teams.filter(team => team.trim() !== "").map((team) => (
                    <SelectItem key={team} value={team} disabled={team === team1}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={!selectedStage}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Fixture
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}