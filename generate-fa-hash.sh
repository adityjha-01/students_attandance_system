#!/bin/bash

# ============================================
# Helper script to generate bcrypt hash for FA demo credentials
# ============================================

# Navigate to backend directory
cd /home/sagar-jadhav/student-attendance-system/backend
node -e "
const bcrypt = require('bcryptjs');

const password = 'FA123456';

bcrypt.hash(password, 10, function(err, hash) {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }
    console.log('Password:', password);
    console.log('Bcrypt Hash:', hash);
    console.log('');
    console.log('Use this hash in the SQL script:');
    console.log(hash);
    process.exit(0);
});
"
