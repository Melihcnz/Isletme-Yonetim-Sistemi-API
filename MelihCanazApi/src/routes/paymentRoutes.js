const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middlewares/auth');

// Tüm route'lar için auth middleware'ini kullan
router.use(auth);

// Ödeme route'ları
router.post('/', paymentController.createPayment);
router.get('/', paymentController.getPayments);
router.post('/:id/cancel', paymentController.cancelPayment);

module.exports = router; 