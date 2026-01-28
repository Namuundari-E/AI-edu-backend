const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exam');
const classRoutes = require('./routes/class');
const gradeRoutes = require('./routes/grade');
const historyRoutes = require('./routes/history');

const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');

const app = express();
//body parser 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});
//cors
app.use(cors({
    origin: '*', // Allow all origins (configure specific origins in production)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Static files for uploaded exams
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/history', historyRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

module.exports = app;