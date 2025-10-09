const Stage = require('../models/stage.model');
const Fixture = require('../models/fixture.model');

exports.getAllStages = async (req, res) => {
    try {
        const stages = await Stage.find().sort({ order: 1 });
        res.json(stages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read stages' });
    }
};

exports.createStage = async (req, res) => {
    try {
        const { name, description, order } = req.body;

        if (!name) return res.status(400).json({ error: 'Stage name is required' });

        const existingStage = await Stage.findOne({ name });
        if (existingStage) return res.status(400).json({ error: 'Stage already exists' });

        const newStage = new Stage({ name, description, order: order || 0 });
        await newStage.save();

        const stages = await Stage.find().sort({ order: 1 });
        res.json({ message: 'Stage added successfully', stages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add stage' });
    }
};

exports.updateStage = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, order } = req.body;

        const updatedStage = await Stage.findByIdAndUpdate(
            id, { name, description, order }, { new: true }
        );

        if (!updatedStage) return res.status(404).json({ error: 'Stage not found' });

        const stages = await Stage.find().sort({ order: 1 });
        res.json({ message: 'Stage updated successfully', stages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update stage' });
    }
};

exports.deleteStage = async (req, res) => {
    try {
        const { id } = req.params;
        await Fixture.deleteMany({ stage: id });
        const deletedStage = await Stage.findByIdAndDelete(id);

        if (!deletedStage) return res.status(404).json({ error: 'Stage not found' });

        const stages = await Stage.find().sort({ order: 1 });
        res.json({ message: 'Stage removed successfully', stages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove stage' });
    }
};