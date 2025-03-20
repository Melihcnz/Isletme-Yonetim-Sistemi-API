const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');

// Tüm route'lar için auth middleware'ini kullan
router.use(auth);

// Kullanıcı route'ları
router.post('/', userController.createUser);
router.get('/', userController.getUsers);

module.exports = router; 