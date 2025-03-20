const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');

// Tüm route'lar için auth middleware'ini kullan
router.use(auth);

// Sipariş route'ları
router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router; 