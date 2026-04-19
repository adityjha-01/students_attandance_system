-- ============================================
-- STUDENT ATTENDANCE SYSTEM - TABLES
-- ============================================

-- ============================================
-- 3. CREATE SEQUENCES FOR ID GENERATION
-- ============================================

CREATE SEQUENCE student_id_seq
  START WITH 1000
  INCREMENT BY 1
  NOMAXVALUE
  NOCYCLE;

CREATE SEQUENCE professor_id_seq
  START WITH 2000
  INCREMENT BY 1
  NOMAXVALUE
  NOCYCLE;

CREATE SEQUENCE course_id_seq
  START WITH 3000
  INCREMENT BY 1
  NOMAXVALUE
  NOCYCLE;

CREATE SEQUENCE enrollment_id_seq
  START WITH 4000
  INCREMENT BY 1
  NOMAXVALUE
  NOCYCLE;

CREATE SEQUENCE attendance_id_seq
  START WITH 5000
  INCREMENT BY 1
  NOMAXVALUE
  NOCYCLE;

-- ============================================
-- 4. CREATE PROFESSORS TABLE
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
) TABLESPACE student_attendance_ts
  STORAGE (INITIAL 100K NEXT 50K PCTINCREASE 0);

CREATE INDEX idx_professors_email ON professors(email);

-- ============================================
-- 5. CREATE STUDENTS TABLE
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
) TABLESPACE student_attendance_ts
  STORAGE (INITIAL 100K NEXT 50K PCTINCREASE 0);

CREATE INDEX idx_students_email ON students(email);

-- ============================================
-- 6. CREATE COURSES TABLE
-- ============================================

CREATE TABLE courses (
    course_id NUMBER PRIMARY KEY,
    prof_id NUMBER NOT NULL REFERENCES professors(prof_id) ON DELETE RESTRICT,
    course_name VARCHAR2(100) NOT NULL,
    subject_code VARCHAR2(20) NOT NULL UNIQUE,
    max_enrollment NUMBER(3) NOT NULL DEFAULT 60,
    current_enrollment NUMBER(3) DEFAULT 0,
    credits NUMBER(2) NOT NULL,
    semester_offered NUMBER(1) NOT NULL,
    course_start_date DATE NOT NULL,
    course_end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
    CONSTRAINT course_max_enroll_check CHECK (max_enrollment > 0 AND max_enrollment <= 200),
    CONSTRAINT course_credits_check CHECK (credits BETWEEN 1 AND 4),
    CONSTRAINT course_semester_check CHECK (semester_offered BETWEEN 1 AND 8),
    CONSTRAINT course_date_check CHECK (course_end_date > course_start_date)
) TABLESPACE student_attendance_ts
  STORAGE (INITIAL 100K NEXT 50K PCTINCREASE 0);

CREATE INDEX idx_courses_prof_id ON courses(prof_id);

-- ============================================
-- 7. CREATE ENROLLMENTS TABLE (M:M)
-- ============================================

CREATE TABLE enrollments (
    enrollment_id NUMBER PRIMARY KEY,
    student_id NUMBER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    course_id NUMBER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP DEFAULT SYSTIMESTAMP,
    status VARCHAR2(20) DEFAULT 'ACTIVE',
    CONSTRAINT enrollment_status_check CHECK (status IN ('ACTIVE', 'DROPPED', 'COMPLETED')),
    CONSTRAINT enrollment_unique UNIQUE (student_id, course_id)
) TABLESPACE student_attendance_ts
  STORAGE (INITIAL 100K NEXT 50K PCTINCREASE 0);

CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);

-- ============================================
-- 8. CREATE ATTENDANCE TABLE
-- ============================================

CREATE TABLE attendance (
    attendance_id NUMBER PRIMARY KEY,
    student_id NUMBER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    course_id NUMBER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR2(20) NOT NULL,
    marked_by NUMBER NOT NULL REFERENCES professors(prof_id) ON DELETE RESTRICT,
    marked_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP,
    remarks VARCHAR2(200),
    CONSTRAINT attendance_status_check CHECK (status IN ('PRESENT', 'ABSENT', 'LEAVE')),
    CONSTRAINT attendance_date_check CHECK (attendance_date <= TRUNC(SYSDATE)),
    CONSTRAINT attendance_unique UNIQUE (student_id, course_id, attendance_date)
) TABLESPACE student_attendance_ts
  STORAGE (INITIAL 100K NEXT 50K PCTINCREASE 0);

CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_course_id ON attendance(course_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

COMMIT;
/