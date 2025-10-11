import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BASE_URL } from "@/config";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { AlertCircle, CheckCircle, Clock, X as CloseIcon, Crown, Edit, Eye, Key, Plus, Save, Search, Shield, UserPlus, Users, X, Lock, Loader, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Member {
  _id: string;
  discordId: string;
  discordName: string;
}

interface Player {
  _id: string;
  discordId: string;
  discordName: string;
  member: Member;
  status: 'available' | 'signed' | 'cooldown';
  cooldownEnds?: string;
  currentTeam?: string;
  // Add new fields for our system
  name?: string;
  discordUsername?: string;
  robloxUsername?: string;
  position?: string;
  jerseyNumber?: number;
  releaseDate?: string;
  signDate?: string;
  isActive?: boolean;
}

interface Team {
  _id: string;
  name: string;
  password: string;
  captain: Player;
  viceCaptain: Player;
  players: Player[];
  isActive: boolean;
}

// Interface for selected player with both ID and Discord ID
interface SelectedPlayer {
  playerId: string;
  discordId: string;
  discordName: string;
}

// Confirmation Dialog Props
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

// Confirmation Dialog Component
function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = 'default',
  disabled = false
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
            disabled={disabled}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={disabled}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TeamManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingCaptain, setEditingCaptain] = useState<string>("");
  const [editingViceCaptain, setEditingViceCaptain] = useState<string>("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTeam, setPasswordTeam] = useState<Team | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isAction, setIsAction] = useState(false);
  const [showLeadershipConfirmation, setShowLeadershipConfirmation] = useState(false);
  const [pendingLeadershipTeam, setPendingLeadershipTeam] = useState<Team | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const [newTeam, setNewTeam] = useState({
    name: "",
    password: "",
    selectedPlayers: [] as SelectedPlayer[], // Store both playerId and discordId
    captainId: "",
    viceCaptainId: ""
  });

  const MIN_PLAYERS = 6;
  const MAX_PLAYERS = 12;

  const fetchData = async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([
        axios.get(`${BASE_URL}/teams`),
        axios.get(`${BASE_URL}/players`)
      ]);

      setTeams(teamsRes.data);
      setPlayers(playersRes.data);
    } catch (error) {
      console.log("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/members`);
      setMembers(response.data);
    } catch (error) {
      console.log("Error fetching members:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredMembers = members.filter(member =>
    member?.discordName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.discordId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const membersWithoutPlayers = filteredMembers.filter(member =>
    !players.some(player => player.member?._id === member._id)
  );

  const availablePlayers = players.filter(player => {
    const isOnCooldown = player.releaseDate &&
      (Date.now() - new Date(player.releaseDate).getTime() < 3 * 24 * 60 * 60 * 1000);

    const isInTeam = player.currentTeam || player.status === 'signed';

    return !isOnCooldown && !isInTeam && player.isActive !== false;
  });

  const isPlayerInCooldown = (player: Player): boolean => {
    if (player.status === 'cooldown' && player.cooldownEnds) {
      const cooldownEnds = new Date(player.cooldownEnds);
      const now = new Date();
      return cooldownEnds > now;
    }
    return false;
  };

  const getAvailableLeadershipPlayers = (teamPlayers: Player[]): Player[] => {
    return teamPlayers.filter(player => !isPlayerInCooldown(player));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewTeam(prev => ({ ...prev, password }));
  };

  const generateNewPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
  };

  const createPlayerFromMember = async (memberId: string) => {
    try {
      const member = members.find(m => m._id === memberId);
      if (!member) {
        throw new Error("Member not found");
      }

      const response = await axios.post(`${BASE_URL}/players`, {
        memberId
      });

      toast({
        title: "Success",
        description: "Player created successfully"
      });

      const playersRes = await axios.get(`${BASE_URL}/players`);
      setPlayers(playersRes.data);
      return {
        playerId: response.data.player._id,
        discordId: member.discordId,
        discordName: member?.discordName
      };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create player",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleAddMemberToTeam = async (member: Member) => {
    if (newTeam.selectedPlayers.length >= MAX_PLAYERS) {
      toast({
        title: "Maximum players reached",
        description: `A team can have maximum ${MAX_PLAYERS} players`,
        variant: "destructive"
      });
      return;
    }

    let playerData: SelectedPlayer | null = null;

    const existingPlayer = players.find(p => p.member?._id === member._id);
    if (existingPlayer) {
      playerData = {
        playerId: existingPlayer._id,
        discordId: member.discordId,
        discordName: member?.discordName
      };
    } else {
      playerData = await createPlayerFromMember(member._id);
      if (!playerData) return; // Failed to create player
    }

    if (!newTeam.selectedPlayers.some(sp => sp.playerId === playerData!.playerId)) {
      setNewTeam(prev => ({
        ...prev,
        selectedPlayers: [...prev.selectedPlayers, playerData!]
      }));
    }

    setShowMemberSelection(false);
    setSearchTerm("");
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    setIsCreating(true);
    e.preventDefault();

    if (newTeam.selectedPlayers.length < MIN_PLAYERS) {
      toast({
        title: "Not enough players",
        description: `Team must have at least ${MIN_PLAYERS} players`,
        variant: "destructive"
      });
      return;
    }

    if (newTeam.selectedPlayers.length > MAX_PLAYERS) {
      toast({
        title: "Too many players",
        description: `Team cannot have more than ${MAX_PLAYERS} players`,
        variant: "destructive"
      });
      return;
    }

    if (!newTeam.captainId || !newTeam.viceCaptainId) {
      toast({
        title: "Error",
        description: "Please select captain and vice-captain",
        variant: "destructive"
      });
      return;
    }

    // Check if selected captain or vice-captain are in cooldown
    const captainPlayer = players.find(p => p._id === newTeam.captainId);
    const viceCaptainPlayer = players.find(p => p._id === newTeam.viceCaptainId);

    if (captainPlayer && isPlayerInCooldown(captainPlayer)) {
      toast({
        title: "Invalid Captain Selection",
        description: "Cannot select a player in cooldown as captain",
        variant: "destructive"
      });
      return;
    }

    if (viceCaptainPlayer && isPlayerInCooldown(viceCaptainPlayer)) {
      toast({
        title: "Invalid Vice Captain Selection",
        description: "Cannot select a player in cooldown as vice captain",
        variant: "destructive"
      });
      return;
    }

    try {
      const promiseArr = newTeam.selectedPlayers.map(player => axios.post("https://testing-bot-rt1b.onrender.com/assign-player-role", { action: "add", discordId: player.discordId }));
      await Promise.all(promiseArr);

      const captainDiscordId = newTeam.selectedPlayers.find(player => player.playerId === newTeam.captainId).discordId;
      const viceCaptainDiscordId = newTeam.selectedPlayers.find(player => player.playerId === newTeam.viceCaptainId).discordId;

      axios.post("https://testing-bot-rt1b.onrender.com/assign-captain-role", { action: "add", discordId: captainDiscordId });

      axios.post("https://testing-bot-rt1b.onrender.com/assign-vice-captain-role", { action: "add", discordId: viceCaptainDiscordId });


      const discordIds = newTeam.selectedPlayers.map(sp => sp.discordId);
      const uniqueDiscordIds = new Set(discordIds);
      if (discordIds.length !== uniqueDiscordIds.size) {
        toast({
          title: "Duplicate Discord IDs",
          description: "Some players have the same Discord ID",
          variant: "destructive"
        });
        return;
      }

      const playerIds = newTeam.selectedPlayers.map(sp => sp.playerId);

      await axios.post(`${BASE_URL}/teams`, {
        name: newTeam.name,
        password: newTeam.password,
        playerIds: playerIds,
        captainId: newTeam.captainId,
        viceCaptainId: newTeam.viceCaptainId
      });

      toast({
        title: "Success",
        description: `Team ${newTeam.name} created successfully`
      });

      setNewTeam({
        name: "",
        password: "",
        selectedPlayers: [],
        captainId: "",
        viceCaptainId: ""
      });
      fetchData();
    } catch (error: any) {
      console.log(error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create team",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const togglePlayerSelection = (playerId: string) => {
    setNewTeam(prev => {
      if (!prev.selectedPlayers.some(sp => sp.playerId === playerId) && prev.selectedPlayers.length >= MAX_PLAYERS) {
        toast({
          title: "Maximum players reached",
          description: `A team can have maximum ${MAX_PLAYERS} players`,
          variant: "destructive"
        });
        return prev;
      }

      const selectedPlayers = prev.selectedPlayers.some(sp => sp.playerId === playerId)
        ? prev.selectedPlayers.filter(sp => sp.playerId !== playerId)
        : [...prev.selectedPlayers, {
          playerId,
          discordId: players.find(p => p._id === playerId)?.discordId || "unknown",
          discordName: players.find(p => p._id === playerId)?.discordName || "Unknown Player"
        }];

      return { ...prev, selectedPlayers };
    });
  };

  const removePlayerFromSelection = (playerId: string) => {
    setNewTeam(prev => ({
      ...prev,
      selectedPlayers: prev.selectedPlayers.filter(sp => sp.playerId !== playerId),
      captainId: prev.captainId === playerId ? "" : prev.captainId,
      viceCaptainId: prev.viceCaptainId === playerId ? "" : prev.viceCaptainId
    }));
  };

  const startEditingTeam = (team: Team) => {
    setEditingTeam(team._id);

    const availablePlayers = getAvailableLeadershipPlayers(team.players);

    if (team.captain && !isPlayerInCooldown(team.captain)) {
      setEditingCaptain(team.captain._id);
    } else if (availablePlayers.length > 0) {
      setEditingCaptain(availablePlayers[0]._id);
    } else {
      setEditingCaptain("");
    }

    if (team.viceCaptain && !isPlayerInCooldown(team.viceCaptain)) {
      setEditingViceCaptain(team.viceCaptain._id);
    } else if (availablePlayers.length > 1) {
      const viceCaptainCandidate = availablePlayers.find(p => p._id !== editingCaptain) || availablePlayers[0];
      setEditingViceCaptain(viceCaptainCandidate._id);
    } else {
      setEditingViceCaptain("");
    }
  };

  const cancelEditing = () => {
    setEditingTeam(null);
    setEditingCaptain("");
    setEditingViceCaptain("");
  };

  const handleSaveLeadershipConfirmation = (teamId: string) => {
    const currentTeam = teams.find(team => team._id === teamId);
    if (!currentTeam) {
      toast({
        title: "Error",
        description: "Team not found",
        variant: "destructive"
      });
      return;
    }

    const newCaptain = currentTeam.players.find(p => p._id === editingCaptain);
    const newViceCaptain = currentTeam.players.find(p => p._id === editingViceCaptain);

    if (!newCaptain || !newViceCaptain) {
      toast({
        title: "Error",
        description: "Selected captain or vice captain not found in team",
        variant: "destructive"
      });
      return;
    }

    setPendingLeadershipTeam(currentTeam);
    setShowLeadershipConfirmation(true);
  };

  const saveTeamLeadership = async () => {
    if (!pendingLeadershipTeam) return;

    const teamId = pendingLeadershipTeam._id;
    try {
      setIsAction(true)
      const currentTeam = teams.find(team => team._id === teamId);
      if (!currentTeam) {
        toast({
          title: "Error",
          description: "Team not found",
          variant: "destructive"
        });
        return;
      }

      const captainPlayer = currentTeam.players.find(p => p._id === editingCaptain);
      const viceCaptainPlayer = currentTeam.players.find(p => p._id === editingViceCaptain);

      if (captainPlayer && isPlayerInCooldown(captainPlayer)) {
        toast({
          title: "Invalid Captain Selection",
          description: "Cannot assign a player in cooldown as captain",
          variant: "destructive"
        });
        return;
      }

      if (viceCaptainPlayer && isPlayerInCooldown(viceCaptainPlayer)) {
        toast({
          title: "Invalid Vice Captain Selection",
          description: "Cannot assign a player in cooldown as vice captain",
          variant: "destructive"
        });
        return;
      }

      const previousCaptain = currentTeam.captain;
      const previousViceCaptain = currentTeam.viceCaptain;

      const newCaptainPlayer = currentTeam.players.find(p => p._id === editingCaptain);
      const newViceCaptainPlayer = currentTeam.players.find(p => p._id === editingViceCaptain);

      if (!newCaptainPlayer || !newViceCaptainPlayer) {
        toast({
          title: "Error",
          description: "Selected captain or vice captain not found in team",
          variant: "destructive"
        });
        return;
      }

      if (previousCaptain && previousCaptain.member?.discordId) {
        await axios.post("https://testing-bot-rt1b.onrender.com/assign-captain-role", {
          action: "remove",
          discordId: previousCaptain.member.discordId
        });
      }

      if (previousViceCaptain && previousViceCaptain.member?.discordId) {
        await axios.post("https://testing-bot-rt1b.onrender.com/assign-vice-captain-role", {
          action: "remove",
          discordId: previousViceCaptain.member.discordId
        });
      }

      await axios.post("https://testing-bot-rt1b.onrender.com/assign-captain-role", {
        action: "add",
        discordId: newCaptainPlayer.member?.discordId
      });

      await axios.post("https://testing-bot-rt1b.onrender.com/assign-vice-captain-role", {
        action: "add",
        discordId: newViceCaptainPlayer.member?.discordId
      });

      await axios.put(`${BASE_URL}/teams/${teamId}/leadership`, {
        captainId: editingCaptain,
        viceCaptainId: editingViceCaptain
      });

      const updatedTeams = teams.map(team => {
        if (team._id === teamId) {
          return {
            ...team,
            captain: newCaptainPlayer,
            viceCaptain: newViceCaptainPlayer
          };
        }
        return team;
      });

      setTeams(updatedTeams);
      setEditingTeam(null);

      toast({
        title: "Success",
        description: "Team leadership updated successfully"
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update team leadership",
        variant: "destructive"
      });
    } finally {
      setIsAction(false)
      setShowLeadershipConfirmation(false);
      setPendingLeadershipTeam(null);
    }
  };

  const openPasswordModal = (team: Team) => {
    setPasswordTeam(team);
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordTeam(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const saveTeamPassword = async () => {
    if (!passwordTeam) return;

    try {
      if (newPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive"
        });
        return;
      }

      if (newPassword.length < 4) {
        toast({
          title: "Error",
          description: "Password must be at least 4 characters long",
          variant: "destructive"
        });
        return;
      }

      await axios.put(`${BASE_URL}/teams/${passwordTeam._id}/password`, {
        password: newPassword
      });

      const updatedTeams = teams.map(team => {
        if (team._id === passwordTeam._id) {
          return {
            ...team,
            password: newPassword
          };
        }
        return team;
      });

      setTeams(updatedTeams);
      closePasswordModal();

      toast({
        title: "Success",
        description: "Team password updated successfully"
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update team password",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    try {
      setIsDeleting(true);

      const roleRemovalPromises = teamToDelete.players.map(player =>
        axios.post("https://testing-bot-rt1b.onrender.com/assign-player-role", {
          action: "remove",
          discordId: player.member?.discordId
        })
      );

      if (teamToDelete.captain?.member?.discordId) {
        roleRemovalPromises.push(
          axios.post("https://testing-bot-rt1b.onrender.com/assign-captain-role", {
            action: "remove",
            discordId: teamToDelete.captain.member.discordId
          })
        );
      }

      if (teamToDelete.viceCaptain?.member?.discordId) {
        roleRemovalPromises.push(
          axios.post("https://testing-bot-rt1b.onrender.com/assign-vice-captain-role", {
            action: "remove",
            discordId: teamToDelete.viceCaptain.member.discordId
          })
        );
      }

      await Promise.all(roleRemovalPromises);

      await axios.delete(`${BASE_URL}/teams/${teamToDelete._id}`);

      toast({
        title: "Success",
        description: `Team ${teamToDelete.name} deleted successfully`
      });

      fetchData();

    } catch (error: any) {
      console.error("Error deleting team:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete team",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      setTeamToDelete(null);
    }
  };

  const openDeleteConfirmation = (team: Team) => {
    setTeamToDelete(team);
    setShowDeleteConfirmation(true);
  };

  const getPlayerDisplayName = (player: Player) => {
    return player.name || player?.discordName || "Unknown Player";
  };

  const getTeamSizeColor = () => {
    const count = newTeam.selectedPlayers.length;
    if (count < MIN_PLAYERS) return "text-red-500";
    if (count > MAX_PLAYERS) return "text-red-500";
    if (count === MAX_PLAYERS) return "text-amber-500";
    return "text-green-500";
  };

  const getTeamSizeMessage = () => {
    const count = newTeam.selectedPlayers.length;
    if (count < MIN_PLAYERS) {
      return `Need ${MIN_PLAYERS - count} more players (minimum ${MIN_PLAYERS})`;
    }
    if (count > MAX_PLAYERS) {
      return `Too many players! Maximum is ${MAX_PLAYERS}`;
    }
    if (count === MAX_PLAYERS) {
      return "Maximum players reached";
    }
    return `Team size OK (${MIN_PLAYERS}-${MAX_PLAYERS} players)`;
  };

  const getLeadershipChangeDetails = () => {
    if (!pendingLeadershipTeam) return { newCaptain: "", newViceCaptain: "" };

    const newCaptain = pendingLeadershipTeam.players.find(p => p._id === editingCaptain);
    const newViceCaptain = pendingLeadershipTeam.players.find(p => p._id === editingViceCaptain);

    return {
      newCaptain: newCaptain ? getPlayerDisplayName(newCaptain) : "Unknown",
      newViceCaptain: newViceCaptain ? getPlayerDisplayName(newViceCaptain) : "Unknown"
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Team Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-md sm:text-xl">
            <Plus className="h-5 w-5" />
            Create New Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTeam} className="space-y-4 text-sm sm:text-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input
                  value={newTeam.name}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter team name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Team Password</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTeam.password}
                    onChange={(e) => setNewTeam(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Generate or enter password"
                    required
                  />
                  <Button type="button" onClick={generatePassword} variant="outline">
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Player Selection */}
            <div className="space-y-3">
              <div className="flex flex-col gap-4 sm:flex-row items-center justify-between">
                <Label>Select Players ({MIN_PLAYERS}-{MAX_PLAYERS} players required)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchMembers();
                    setShowMemberSelection(true);
                  }}
                  disabled={newTeam.selectedPlayers.length >= MAX_PLAYERS}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Member
                </Button>
              </div>

              {/* Team Size Validation */}
              <div className={`p-3 rounded-lg border ${newTeam.selectedPlayers.length < MIN_PLAYERS || newTeam.selectedPlayers.length > MAX_PLAYERS ? 'bg-red-50 border-red-200' : newTeam.selectedPlayers.length === MAX_PLAYERS ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2">
                  {newTeam.selectedPlayers.length < MIN_PLAYERS || newTeam.selectedPlayers.length > MAX_PLAYERS ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : newTeam.selectedPlayers.length === MAX_PLAYERS ? (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`font-medium ${getTeamSizeColor()}`}>
                    {newTeam.selectedPlayers.length} / {MAX_PLAYERS} players selected
                  </span>
                </div>
                <p className={`text-sm mt-1 ${getTeamSizeColor()}`}>
                  {getTeamSizeMessage()}
                </p>
              </div>

              {/* Selected Players */}
              {newTeam.selectedPlayers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Selected Players:</Label>
                  <div className="flex flex-wrap gap-2">
                    {newTeam.selectedPlayers.map(selectedPlayer => {
                      const player = players.find(p => p._id === selectedPlayer.playerId);
                      return player ? (
                        <Badge
                          key={selectedPlayer.playerId}
                          variant="default"
                          className="flex items-center gap-1"
                          title={`Discord: ${selectedPlayer.discordId}`}
                        >
                          {getPlayerDisplayName(player)}
                          {isPlayerInCooldown(player) && (
                            <Clock className="h-3 w-3 text-orange-500 ml-1" />
                          )}
                          <button
                            type="button"
                            onClick={() => removePlayerFromSelection(selectedPlayer.playerId)}
                            className="ml-1 hover:bg-primary/20 rounded-full w-4 h-4 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Available Players Dropdown */}
              <div className="space-y-2">
                <Label>Add Available Players:</Label>
                <Select
                  onValueChange={(value) => togglePlayerSelection(value)}
                  disabled={newTeam.selectedPlayers.length >= MAX_PLAYERS}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      newTeam.selectedPlayers.length >= MAX_PLAYERS
                        ? "Maximum players reached"
                        : "Select a player to add..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlayers.length > 0 ? (
                      availablePlayers.map(player => (
                        <SelectItem
                          key={player._id}
                          value={player._id}
                          disabled={newTeam.selectedPlayers.some(sp => sp.playerId === player._id) || newTeam.selectedPlayers.length >= MAX_PLAYERS}
                        >
                          <div className="flex items-center justify-between">
                            <span>
                              {getPlayerDisplayName(player)}
                              {isPlayerInCooldown(player) && (
                                <Clock className="h-3 w-3 text-orange-500 ml-1" />
                              )}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Discord: {player?.discordId}
                            {isPlayerInCooldown(player) && " • In Cooldown"}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-players" disabled>
                        No available players
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {availablePlayers.length} players available for signing • Players on cooldown are hidden
                  {newTeam.selectedPlayers.length >= MAX_PLAYERS && " • Maximum players reached"}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Selected: {newTeam.selectedPlayers.length} players
                </span>
                {newTeam.selectedPlayers.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewTeam(prev => ({ ...prev, selectedPlayers: [] }))}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Captain Selection */}
            {newTeam.selectedPlayers.length >= 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Captain
                  </Label>
                  <Select
                    value={newTeam.captainId}
                    onValueChange={(value) => setNewTeam(prev => ({ ...prev, captainId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select captain" />
                    </SelectTrigger>
                    <SelectContent>
                      {newTeam.selectedPlayers.map(selectedPlayer => {
                        const player = players.find(p => p._id === selectedPlayer.playerId);
                        if (!player) return null;

                        return (
                          <SelectItem
                            key={selectedPlayer.playerId}
                            value={selectedPlayer.playerId}
                            disabled={isPlayerInCooldown(player)}
                          >
                            <div className="flex items-center justify-between">
                              <span>
                                {getPlayerDisplayName(player)}
                                {isPlayerInCooldown(player) && (
                                  <Clock className="h-3 w-3 text-orange-500 ml-1" />
                                )}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {isPlayerInCooldown(player) ? "In Cooldown - Cannot be captain" : "Available for captain"}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Vice Captain
                  </Label>
                  <Select
                    value={newTeam.viceCaptainId}
                    onValueChange={(value) => setNewTeam(prev => ({ ...prev, viceCaptainId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vice captain" />
                    </SelectTrigger>
                    <SelectContent>
                      {newTeam.selectedPlayers
                        .filter(sp => sp.playerId !== newTeam.captainId)
                        .map(selectedPlayer => {
                          const player = players.find(p => p._id === selectedPlayer.playerId);
                          if (!player) return null;

                          return (
                            <SelectItem
                              key={selectedPlayer.playerId}
                              value={selectedPlayer.playerId}
                              disabled={isPlayerInCooldown(player)}
                            >
                              <div className="flex items-center justify-between">
                                <span>
                                  {getPlayerDisplayName(player)}
                                  {isPlayerInCooldown(player) && (
                                    <Clock className="h-3 w-3 text-orange-500 ml-1" />
                                  )}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {isPlayerInCooldown(player) ? "In Cooldown - Cannot be vice captain" : "Available for vice captain"}
                              </div>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={newTeam.selectedPlayers.length < MIN_PLAYERS || newTeam.selectedPlayers.length > MAX_PLAYERS || !newTeam.captainId || !newTeam.viceCaptainId || isCreating}
              className="w-full"
            >
              {isCreating ? <Loader /> : <Plus className="h-4 w-4 mr-2" />}
              {isCreating ? "Creating..." : `Create Team (${newTeam.selectedPlayers.length}/${MIN_PLAYERS}+ players)`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Member Selection Modal */}
      {showMemberSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Add New Member</span>
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
                {newTeam.selectedPlayers.length >= MAX_PLAYERS && (
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
                    <Label>Select a member to add as player:</Label>
                    <span className="text-sm text-muted-foreground">
                      {membersWithoutPlayers.length} members found
                    </span>
                  </div>

                  <div className="max-h-96 overflow-y-auto border rounded">
                    {membersWithoutPlayers.length > 0 ? (
                      <div className="divide-y">
                        {membersWithoutPlayers.map(member => (
                          <div
                            key={member._id}
                            className="p-4 cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => newTeam.selectedPlayers.length < MAX_PLAYERS && handleAddMemberToTeam(member)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{member?.discordName}</div>
                                <div className="text-sm text-muted-foreground">
                                  Discord ID: {member.discordId}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={newTeam.selectedPlayers.length >= MAX_PLAYERS}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                {newTeam.selectedPlayers.length >= MAX_PLAYERS ? "Full" : "Add"}
                              </Button>
                            </div>
                          </div>
                        ))}
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

      {/* Password Change Modal */}
      {showPasswordModal && passwordTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Change Team Password</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closePasswordModal}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <Lock className="h-12 w-12 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Update password for <strong>{passwordTeam.name}</strong>
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>New Password</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateNewPassword}
                    >
                      <Key className="h-3 w-3 mr-1" />
                      Generate
                    </Button>
                  </div>
                  <Input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <Input
                    type="text"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />

                  {newPassword && confirmPassword && (
                    <div className={`text-sm ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                      {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </div>
                  )}

                  {newPassword.length > 0 && newPassword.length < 4 && (
                    <div className="text-sm text-red-600">
                      Password must be at least 4 characters long
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={saveTeamPassword}
                    disabled={newPassword !== confirmPassword || newPassword.length < 4 || isAction}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={closePasswordModal}
                    disabled={isAction}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showLeadershipConfirmation}
        onClose={() => {
          setShowLeadershipConfirmation(false);
          setPendingLeadershipTeam(null);
        }}
        onConfirm={saveTeamLeadership}
        title="Update Team Leadership"
        description={`Are you sure you want to update the leadership for ${pendingLeadershipTeam?.name}?\n\nNew Captain: ${getLeadershipChangeDetails().newCaptain}\nNew Vice Captain: ${getLeadershipChangeDetails().newViceCaptain}`}
        confirmText="Update Leadership"
        cancelText="Cancel"
        disabled={isAction}
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setTeamToDelete(null);
        }}
        onConfirm={handleDeleteTeam}
        title="Delete Team"
        description={`Are you sure you want to delete the team "${teamToDelete?.name}"? This action cannot be undone and will remove all players from the team.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Team"}
        cancelText="Cancel"
        variant="destructive"
        disabled={isDeleting}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Existing Teams ({teams.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Captain</TableHead>
                  <TableHead>Vice Captain</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map(team => {
                  const availableLeadershipPlayers = getAvailableLeadershipPlayers(team.players);
                  const canEditLeadership = availableLeadershipPlayers.length >= 2;

                  return (
                    <TableRow key={team._id}>
                      <TableCell className="font-medium">{team.name}</TableCell>

                      {/* Players Column - Show usernames */}
                      <TableCell>
                        <div className="w-fit">
                          <Badge variant="secondary" className="text-xs flex items-center gap-2">
                            {team.players.length} <span>Players</span>
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Captain Column */}
                      <TableCell>
                        {editingTeam === team._id ? (
                          <Select value={editingCaptain} onValueChange={setEditingCaptain}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select captain" />
                            </SelectTrigger>
                            <SelectContent>
                              {team.players.map(player => (
                                <SelectItem
                                  key={player._id}
                                  value={player._id}
                                  disabled={isPlayerInCooldown(player)}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>
                                      {getPlayerDisplayName(player)}
                                      {isPlayerInCooldown(player) && (
                                        <Clock className="h-3 w-3 text-orange-500 ml-1" />
                                      )}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {isPlayerInCooldown(player) ? "In Cooldown - Cannot be captain" : "Available for captain"}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Crown className={`h-4 w-4 ${isPlayerInCooldown(team.captain) ? 'text-orange-500' : 'text-yellow-600'}`} />
                            <div>
                              <div>{getPlayerDisplayName(team.captain)}</div>
                              {isPlayerInCooldown(team.captain) && (
                                <div className="text-xs text-orange-600 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  In Cooldown
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </TableCell>

                      {/* Vice Captain Column */}
                      <TableCell>
                        {editingTeam === team._id ? (
                          <Select
                            value={editingViceCaptain}
                            onValueChange={setEditingViceCaptain}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select vice captain" />
                            </SelectTrigger>
                            <SelectContent>
                              {team.players
                                .filter(player => player._id !== editingCaptain)
                                .map(player => (
                                  <SelectItem
                                    key={player._id}
                                    value={player._id}
                                    disabled={isPlayerInCooldown(player)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>
                                        {getPlayerDisplayName(player)}
                                        {isPlayerInCooldown(player) && (
                                          <Clock className="h-3 w-3 text-orange-500 ml-1" />
                                        )}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {isPlayerInCooldown(player) ? "In Cooldown - Cannot be vice captain" : "Available for vice captain"}
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Shield className={`h-4 w-4 ${isPlayerInCooldown(team.viceCaptain) ? 'text-orange-500' : 'text-blue-600'}`} />
                            <div>
                              <div>{getPlayerDisplayName(team.viceCaptain)}</div>
                              {isPlayerInCooldown(team.viceCaptain) && (
                                <div className="text-xs text-orange-600 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  In Cooldown
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell>
                        <div className="flex gap-2">
                          {editingTeam === team._id ? (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSaveLeadershipConfirmation(team._id)}
                                disabled={!canEditLeadership || isAction}
                                title={!canEditLeadership ? "Need at least 2 players not in cooldown" : "Save leadership changes"}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelEditing}
                                disabled={isAction}
                              >
                                <CloseIcon className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Link to={`/team/${team._id}/manage`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditingTeam(team)}
                                disabled={!canEditLeadership || isDeleting}
                                title={!canEditLeadership ? "Need at least 2 players not in cooldown to edit leadership" : "Edit leadership"}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPasswordModal(team)}
                                disabled={isDeleting}
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteConfirmation(team)}
                                disabled={isDeleting}
                                title="Delete team"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        {!canEditLeadership && (
                          <div className="text-xs text-orange-600 mt-1">
                            Need 2+ players not in cooldown to edit leadership
                          </div>
                        )}
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
  );
}