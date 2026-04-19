# Database Schema

## Overview
This document describes the database schema for the Student Attendance System using Oracle Database.

## Tables

### 1. USERS
Primary table for all system users.

```sql
CREATE TABLE users (
  user_id NUMBER PRIMARY KEY,
  email VARCHAR2(255) UNIQUE NOT NULL,
  password_hash VARCHAR2(255) NOT NULL,
  user_type VARCHAR2(20) CHECK (user_type IN ('student', 'professor')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. STUDENTS
Student-specific information.

```sql
CREATE TABLE students (
  student_id NUMBER PRIMARY KEY,
  user_id NUMBER REFERENCES users(user_id),
  roll_number VARCHAR2(50) UNIQUE NOT NULL,
  first_name VARCHAR2(100) NOT NULL,
  last_name VARCHAR2(100) NOT NULL,
  department VARCHAR2(100),
  year NUMBER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. PROFESSORS
Professor-specific information.

```sql
CREATE TABLE professors (
  professor_id NUMBER PRIMARY KEY,
  user_id NUMBER REFERENCES users(user_id),
  first_name VARCHAR2(100) NOT NULL,
  last_name VARCHAR2(100) NOT NULL,
  department VARCHAR2(100),
  designation VARCHAR2(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. COURSES
Course information.

```sql
CREATE TABLE courses (
  course_id NUMBER PRIMARY KEY,
  course_code VARCHAR2(20) UNIQUE NOT NULL,
  course_name VARCHAR2(255) NOT NULL,
  professor_id NUMBER REFERENCES professors(professor_id),
  semester VARCHAR2(20),
  academic_year VARCHAR2(20),
  credits NUMBER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. ENROLLMENTS
Student course enrollments.

```sql
CREATE TABLE enrollments (
  enrollment_id NUMBER PRIMARY KEY,
  student_id NUMBER REFERENCES students(student_id),
  course_id NUMBER REFERENCES courses(course_id),
  enrollment_date DATE DEFAULT SYSDATE,
  status VARCHAR2(20) DEFAULT 'active',
  UNIQUE(student_id, course_id)
);
```

### 6. ATTENDANCE
Attendance records.

```sql
CREATE TABLE attendance (
  attendance_id NUMBER PRIMARY KEY,
  enrollment_id NUMBER REFERENCES enrollments(enrollment_id),
  class_date DATE NOT NULL,
  status VARCHAR2(20) CHECK (status IN ('present', 'absent', 'late')),
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  marked_by NUMBER REFERENCES professors(professor_id),
  remarks VARCHAR2(500)
);
```

## Sequences

Auto-increment sequences for primary keys:

```sql
CREATE SEQUENCE user_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE student_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE professor_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE course_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE enrollment_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE attendance_seq START WITH 1 INCREMENT BY 1;
```

## Indexes

Performance indexes on frequently queried columns:

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_roll ON students(roll_number);
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_enrollment_student ON enrollments(student_id);
CREATE INDEX idx_enrollment_course ON enrollments(course_id);
CREATE INDEX idx_attendance_enrollment ON attendance(enrollment_id);
CREATE INDEX idx_attendance_date ON attendance(class_date);
```

## Triggers

Auto-update timestamps and set primary keys:

```sql
-- Example trigger for users table
CREATE OR REPLACE TRIGGER user_id_trigger
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  SELECT user_seq.NEXTVAL INTO :NEW.user_id FROM dual;
END;
```

## Relationships

- Users (1) → (1) Students
- Users (1) → (1) Professors
- Professors (1) → (*) Courses
- Students (*) → (*) Courses (through Enrollments)
- Enrollments (1) → (*) Attendance
- Professors (1) → (*) Attendance (marked_by)

## Stored Procedures

### calculate_attendance_percentage
Calculates attendance percentage for a student in a course.

```sql
CREATE OR REPLACE PROCEDURE calculate_attendance_percentage(
  p_student_id IN NUMBER,
  p_course_id IN NUMBER,
  p_percentage OUT NUMBER
)
-- Implementation details in database/04_packages/
```

### get_student_attendance_report
Generates a comprehensive attendance report for a student.

```sql
CREATE OR REPLACE PROCEDURE get_student_attendance_report(
  p_student_id IN NUMBER,
  p_cursor OUT SYS_REFCURSOR
)
-- Implementation details in database/04_packages/
```
