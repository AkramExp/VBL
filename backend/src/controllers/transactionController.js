const Transaction = require('../models/transaction.model');

exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('player team').populate({ path: "player", populate: { path: "member", select: "discordName discordId" } })
            .sort({ timestamp: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};