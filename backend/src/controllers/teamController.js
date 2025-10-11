const Team = require('../models/team.model');
const Player = require('../models/player.model');
const Transaction = require('../models/transaction.model');
const bcrypt = require('bcrypt');

exports.createTeam = async (req, res) => {
    try {
        const { name, password, playerIds, captainId, viceCaptainId } = req.body;

        if (playerIds.length < 6) {
            return res.status(400).json({ error: 'Team must have at least 6 players' });
        }

        if (!playerIds.includes(captainId) || !playerIds.includes(viceCaptainId)) {
            return res.status(400).json({ error: 'Captain and vice-captain must be in the player list' });
        }

        const players = await Player.find({ _id: { $in: playerIds } });
        const unavailablePlayers = players.filter(p => p.status === 'signed' ||
            (p.status === 'cooldown' && p.cooldownEnds > new Date()));

        if (unavailablePlayers.length > 0) {
            return res.status(400).json({ error: 'Some players are not available' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const newTeam = new Team({ name, password: hashedPassword, captain: captainId, viceCaptain: viceCaptainId, players: playerIds });
        await newTeam.save();

        await Player.updateMany(
            { _id: { $in: playerIds } },
            { status: 'signed', currentTeam: newTeam._id, joinDate: new Date() }
        );

        const transactionPromises = playerIds.map(playerId =>
            new Transaction({
                type: 'signing',
                player: playerId,
                team: newTeam._id,
                details: `Signed with ${name} during team creation`
            }).save()
        );

        await Promise.all(transactionPromises);
        await newTeam.populate('players captain viceCaptain');
        await newTeam.populate('players.member', 'discordName discordId');
        await newTeam.populate('captain.member', 'discordName discordId');
        await newTeam.populate('viceCaptain.member', 'discordName discordId');

        res.json({ message: 'Team created successfully', team: newTeam });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create team' });
    }
};

// In your teamController.js - update the population
exports.getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find({ isActive: true })
            .populate({
                path: 'players',
                populate: {
                    path: 'member',
                    select: 'discordName discordId'
                }
            })
            .populate({
                path: 'captain',
                populate: {
                    path: 'member',
                    select: 'discordName discordId'
                }
            })
            .populate({
                path: 'viceCaptain',
                populate: {
                    path: 'member',
                    select: 'discordName discordId'
                }
            }).select('-password'); // Exclude password field

        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
};

exports.getTeamById = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('players captain viceCaptain')
            .populate({ path: "players", populate: { path: "member", select: "discordName discordId" } })
            .populate({ path: "captain", populate: { path: "member", select: "discordName discordId" } })
            .populate({ path: "viceCaptain", populate: { path: "member", select: "discordName discordId" } })
            .select('-password'); // Exclude password field

        if (!team) return res.status(404).json({ error: 'Team not found' });
        res.json(team);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch team' });
    }
};

exports.addPlayerToTeam = async (req, res) => {
    try {
        const { playerId } = req.body;
        const teamId = req.params.id;

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ error: 'Team not found' });

        const player = await Player.findById(playerId).populate('member');
        if (!player) return res.status(404).json({ error: 'Player not found' });
        if (player.status === 'signed') return res.status(400).json({ error: 'Player is already signed with a team' });
        if (player.status === 'cooldown' && player.cooldownEnds > new Date()) {
            return res.status(400).json({ error: 'Player is in cooldown period' });
        }

        team.players.push(playerId);
        await team.save();

        const cooldownEnds = new Date();
        cooldownEnds.setDate(cooldownEnds.getDate() + 2);

        await Player.findByIdAndUpdate(playerId, {
            status: 'signed',
            currentTeam: teamId,
            joinDate: new Date(),
            cooldownEnds: cooldownEnds
        });

        await new Transaction({
            type: 'signing',
            player: playerId,
            team: teamId,
            details: `Signed with ${team.name}`
        }).save();

        res.json({ message: 'Player added to team successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add player to team' });
    }
};

