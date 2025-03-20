const bcrypt = require('bcryptjs');
const pool = require('../utils/db');

// Kullanıcı Ekleme
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const company_id = req.user.id;

        // Email kontrolü
        const [existingUser] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Bu email adresi zaten kullanımda' });
        }

        // Şifre hashleme
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO users (company_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [company_id, name, email, hashedPassword, role]
        );

        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu',
            user: {
                id: result.insertId,
                name,
                email,
                role
            }
        });
    } catch (error) {
        console.error('Kullanıcı oluşturma hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Kullanıcıları Listele
const getUsers = async (req, res) => {
    try {
        const company_id = req.user.id;
        
        const [users] = await pool.query(
            'SELECT id, name, email, role, created_at FROM users WHERE company_id = ?',
            [company_id]
        );

        res.json({ users });
    } catch (error) {
        console.error('Kullanıcı listeleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

module.exports = {
    createUser,
    getUsers
}; 