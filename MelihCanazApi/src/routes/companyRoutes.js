const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const auth = require('../middlewares/auth');

// Firma kaydı
router.post('/register', companyController.register);

// Firma girişi
router.post('/login', companyController.login);

// Firma profili
router.get('/profile', auth, companyController.getProfile);

module.exports = router; 