exports.releasePlayerFromTeam = async (req, res) => {
    try {
        const { teamId, playerId } = req.params;

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ error: 'Team not found' });
        if (!team.players.includes(playerId)) return res.status(400).json({ error: 'Player not in team' });

        team.players = team.players.filter(p => p.toString() !== playerId);
        await team.save();

        const cooldownEnds = new Date();
        cooldownEnds.setDate(cooldownEnds.getDate() + 2);

        await Player.findByIdAndUpdate(playerId, {
            status: 'cooldown',
            currentTeam: null,
            releaseDate: new Date(),
            cooldownEnds: cooldownEnds
        });

        await new Transaction({
            type: 'release',
            player: playerId,
            team: teamId,
            details: `Released from ${team.name}`
        }).save();

        res.json({ message: 'Player released from team successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to release player from team' });
    }
};

exports.teamLeadership = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { captainId, viceCaptainId } = req.body;

        if (!captainId || !viceCaptainId) {
            return res.status(400).json({ error: 'Captain ID and Vice Captain ID are required' });
        }

        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const captainInTeam = team.players.some(player => player._id.toString() === captainId);
        const viceCaptainInTeam = team.players.some(player => player._id.toString() === viceCaptainId);

        if (!captainInTeam || !viceCaptainInTeam) {
            return res.status(400).json({ error: 'Both captain and vice captain must be team members' });
        }

        if (captainId === viceCaptainId) {
            return res.status(400).json({ error: 'Captain and vice captain cannot be the same player' });
        }

        const captainPlayer = await Player.findById(captainId);
        const viceCaptainPlayer = await Player.findById(viceCaptainId);

        if (!captainPlayer || !viceCaptainPlayer) {
            return res.status(404).json({ error: 'One or both players not found' });
        }

        team.captain = captainPlayer;
        team.viceCaptain = viceCaptainPlayer;

        await team.save();

        await team.populate('captain viceCaptain players');

        res.json({
            message: 'Team leadership updated successfully',
            team: {
                _id: team._id,
                name: team.name,
                captain: {
                    _id: captainPlayer._id,
                    name: captainPlayer.name,
                    discordUsername: captainPlayer.discordUsername,
                    robloxUsername: captainPlayer.robloxUsername,
                    position: captainPlayer.position,
                    member: captainPlayer.member
                },
                viceCaptain: {
                    _id: viceCaptainPlayer._id,
                    name: viceCaptainPlayer.name,
                    discordUsername: viceCaptainPlayer.discordUsername,
                    robloxUsername: viceCaptainPlayer.robloxUsername,
                    position: viceCaptainPlayer.position,
                    member: viceCaptainPlayer.member
                },
                players: team.players
            }
        });
    } catch (error) {
        console.log('Error updating team leadership:', error);
        res.status(500).json({ error: 'Failed to update team leadership' });
    }
}

exports.updateTeamPassword = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { password } = req.body;

        // Validate input
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        if (password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters long' });
        }

        // Find the team
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        team.password = hashedPassword;
        await team.save();

        res.json({
            message: 'Team password updated successfully',
            team: {
                _id: team._id,
                name: team.name
            }
        });

    } catch (error) {
        console.log('Error updating team password:', error);
        res.status(500).json({ error: 'Failed to update team password' });
    }
};

exports.loginTeam = async (req, res) => {
    try {
        const { password } = req.body;
        const { teamId } = req.params;

        const findTeam = await Team.findById(teamId);


        if (!findTeam) {
            return res.status(404).json({ error: 'Team not found', success: false });
        }
        const passwordMatch = bcrypt.compareSync(password, findTeam.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid team password', success: false });
        }

        res.json({ message: 'Login successful', success: true });

    } catch (error) {
        console.log('Error logging in team:', error);
        res.status(500).json({ error: 'Failed to log in team', success: false });
    }
}