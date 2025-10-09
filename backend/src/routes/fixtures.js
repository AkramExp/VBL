const express = require('express');
const router = express.Router();
const fixtureController = require('../controllers/fixtureController');

router.get('/', fixtureController.getAllFixtures);
router.post('/', fixtureController.createFixture);
router.put('/:id', fixtureController.updateFixture);
router.delete('/:id', fixtureController.deleteFixture);

module.exports = router;