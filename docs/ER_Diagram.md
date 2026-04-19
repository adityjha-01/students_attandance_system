# Entity-Relationship Diagram

## Overview
This document describes the database schema and relationships in the Student Attendance System. The system manages students, faculty advisors, professors, courses, enrollments, attendance tracking, and academic performance.

---

## Core Entities

### 1. **STUDENTS**
Stores information about registered students in the system.

**Attributes:**
- `student_id` (PK, NUMBER) - Unique identifier
- `name` (VARCHAR2) - Student name
- `email` (VARCHAR2) - University email
- `password_hash` (VARCHAR2) - Encrypted password
- `semester` (NUMBER) - Current semester (1-6)
- `cgpa` (NUMBER) - Cumulative GPA
- `phone` (VARCHAR2) - Contact phone number
- `created_at` (TIMESTAMP) - Registration timestamp

**Key Constraint:** Email is unique per student

---

### 2. **PROFESSORS**
Stores information about faculty members who teach courses.

**Attributes:**
- `prof_id` (PK, NUMBER) - Unique identifier
- `name` (VARCHAR2) - Professor name
- `email` (VARCHAR2) - University email
- `password_hash` (VARCHAR2) - Encrypted password
- `department` (VARCHAR2) - Department (e.g., CS, IT)
- `phone` (VARCHAR2) - Contact phone number
- `created_at` (TIMESTAMP) - Registration timestamp

**Key Constraint:** Email is unique per professor

---

### 3. **FACULTY_ADVISORS**
Stores information about faculty advisors who approve student course enrollments.

**Attributes:**
- `fa_id` (PK, NUMBER) - Unique identifier
- `name` (VARCHAR2) - Faculty advisor name
- `email` (VARCHAR2) - University email
- `password_hash` (VARCHAR2) - Encrypted password
- `department` (VARCHAR2) - Department
- `phone` (VARCHAR2) - Contact phone number
- `assigned_semester` (NUMBER) - Assigned semester (1-6, or NULL for all)
- `prof_id` (FK, NUMBER, nullable) - Optional: linked professor
- `created_at` (TIMESTAMP) - Registration timestamp

**Key Constraint:** Email is unique per FA

---

### 4. **COURSES**
Stores course information offered by the university.

**Attributes:**
- `course_id` (PK, NUMBER) - Unique identifier
- `course_name` (VARCHAR2) - Course name
- `subject_code` (VARCHAR2) - Course code (e.g., CS001)
- `credits` (NUMBER) - Credit hours (typically 3-4)
- `max_enrollment` (NUMBER) - Maximum students allowed
- `current_enrollment` (NUMBER) - Current enrollment count
- `semester_offered` (NUMBER) - Semester when offered
- `prof_id` (FK, NUMBER) - Assigned professor
- `created_at` (TIMESTAMP) - Creation timestamp

**Key Constraint:** subject_code is unique

---

### 5. **ENROLLMENTS**
Tracks which students are enrolled in which courses (after FA approval).

**Attributes:**
- `enrollment_id` (PK, NUMBER) - Unique identifier
- `student_id` (FK, NUMBER) - Enrolled student
- `course_id` (FK, NUMBER) - Enrolled course
- `enrollment_date` (TIMESTAMP) - Date of enrollment
- `status` (VARCHAR2) - Status (ACTIVE, DROPPED, COMPLETED)

**Key Constraint:** Composite unique (student_id, course_id)

---

### 6. **ENROLLMENT_REQUESTS**
Tracks enrollment requests submitted by students that require FA approval.

**Attributes:**
- `request_id` (PK, NUMBER) - Unique identifier
- `student_id` (FK, NUMBER) - Student making request
- `course_id` (FK, NUMBER) - Course requested
- `fa_id` (FK, NUMBER, nullable) - Assigned faculty advisor
- `status` (VARCHAR2) - Status (PENDING, APPROVED, REJECTED)
- `request_date` (TIMESTAMP) - Date request submitted
- `approval_date` (TIMESTAMP, nullable) - Date of approval/rejection
- `rejection_reason` (VARCHAR2, nullable) - Reason if rejected

**Key Constraint:** Each student can request each course once

**Workflow:**
1. Student submits enrollment request
2. Request assigned to semester-appropriate FA
3. FA approves/rejects based on available capacity and student qualifications
4. Upon approval: enrollment created, request status → APPROVED
5. Upon rejection: request status → REJECTED with reason

---

### 7. **STUDENT_FA_ASSIGNMENT**
Maps students to their assigned faculty advisors.

**Attributes:**
- `assignment_id` (PK, NUMBER) - Unique identifier
- `student_id` (FK, NUMBER) - Assigned student
- `fa_id` (FK, NUMBER) - Assigned faculty advisor
- `assigned_at` (DATE) - Date of assignment

**Key Constraint:** Each student has ONE primary FA per semester

**Assignment Logic:**
- Auto-assigned upon student registration based on `semester`
- FA's `assigned_semester` must match student's `semester`
- Only ONE FA per student allowed at a time

