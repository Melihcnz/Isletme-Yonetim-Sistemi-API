const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../utils/db');

// Firma Kaydı
const register = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Email kontrolü
        const [existingCompany] = await pool.query('SELECT id FROM companies WHERE email = ?', [email]);
        if (existingCompany.length > 0) {
            return res.status(400).json({ message: 'Bu email adresi zaten kullanımda' });
        }

        // Şifre hashleme
        const hashedPassword = await bcrypt.hash(password, 10);

        // Firma kaydı
        const [result] = await pool.query(
            'INSERT INTO companies (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, phone, address]
        );

        // JWT token oluşturma
        const token = jwt.sign(
            { id: result.insertId, email, type: 'company' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Firma başarıyla kaydedildi',
            token,
            company: {
                id: result.insertId,
                name,
                email
            }
        });
    } catch (error) {
        console.error('Firma kaydı hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Firma Girişi
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Firma kontrolü
        const [companies] = await pool.query('SELECT * FROM companies WHERE email = ?', [email]);
        if (companies.length === 0) {
            return res.status(401).json({ message: 'Geçersiz email veya şifre' });
        }

        const company = companies[0];

        // Şifre kontrolü
        const isValidPassword = await bcrypt.compare(password, company.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Geçersiz email veya şifre' });
        }

        // JWT token oluşturma
        const token = jwt.sign(
            { id: company.id, email: company.email, type: 'company' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Giriş başarılı',
            token,
            company: {
                id: company.id,
                name: company.name,
                email: company.email
            }
        });
    } catch (error) {
        console.error('Firma girişi hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Firma Bilgilerini Getir
const getProfile = async (req, res) => {
    try {
        const [companies] = await pool.query(
            'SELECT id, name, email, phone, address, created_at FROM companies WHERE id = ?',
            [req.user.id]
        );

        if (companies.length === 0) {
            return res.status(404).json({ message: 'Firma bulunamadı' });
        }

        res.json({ company: companies[0] });
    } catch (error) {
        console.error('Firma profili getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

module.exports = {
    register,
    login,
    getProfile
}; 