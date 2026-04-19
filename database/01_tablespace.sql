-- ============================================
-- STUDENT ATTENDANCE SYSTEM - ORACLE 21c
-- DATABASE SETUP SCRIPT
-- ============================================
-- 1. CREATE TABLESPACE
-- ============================================

CREATE TABLESPACE student_attendance_ts
  DATAFILE '/u01/oradata/student_attendance_ts.dbf' 
  SIZE 500M
  AUTOEXTEND ON NEXT 100M MAXSIZE 2G
  EXTENT MANAGEMENT LOCAL
  SEGMENT SPACE MANAGEMENT AUTO;

-- ============================================
-- 2. CREATE APPLICATION USER
-- ============================================

CREATE USER app_user IDENTIFIED BY app_password123
  DEFAULT TABLESPACE student_attendance_ts;

GRANT CONNECT, RESOURCE TO app_user;
GRANT EXECUTE ON sys.dbms_output TO app_user;
GRANT CREATE TABLE TO app_user;
GRANT CREATE SEQUENCE TO app_user;
GRANT CREATE PROCEDURE TO app_user;
GRANT CREATE PACKAGE TO app_user;

-- Connect as app_user for next steps
-- ALTER SESSION SET CURRENT_SCHEMA = app_user;

COMMIT;
/