const Player = require('../models/player.model');
const Member = require('../models/member.model');
const Team = require('../models/team.model')

exports.getAvailablePlayers = async (req, res) => {
    try {
        const availablePlayers = await Player.find({
            $or: [
                { status: 'available' },
                { status: 'cooldown', cooldownEnds: { $lte: new Date() } }
            ]
        }).populate('member', 'discordName discordId');

        res.json(availablePlayers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch available players' });
    }
};

exports.createPlayer = async (req, res) => {
    try {
        const { memberId } = req.body;

        const existingPlayer = await Player.findOne({ member: memberId });
        if (existingPlayer) {
            return res.status(400).json({ error: 'Player already exists for this member' });
        }

        const findMember = await Member.findById(memberId);

        console.log(findMember)

        if (!findMember) {
            return res.status(404).json({ error: 'Member with this ID not found' });
        }

        const newPlayer = new Player({ member: memberId, discordId: findMember.discordId, discordName: findMember.discordName });
        await newPlayer.save();
        await newPlayer.populate('member', 'discordName discordId');

        res.json({ message: 'Player created successfully', player: newPlayer });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed to create player' });
    }
};

exports.getAllPlayers = async (req, res) => {
    try {
        const players = await Player.find().populate('member', 'discordName discordId');
        res.json(players);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch players' });
    }
};

exports.updatePlayer = async (req, res) => {
    try {
        const { playerId } = req.params;
        const { teamId, applyCooldown = false } = req.body;

        const player = await Player.findById(playerId);
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        const previousTeam = player.currentTeam;

        if (!teamId) {
            player.currentTeam = null;
            player.status = 'available';

            if (applyCooldown) {
                player.releaseDate = new Date();
                player.status = 'cooldown';
                player.cooldownEnds = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
            } else {
                player.releaseDate = null;
                player.cooldownEnds = null;
            }

            if (previousTeam) {
                const findTeam = await Team.findById(previousTeam);
                if (!findTeam) {
                    return res.status(404).json({ error: 'Team not found' });
                }
                const newPlayers = findTeam.players.filter(item => String(item) !== String(player._id));
                await Team.findByIdAndUpdate(findTeam._id, { players: newPlayers });
            }
        }
        else {
            const team = await Team.findById(teamId);
            if (!team) {
                return res.status(404).json({ error: 'Team not found' });
            }

            if (previousTeam) {
                const findTeam = await Team.findById(previousTeam);
                if (!findTeam) {
                    return res.status(404).json({ error: 'Team not found' });
                }
                const newPlayers = findTeam.players.filter(item => String(item) !== String(player._id));
                await Team.findByIdAndUpdate(findTeam._id, { players: newPlayers });
            }

            player.currentTeam = teamId;
            player.status = 'signed';
            player.joinDate = new Date();
            player.releaseDate = null;
            player.cooldownEnds = null;

            await Team.findByIdAndUpdate(team._id, { players: [...team.players, player._id] });
        }

        await player.save();

        res.json({
            message: 'Player team updated successfully',
            player: await Player.findById(playerId).populate('member')
        });

    } catch (error) {
        console.error('Error updating player team:', error);
        res.status(500).json({ error: 'Failed to update player team' });
    }
}