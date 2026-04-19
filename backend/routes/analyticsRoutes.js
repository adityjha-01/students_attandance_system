const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getLowAttendanceStudents } = require('../controllers/analyticsController');

// All routes require authentication
router.use(authMiddleware);

// GET /api/analytics/low-attendance - Get students with low attendance
router.get('/low-attendance', getLowAttendanceStudents);

module.exports = router;
