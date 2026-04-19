const { getConnection } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const oracledb = require('oracledb');

// Mark attendance for a student
async function markAttendance(req, res) {
    let connection;
    try {
        const { course_id, student_id, status, remarks } = req.body;
        const profId = req.user.id;
        
        // Validate required fields
        if (!course_id || !student_id || !status) {
            return errorResponse(res, 'Missing required fields', 400);
        }
        
        // Validate status
        if (!['PRESENT', 'ABSENT', 'LEAVE'].includes(status)) {
            return errorResponse(res, 'Invalid status. Must be PRESENT, ABSENT, or LEAVE', 400);
        }
        
        connection = await getConnection();
        
        // Validate professor owns the course
        const courseCheck = await connection.execute(
            `SELECT COUNT(*) as count FROM courses WHERE course_id = :course_id AND prof_id = :prof_id`,
            [parseInt(course_id), profId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (courseCheck.rows[0].COUNT === 0) {
            return errorResponse(res, 'Unauthorized. You do not teach this course', 403);
        }
        
        // Check if student is enrolled
        const enrollmentCheck = await connection.execute(
            `SELECT COUNT(*) as count FROM enrollments 
             WHERE student_id = :student_id AND course_id = :course_id AND status = 'ACTIVE'`,
            [parseInt(student_id), parseInt(course_id)],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (enrollmentCheck.rows[0].COUNT === 0) {
            return errorResponse(res, 'Student is not enrolled in this course', 404);
        }
        
        // Try to insert, if duplicate then update
        try {
            await connection.execute(
                `INSERT INTO attendance (
                    attendance_id, student_id, course_id, attendance_date,
                    status, marked_by, remarks
                 ) VALUES (
                    attendance_id_seq.NEXTVAL, :student_id, :course_id, TRUNC(SYSDATE),
                    :status, :prof_id, :remarks
                 )`,
                {
                    student_id: parseInt(student_id),
                    course_id: parseInt(course_id),
                    status,
                    prof_id: profId,
                    remarks: remarks || null
                },
                { autoCommit: true }
            );
            
            return successResponse(res, null, 'Attendance marked successfully', 201);
            
        } catch (insertError) {
            // If duplicate, update existing record
            if (insertError.errorNum === 1) { // ORA-00001: unique constraint violated
                await connection.execute(
                    `UPDATE attendance
                     SET status = :status, remarks = :remarks, marked_timestamp = SYSTIMESTAMP
                     WHERE student_id = :student_id 
                       AND course_id = :course_id 
                       AND attendance_date = TRUNC(SYSDATE)`,
                    {
                        status,
                        remarks: remarks || null,
                        student_id: parseInt(student_id),
                        course_id: parseInt(course_id)
                    },
                    { autoCommit: true }
                );
                
                return successResponse(res, null, 'Attendance updated successfully');
            } else {
                throw insertError;
            }
        }
        
    } catch (error) {
        console.error('Mark attendance error:', error);
        return errorResponse(res, 'Failed to mark attendance', 500, error.message);
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

// Get course attendance summary
async function getCourseAttendance(req, res) {
    let connection;
    try {
        const { course_id } = req.params;
        const { date } = req.query;
        
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        
        connection = await getConnection();
        
        const result = await connection.execute(
            `SELECT 
                s.student_id,
                s.name,
                s.email,
                COALESCE(a.status, 'NOT_MARKED') AS attendance_status,
                COALESCE(a.remarks, '') AS remarks
             FROM students s
             JOIN enrollments e ON s.student_id = e.student_id
             LEFT JOIN attendance a ON s.student_id = a.student_id
                                   AND a.course_id = :course_id
                                   AND a.attendance_date = TO_DATE(:attendance_date, 'YYYY-MM-DD')
             WHERE e.course_id = :course_id
               AND e.status = 'ACTIVE'
             ORDER BY s.name`,
            {
                course_id: parseInt(course_id),
                attendance_date: attendanceDate
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        return successResponse(res, {
            date: attendanceDate,
            attendance_records: result.rows
        }, 'Attendance retrieved');
        
    } catch (error) {
        console.error('Get course attendance error:', error);
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

// Bulk mark attendance for multiple students
async function bulkMarkAttendance(req, res) {
    let connection;
    try {
        const { course_id, attendance_date, attendance_records } = req.body;
        const profId = req.user.id;
        
        // Validate required fields
        if (!course_id || !attendance_date || !Array.isArray(attendance_records) || attendance_records.length === 0) {
            return errorResponse(res, 'Missing required fields or empty attendance records', 400);
        }
        
        connection = await getConnection();
        
        // Verify professor owns the course
        const courseCheck = await connection.execute(
            `SELECT course_id FROM courses WHERE course_id = :course_id AND prof_id = :prof_id`,
            [parseInt(course_id), profId]
        );
        
        if (courseCheck.rows.length === 0) {
            return errorResponse(res, 'Unauthorized or course not found', 403);
        }
        
        // Validate attendance date
        const attDate = new Date(attendance_date);
        if (attDate > new Date()) {
            return errorResponse(res, 'Cannot mark attendance for future dates', 400);
        }
        
        let successCount = 0;
        let updateCount = 0;
        
        // Process each attendance record
        for (const record of attendance_records) {
            const { student_id, status } = record;
            
            if (!student_id || !status || !['PRESENT', 'ABSENT', 'LEAVE'].includes(status)) {
                continue; // Skip invalid records
            }
            
            try {
                // Try to insert first
                await connection.execute(
                    `INSERT INTO attendance (
                        attendance_id, student_id, course_id, attendance_date, 
                        status, marked_by
                     ) VALUES (
                        attendance_id_seq.NEXTVAL, :student_id, :course_id, 
                        TO_DATE(:attendance_date, 'YYYY-MM-DD'), :status, :marked_by
                     )`,
                    {
                        student_id: parseInt(student_id),
                        course_id: parseInt(course_id),
                        attendance_date,
                        status,
                        marked_by: profId
                    },
                    { autoCommit: false }
                );
                successCount++;
            } catch (insertError) {
                // If unique constraint violation, update existing record
                if (insertError.errorNum === 1) {
                    await connection.execute(
                        `UPDATE attendance 
                         SET status = :status, marked_by = :marked_by, marked_timestamp = SYSTIMESTAMP
                         WHERE student_id = :student_id 
                           AND course_id = :course_id 
                           AND attendance_date = TO_DATE(:attendance_date, 'YYYY-MM-DD')`,
                        {
                            status,
                            marked_by: profId,
                            student_id: parseInt(student_id),
                            course_id: parseInt(course_id),
                            attendance_date
                        },
                        { autoCommit: false }
                    );
                    updateCount++;
                } else {
                    throw insertError;
                }
            }
        }
        
        await connection.commit();
        
        return successResponse(res, {
            inserted: successCount,
            updated: updateCount,
            total: successCount + updateCount
        }, `Attendance marked successfully for ${successCount + updateCount} students`, 201);
        
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (err) {
                console.error('Rollback error:', err);
            }
        }
        console.error('Bulk mark attendance error:', error);
        return errorResponse(res, 'Failed to mark attendance', 500, error.message);
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
    markAttendance,
    getCourseAttendance,
    bulkMarkAttendance
};
