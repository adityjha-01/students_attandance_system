const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { generateCourseExcel, generateCoursePDF } = require('../controllers/reportsController');

// All routes require authentication
router.use(authMiddleware);

// GET /api/reports/course/:courseId/excel - Generate Excel report
router.get('/course/:courseId/excel', generateCourseExcel);

// GET /api/reports/course/:courseId/pdf - Generate PDF report
router.get('/course/:courseId/pdf', generateCoursePDF);

module.exports = router;
