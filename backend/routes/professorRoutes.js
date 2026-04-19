const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { 
    createCourse, 
    getProfessorCourses, 
    getEnrolledStudents,
    deleteCourse
} = require('../controllers/professorController');

// All routes require authentication
router.use(authMiddleware);

// POST /api/professors/courses - Create a new course
router.post('/courses', createCourse);

// GET /api/professors/courses - Get all professor's courses
router.get('/courses', getProfessorCourses);

// GET /api/professors/courses/:course_id/students - Get enrolled students
router.get('/courses/:course_id/students', getEnrolledStudents);

// DELETE /api/professors/courses/:course_id - Delete a course
router.delete('/courses/:course_id', deleteCourse);

module.exports = router;
