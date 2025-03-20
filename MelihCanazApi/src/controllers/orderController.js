const pool = require('../utils/db');

// Sipariş Oluşturma
const createOrder = async (req, res) => {
    try {
        const { table_id, customer_id, items } = req.body;
        const company_id = req.user.id;

        // Önce kullanıcıyı bul
        const [users] = await pool.query(
            'SELECT id FROM users WHERE company_id = ? LIMIT 1',
            [company_id]
        );

        if (users.length === 0) {
            return res.status(400).json({ 
                message: 'Sipariş oluşturmak için en az bir kullanıcı kaydı olmalıdır' 
            });
        }

        const user_id = users[0].id;

        // Transaction başlat
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Siparişi oluştur
            const [orderResult] = await connection.query(
                'INSERT INTO orders (company_id, table_id, customer_id, user_id) VALUES (?, ?, ?, ?)',
                [company_id, table_id, customer_id, user_id]
            );

            const order_id = orderResult.insertId;
            let total_amount = 0;

            // Sipariş ürünlerini ekle
            for (const item of items) {
                // Ürün fiyatını kontrol et
                const [productResult] = await connection.query(
                    'SELECT price FROM products WHERE id = ? AND company_id = ?',
                    [item.product_id, company_id]
                );

                if (productResult.length === 0) {
                    throw new Error(`Ürün bulunamadı: ${item.product_id}`);
                }

                const unit_price = productResult[0].price;
                const total_price = unit_price * item.quantity;
                total_amount += total_price;

                // Sipariş ürününü ekle
                await connection.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, notes) VALUES (?, ?, ?, ?, ?, ?)',
                    [order_id, item.product_id, item.quantity, unit_price, total_price, item.notes || null]
                );

                // Stok miktarını güncelle
                await connection.query(
                    'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }

            // Toplam tutarı güncelle
            await connection.query(
                'UPDATE orders SET total_amount = ? WHERE id = ?',
                [total_amount, order_id]
            );

            // Masayı meşgul olarak işaretle
            if (table_id) {
                await connection.query(
                    "UPDATE tables SET status = 'occupied' WHERE id = ? AND company_id = ?",
                    [table_id, company_id]
                );
            }

            await connection.commit();

            res.status(201).json({
                message: 'Sipariş başarıyla oluşturuldu',
                order: {
                    id: order_id,
                    total_amount,
                    items: items.length
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};

// Siparişleri Listele
const getOrders = async (req, res) => {
    try {
        const company_id = req.user.id;
        const { status, start_date, end_date } = req.query;

        let query = `
            SELECT o.*, 
                   c.name as customer_name,
                   t.table_number,
                   COUNT(oi.id) as total_items
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN tables t ON o.table_id = t.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.company_id = ?
        `;
        const queryParams = [company_id];

        if (status) {
            query += ' AND o.status = ?';
            queryParams.push(status);
        }

        if (start_date) {
            query += ' AND o.order_date >= ?';
            queryParams.push(start_date);
        }

        if (end_date) {
            query += ' AND o.order_date <= ?';
            queryParams.push(end_date);
        }

        query += ' GROUP BY o.id ORDER BY o.order_date DESC';

        const [orders] = await pool.query(query, queryParams);

        res.json({ orders });
    } catch (error) {
        console.error('Sipariş listeleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Sipariş Detayı
const getOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.id;

        const [orders] = await pool.query(
            `SELECT o.*, 
                    c.name as customer_name,
                    t.table_number,
                    u.name as user_name
             FROM orders o
             LEFT JOIN customers c ON o.customer_id = c.id
             LEFT JOIN tables t ON o.table_id = t.id
             LEFT JOIN users u ON o.user_id = u.id
             WHERE o.id = ? AND o.company_id = ?`,
            [id, company_id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Sipariş bulunamadı' });
        }

        const [items] = await pool.query(
            `SELECT oi.*, p.name as product_name
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [id]
        );

        res.json({
            order: orders[0],
            items
        });
    } catch (error) {
        console.error('Sipariş detayı getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Sipariş Durumu Güncelleme
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const company_id = req.user.id;

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [order] = await connection.query(
                'SELECT table_id FROM orders WHERE id = ? AND company_id = ?',
                [id, company_id]
            );

            if (order.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Sipariş bulunamadı' });
            }

            await connection.query(
                'UPDATE orders SET status = ? WHERE id = ? AND company_id = ?',
                [status, id, company_id]
            );

            // Sipariş tamamlandıysa veya iptal edildiyse masayı boşalt
            if ((status === 'completed' || status === 'cancelled') && order[0].table_id) {
                await connection.query(
                    "UPDATE tables SET status = 'available' WHERE id = ? AND company_id = ?",
                    [order[0].table_id, company_id]
                );
            }

            await connection.commit();

            res.json({
                message: 'Sipariş durumu başarıyla güncellendi',
                order_id: parseInt(id),
                new_status: status
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Sipariş durumu güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Sipariş İptali
const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.id;

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Siparişi kontrol et
            const [order] = await connection.query(
                'SELECT table_id, status FROM orders WHERE id = ? AND company_id = ?',
                [id, company_id]
            );

            if (order.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Sipariş bulunamadı' });
            }

            if (order[0].status === 'completed') {
                await connection.rollback();
                return res.status(400).json({ message: 'Tamamlanmış sipariş iptal edilemez' });
            }

            // Sipariş ürünlerini al
            const [items] = await connection.query(
                'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
                [id]
            );

            // Stokları geri ekle
            for (const item of items) {
                await connection.query(
                    'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }

            // Siparişi iptal et
            await connection.query(
                "UPDATE orders SET status = 'cancelled' WHERE id = ? AND company_id = ?",
                [id, company_id]
            );

            // Masayı boşalt
            if (order[0].table_id) {
                await connection.query(
                    "UPDATE tables SET status = 'available' WHERE id = ? AND company_id = ?",
                    [order[0].table_id, company_id]
                );
            }

            await connection.commit();

            res.json({ message: 'Sipariş başarıyla iptal edildi' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Sipariş iptal hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    cancelOrder
}; 