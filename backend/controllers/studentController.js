const { getConnection } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const oracledb = require('oracledb');

// Get available courses for enrollment
async function getAvailableCourses(req, res) {
    let connection;
    try {
        const { semester } = req.params;
        
        connection = await getConnection();
        
        const result = await connection.execute(
            `SELECT 
                c.course_id,
                c.course_name,
                c.subject_code,
                p.name AS professor_name,
                c.credits,
                c.max_enrollment,
                c.current_enrollment,
                (c.max_enrollment - c.current_enrollment) AS seats_available,
                c.course_start_date,
                c.course_end_date
             FROM courses c
             JOIN professors p ON c.prof_id = p.prof_id
             WHERE c.semester_offered = :semester
               AND c.current_enrollment < c.max_enrollment
               AND c.course_start_date > SYSDATE
             ORDER BY c.course_name`,
            [parseInt(semester)],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        return successResponse(res, result.rows, 'Available courses retrieved');
        
    } catch (error) {
        console.error('Get available courses error:', error);
        return errorResponse(res, 'Failed to get courses', 500, error.message);
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

// Get student's enrolled courses
async function getEnrolledCourses(req, res) {
    let connection;
    try {
        const studentId = req.user.id;
        
        connection = await getConnection();
        
        const result = await connection.execute(
            `SELECT 
                c.course_id,
                c.course_name,
                c.subject_code,
                p.name AS professor_name,
                c.credits,
                e.enrollment_date,
                e.status,
                (SELECT ROUND((SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2)
                 FROM attendance a
                 WHERE a.student_id = e.student_id AND a.course_id = e.course_id) AS attendance_percentage
             FROM enrollments e
             JOIN courses c ON e.course_id = c.course_id
             JOIN professors p ON c.prof_id = p.prof_id
             WHERE e.student_id = :student_id
               AND e.status = 'ACTIVE'
             ORDER BY c.course_name`,
            [studentId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        return successResponse(res, result.rows, 'Enrolled courses retrieved');
        
    } catch (error) {
        console.error('Get enrolled courses error:', error);
        return errorResponse(res, 'Failed to get enrolled courses', 500, error.message);
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

// Enroll in a course
async function enrollCourse(req, res) {
    let connection;
    try {
        const { course_id } = req.body;
        const studentId = req.user.id;
        
        if (!course_id) {
            return errorResponse(res, 'Course ID is required', 400);
        }
        
        connection = await getConnection();
        
        // Check if already enrolled
        const checkResult = await connection.execute(
            `SELECT enrollment_id FROM enrollments 
             WHERE student_id = :student_id AND course_id = :course_id AND status = 'ACTIVE'`,
            [studentId, parseInt(course_id)]
        );
        
        if (checkResult.rows.length > 0) {
            return errorResponse(res, 'Already enrolled in this course', 409);
        }
        
        // Check course capacity
        const courseResult = await connection.execute(
            `SELECT current_enrollment, max_enrollment 
             FROM courses WHERE course_id = :course_id`,
            [parseInt(course_id)],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (courseResult.rows.length === 0) {
            return errorResponse(res, 'Course not found', 404);
        }
        
        const course = courseResult.rows[0];
        if (course.CURRENT_ENROLLMENT >= course.MAX_ENROLLMENT) {
            return errorResponse(res, 'Course is full', 409);
        }
        
        // Get student's assigned FA (semester-specific)
        const faAssignmentResult = await connection.execute(
            `SELECT fa_id FROM student_fa_assignment 
             WHERE student_id = :student_id`,
            [studentId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        let faId = null;
        if (faAssignmentResult.rows.length > 0) {
            faId = faAssignmentResult.rows[0].FA_ID;
            console.log(`✓ Student ${studentId} assigned to FA ${faId}`);
        } else {
            console.log(`⚠ Student ${studentId} NOT assigned to any FA - auto-assigning now`);
            // If not assigned, try to auto-assign based on course semester
            const autoAssignResult = await connection.execute(
                `SELECT fa_id FROM faculty_advisors 
                 WHERE assigned_semester = :semester
                 AND ROWNUM = 1`,
                [course.SEMESTER_OFFERED],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            
            if (autoAssignResult.rows.length > 0) {
                faId = autoAssignResult.rows[0].FA_ID;
                const seqResult = await connection.execute('SELECT student_fa_assignment_seq.NEXTVAL FROM DUAL');
                const assignmentId = seqResult.rows[0][0];
                await connection.execute(
                    `INSERT INTO student_fa_assignment (assignment_id, student_id, fa_id, assigned_at)
                     VALUES (:assignment_id, :student_id, :fa_id, SYSDATE)`,
                    [assignmentId, studentId, faId]
                );
                console.log(`✓ Auto-assigned Student ${studentId} to FA ${faId}`);
            }
        }
        
        // Create enrollment request with assigned FA
        const requestSeqResult = await connection.execute('SELECT enrollment_request_seq.NEXTVAL FROM DUAL');
        const requestId = requestSeqResult.rows[0][0];
        
        await connection.execute(
            `INSERT INTO enrollment_requests (request_id, student_id, course_id, fa_id, status, request_date)
             VALUES (:request_id, :student_id, :course_id, :fa_id, 'PENDING', SYSDATE)`,
            [requestId, studentId, parseInt(course_id), faId],
            { autoCommit: false }
        );
        
        await connection.commit();
        
        if (faId) {
            console.log(`✓ Request ${requestId}: Student ${studentId} → FA ${faId}`);
        } else {
            console.log(`⚠ Request ${requestId}: Student ${studentId} → NO FA ASSIGNED`);
        }
        
        return successResponse(res, { request_id: requestId, fa_id: faId }, 'Enrollment request submitted', 201);
        
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (err) {
                console.error('Rollback error:', err);
            }
        }
        console.error('Enroll course error:', error);
        return errorResponse(res, 'Failed to enroll', 500, error.message);
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

// Get student's attendance for a course
async function getStudentAttendance(req, res) {
    let connection;
    try {
        const { course_id } = req.params;
        const studentId = req.user.id;
        
        connection = await getConnection();
        
        const result = await connection.execute(
            `SELECT 
                attendance_id,
                attendance_date,
                status,
                remarks,
                marked_timestamp
             FROM attendance
             WHERE student_id = :student_id AND course_id = :course_id
             ORDER BY attendance_date DESC`,
            [studentId, parseInt(course_id)],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        // Get attendance percentage
        const percentResult = await connection.execute(
            `SELECT 
                COUNT(*) as total_classes,
                SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
                ROUND((SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 2) as percentage
             FROM attendance
             WHERE student_id = :student_id AND course_id = :course_id`,
            [studentId, parseInt(course_id)],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        const stats = percentResult.rows[0] || { TOTAL_CLASSES: 0, PRESENT_COUNT: 0, PERCENTAGE: 0 };
        
        return successResponse(res, {
            attendance_records: result.rows,
            total_classes: stats.TOTAL_CLASSES,
            present_count: stats.PRESENT_COUNT,
            attendance_percentage: stats.PERCENTAGE || 0
        }, 'Attendance retrieved');
        
    } catch (error) {
        console.error('Get attendance error:', error);
        return errorResponse(res, 'Failed to get attendance', 500, error.message);
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
    getAvailableCourses,
    getEnrolledCourses,
    enrollCourse,
    getStudentAttendance
};
