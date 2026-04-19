-- ============================================
-- RUN ALL DATABASE SCRIPTS IN ORDER
-- ============================================
-- Execute this file to set up the entire database
-- Usage: sqlplus sagar/2066@XEPDB1 @run_all_scripts.sql
-- ============================================

WHENEVER SQLERROR CONTINUE
SET ECHO ON
SET FEEDBACK ON

PROMPT ============================================
PROMPT Creating Tablespace...
PROMPT ============================================
@01_tablespace.sql

PROMPT
PROMPT ============================================
PROMPT Creating Tables and Sequences...
PROMPT ============================================
@02_tables.sql

PROMPT
PROMPT ============================================
PROMPT Creating Student Package...
PROMPT ============================================
@04_packages/student_pkg.sql

PROMPT
PROMPT ============================================
PROMPT Creating Enrollment Package...
PROMPT ============================================
@04_packages/enrollment_pkg.sql

PROMPT
PROMPT ============================================
PROMPT Creating Attendance Package...
PROMPT ============================================
@04_packages/attendance_pkg.sql

PROMPT
PROMPT ============================================
PROMPT Creating Professor Package...
PROMPT ============================================
@04_packages/professor_pkg.sql

PROMPT
PROMPT ============================================
PROMPT Verifying Installation...
PROMPT ============================================

SELECT 'TABLES' AS object_type, COUNT(*) AS count FROM user_tables
UNION ALL
SELECT 'SEQUENCES', COUNT(*) FROM user_sequences
UNION ALL
SELECT 'PACKAGES', COUNT(*) FROM user_objects WHERE object_type = 'PACKAGE'
UNION ALL
SELECT 'PACKAGE BODIES', COUNT(*) FROM user_objects WHERE object_type = 'PACKAGE BODY';

PROMPT
PROMPT ============================================
PROMPT Listing Created Objects...
PROMPT ============================================

SELECT table_name FROM user_tables ORDER BY table_name;
SELECT sequence_name FROM user_sequences ORDER BY sequence_name;
SELECT object_name, object_type, status FROM user_objects 
WHERE object_type IN ('PACKAGE', 'PACKAGE BODY') 
ORDER BY object_type, object_name;

PROMPT
PROMPT ============================================
PROMPT Database Setup Complete!
PROMPT ============================================

EXIT;
