const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middlewares/auth');

// Tüm route'lar için auth middleware'ini kullan
router.use(auth);

// Müşteri route'ları
router.post('/', customerController.createCustomer);
router.get('/', customerController.getCustomers);
router.get('/search', customerController.searchCustomers);
router.get('/:id', customerController.getCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router; 