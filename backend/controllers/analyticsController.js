const { getConnection } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const oracledb = require('oracledb');

// Get students with low attendance (< 75%)
async function getLowAttendanceStudents(req, res) {
    let connection;
    try {
        const userId = req.user.id;
        const userType = req.user.user_type;
        
        connection = await getConnection();
        
        let query, params;
        
        if (userType === 'professor') {
            // Professor sees all students in their courses with low attendance
            query = `
                SELECT DISTINCT
                    s.student_id,
                    s.name as full_name,
                    s.email,
                    c.course_id,
                    c.course_name,
                    c.subject_code,
                    COUNT(a.attendance_id) as total_classes,
                    SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as classes_attended,
                    ROUND(
                        (SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) * 100.0) / 
                        NULLIF(COUNT(a.attendance_id), 0), 
                        2
                    ) as attendance_percentage
                FROM students s
                JOIN enrollments e ON s.student_id = e.student_id
                JOIN courses c ON e.course_id = c.course_id
                LEFT JOIN attendance a ON s.student_id = a.student_id AND a.course_id = c.course_id
                WHERE c.prof_id = :prof_id
                    AND e.status = 'ACTIVE'
                GROUP BY s.student_id, s.name, s.email, c.course_id, c.course_name, c.subject_code
                HAVING ROUND(
                    (SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) * 100.0) / 
                    NULLIF(COUNT(a.attendance_id), 0), 
                    2
                ) < 75
                ORDER BY attendance_percentage ASC
            `;
            params = [userId];
        } else {
            // Student sees their own courses with low attendance
            query = `
                SELECT 
                    s.student_id,
                    s.name as full_name,
                    s.email,
                    c.course_id,
                    c.course_name,
                    c.subject_code,
                    COUNT(a.attendance_id) as total_classes,
                    SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as classes_attended,
                    ROUND(
                        (SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) * 100.0) / 
                        NULLIF(COUNT(a.attendance_id), 0), 
                        2
                    ) as attendance_percentage
                FROM students s
                JOIN enrollments e ON s.student_id = e.student_id
                JOIN courses c ON e.course_id = c.course_id
                LEFT JOIN attendance a ON s.student_id = a.student_id AND a.course_id = c.course_id
                WHERE s.student_id = :student_id
                    AND e.status = 'ACTIVE'
                GROUP BY s.student_id, s.name, s.email, c.course_id, c.course_name, c.subject_code
                HAVING ROUND(
                    (SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) * 100.0) / 
                    NULLIF(COUNT(a.attendance_id), 0), 
                    2
                ) < 75
                ORDER BY attendance_percentage ASC
            `;
            params = [userId];
        }
        
        const result = await connection.execute(query, params, {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });
        
        return successResponse(res, result.rows, 'Low attendance students retrieved');
        
    } catch (error) {
        console.error('Get low attendance error:', error);
        return errorResponse(res, 'Failed to retrieve low attendance data', 500, error.message);
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
    getLowAttendanceStudents
};
