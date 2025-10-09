const express = require('express');
const router = express.Router();

// Import route modules
const teamRoutes = require('./teams.js');
const fixtureRoutes = require('./fixtures.js');
const stageRoutes = require('./stages.js');
const playerRoutes = require('./players.js');
const memberRoutes = require('./members.js');
const transactionRoutes = require('./transactions.js');

// Mount routes
router.use('/teams', teamRoutes);
router.use('/fixtures', fixtureRoutes);
router.use('/stages', stageRoutes);
router.use('/players', playerRoutes);
router.use('/members', memberRoutes);
router.use('/transactions', transactionRoutes);

module.exports = router;