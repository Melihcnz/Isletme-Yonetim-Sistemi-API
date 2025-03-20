const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middlewares/auth');

// Tüm route'lar için auth middleware'ini kullan
router.use(auth);

// Ürün route'ları
router.post('/', productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Kategori route'ları
router.post('/categories', productController.createCategory);
router.get('/categories', productController.getCategories);

module.exports = router;