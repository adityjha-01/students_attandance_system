const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { 
    markAttendance, 
    getCourseAttendance,
    bulkMarkAttendance
} = require('../controllers/attendanceController');

// All routes require authentication
router.use(authMiddleware);

// POST /api/attendance/mark
router.post('/mark', markAttendance);

// POST /api/attendance/bulk-mark
router.post('/bulk-mark', bulkMarkAttendance);

// GET /api/attendance/course/:course_id
router.get('/course/:course_id', getCourseAttendance);

module.exports = router;
