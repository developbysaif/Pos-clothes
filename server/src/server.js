require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const returnRoutes = require('./routes/returns');
const inventoryRoutes = require('./routes/inventory');
const purchaseRoutes = require('./routes/purchases');
const customerRoutes = require('./routes/customers');
const supplierRoutes = require('./routes/suppliers');
const expenseRoutes = require('./routes/expenses');
const cashRegisterRoutes = require('./routes/cashRegister');
const reportRoutes = require('./routes/reports');
const settingRoutes = require('./routes/settings');
const employeeRoutes = require('./routes/employees');
const categoryRoutes = require('./routes/categories');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// 1. Socket.IO Setup for Real-Time POS terminal events
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[WebSocket] Cashier terminal connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[WebSocket] Cashier terminal disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// 2. Global Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'MR BILAL LADIES WEAR POS & INVENTORY API',
    database: 'MySQL 8.4 via Prisma ORM',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 4. REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/cash-register', cashRegisterRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/categories', categoryRoutes);

// 5. Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Express API] POS Server running on port ${PORT}`);
  console.log(`[WebSocket] Socket.IO ready on port ${PORT}`);
});

module.exports = { app, server, io };
