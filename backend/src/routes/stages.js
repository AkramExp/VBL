const express = require('express');
const router = express.Router();
const stageController = require('../controllers/stageController');

router.get('/', stageController.getAllStages);
router.post('/', stageController.createStage);
router.put('/:id', stageController.updateStage);
router.delete('/:id', stageController.deleteStage);

module.exports = router;