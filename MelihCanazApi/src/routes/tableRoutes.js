const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const auth = require('../middlewares/auth');

// Tüm route'lar için auth middleware'ini kullan
router.use(auth);

// Masa route'ları
router.post('/', tableController.createTable);
router.get('/', tableController.getTables);
router.get('/:id', tableController.getTable);
router.put('/:id', tableController.updateTable);
router.delete('/:id', tableController.deleteTable);
router.put('/:id/status', tableController.updateTableStatus);

module.exports = router; 