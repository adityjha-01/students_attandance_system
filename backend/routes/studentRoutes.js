const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { 
    getAvailableCourses, 
    getEnrolledCourses, 
    enrollCourse, 
    getStudentAttendance 
} = require('../controllers/studentController');

// All routes require authentication
router.use(authMiddleware);

// GET /api/student/available-courses/:semester
router.get('/available-courses/:semester', getAvailableCourses);

// GET /api/student/enrolled-courses
router.get('/enrolled-courses', getEnrolledCourses);

// POST /api/student/enroll
router.post('/enroll', enrollCourse);

// GET /api/student/attendance/:course_id
router.get('/attendance/:course_id', getStudentAttendance);

module.exports = router;
