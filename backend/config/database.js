const oracledb = require('oracledb');
require('dotenv').config();

// Set Oracle Client library path
oracledb.initOracleClient({
    libDir: process.env.ORACLE_LIB_DIR || '/u01/app/oracle/product/21c/lib'
});

async function initializeDatabase() {
    try {
        const connectionPool = await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING,
            // Example: 'localhost:1521/ORCLPDB1'
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 1,
            poolTimeout: 60,
            stmtCacheSize: 40,
            edition: 'ORA$BASE'
        });
        
        console.log('✓ Oracle Database Connection Pool Created');
        return connectionPool;
    } catch (error) {
        console.error('✗ Error initializing database:', error);
        throw error;
    }
}

async function getConnection() {
    try {
        const pool = await initializeDatabase();
        return await pool.getConnection();
    } catch (error) {
        console.error('✗ Error getting connection:', error);
        throw error;
    }
}

module.exports = {
    initializeDatabase,
    getConnection,
    oracledb
};