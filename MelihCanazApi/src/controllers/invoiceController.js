const pool = require('../utils/db');

// Fatura Oluşturma
const createInvoice = async (req, res) => {
    try {
        const { order_id, due_date } = req.body;
        const company_id = req.user.id;

        // Transaction başlat
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Siparişi kontrol et
            const [orders] = await connection.query(
                'SELECT total_amount FROM orders WHERE id = ? AND company_id = ?',
                [order_id, company_id]
            );

            if (orders.length === 0) {
                throw new Error('Sipariş bulunamadı');
            }

            // Fatura numarası oluştur (FTR-YIL-AYGUN-SIRA)
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            const [lastInvoice] = await connection.query(
                'SELECT invoice_number FROM invoices WHERE company_id = ? AND DATE(invoice_date) = CURDATE() ORDER BY id DESC LIMIT 1',
                [company_id]
            );

            let sequence = 1;
            if (lastInvoice.length > 0) {
                sequence = parseInt(lastInvoice[0].invoice_number.split('-')[3]) + 1;
            }

            const invoice_number = `FTR-${year}-${month}${day}-${String(sequence).padStart(4, '0')}`;

            // Fatura oluştur
            const [result] = await connection.query(
                'INSERT INTO invoices (company_id, order_id, invoice_number, due_date, total_amount) VALUES (?, ?, ?, ?, ?)',
                [company_id, order_id, invoice_number, due_date, orders[0].total_amount]
            );

            await connection.commit();

            res.status(201).json({
                message: 'Fatura başarıyla oluşturuldu',
                invoice: {
                    id: result.insertId,
                    invoice_number,
                    total_amount: orders[0].total_amount,
                    due_date
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Fatura oluşturma hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};

// Faturaları Listele
const getInvoices = async (req, res) => {
    try {
        const company_id = req.user.id;
        const { status, start_date, end_date } = req.query;

        let query = `
            SELECT i.*, 
                   o.order_date,
                   c.name as customer_name
            FROM invoices i
            JOIN orders o ON i.order_id = o.id
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE i.company_id = ?
        `;
        const queryParams = [company_id];

        if (status) {
            query += ' AND i.payment_status = ?';
            queryParams.push(status);
        }

        if (start_date) {
            query += ' AND DATE(i.invoice_date) >= ?';
            queryParams.push(start_date);
        }

        if (end_date) {
            query += ' AND DATE(i.invoice_date) <= ?';
            queryParams.push(end_date);
        }

        query += ' ORDER BY i.invoice_date DESC';

        const [invoices] = await pool.query(query, queryParams);

        res.json({ invoices });
    } catch (error) {
        console.error('Fatura listeleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Fatura Detayı
const getInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.id;

        const [invoices] = await pool.query(
            `SELECT i.*, 
                    o.order_date,
                    c.name as customer_name,
                    c.address as customer_address,
                    c.phone as customer_phone
             FROM invoices i
             JOIN orders o ON i.order_id = o.id
             LEFT JOIN customers c ON o.customer_id = c.id
             WHERE i.id = ? AND i.company_id = ?`,
            [id, company_id]
        );

        if (invoices.length === 0) {
            return res.status(404).json({ message: 'Fatura bulunamadı' });
        }

        // Fatura kalemlerini getir
        const [items] = await pool.query(
            `SELECT oi.*, p.name as product_name
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [invoices[0].order_id]
        );

        // Ödemeleri getir
        const [payments] = await pool.query(
            'SELECT * FROM payments WHERE invoice_id = ?',
            [id]
        );

        res.json({
            invoice: invoices[0],
            items,
            payments
        });
    } catch (error) {
        console.error('Fatura detayı getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Fatura İptali
const cancelInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.id;

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Faturayı kontrol et
            const [invoice] = await connection.query(
                'SELECT payment_status FROM invoices WHERE id = ? AND company_id = ?',
                [id, company_id]
            );

            if (invoice.length === 0) {
                throw new Error('Fatura bulunamadı');
            }

            if (invoice[0].payment_status === 'paid') {
                throw new Error('Ödenmiş fatura iptal edilemez');
            }

            // Faturayı iptal et
            await connection.query(
                "UPDATE invoices SET payment_status = 'cancelled' WHERE id = ?",
                [id]
            );

            await connection.commit();

            res.json({ message: 'Fatura başarıyla iptal edildi' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Fatura iptal hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};

module.exports = {
    createInvoice,
    getInvoices,
    getInvoice,
    cancelInvoice
}; 