-- ============================================
-- STUDENT ATTENDANCE SYSTEM - TABLES (FIXED)
-- ============================================

-- Drop existing tables if they exist (in reverse order of dependencies)
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE attendance CASCADE CONSTRAINTS';
EXCEPTION
   WHEN OTHERS THEN NULL;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE enrollments CASCADE CONSTRAINTS';
EXCEPTION
   WHEN OTHERS THEN NULL;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE courses CASCADE CONSTRAINTS';
EXCEPTION
   WHEN OTHERS THEN NULL;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE students CASCADE CONSTRAINTS';
EXCEPTION
   WHEN OTHERS THEN NULL;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE professors CASCADE CONSTRAINTS';
EXCEPTION
   WHEN OTHERS THEN NULL;
END;
/

-- ============================================
-- CREATE PROFESSORS TABLE
-- ============================================

CREATE TABLE professors (
    prof_id NUMBER PRIMARY KEY,
    name VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) NOT NULL UNIQUE,
    department VARCHAR2(50) NOT NULL,
    phone VARCHAR2(15),
    password_hash VARCHAR2(256) NOT NULL,
    created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
    CONSTRAINT prof_email_check CHECK (email LIKE '%@%.%'),
    CONSTRAINT prof_dept_check CHECK (department IN ('CS', 'IT', 'EC', 'MECH', 'CIVIL', 'EE'))
);

CREATE INDEX idx_professors_email ON professors(email);

-- ============================================
-- CREATE STUDENTS TABLE
-- ============================================

CREATE TABLE students (
    student_id NUMBER PRIMARY KEY,
    name VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) NOT NULL UNIQUE,
    enrollment_date DATE DEFAULT SYSDATE NOT NULL,
    phone VARCHAR2(15),
    semester NUMBER(1) NOT NULL,
    cgpa NUMBER(3,2),
    password_hash VARCHAR2(256) NOT NULL,
    CONSTRAINT std_email_check CHECK (email LIKE '%@%.%'),
    CONSTRAINT std_semester_check CHECK (semester BETWEEN 1 AND 8)
);

CREATE INDEX idx_students_email ON students(email);

-- ============================================
-- CREATE COURSES TABLE
-- ============================================

CREATE TABLE courses (
    course_id NUMBER PRIMARY KEY,
    prof_id NUMBER NOT NULL,
    course_name VARCHAR2(100) NOT NULL,
    subject_code VARCHAR2(20) NOT NULL UNIQUE,
    max_enrollment NUMBER(3) NOT NULL DEFAULT 60,
    current_enrollment NUMBER(3) DEFAULT 0,
    credits NUMBER(2) NOT NULL,
    semester_offered NUMBER(1) NOT NULL,
    course_start_date DATE NOT NULL,
    course_end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
    CONSTRAINT fk_course_prof FOREIGN KEY (prof_id) REFERENCES professors(prof_id),
    CONSTRAINT course_max_enroll_check CHECK (max_enrollment > 0 AND max_enrollment <= 200),
    CONSTRAINT course_credits_check CHECK (credits BETWEEN 1 AND 4),
    CONSTRAINT course_semester_check CHECK (semester_offered BETWEEN 1 AND 8),
    CONSTRAINT course_date_check CHECK (course_end_date > course_start_date)
);

CREATE INDEX idx_courses_prof_id ON courses(prof_id);

-- ============================================
-- CREATE ENROLLMENTS TABLE (M:M)
-- ============================================

CREATE TABLE enrollments (
    enrollment_id NUMBER PRIMARY KEY,
    student_id NUMBER NOT NULL,
    course_id NUMBER NOT NULL,
    enrollment_date TIMESTAMP DEFAULT SYSTIMESTAMP,
    status VARCHAR2(20) DEFAULT 'ACTIVE',
    CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    CONSTRAINT enrollment_status_check CHECK (status IN ('ACTIVE', 'DROPPED', 'COMPLETED')),
    CONSTRAINT enrollment_unique UNIQUE (student_id, course_id)
);

CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);

-- ============================================
-- CREATE ATTENDANCE TABLE
-- ============================================

CREATE TABLE attendance (
    attendance_id NUMBER PRIMARY KEY,
    student_id NUMBER NOT NULL,
    course_id NUMBER NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR2(20) NOT NULL,
    marked_by NUMBER NOT NULL,
    marked_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP,
    remarks VARCHAR2(200),
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_course FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_prof FOREIGN KEY (marked_by) REFERENCES professors(prof_id),
    CONSTRAINT attendance_status_check CHECK (status IN ('PRESENT', 'ABSENT', 'LEAVE')),
    CONSTRAINT attendance_date_check CHECK (attendance_date <= TRUNC(SYSDATE)),
    CONSTRAINT attendance_unique UNIQUE (student_id, course_id, attendance_date)
);

CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_course_id ON attendance(course_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

COMMIT;

PROMPT Tables created successfully!
