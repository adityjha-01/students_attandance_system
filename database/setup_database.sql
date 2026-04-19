-- ============================================
-- COMPLETE DATABASE SETUP FOR SAGAR USER
-- ============================================
SET ECHO ON
SET FEEDBACK ON

PROMPT ============================================
PROMPT Creating/Recreating Tables...
PROMPT ============================================
@02_tables_fixed.sql

PROMPT
PROMPT ============================================
PROMPT Creating Packages...
PROMPT ============================================
@04_packages/student_pkg.sql
@04_packages/enrollment_pkg.sql
@04_packages/attendance_pkg.sql
@04_packages/professor_pkg.sql

PROMPT
PROMPT ============================================
PROMPT Verification
PROMPT ============================================
SELECT 'Tables Created' AS status, COUNT(*) AS count FROM user_tables WHERE table_name IN ('STUDENTS','PROFESSORS','COURSES','ENROLLMENTS','ATTENDANCE');
SELECT 'Sequences' AS status, COUNT(*) AS count FROM user_sequences;
SELECT 'Packages' AS status, COUNT(*) AS count FROM user_objects WHERE object_type = 'PACKAGE';

PROMPT
PROMPT ============================================
PROMPT Setup Complete!
PROMPT ============================================
EXIT;
