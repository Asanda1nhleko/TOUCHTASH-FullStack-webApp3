const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '@Mut0882084',
    database: 'touchtashdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('MySQL Connected');

module.exports = pool;