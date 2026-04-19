const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./config/database');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
let connectionPool;

async function startServer() {
    try {
        connectionPool = await initializeDatabase();
        console.log('✓ Database Connection Pool Created Successfully');
        
        // Import routes
        const authRoutes = require('./routes/authRoutes');
        const studentRoutes = require('./routes/studentRoutes');
        const professorRoutes = require('./routes/professorRoutes');
        const attendanceRoutes = require('./routes/attendanceRoutes');
        const analyticsRoutes = require('./routes/analyticsRoutes');
        const reportsRoutes = require('./routes/reportsRoutes');
        const profileRoutes = require('./routes/profileRoutes');
        const facultyAdvisorRoutes = require('./routes/facultyAdvisorRoutes');
        
        // Use routes
        app.use('/api/auth', authRoutes);
        app.use('/api/students', studentRoutes);
        app.use('/api/professors', professorRoutes);
        app.use('/api/attendance', attendanceRoutes);
        app.use('/api/analytics', analyticsRoutes);
        app.use('/api/reports', reportsRoutes);
        app.use('/api/profile', profileRoutes);
        app.use('/api/faculty-advisor', facultyAdvisorRoutes);
        
        // Health check endpoint
        app.get('/api/health', (req, res) => {
            res.json({ status: 'Server is running', timestamp: new Date() });
        });
        
        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error('Error:', err.stack);
            res.status(500).json({ 
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        });
        
        // 404 handler
        app.use((req, res) => {
            res.status(404).json({ error: 'Route not found' });
        });
        
        // Start server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`✓ Server running on http://localhost:${PORT}`);
            console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('✗ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    if (connectionPool) {
        try {
            await connectionPool.close();
            console.log('Connection pool closed');
        } catch (error) {
            console.error('Error closing connection pool:', error);
        }
    }
    process.exit(0);
});

startServer();

module.exports = app;