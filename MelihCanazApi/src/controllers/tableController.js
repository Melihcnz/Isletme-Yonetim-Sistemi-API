const pool = require('../utils/db');

// Masa Ekleme
const createTable = async (req, res) => {
    try {
        const { table_number, capacity } = req.body;
        const company_id = req.user.id;

        // Masa numarası kontrolü
        const [existingTable] = await pool.query(
            'SELECT id FROM tables WHERE company_id = ? AND table_number = ?',
            [company_id, table_number]
        );

        if (existingTable.length > 0) {
            return res.status(400).json({ message: 'Bu masa numarası zaten kullanımda' });
        }

        const [result] = await pool.query(
            'INSERT INTO tables (company_id, table_number, capacity) VALUES (?, ?, ?)',
            [company_id, table_number, capacity]
        );

        res.status(201).json({
            message: 'Masa başarıyla eklendi',
            table: {
                id: result.insertId,
                table_number,
                capacity,
                status: 'available'
            }
        });
    } catch (error) {
        console.error('Masa ekleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Masaları Listele
const getTables = async (req, res) => {
    try {
        const company_id = req.user.id;
        const { status } = req.query;

        let query = 'SELECT * FROM tables WHERE company_id = ?';
        const queryParams = [company_id];

        if (status) {
            query += ' AND status = ?';
            queryParams.push(status);
        }

        query += ' ORDER BY table_number';

        const [tables] = await pool.query(query, queryParams);

        res.json({ tables });
    } catch (error) {
        console.error('Masa listeleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Masa Detayı
const getTable = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.id;

        // Masa bilgilerini ve aktif siparişi getir
        const [tables] = await pool.query(
            `SELECT t.*, 
                    o.id as active_order_id,
                    o.total_amount,
                    o.status as order_status,
                    c.name as customer_name
             FROM tables t
             LEFT JOIN orders o ON t.id = o.table_id AND o.status IN ('pending', 'preparing')
             LEFT JOIN customers c ON o.customer_id = c.id
             WHERE t.id = ? AND t.company_id = ?`,
            [id, company_id]
        );

        if (tables.length === 0) {
            return res.status(404).json({ message: 'Masa bulunamadı' });
        }

        res.json({ table: tables[0] });
    } catch (error) {
        console.error('Masa detayı getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Masa Güncelleme
const updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const { table_number, capacity } = req.body;
        const company_id = req.user.id;

        // Masa numarası kontrolü (kendi ID'si hariç)
        const [existingTable] = await pool.query(
            'SELECT id FROM tables WHERE company_id = ? AND table_number = ? AND id != ?',
            [company_id, table_number, id]
        );

        if (existingTable.length > 0) {
            return res.status(400).json({ message: 'Bu masa numarası zaten kullanımda' });
        }

        const [result] = await pool.query(
            'UPDATE tables SET table_number = ?, capacity = ? WHERE id = ? AND company_id = ?',
            [table_number, capacity, id, company_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Masa bulunamadı' });
        }

        res.json({
            message: 'Masa başarıyla güncellendi',
            table: {
                id: parseInt(id),
                table_number,
                capacity
            }
        });
    } catch (error) {
        console.error('Masa güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Masa Silme
const deleteTable = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.id;

        // Masada aktif sipariş var mı kontrol et
        const [activeOrders] = await pool.query(
            "SELECT id FROM orders WHERE table_id = ? AND status IN ('pending', 'preparing')",
            [id]
        );

        if (activeOrders.length > 0) {
            return res.status(400).json({ message: 'Masada aktif sipariş olduğu için silinemez' });
        }

        const [result] = await pool.query(
            'DELETE FROM tables WHERE id = ? AND company_id = ?',
            [id, company_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Masa bulunamadı' });
        }

        res.json({ message: 'Masa başarıyla silindi' });
    } catch (error) {
        console.error('Masa silme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Masa Durumu Güncelleme
const updateTableStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const company_id = req.user.id;

        // Geçerli durumları kontrol et
        if (!['available', 'occupied', 'reserved'].includes(status)) {
            return res.status(400).json({ 
                message: 'Geçersiz durum. Durum "available", "occupied" veya "reserved" olmalıdır' 
            });
        }

        const [result] = await pool.query(
            'UPDATE tables SET status = ? WHERE id = ? AND company_id = ?',
            [status, id, company_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Masa bulunamadı' });
        }

        res.json({
            message: 'Masa durumu başarıyla güncellendi',
            table: {
                id: parseInt(id),
                status
            }
        });
    } catch (error) {
        console.error('Masa durumu güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

module.exports = {
    createTable,
    getTables,
    getTable,
    updateTable,
    deleteTable,
    updateTableStatus
}; 