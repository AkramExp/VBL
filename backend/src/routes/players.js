const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

router.get('/available', playerController.getAvailablePlayers);
router.get('/', playerController.getAllPlayers);
router.post('/', playerController.createPlayer);
router.put('/:playerId/team', playerController.updatePlayer)

module.exports = router;