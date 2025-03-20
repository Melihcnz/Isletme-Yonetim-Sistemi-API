const pool = require('../utils/db');

// Ödeme Oluşturma
const createPayment = async (req, res) => {
    try {
        const { invoice_id, amount, payment_method } = req.body;
        const company_id = req.user.id;

        // Transaction başlat
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Faturayı kontrol et
            const [invoices] = await connection.query(
                'SELECT total_amount, payment_status FROM invoices WHERE id = ? AND company_id = ?',
                [invoice_id, company_id]
            );

            if (invoices.length === 0) {
                throw new Error('Fatura bulunamadı');
            }

            if (invoices[0].payment_status === 'cancelled') {
                throw new Error('İptal edilmiş faturaya ödeme yapılamaz');
            }

            // Toplam ödemeleri kontrol et
            const [payments] = await connection.query(
                'SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?',
                [invoice_id]
            );

            const total_paid = payments[0].total_paid || 0;
            const remaining = invoices[0].total_amount - total_paid;

            if (amount > remaining) {
                throw new Error('Ödeme tutarı kalan tutardan büyük olamaz');
            }

            // Ödemeyi kaydet
            const [result] = await connection.query(
                'INSERT INTO payments (company_id, invoice_id, amount, payment_method) VALUES (?, ?, ?, ?)',
                [company_id, invoice_id, amount, payment_method]
            );

            // Fatura durumunu güncelle
            const new_total_paid = total_paid + amount;
            if (new_total_paid >= invoices[0].total_amount) {
                await connection.query(
                    "UPDATE invoices SET payment_status = 'paid' WHERE id = ?",
                    [invoice_id]
                );
            }

            await connection.commit();

            res.status(201).json({
                message: 'Ödeme başarıyla kaydedildi',
                payment: {
                    id: result.insertId,
                    amount,
                    payment_method,
                    remaining: remaining - amount
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Ödeme oluşturma hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};

// Ödemeleri Listele
const getPayments = async (req, res) => {
    try {
        const company_id = req.user.id;
        const { invoice_id, start_date, end_date, payment_method } = req.query;

        let query = `
            SELECT p.*, 
                   i.invoice_number,
                   i.total_amount as invoice_total
            FROM payments p
            JOIN invoices i ON p.invoice_id = i.id
            WHERE p.company_id = ?
        `;
        const queryParams = [company_id];

        if (invoice_id) {
            query += ' AND p.invoice_id = ?';
            queryParams.push(invoice_id);
        }

        if (payment_method) {
            query += ' AND p.payment_method = ?';
            queryParams.push(payment_method);
        }

        if (start_date) {
            query += ' AND DATE(p.payment_date) >= ?';
            queryParams.push(start_date);
        }

        if (end_date) {
            query += ' AND DATE(p.payment_date) <= ?';
            queryParams.push(end_date);
        }

        query += ' ORDER BY p.payment_date DESC';

        const [payments] = await pool.query(query, queryParams);

        res.json({ payments });
    } catch (error) {
        console.error('Ödeme listeleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Ödeme İptali
const cancelPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.id;

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Ödemeyi kontrol et
            const [payments] = await connection.query(
                'SELECT * FROM payments WHERE id = ? AND company_id = ?',
                [id, company_id]
            );

            if (payments.length === 0) {
                throw new Error('Ödeme bulunamadı');
            }

            if (payments[0].payment_status === 'failed') {
                throw new Error('Başarısız ödeme iptal edilemez');
            }

            // Ödemeyi iptal et
            await connection.query(
                "UPDATE payments SET payment_status = 'failed' WHERE id = ?",
                [id]
            );

            // Fatura durumunu güncelle
            const [remainingPayments] = await connection.query(
                'SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ? AND payment_status = "completed"',
                [payments[0].invoice_id]
            );

            const total_paid = remainingPayments[0].total_paid || 0;

            await connection.query(
                "UPDATE invoices SET payment_status = ? WHERE id = ?",
                [total_paid > 0 ? 'pending' : 'cancelled', payments[0].invoice_id]
            );

            await connection.commit();

            res.json({ message: 'Ödeme başarıyla iptal edildi' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Ödeme iptal hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};

module.exports = {
    createPayment,
    getPayments,
    cancelPayment
}; 