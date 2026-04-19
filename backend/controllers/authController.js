const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const oracledb = require('oracledb');
const { getConnection } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { isValidEmail, validateRequiredFields } = require('../utils/validators');

// Register new user (student, professor, or faculty_advisor)
async function register(req, res) {
    let connection;
    try {
        const { email, password, name, user_type, department, semester, phone, prof_id_link } = req.body;
        
        // Validate required fields
        const validation = validateRequiredFields(req.body, ['email', 'password', 'name', 'user_type']);
        if (!validation.isValid) {
            return errorResponse(res, `Missing fields: ${validation.missingFields.join(', ')}`, 400);
        }
        
        // Validate email
        if (!isValidEmail(email)) {
            return errorResponse(res, 'Invalid email format', 400);
        }
        
        // Validate user type - must be one of these exact strings
        const validUserTypes = ['student', 'professor', 'faculty_advisor'];
        if (typeof user_type !== 'string' || !validUserTypes.includes(user_type.toLowerCase())) {
            return errorResponse(res, `Invalid user type. Must be one of: ${validUserTypes.join(', ')}`, 400);
        }
        
        // Hash password
        const password_hash = await bcrypt.hash(password, 10);
        
        connection = await getConnection();
        
        // Check if email already exists
        let result = await connection.execute(
            `SELECT student_id FROM students WHERE email = :email 
             UNION 
             SELECT prof_id FROM professors WHERE email = :email
             UNION
             SELECT fa_id FROM faculty_advisors WHERE email = :email`,
            { email }
        );
        
        if (result.rows.length > 0) {
            return errorResponse(res, 'Email already registered', 409);
        }
        
        // Insert based on user type
        if (user_type === 'student') {
            result = await connection.execute(
                `INSERT INTO students (student_id, name, email, password_hash, semester, phone)
                 VALUES (student_id_seq.NEXTVAL, :name, :email, :password_hash, :semester, :phone)
                 RETURNING student_id INTO :id`,
                {
                    name,
                    email,
                    password_hash,
                    semester: semester || 1,
                    phone: phone || null,
                    id: { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }
                }
            );
            
            const studentId = result.outBinds.id[0];
            const studentSemester = semester || 1;
            
            // Auto-assign student to ONLY their semester's FA (semester-specific assignment only)
            const faResult = await connection.execute(
                `SELECT fa_id FROM faculty_advisors 
                 WHERE assigned_semester = :semester
                 AND ROWNUM = 1`,
                [studentSemester],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            
            if (faResult.rows.length > 0) {
                const faId = faResult.rows[0].FA_ID;
                
                // Create student-FA assignment
                const seqResult = await connection.execute('SELECT student_fa_assignment_seq.NEXTVAL FROM DUAL');
                const assignmentId = seqResult.rows[0][0];
                
                await connection.execute(
                    `INSERT INTO student_fa_assignment (assignment_id, student_id, fa_id, assigned_at)
                     VALUES (:assignment_id, :student_id, :fa_id, SYSDATE)`,
                    [assignmentId, studentId, faId]
                );
            }
        } else if (user_type === 'professor') {
            result = await connection.execute(
                `INSERT INTO professors (prof_id, name, email, password_hash, department, phone)
                 VALUES (professor_id_seq.NEXTVAL, :name, :email, :password_hash, :department, :phone)
                 RETURNING prof_id INTO :id`,
                {
                    name,
                    email,
                    password_hash,
                    department: department || 'CS',
                    phone: phone || null,
                    id: { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }
                }
            );
        } else if (user_type === 'faculty_advisor') {
            // Faculty Advisor can be linked to existing professor or standalone
            let linkedProfId = prof_id_link ? parseInt(prof_id_link) : null;
            
            result = await connection.execute(
                `INSERT INTO faculty_advisors (fa_id, prof_id, name, email, password_hash, department, phone, assigned_semester)
                 VALUES (faculty_advisor_seq.NEXTVAL, :prof_id, :name, :email, :password_hash, :department, :phone, :semester)
                 RETURNING fa_id INTO :id`,
                {
                    prof_id: linkedProfId,
                    name,
                    email,
                    password_hash,
                    department: department || 'CS',
                    phone: phone || null,
                    semester: semester && parseInt(semester) > 0 ? parseInt(semester) : null,  // NULL means all semesters
                    id: { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }
                }
            );
        }
        
        await connection.commit();
        
        const userId = result.outBinds.id[0];
        
        // Generate JWT token
        const token = jwt.sign(
            { id: userId, email, user_type },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '24h' }
        );
        
        return successResponse(res, { user_id: userId, token, user_type }, 'Registration successful', 201);
        
    } catch (error) {
        console.error('Register error:', error);
        return errorResponse(res, 'Registration failed', 500, error.message);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

// Login user
async function login(req, res) {
    let connection;
    try {
        const { email, password, user_type } = req.body;
        
        // Validate required fields
        const validation = validateRequiredFields(req.body, ['email', 'password', 'user_type']);
        if (!validation.isValid) {
            return errorResponse(res, `Missing fields: ${validation.missingFields.join(', ')}`, 400);
        }
        
        connection = await getConnection();
        
        let userId, userName, storedHash, semester, department;
        
        // Query based on user type
        if (user_type === 'student') {
            const result = await connection.execute(
                `SELECT student_id, name, password_hash, semester FROM students WHERE email = :email`,
                { email },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            
            if (result.rows.length === 0) {
                return errorResponse(res, 'Invalid credentials', 401);
            }
            
            const student = result.rows[0];
            userId = student.STUDENT_ID;
            userName = student.NAME;
            storedHash = student.PASSWORD_HASH;
            semester = student.SEMESTER;
            
        } else if (user_type === 'professor') {
            const result = await connection.execute(
                `SELECT prof_id, name, password_hash, department FROM professors WHERE email = :email`,
                { email },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            
            if (result.rows.length === 0) {
                return errorResponse(res, 'Invalid credentials', 401);
            }
            
            const professor = result.rows[0];
            userId = professor.PROF_ID;
            userName = professor.NAME;
            storedHash = professor.PASSWORD_HASH;
            department = professor.DEPARTMENT;
        } else if (user_type === 'faculty_advisor') {
            const result = await connection.execute(
                `SELECT fa_id, name, password_hash, department, assigned_semester FROM faculty_advisors WHERE email = :email`,
                { email },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            
            if (result.rows.length === 0) {
                return errorResponse(res, 'Invalid credentials', 401);
            }
            
            const fa = result.rows[0];
            userId = fa.FA_ID;
            userName = fa.NAME;
            storedHash = fa.PASSWORD_HASH;
            department = fa.DEPARTMENT;
            semester = fa.ASSIGNED_SEMESTER;
        } else {
            return errorResponse(res, 'Invalid user type', 400);
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, storedHash);
        
        if (!isPasswordValid) {
            return errorResponse(res, 'Invalid credentials', 401);
        }
        
        // Generate JWT token
        const tokenPayload = { id: userId, email, user_type, name: userName };
        if (user_type === 'student') {
            tokenPayload.semester = semester;
        } else if (user_type === 'professor' || user_type === 'faculty_advisor') {
            tokenPayload.department = department;
            if (user_type === 'faculty_advisor') {
                tokenPayload.assigned_semester = semester;
            }
        }
        
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '24h' }
        );
        
        const userResponse = {
            id: userId,
            name: userName,
            email,
            user_type
        };
        
        if (user_type === 'student') {
            userResponse.semester = semester;
        } else if (user_type === 'professor' || user_type === 'faculty_advisor') {
            userResponse.department = department;
            if (user_type === 'faculty_advisor') {
                userResponse.assigned_semester = semester;
            }
        }
        
        return successResponse(res, {
            token,
            user: userResponse
        }, 'Login successful');
        
    } catch (error) {
        console.error('Login error:', error);
        return errorResponse(res, 'Login failed', 500, error.message);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

module.exports = {
    register,
    login
};
