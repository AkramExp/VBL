const Member = require('../models/member.model');
const { MongoClient } = require("mongodb");

const client = new MongoClient("mongodb+srv://admin:admin@ivl.qq3bahu.mongodb.net"); // replace with your DB URI
const dbName = "ivl-test";

exports.getAllMembers = async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const members = await db.collection("members").find().toArray();

        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch members' });
    }
};

exports.createMember = async (req, res) => {
    try {
        const { discordId, discordName } = req.body;

        const existingMember = await Member.findOne({ discordId });
        if (existingMember) {
            return res.status(400).json({ error: 'Member already exists' });
        }

        const newMember = new Member({ discordId, discordName, joinedAt: new Date() });
        await newMember.save();

        res.json({ message: 'Member created successfully', member: newMember });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create member' });
    }
};