---

### 8. **ATTENDANCE**
Records daily attendance for enrolled students.

**Attributes:**
- `attendance_id` (PK, NUMBER) - Unique identifier
- `enrollment_id` (FK, NUMBER) - Which enrollment
- `class_date` (DATE) - Date of class
- `status` (VARCHAR2) - Attendance status (PRESENT, ABSENT, LATE)
- `marked_at` (TIMESTAMP) - When attendance was marked
- `marked_by` (FK, NUMBER) - Professor who marked attendance

**Key Constraint:** One entry per enrollment per date

---

### 9. **SEMESTER_MARKS**
Stores grade/marks information for completed courses.

**Attributes:**
- `marks_id` (PK, NUMBER) - Unique identifier
- `enrollment_id` (FK, NUMBER) - Completed enrollment
- `marks` (NUMBER) - Marks obtained (0-100)
- `grade` (VARCHAR2) - Letter grade (A, B, C, D, F)
- `gpa` (NUMBER) - Grade point average
- `recorded_at` (TIMESTAMP) - When recorded

**Key Constraint:** One entry per enrollment

---

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                       STUDENTS                                      │
│  (student_id, name, email, semester, cgpa, phone, ...)             │
└────────────┬──────────────────────┬──────────────────┬──────────────┘
             │                      │                  │
             │ (student_id FK)      │ (student_id FK)  │ (student_id FK)
             │                      │                  │
    ┌────────▼────────┐   ┌────────▼──────────┐   ┌────▼───────────────┐
    │  ENROLLMENTS    │   │ENROLLMENT_REQUESTS│   │STUDENT_FA_ASSIGN.. │
    │  ────────────   │   │  ──────────────   │   │  ──────────────    │
    │ enrollment_id   │   │  request_id       │   │ assignment_id      │
    │ course_id (FK)◄─┼───┤  course_id (FK)   │   │ fa_id (FK)◄────┐   │
    │ status          │   │  fa_id (FK)───┐   │   │ assigned_at    │   │
    │ enrollment_date │   │  status       │   │   └────────────────┘   │
    └────────┬────────┘   │  request_date └─┐ │                        │
             │            │  approval_date  └─┼────────────────────┐   │
             │ (enrollment_id FK)             │                    │   │
             │                                │  ┌─────────────────▼───┴──┐
    ┌────────▼──────────────┐                 │  │  FACULTY_ADVISORS      │
    │     ATTENDANCE        │                 │  │  ───────────────       │
    │     ──────────        │                 │  │  fa_id                 │
    │  attendance_id        │                 │  │  name, email, dept     │
    │  class_date           │                 │  │  assigned_semester     │
    │  status               │                 │  │  prof_id (FK)      ┐   │
    │  marked_by (FK)───┐   │                 │  └────────────────────┤───┘
    │  marked_at        │   │                 │                       │
    └───────────────────┘   │                 │     ┌─────────────────┘
                            │                 │     │ (prof_id FK)
                            │                 │     │
                            │  ┌──────────────┘     │
                            │  │ (prof_id FK)       │
                            │  │                    │
    ┌───────────────────────▼──▼─────┐    ┌────────▼────────────┐
    │        COURSES                  │    │   PROFESSORS        │
    │  ─────────────────────────────  │    │  ──────────────     │
    │  course_id                      │    │  prof_id            │
    │  course_name, subject_code      │    │  name, email, dept  │
    │  credits, semester_offered      │    │  phone              │
    │  max_enrollment, current_enum.. │    │  created_at         │
    │  prof_id (FK)───────────────────┤───►└─────────────────────┘
    └───────────┬─────────────────────┘
                │ (course_id FK)
                │
    ┌───────────▼──────────────────┐
    │    SEMESTER_MARKS            │
    │  ───────────────────────     │
    │  marks_id                    │
    │  enrollment_id (FK)          │
    │  marks, grade, gpa           │
    │  recorded_at                 │
    └──────────────────────────────┘
```

---

## Key Relationships

| From | To | Type | Cardinality | Description |
|------|----|----|---|---|
| STUDENTS | STUDENT_FA_ASSIGNMENT | One-to-Many | 1:N | One student assigned to one FA |
| FACULTY_ADVISORS | STUDENT_FA_ASSIGNMENT | One-to-Many | 1:N | One FA advises many students |
| STUDENTS | ENROLLMENTS | One-to-Many | 1:N | One student enrolls in many courses |
| COURSES | ENROLLMENTS | One-to-Many | 1:N | One course has many students |
| ENROLLMENTS | ATTENDANCE | One-to-Many | 1:N | One enrollment has many attendance records |
| STUDENTS | ENROLLMENT_REQUESTS | One-to-Many | 1:N | One student makes many requests |
| COURSES | ENROLLMENT_REQUESTS | One-to-Many | 1:N | One course has many requests |
| FACULTY_ADVISORS | ENROLLMENT_REQUESTS | One-to-Many | 1:N | One FA processes many requests |
| PROFESSORS | COURSES | One-to-Many | 1:N | One professor teaches many courses |
| PROFESSORS | ATTENDANCE | One-to-Many | 1:N | One professor marks many attendance records |
| ENROLLMENTS | SEMESTER_MARKS | One-to-One | 1:1 | One enrollment has one marks record |
| PROFESSORS | FACULTY_ADVISORS | One-to-Many | 1:N | One professor can be linked to one FA (optional) |

---

## Workflow: Enrollment Process

### Current Workflow (With Faculty Advisor Approval)

```
1. STUDENT REGISTRATION
   ├─ Register as Student
   ├─ Auto-assigned to Semester FA
   └─ Entry created in STUDENT_FA_ASSIGNMENT

