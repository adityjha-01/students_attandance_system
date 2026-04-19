const { getConnection } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const oracledb = require('oracledb');
const bcrypt = require('bcryptjs');

// Get student profile
async function getStudentProfile(req, res) {
    let connection;
    try {
        const studentId = req.user.id;
        
        connection = await getConnection();
        
        const result = await connection.execute(
            `SELECT 
                student_id, name, email, enrollment_date, phone, semester, cgpa,
                roll_no, address, date_of_birth, blood_group, emergency_contact,
                emergency_contact_name, parent_name, parent_phone, profile_picture,
                last_semester_update, has_backlog
            FROM students 
            WHERE student_id = :studentId`,
            [studentId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (result.rows.length === 0) {
            return errorResponse(res, 'Student not found', 404);
        }
        
        const student = result.rows[0];
        
        // Get semester marks
        const marksResult = await connection.execute(
            `SELECT mark_id, semester, subject_name, marks_obtained, max_marks, 
                    grade, academic_year, created_at
            FROM semester_marks 
            WHERE student_id = :studentId
            ORDER BY semester DESC, subject_name`,
            [studentId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        student.MARKS = marksResult.rows;
        
        return successResponse(res, student, 'Profile retrieved successfully');
        
    } catch (error) {
        console.error('Get profile error:', error);
        return errorResponse(res, 'Failed to retrieve profile', 500, error.message);
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

// Update student profile
async function updateStudentProfile(req, res) {
    let connection;
    try {
        const studentId = req.user.id;
        const {
            name, phone, roll_no, address, date_of_birth, blood_group,
            emergency_contact, emergency_contact_name, parent_name, parent_phone,
            has_backlog
        } = req.body;
        
        connection = await getConnection();
        
        // Build update query dynamically
        const updates = [];
        const values = [];
        
        if (name) { updates.push('name = :name'); values.push(name); }
        if (phone) { updates.push('phone = :phone'); values.push(phone); }
        if (roll_no) { updates.push('roll_no = :roll_no'); values.push(roll_no); }
        if (address) { updates.push('address = :address'); values.push(address); }
        if (date_of_birth) { updates.push('date_of_birth = TO_DATE(:dob, \'YYYY-MM-DD\')'); values.push(date_of_birth); }
        if (blood_group) { updates.push('blood_group = :blood_group'); values.push(blood_group); }
        if (emergency_contact) { updates.push('emergency_contact = :emergency_contact'); values.push(emergency_contact); }
        if (emergency_contact_name) { updates.push('emergency_contact_name = :emergency_contact_name'); values.push(emergency_contact_name); }
        if (parent_name) { updates.push('parent_name = :parent_name'); values.push(parent_name); }
        if (parent_phone) { updates.push('parent_phone = :parent_phone'); values.push(parent_phone); }
        if (has_backlog !== undefined) { updates.push('has_backlog = :has_backlog'); values.push(has_backlog ? 1 : 0); }
        
        if (updates.length === 0) {
            return errorResponse(res, 'No fields to update', 400);
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(studentId);
        
        const query = `UPDATE students SET ${updates.join(', ')} WHERE student_id = :studentId`;
        
        await connection.execute(query, values, { autoCommit: true });
        
        return successResponse(res, null, 'Profile updated successfully');
        
    } catch (error) {
        console.error('Update profile error:', error);
        if (error.errorNum === 1) {
            return errorResponse(res, 'Roll number already exists', 400);
        }
        return errorResponse(res, 'Failed to update profile', 500, error.message);
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

// Change password
async function changePassword(req, res) {
    let connection;
    try {
        const studentId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return errorResponse(res, 'Current and new passwords required', 400);
        }
        
        if (newPassword.length < 6) {
            return errorResponse(res, 'New password must be at least 6 characters', 400);
        }
        
        connection = await getConnection();
        
        // Get current password hash
        const result = await connection.execute(
            `SELECT password_hash FROM students WHERE student_id = :studentId`,
            [studentId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (result.rows.length === 0) {
            return errorResponse(res, 'Student not found', 404);
        }
        
        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, result.rows[0].PASSWORD_HASH);
        if (!isValid) {
            return errorResponse(res, 'Current password is incorrect', 401);
        }
        
        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await connection.execute(
            `UPDATE students SET password_hash = :passwordHash, updated_at = CURRENT_TIMESTAMP 
             WHERE student_id = :studentId`,
            [newPasswordHash, studentId],
            { autoCommit: true }
        );
        
        return successResponse(res, null, 'Password changed successfully');
        
    } catch (error) {
        console.error('Change password error:', error);
        return errorResponse(res, 'Failed to change password', 500, error.message);
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

// Add semester marks
async function addSemesterMarks(req, res) {
    let connection;
    try {
        const studentId = req.user.id;
        const { semester, subject_name, marks_obtained, max_marks, grade, academic_year } = req.body;
        
        if (!semester || !subject_name || marks_obtained === undefined) {
            return errorResponse(res, 'Semester, subject name, and marks are required', 400);
        }
        
        connection = await getConnection();
        
        // Get next mark_id
        const seqResult = await connection.execute(
            `SELECT semester_marks_seq.NEXTVAL as next_id FROM dual`
        );
        const markId = seqResult.rows[0][0];
        
        await connection.execute(
            `INSERT INTO semester_marks 
             (mark_id, student_id, semester, subject_name, marks_obtained, max_marks, grade, academic_year)
             VALUES (:markId, :studentId, :semester, :subjectName, :marksObtained, :maxMarks, :grade, :academicYear)`,
            {
                markId,
                studentId,
                semester: parseInt(semester),
                subjectName: subject_name,
                marksObtained: parseFloat(marks_obtained),
                maxMarks: max_marks ? parseFloat(max_marks) : 100,
                grade: grade || null,
                academicYear: academic_year || null
            },
            { autoCommit: true }
        );
        
        return successResponse(res, { mark_id: markId }, 'Marks added successfully');
        
    } catch (error) {
        console.error('Add marks error:', error);
        return errorResponse(res, 'Failed to add marks', 500, error.message);
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

// Auto-update semester (called periodically or manually)
async function updateSemester(req, res) {
    let connection;
    try {
        const studentId = req.user.id;
        
        connection = await getConnection();
        
        // Get student info
        const studentInfo = await connection.execute(
            `SELECT semester, enrollment_date, last_semester_update, has_backlog 
             FROM students WHERE student_id = :studentId`,
            [studentId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (studentInfo.rows.length === 0) {
            return errorResponse(res, 'Student not found', 404);
        }
        
        const student = studentInfo.rows[0];
        
        // Check if student has backlog
        if (student.HAS_BACKLOG === 1) {
            return errorResponse(res, 'Cannot update semester: Student has backlogs', 400);
        }
        
        // Check if 6 months have passed since last update
        const lastUpdate = student.LAST_SEMESTER_UPDATE || student.ENROLLMENT_DATE;
        const monthsSinceUpdate = Math.floor((new Date() - new Date(lastUpdate)) / (1000 * 60 * 60 * 24 * 30));
        
        if (monthsSinceUpdate < 6) {
            return errorResponse(res, `Cannot update semester yet. ${6 - monthsSinceUpdate} months remaining`, 400);
        }
        
        // Update semester (max 8)
        const newSemester = Math.min(student.SEMESTER + 1, 8);
        
        await connection.execute(
            `UPDATE students 
             SET semester = :newSemester, last_semester_update = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
             WHERE student_id = :studentId`,
            [newSemester, studentId],
            { autoCommit: true }
        );
        
        return successResponse(res, { new_semester: newSemester }, 'Semester updated successfully');
        
    } catch (error) {
        console.error('Update semester error:', error);
        return errorResponse(res, 'Failed to update semester', 500, error.message);
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
    getStudentProfile,
    updateStudentProfile,
    changePassword,
    addSemesterMarks,
    updateSemester
};
