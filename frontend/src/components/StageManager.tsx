import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { BASE_URL } from "@/config";

interface Stage {
    _id: string;
    name: string;
    description?: string;
    order: number;
}

interface StageManagerProps {
    stages: Stage[];
    getStages: () => void;
    getFixtures: any
}

export function StageManager({ stages, getStages, getFixtures }: StageManagerProps) {
    const [newStageName, setNewStageName] = useState("");
    const [newStageDescription, setNewStageDescription] = useState("");
    const [newStageOrder, setNewStageOrder] = useState(0);
    const [editingStage, setEditingStage] = useState<Stage | null>(null);
    const { toast } = useToast();

    const handleAddStage = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!newStageName.trim()) return;

            await axios.post(`${BASE_URL}/stages`, {
                name: newStageName,
                description: newStageDescription,
                order: newStageOrder
            });

            setNewStageName("");
            setNewStageDescription("");
            setNewStageOrder(0);
            getStages();
            getFixtures();
            toast({
                title: "Stage added",
                description: `${newStageName.trim()} has been added`,
            });
        } catch (error) {
            console.log(error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Something went wrong",
                variant: "destructive"
            });
        }
    };

    const handleUpdateStage = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!editingStage || !editingStage.name.trim()) return;

            await axios.put(`${BASE_URL}/stages/${editingStage._id}`, {
                name: editingStage.name,
                description: editingStage.description,
                order: editingStage.order
            });

            setEditingStage(null);
            getStages();
            getFixtures();
            toast({
                title: "Stage updated",
                description: `${editingStage.name} has been updated`,
            });
        } catch (error) {
            console.log(error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Something went wrong",
                variant: "destructive"
            });
        }
    };

    const handleRemoveStage = async (stageId: string, stageName: string) => {
        try {
            await axios.delete(`${BASE_URL}/stages/${stageId}`);

            getStages();
            getFixtures();
            toast({
                title: "Stage removed",
                description: `${stageName} has been removed`,
            });
        } catch (error) {
            console.log(error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Something went wrong",
                variant: "destructive"
            });
        }
    };

    return (
        <Card className="shadow-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    Stage Management
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add Stage Form */}
                <form onSubmit={handleAddStage} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                            placeholder="Stage name"
                            value={newStageName}
                            onChange={(e) => setNewStageName(e.target.value)}
                            required
                        />
                        <Input
                            placeholder="Description (optional)"
                            value={newStageDescription}
                            onChange={(e) => setNewStageDescription(e.target.value)}
                        />
                        <Input
                            type="number"
                            placeholder="Order"
                            value={newStageOrder}
                            onChange={(e) => setNewStageOrder(Number(e.target.value))}
                            min="0"
                        />
                    </div>
                    <Button type="submit" className="bg-secondary hover:bg-secondary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Stage
                    </Button>
                </form>

                {/* Edit Stage Form */}
                {editingStage && (
                    <Card className="bg-muted/50">
                        <CardContent className="pt-6 space-y-3">
                            <h4 className="font-medium">Edit Stage</h4>
                            <form onSubmit={handleUpdateStage} className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <Input
                                        placeholder="Stage name"
                                        value={editingStage.name}
                                        onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                                        required
                                    />
                                    <Input
                                        placeholder="Description"
                                        value={editingStage.description || ""}
                                        onChange={(e) => setEditingStage({ ...editingStage, description: e.target.value })}
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Order"
                                        value={editingStage.order}
                                        onChange={(e) => setEditingStage({ ...editingStage, order: Number(e.target.value) })}
                                        min="0"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" className="bg-primary hover:bg-primary/90">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Update Stage
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingStage(null)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Stages List */}
                <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">
                        Current Stages ({stages.length})
                    </h4>
                    <div className="space-y-2">
                        {stages.map((stage) => (
                            <div key={stage._id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{stage.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                            Order: {stage.order}
                                        </Badge>
                                    </div>
                                    {stage.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingStage(stage)}
                                    >
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRemoveStage(stage._id, stage.name)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {stages.length === 0 && (
                            <p className="text-muted-foreground italic text-center py-4">
                                No stages added yet. Add stages to organize your tournament.
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}