const pool = require('../utils/db');

// Müşteri Ekleme
const createCustomer = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        const company_id = req.user.id;

        const [result] = await pool.query(
            'INSERT INTO customers (company_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
            [company_id, name, email, phone, address]
        );

        res.status(201).json({
            message: 'Müşteri başarıyla eklendi',
            customer: {
                id: result.insertId,
                name,
                email,
                phone,
                address
            }
        });
    } catch (error) {
        console.error('Müşteri ekleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Müşterileri Listele
const getCustomers = async (req, res) => {
    try {
        const company_id = req.user.id;
        const [customers] = await pool.query(
            'SELECT * FROM customers WHERE company_id = ? ORDER BY created_at DESC',
            [company_id]
        );

        res.json({ customers });
    } catch (error) {
        console.error('Müşteri listeleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Müşteri Detayı
const getCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.id;

        const [customers] = await pool.query(
            'SELECT * FROM customers WHERE id = ? AND company_id = ?',
            [id, company_id]
        );

        if (customers.length === 0) {
            return res.status(404).json({ message: 'Müşteri bulunamadı' });
        }

        // Müşterinin siparişlerini de getir
        const [orders] = await pool.query(
            `SELECT o.*, 
                    COUNT(oi.id) as total_items,
                    GROUP_CONCAT(CONCAT(p.name, ' (', oi.quantity, ')')) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.customer_id = ? AND o.company_id = ?
             GROUP BY o.id
             ORDER BY o.order_date DESC`,
            [id, company_id]
        );

        res.json({
            customer: customers[0],
            orders
        });
    } catch (error) {
        console.error('Müşteri detayı getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Müşteri Güncelleme
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;
        const company_id = req.user.id;

        const [result] = await pool.query(
            `UPDATE customers 
             SET name = ?, email = ?, phone = ?, address = ? 
             WHERE id = ? AND company_id = ?`,
            [name, email, phone, address, id, company_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Müşteri bulunamadı' });
        }

        res.json({
            message: 'Müşteri başarıyla güncellendi',
            customer: {
                id: parseInt(id),
                name,
                email,
                phone,
                address
            }
        });
    } catch (error) {
        console.error('Müşteri güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Müşteri Silme
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.id;

        // Önce müşterinin aktif siparişi var mı kontrol et
        const [activeOrders] = await pool.query(
            "SELECT id FROM orders WHERE customer_id = ? AND status NOT IN ('completed', 'cancelled')",
            [id]
        );

        if (activeOrders.length > 0) {
            return res.status(400).json({ 
                message: 'Müşterinin aktif siparişleri olduğu için silinemez' 
            });
        }

        const [result] = await pool.query(
            'DELETE FROM customers WHERE id = ? AND company_id = ?',
            [id, company_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Müşteri bulunamadı' });
        }

        res.json({ message: 'Müşteri başarıyla silindi' });
    } catch (error) {
        console.error('Müşteri silme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Müşteri Arama
const searchCustomers = async (req, res) => {
    try {
        const { query } = req.query;
        const company_id = req.user.id;

        const [customers] = await pool.query(
            `SELECT * FROM customers 
             WHERE company_id = ? AND 
                   (name LIKE ? OR email LIKE ? OR phone LIKE ?)
             ORDER BY name ASC`,
            [company_id, `%${query}%`, `%${query}%`, `%${query}%`]
        );

        res.json({ customers });
    } catch (error) {
        console.error('Müşteri arama hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

module.exports = {
    createCustomer,
    getCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers
}; 