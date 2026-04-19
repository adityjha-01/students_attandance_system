const { getConnection } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const oracledb = require('oracledb');

// Create a new course
async function createCourse(req, res) {
    let connection;
    try {
        const { course_name, subject_code, credits, semester_offered, max_enrollment, course_start_date, course_end_date } = req.body;
        const profId = req.user.id;
        
        // Validate required fields
        if (!course_name || !subject_code || !credits || !semester_offered || !course_start_date || !course_end_date) {
            return errorResponse(res, 'Missing required fields', 400);
        }
        
        // Validate dates
        const startDate = new Date(course_start_date);
        const endDate = new Date(course_end_date);
        if (endDate <= startDate) {
            return errorResponse(res, 'End date must be after start date', 400);
        }
        
        connection = await getConnection();
        
        // Check if subject code exists
        const checkResult = await connection.execute(
            `SELECT course_id FROM courses WHERE subject_code = :subject_code`,
            [subject_code]
        );
        
        if (checkResult.rows.length > 0) {
            return errorResponse(res, 'Subject code already exists', 409);
        }
        
        // Insert course
        await connection.execute(
            `INSERT INTO courses (
                course_id, prof_id, course_name, subject_code, credits, 
                semester_offered, max_enrollment, current_enrollment,
                course_start_date, course_end_date
             ) VALUES (
                course_id_seq.NEXTVAL, :prof_id, :course_name, :subject_code, :credits,
                :semester_offered, :max_enrollment, 0,
                TO_DATE(:course_start_date, 'YYYY-MM-DD'),
                TO_DATE(:course_end_date, 'YYYY-MM-DD')
             )`,
            {
                prof_id: profId,
                course_name,
                subject_code,
                credits: parseInt(credits),
                semester_offered: parseInt(semester_offered),
                max_enrollment: max_enrollment ? parseInt(max_enrollment) : 60,
                course_start_date,
                course_end_date
            },
            { autoCommit: true }
        );
        
        return successResponse(res, null, 'Course created successfully', 201);
        
    } catch (error) {
        console.error('Create course error:', error);
        return errorResponse(res, 'Failed to create course', 500, error.message);
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

// Get professor's courses
async function getProfessorCourses(req, res) {
    let connection;
    try {
        const profId = req.user.id;
        
        connection = await getConnection();
        
        const result = await connection.execute(
            `SELECT 
                course_id,
                course_name,
                subject_code,
                credits,
                semester_offered,
                max_enrollment,
                current_enrollment,
                (max_enrollment - current_enrollment) AS available_seats,
                course_start_date,
                course_end_date,
                created_at
             FROM courses
             WHERE prof_id = :prof_id
             ORDER BY course_start_date DESC`,
            [profId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        return successResponse(res, result.rows, 'Courses retrieved');
        
    } catch (error) {
        console.error('Get professor courses error:', error);
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

// Get enrolled students in a course
async function getEnrolledStudents(req, res) {
    let connection;
    try {
        const { course_id } = req.params;
        const profId = req.user.id;
        
        connection = await getConnection();
        
        // Verify professor owns the course
        const courseCheck = await connection.execute(
            `SELECT course_id FROM courses WHERE course_id = :course_id AND prof_id = :prof_id`,
            [parseInt(course_id), profId]
        );
        
        if (courseCheck.rows.length === 0) {
            return errorResponse(res, 'Unauthorized or course not found', 403);
        }
        
        const result = await connection.execute(
            `SELECT 
                s.student_id,
                s.name,
                s.email,
                s.semester,
                s.cgpa,
                e.enrollment_date,
                e.status AS enrollment_status,
                (SELECT ROUND((SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 2)
                 FROM attendance a
                 WHERE a.student_id = s.student_id AND a.course_id = :course_id) AS attendance_percentage
             FROM students s
             JOIN enrollments e ON s.student_id = e.student_id
             WHERE e.course_id = :course_id
               AND e.status = 'ACTIVE'
             ORDER BY s.name`,
            [parseInt(course_id), parseInt(course_id)],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        return successResponse(res, result.rows, 'Students retrieved');
        
    } catch (error) {
        console.error('Get enrolled students error:', error);
        return errorResponse(res, 'Failed to get students', 500, error.message);
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

// Delete a course
async function deleteCourse(req, res) {
    let connection;
    try {
        const { course_id } = req.params;
        const profId = req.user.id;
        
        connection = await getConnection();
        
        // Verify professor owns the course
        const courseCheck = await connection.execute(
            `SELECT course_id, course_name FROM courses WHERE course_id = :course_id AND prof_id = :prof_id`,
            [parseInt(course_id), profId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (courseCheck.rows.length === 0) {
            return errorResponse(res, 'Unauthorized or course not found', 403);
        }
        
        const courseName = courseCheck.rows[0].COURSE_NAME;
        
        // Check if there are enrollments
        const enrollmentCheck = await connection.execute(
            `SELECT COUNT(*) as count FROM enrollments WHERE course_id = :course_id AND status = 'ACTIVE'`,
            [parseInt(course_id)],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        const enrollmentCount = enrollmentCheck.rows[0].COUNT;
        
        // Delete course (CASCADE will handle enrollments and attendance)
        await connection.execute(
            `DELETE FROM courses WHERE course_id = :course_id`,
            [parseInt(course_id)],
            { autoCommit: true }
        );
        
        return successResponse(res, {
            deleted_enrollments: enrollmentCount
        }, `Course "${courseName}" deleted successfully`);
        
    } catch (error) {
        console.error('Delete course error:', error);
        return errorResponse(res, 'Failed to delete course', 500, error.message);
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
    createCourse,
    getProfessorCourses,
    getEnrolledStudents,
    deleteCourse
};
