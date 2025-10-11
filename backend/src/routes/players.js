const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

router.get('/available', playerController.getAvailablePlayers);
router.get('/', playerController.getAllPlayers);
router.post('/', playerController.createPlayer);
router.put('/:playerId/team', playerController.updatePlayer);
router.put('/:playerId/remove-cooldown', playerController.removeCooldown);

module.exports = router;