2. COURSE ENROLLMENT (Request Phase)
   ├─ Student views available courses
   ├─ Student clicks "Enroll"
   ├─ Entry created in ENROLLMENT_REQUESTS
   │  ├─ student_id = logged-in student
   │  ├─ course_id = selected course
   │  ├─ fa_id = assigned FA (from STUDENT_FA_ASSIGNMENT)
   │  ├─ status = 'PENDING'
   │  └─ request_date = now()
   └─ Notification sent to assigned FA

3. FA REVIEW & APPROVAL
   ├─ FA logs in → Views "Pending Requests"
   ├─ FA sees ONLY requests where fa_id = their fa_id
   ├─ FA reviews request details
   ├─ FA can:
   │  ├─ APPROVE (if course has capacity)
   │  │  ├─ Insert entry in ENROLLMENTS
   │  │  ├─ Increment COURSES.current_enrollment
   │  │  ├─ Update ENROLLMENT_REQUESTS.status = 'APPROVED'
   │  │  └─ Update ENROLLMENT_REQUESTS.approval_date = now()
   │  │
   │  └─ REJECT (if no capacity or student not eligible)
   │     ├─ Update ENROLLMENT_REQUESTS.status = 'REJECTED'
   │     ├─ Set ENROLLMENT_REQUESTS.rejection_reason
   │     └─ Update ENROLLMENT_REQUESTS.approval_date = now()
   │
   └─ Notification sent to student

4. STUDENT VIEWS ENROLLMENT
   ├─ Student logs in
   ├─ Views "My Courses"
   ├─ Shows ONLY approved enrollments (from ENROLLMENTS table)
   └─ Can view enrollment status and attendance

5. PROFESSOR MARKS ATTENDANCE
   ├─ Professor logs in
   ├─ Selects a course
   ├─ Marks attendance for each enrolled student
   ├─ Entry created in ATTENDANCE
   └─ Updates are reflected in student's profile

6. END OF SEMESTER
   ├─ Professor enters marks for course
   ├─ Entries created in SEMESTER_MARKS
   ├─ Student GPA updated (CGPA in STUDENTS table)
   └─ Course status changed to 'COMPLETED'
```

---

## Security & Isolation

### Semester-Based Isolation
- **FA assignments** are tied to specific semesters
  - FA_ID 13 (sem1) handles semester 1 students
  - FA_ID 18 (sem6) handles semester 6 students
  
- **Enrollment requests filtering**
  ```sql
  SELECT * FROM ENROLLMENT_REQUESTS 
  WHERE fa_id = :current_fa_id AND status = 'PENDING'
  ```
  - Each FA sees ONLY their assigned students' requests
  - Cross-semester visibility prevented by fa_id filtering

### Data Integrity
- **Unique Constraints:**
  - Student email is unique per registration
  - Professor email is unique
  - FA email is unique
  - Course code (subject_code) is unique
  - (student_id, course_id) composite unique in ENROLLMENTS

- **Referential Integrity:**
  - All FK references enforced at database level
  - Cascading deletes handled appropriately

---

## Database Statistics

| Table | Purpose | Key Relations |
|-------|---------|---|
| STUDENTS | Student profiles | FA assignments, Enrollments, Requests |
| PROFESSORS | Instructor profiles | Courses, Attendance marking |
| FACULTY_ADVISORS | Enrollment approvers | Student assignments, Request processing |
| COURSES | Course catalog | Professors, Enrollments, Requests |
| ENROLLMENTS | Active student registrations | Attendance records, Semester marks |
| ENROLLMENT_REQUESTS | Approval workflow | Students, Courses, FAs (required) |
| STUDENT_FA_ASSIGNMENT | Advisor-Student mapping | Routing requests to correct FA |
| ATTENDANCE | Class attendance | Courses, Professors, Enrollments |
| SEMESTER_MARKS | Academic grades | Enrollments, GPA calculations |

---

## Notes
- This schema supports efficient semester-based isolation
- FA approval workflow enables quality control before enrollment
- Automatic FA assignment ensures every student has an advisor
- Attendance and marks tracking enable comprehensive academic monitoring
