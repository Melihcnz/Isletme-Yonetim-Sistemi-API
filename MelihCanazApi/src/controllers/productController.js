const pool = require('../utils/db');

// Ürün Ekleme
const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock_quantity, category_id } = req.body;
        const company_id = req.user.id;

        const [result] = await pool.query(
            'INSERT INTO products (company_id, category_id, name, description, price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
            [company_id, category_id, name, description, price, stock_quantity]
        );

        res.status(201).json({
            message: 'Ürün başarıyla eklendi',
            product: {
                id: result.insertId,
                name,
                description,
                price,
                stock_quantity
            }
        });
    } catch (error) {
        console.error('Ürün ekleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Ürünleri Listele
const getProducts = async (req, res) => {
    try {
        const company_id = req.user.id;
        const [products] = await pool.query(
            `SELECT p.*, pc.name as category_name 
             FROM products p 
             LEFT JOIN product_categories pc ON p.category_id = pc.id 
             WHERE p.company_id = ?`,
            [company_id]
        );

        res.json({ products });
    } catch (error) {
        console.error('Ürün listeleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Ürün Detayı
const getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.id;

        const [products] = await pool.query(
            `SELECT p.*, pc.name as category_name 
             FROM products p 
             LEFT JOIN product_categories pc ON p.category_id = pc.id 
             WHERE p.id = ? AND p.company_id = ?`,
            [id, company_id]
        );

        if (products.length === 0) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
        }

        res.json({ product: products[0] });
    } catch (error) {
        console.error('Ürün detayı getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Ürün Güncelleme
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock_quantity, category_id } = req.body;
        const company_id = req.user.id;

        const [result] = await pool.query(
            `UPDATE products 
             SET name = ?, description = ?, price = ?, stock_quantity = ?, category_id = ? 
             WHERE id = ? AND company_id = ?`,
            [name, description, price, stock_quantity, category_id, id, company_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
        }

        res.json({
            message: 'Ürün başarıyla güncellendi',
            product: {
                id: parseInt(id),
                name,
                description,
                price,
                stock_quantity,
                category_id
            }
        });
    } catch (error) {
        console.error('Ürün güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Ürün Silme
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.id;

        const [result] = await pool.query(
            'DELETE FROM products WHERE id = ? AND company_id = ?',
            [id, company_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
        }

        res.json({ message: 'Ürün başarıyla silindi' });
    } catch (error) {
        console.error('Ürün silme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Kategori Ekleme
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const company_id = req.user.id;

        const [result] = await pool.query(
            'INSERT INTO product_categories (company_id, name, description) VALUES (?, ?, ?)',
            [company_id, name, description]
        );

        res.status(201).json({
            message: 'Kategori başarıyla eklendi',
            category: {
                id: result.insertId,
                name,
                description
            }
        });
    } catch (error) {
        console.error('Kategori ekleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Kategorileri Listele
const getCategories = async (req, res) => {
    try {
        const company_id = req.user.id;
        const [categories] = await pool.query(
            'SELECT * FROM product_categories WHERE company_id = ?',
            [company_id]
        );

        res.json({ categories });
    } catch (error) {
        console.error('Kategori listeleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    getCategories
}; 