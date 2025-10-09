const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

router.post('/', teamController.createTeam);
router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.post('/:id/players', teamController.addPlayerToTeam);
router.delete('/:teamId/players/:playerId', teamController.releasePlayerFromTeam);

module.exports = router;