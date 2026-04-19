const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
    getStudentProfile,
    updateStudentProfile,
    changePassword,
    addSemesterMarks,
    updateSemester
} = require('../controllers/profileController');

// All routes require authentication
router.use(authMiddleware);

// GET /api/profile - Get student profile
router.get('/', getStudentProfile);

// PUT /api/profile - Update student profile
router.put('/', updateStudentProfile);

// PUT /api/profile/password - Change password
router.put('/password', changePassword);

// POST /api/profile/marks - Add semester marks
router.post('/marks', addSemesterMarks);

// PUT /api/profile/semester - Update semester (if eligible)
router.put('/semester', updateSemester);

module.exports = router;
