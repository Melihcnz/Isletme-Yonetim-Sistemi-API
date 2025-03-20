const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Route'ları import et
const companyRoutes = require('./src/routes/companyRoutes');
const userRoutes = require('./src/routes/userRoutes');
const productRoutes = require('./src/routes/productRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const tableRoutes = require('./src/routes/tableRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'API çalışıyor!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
}); 