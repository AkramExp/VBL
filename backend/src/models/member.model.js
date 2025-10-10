const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    discordName: String,
    joinedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("Member", MemberSchema);