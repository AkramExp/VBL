const Fixture = require('../models/fixture.model');
const Team = require('../models/team.model');
const Stage = require('../models/stage.model');

exports.getAllFixtures = async (req, res) => {
    try {
        const fixtures = await Fixture.find().populate('team1 team2 stage');
        res.json(fixtures);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read fixtures' });
    }
};

exports.createFixture = async (req, res) => {
    try {
        const { stageId, team1, team2 } = req.body;

        if (!stageId || !team1 || !team2) {
            return res.status(400).json({ error: 'Stage and both teams are required' });
        }

        if (team1 === team2) {
            return res.status(400).json({ error: 'A team cannot play against itself' });
        }

        const stage = await Stage.findById(stageId);
        if (!stage) return res.status(400).json({ error: 'Stage does not exist' });

        const team1Doc = await Team.findOne({ name: team1 });
        const team2Doc = await Team.findOne({ name: team2 });

        if (!team1Doc || !team2Doc) {
            return res.status(400).json({ error: 'One or both teams do not exist' });
        }

        const newFixture = new Fixture({ stage: stageId, team1: team1Doc._id, team2: team2Doc._id });
        await newFixture.save();
        await newFixture.populate('team1 team2 stage');

        res.json({ message: 'Fixture added successfully', fixture: newFixture });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add fixture' });
    }
};

exports.updateFixture = async (req, res) => {
    try {
        const { id } = req.params;
        const { result } = req.body;

        const updatedFixture = await Fixture.findByIdAndUpdate(id, { result }, { new: true })
            .populate('team1 team2 stage');

        if (!updatedFixture) return res.status(404).json({ error: 'Fixture not found' });
        res.json({ message: 'Fixture updated successfully', fixture: updatedFixture });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update fixture' });
    }
};

exports.deleteFixture = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedFixture = await Fixture.findByIdAndDelete(id);

        if (!deletedFixture) return res.status(404).json({ error: 'Fixture not found' });

        const fixtures = await Fixture.find().populate('team1 team2 stage');
        res.json({ message: 'Fixture removed successfully', fixtures });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove fixture' });
    }
};