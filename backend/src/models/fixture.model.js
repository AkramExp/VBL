const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
    team1Score: {
        type: Number,
        required: true,
        min: 0
    },
    team2Score: {
        type: Number,
        required: true,
        min: 0
    }
});

const resultSchema = new mongoose.Schema({
    winner: {
        type: String,
        required: true
    },
    sets: {
        set1: setSchema,
        set2: setSchema,
        set3: setSchema
    }
});

const fixtureSchema = new mongoose.Schema({
    stage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stage',
        required: true
    },
    team1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    team2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    result: resultSchema
}, {
    timestamps: true
});

module.exports = mongoose.model('Fixture', fixtureSchema);