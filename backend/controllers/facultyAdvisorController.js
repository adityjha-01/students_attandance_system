const { getConnection } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const oracledb = require('oracledb');

// Get all pending enrollment requests for FA (only from their semester's assigned students)
async function getPendingEnrollmentRequests(req, res) {
    let connection;
    try {
        const faId = req.user.id;
        
        connection = await getConnection();
        
        const result = await connection.execute(
            `SELECT 
                er.request_id,
                er.student_id,
                s.name AS student_name,
                s.email AS student_email,
                s.semester AS student_semester,
                s.cgpa,
                er.course_id,
                c.course_name,
                c.subject_code,
                c.semester_offered,
                p.name AS professor_name,
                c.credits,
                c.max_enrollment,
                c.current_enrollment,
                er.status,
                TO_CHAR(er.request_date, 'YYYY-MM-DD HH24:MI') AS request_date
             FROM enrollment_requests er
             JOIN students s ON er.student_id = s.student_id
             JOIN courses c ON er.course_id = c.course_id
             JOIN professors p ON c.prof_id = p.prof_id
             WHERE er.status = 'PENDING'
               AND er.fa_id = :fa_id
             ORDER BY er.request_date DESC`,
            [faId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        return successResponse(res, result.rows, 'Pending enrollment requests retrieved');
        
    } catch (error) {
        console.error('Get pending enrollment requests error:', error);
        return errorResponse(res, 'Failed to get requests', 500, error.message);
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

// Get all enrollment requests history for this FA (pending, approved, rejected - only their students)
async function getAllEnrollmentRequests(req, res) {
    let connection;
    try {
        const faId = req.user.id;
        const { status = 'all' } = req.query;
        
        connection = await getConnection();
        
        let query = `SELECT 
                        er.request_id,
                        er.student_id,
                        s.name AS student_name,
                        s.email AS student_email,
                        s.semester AS student_semester,
                        er.course_id,
                        c.course_name,
                        c.subject_code,
                        c.semester_offered,
                        er.status,
                        TO_CHAR(er.request_date, 'YYYY-MM-DD HH24:MI') AS request_date,
                        TO_CHAR(er.approval_date, 'YYYY-MM-DD HH24:MI') AS approval_date,
                        er.rejection_reason
                     FROM enrollment_requests er
                     JOIN students s ON er.student_id = s.student_id
                     JOIN courses c ON er.course_id = c.course_id
                     WHERE er.fa_id = :fa_id`;
        
        const params = [faId];
        
        if (status !== 'all') {
            query += ` AND er.status = :status`;
            params.push(status.toUpperCase());
        }
        
        query += ` ORDER BY er.request_date DESC`;
        
        const result = await connection.execute(query, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        return successResponse(res, result.rows, 'Enrollment requests retrieved');
        
    } catch (error) {
        console.error('Get enrollment requests error:', error);
        return errorResponse(res, 'Failed to get requests', 500, error.message);
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

// Approve enrollment request
async function approveEnrollmentRequest(req, res) {
    let connection;
    try {
        const faId = req.user.id;
        const { request_id } = req.body;
        
        console.log(`📝 FA ${faId} attempting to approve request ${request_id}`);
        connection = await getConnection();
        
        // Get request details - verify FA owns this request
        const requestResult = await connection.execute(
            `SELECT student_id, course_id, status, fa_id
             FROM enrollment_requests 
             WHERE request_id = :request_id AND fa_id = :fa_id`,
            [request_id, faId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (requestResult.rows.length === 0) {
            console.log(`❌ Request ${request_id} not found for FA ${faId}`);
            return errorResponse(res, 'Request not found or not assigned to you', 404);
        }
        
        const row = requestResult.rows[0];
        console.log(`📋 Raw row data:`, row);
        const student_id = row.STUDENT_ID;
        const course_id = row.COURSE_ID;
        const req_status = row.STATUS;
        const fa_id = row.FA_ID;
        console.log(`✓ Found request: Student ${student_id}, Course ${course_id}, Status '${req_status}' (type: ${typeof req_status})`);
        
        if (!req_status || req_status.trim() !== 'PENDING') {
            console.log(`❌ Request status is '${req_status}', not PENDING`);
            return errorResponse(res, 'Request is not pending', 400);
        }
        
        // Check if space available in course
        const courseResult = await connection.execute(
            `SELECT current_enrollment, max_enrollment 
             FROM courses 
             WHERE course_id = :course_id`,
            [course_id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (courseResult.rows.length === 0) {
            console.log(`❌ Course ${course_id} not found`);
            return errorResponse(res, 'Course not found', 404);
        }
        
        const course = courseResult.rows[0];
        const current_enrollment = course.CURRENT_ENROLLMENT;
        const max_enrollment = course.MAX_ENROLLMENT;
        console.log(`📊 Course ${course_id}: ${current_enrollment}/${max_enrollment} enrolled`);
        
        if (current_enrollment >= max_enrollment) {
            // Update request as rejected
            await connection.execute(
                `UPDATE enrollment_requests 
                 SET status = 'REJECTED', 
                     rejection_reason = 'Course is now full',
                     approval_date = SYSTIMESTAMP
                 WHERE request_id = :request_id`,
                [request_id]
            );
            
            await connection.commit();
            return errorResponse(res, 'Course is full. Request rejected', 400);
        }
        
        // Create actual enrollment
        const seqResult = await connection.execute('SELECT enrollment_id_seq.NEXTVAL FROM DUAL');
        const enrollmentId = seqResult.rows[0][0];
        
        await connection.execute(
            `INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, status)
             VALUES (:enrollment_id, :student_id, :course_id, SYSTIMESTAMP, 'ACTIVE')`,
            [enrollmentId, student_id, course_id]
        );
        
        // Update course enrollment count
        await connection.execute(
            `UPDATE courses 
             SET current_enrollment = current_enrollment + 1 
             WHERE course_id = :course_id`,
            [course_id]
        );
        
        // Update request status
        await connection.execute(
            `UPDATE enrollment_requests 
             SET status = 'APPROVED', approval_date = SYSTIMESTAMP
             WHERE request_id = :request_id`,
            [request_id]
        );
        
        await connection.commit();
        
        console.log(`✓ Approval complete: Student ${student_id} enrolled in Course ${course_id}`);
        return successResponse(res, { enrollment_id: enrollmentId }, 'Enrollment approved successfully');
        
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Rollback error:', rollbackError);
        }
        console.error('Approve enrollment request error:', error);
        return errorResponse(res, 'Failed to approve request', 500, error.message);
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

// Reject enrollment request
async function rejectEnrollmentRequest(req, res) {
    let connection;
    try {
        const faId = req.user.id;
        const { request_id, rejection_reason } = req.body;
        
        if (!rejection_reason) {
            return errorResponse(res, 'Rejection reason is required', 400);
        }
        
        connection = await getConnection();
        
        // Verify request exists and is assigned to this FA
        const requestResult = await connection.execute(
            `SELECT status FROM enrollment_requests 
             WHERE request_id = :request_id AND fa_id = :fa_id`,
            [request_id, faId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (requestResult.rows.length === 0) {
            return errorResponse(res, 'Request not found or not assigned to you', 404);
        }
        
        if (requestResult.rows[0].STATUS !== 'PENDING') {
            return errorResponse(res, 'Request is not pending', 400);
        }
        
        // Update request status
        await connection.execute(
            `UPDATE enrollment_requests 
             SET status = 'REJECTED', 
                 rejection_reason = :reason,
                 approval_date = SYSTIMESTAMP
             WHERE request_id = :request_id`,
            [rejection_reason, request_id]
        );
        
        await connection.commit();
        
        return successResponse(res, {}, 'Enrollment request rejected');
        
    } catch (error) {
        console.error('Reject enrollment request error:', error);
        return errorResponse(res, 'Failed to reject request', 500, error.message);
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

// Get assigned students
async function getAssignedStudents(req, res) {
    let connection;
    try {
        const faId = req.user.id;
        
        connection = await getConnection();
        
        const result = await connection.execute(
            `SELECT 
                s.student_id,
                s.name,
                s.email,
                s.semester,
                s.cgpa,
                (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = s.student_id AND e.status = 'ACTIVE') AS active_enrollments,
                (SELECT COUNT(*) FROM enrollment_requests er WHERE er.student_id = s.student_id AND er.status = 'PENDING') AS pending_requests
             FROM students s
             JOIN student_fa_assignment sfa ON s.student_id = sfa.student_id
             WHERE sfa.fa_id = :fa_id
             ORDER BY s.name`,
            [faId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        return successResponse(res, result.rows, 'Assigned students retrieved');
        
    } catch (error) {
        console.error('Get assigned students error:', error);
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

module.exports = {
    getPendingEnrollmentRequests,
    getAllEnrollmentRequests,
    approveEnrollmentRequest,
    rejectEnrollmentRequest,
    getAssignedStudents
};
