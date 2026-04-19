-- ============================================
-- Sample/Initial Data for Student Attendance System
-- ============================================
-- 
-- This file contains sample data for testing and development purposes.
-- DO NOT use this in production environments.
--
-- Usage:
--   sqlplus username/password@database
--   @init_data.sql
--
-- ============================================

-- Sample users will be inserted here
-- Passwords should be hashed using bcrypt before insertion

-- Sample students data
-- INSERT INTO students (student_id, user_id, roll_number, first_name, last_name, department, year)
-- VALUES (...);

-- Sample professors data
-- INSERT INTO professors (professor_id, user_id, first_name, last_name, department, designation)
-- VALUES (...);

-- Sample courses data
-- INSERT INTO courses (course_id, course_code, course_name, professor_id, semester, academic_year, credits)
-- VALUES (...);

-- Sample enrollments data
-- INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date)
-- VALUES (...);

-- Sample attendance records
-- INSERT INTO attendance (attendance_id, enrollment_id, class_date, status, marked_by)
-- VALUES (...);

-- Commit all changes
-- COMMIT;

-- Note: Uncomment and populate the above INSERT statements as needed for testing
