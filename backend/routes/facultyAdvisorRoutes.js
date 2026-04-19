const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { 
    getPendingEnrollmentRequests,
    getAllEnrollmentRequests,
    approveEnrollmentRequest,
    rejectEnrollmentRequest,
    getAssignedStudents
} = require('../controllers/facultyAdvisorController');

// All routes require authentication
router.use(authMiddleware);

// GET /api/faculty-advisor/pending-requests - Get all pending enrollment requests
router.get('/pending-requests', getPendingEnrollmentRequests);

// GET /api/faculty-advisor/all-requests - Get all requests (pending, approved, rejected)
router.get('/all-requests', getAllEnrollmentRequests);

// POST /api/faculty-advisor/approve - Approve enrollment request
router.post('/approve', approveEnrollmentRequest);

// POST /api/faculty-advisor/reject - Reject enrollment request
router.post('/reject', rejectEnrollmentRequest);

// GET /api/faculty-advisor/assigned-students - Get students assigned to this FA
router.get('/assigned-students', getAssignedStudents);

module.exports = router;
