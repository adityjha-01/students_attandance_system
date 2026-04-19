# Faculty Advisor & Course Drop System

## Overview
This document describes the new Faculty Advisor (FA) approval workflow and course drop functionality added to the Student Attendance System.

---

## Features

### 1. Faculty Advisor Approval Workflow

**Before:**
- Students could directly enroll in courses

**After:**
- Students submit enrollment requests
- Faculty Advisors review requests
- Faculty Advisors approve or reject with reasons
- Students can only enroll after approval

### 2. Course Drop Functionality
- Students can drop enrolled courses
- Current enrollment count is updated
- Course space becomes available for other students

---

## Database Schema

### New Tables

#### `FACULTY_ADVISORS`
```sql
fa_id NUMBER PRIMARY KEY
prof_id NUMBER (FK to professors)
name VARCHAR2(100)
email VARCHAR2(100) UNIQUE
department VARCHAR2(50)
phone VARCHAR2(15)
password_hash VARCHAR2(256)
assigned_semester NUMBER(1) -- Can advise specific semester students
created_at TIMESTAMP
```

#### `ENROLLMENT_REQUESTS`
```sql
request_id NUMBER PRIMARY KEY
student_id NUMBER (FK to students)
course_id NUMBER (FK to courses)
fa_id NUMBER (FK to faculty_advisors)
status VARCHAR2(20) -- PENDING | APPROVED | REJECTED
request_date TIMESTAMP
approval_date TIMESTAMP
rejection_reason VARCHAR2(500)
```

#### `STUDENT_FA_ASSIGNMENT`
```sql
assignment_id NUMBER PRIMARY KEY
student_id NUMBER (FK to students) UNIQUE
fa_id NUMBER (FK to faculty_advisors)
assigned_at TIMESTAMP
```

### Modified Tables

#### `ENROLLMENTS`
- Added `DROPPED` status (was ACTIVE, COMPLETED)
- Status values: `ACTIVE` | `DROPPED` | `COMPLETED`

---

## API Endpoints

### Student Endpoints

#### 1. Request Enrollment
```http
POST /api/students/enroll
Content-Type: application/json

{
  "course_id": 101
}

Response (201):
{
  "status": true,
  "data": {
    "request_id": 5,
    "message": "Enrollment request submitted. Awaiting Faculty Advisor approval."
  }
}
```

#### 2. Get Pending Enrollment Requests
```http
GET /api/students/pending-requests

Response (200):
{
  "status": true,
  "data": [
    {
      "request_id": 5,
      "course_id": 101,
      "course_name": "Data Structures",
      "subject_code": "CS201",
      "professor_name": "Dr. John Smith",
      "credits": 3,
      "status": "PENDING",
      "rejection_reason": null,
      "request_date": "2026-04-18 10:30",
      "approval_date": null
    },
    {
      "request_id": 6,
      "course_id": 102,
      "course_name": "Algorithms",
      "subject_code": "CS202",
      "professor_name": "Dr. Jane Doe",
      "credits": 3,
      "status": "REJECTED",
      "rejection_reason": "Course is now full",
      "request_date": "2026-04-18 10:45",
      "approval_date": "2026-04-18 11:00"
    }
  ]
}
```

#### 3. Drop Course
```http
POST /api/students/drop-course
Content-Type: application/json

{
  "course_id": 101
}

Response (200):
{
  "status": true,
  "data": {},
  "message": "Course dropped successfully"
}
```

---

### Faculty Advisor Endpoints

#### 1. Get Pending Enrollment Requests
```http
GET /api/faculty-advisor/pending-requests

Response (200):
{
  "status": true,
  "data": [
    {
      "request_id": 5,
      "student_id": 1001,
      "student_name": "Alice Johnson",
      "student_email": "alice@college.edu",
      "student_semester": 2,
      "cgpa": 3.8,
      "course_id": 101,
      "course_name": "Data Structures",
      "subject_code": "CS201",
      "professor_name": "Dr. John Smith",
      "credits": 3,
      "max_enrollment": 60,
      "current_enrollment": 58,
      "status": "PENDING",
      "request_date": "2026-04-18 10:30"
    }
  ]
}
```

#### 2. Get All Enrollment Requests (with optional filtering)
```http
GET /api/faculty-advisor/all-requests?status=pending
GET /api/faculty-advisor/all-requests?status=approved
GET /api/faculty-advisor/all-requests?status=rejected
GET /api/faculty-advisor/all-requests  -- All statuses

Response (200):
{
  "status": true,
  "data": [
    {
      "request_id": 5,
      "student_id": 1001,
      "student_name": "Alice Johnson",
      "student_email": "alice@college.edu",
      "student_semester": 2,
      "course_id": 101,
      "course_name": "Data Structures",
      "subject_code": "CS201",
      "status": "APPROVED",
      "request_date": "2026-04-18 10:30",
      "approval_date": "2026-04-18 10:45",
      "rejection_reason": null
    }
  ]
}
```

#### 3. Approve Enrollment Request
```http
POST /api/faculty-advisor/approve-request
Content-Type: application/json

{
  "request_id": 5
}

Response (200):
{
  "status": true,
  "data": {
    "enrollment_id": 501
  },
  "message": "Enrollment approved successfully"
}
```

**Notes:**
- Approval automatically creates an enrollment record
- Updates course enrollment count
- Only works if:
  - Request status is "PENDING"
  - Course has available seats
- If course is full, request is auto-rejected with message "Course is now full"

#### 4. Reject Enrollment Request
```http
POST /api/faculty-advisor/reject-request
Content-Type: application/json

{
  "request_id": 5,
  "rejection_reason": "Course level too high for your current semester"
}

Response (200):
{
  "status": true,
  "data": {},
  "message": "Enrollment request rejected"
}
```

#### 5. Get Assigned Students
```http
GET /api/faculty-advisor/assigned-students

Response (200):
{
  "status": true,
  "data": [
    {
      "student_id": 1001,
      "name": "Alice Johnson",
      "email": "alice@college.edu",
      "semester": 2,
      "cgpa": 3.8,
      "active_enrollments": 4,
      "pending_requests": 2
    },
    {
      "student_id": 1002,
      "name": "Bob Smith",
      "email": "bob@college.edu",
      "semester": 2,
      "cgpa": 3.5,
      "active_enrollments": 3,
      "pending_requests": 1
    }
  ]
}
```

---

## Database Setup

### 1. Create Faculty Advisor Tables
```bash
sqlplus sagar/2066@XEPDB1
SQL> @04_faculty_advisor.sql
```

### 2. Create Sequences and Insert Test Data
```bash
sqlplus sagar/2066@XEPDB1
SQL> @04_faculty_advisor_data.sql
```

---

## Frontend Implementation Tasks

### 1. Student Dashboard Update
- **Remove:** Direct "Enroll" button functionality
- **Add:** 
  - Form to search and submit enrollment requests
  - View "Pending Requests" section with status indicators
  - "Drop Course" button on enrolled courses

### 2. New Student Views

#### Pending Enrollment Requests View
```component
StudentPendingRequests
├── List pending requests with course details
├── Show approval/rejection date
├── Display rejection reason if rejected
└── Show estimated approval ETA
```

#### Course Drop Confirmation Modal
```component
CourseDropModal
├── Show course name and professor
├── Display current attendance percentage (if applicable)
├── Confirmation message
└── Drop/Cancel buttons
```

### 3. New Faculty Advisor Dashboard

#### Faculty Advisor Dashboard
```component
FacultyAdvisorDashboard
├── Dashboard Stats (Pending, Approved, Rejected counts)
├── Pending Requests Table
│   ├── Student info
│   ├── Course details
│   ├── Request date
│   └── Approve/Reject buttons
├── Assigned Students List
│   ├── Student details
│   ├── Active enrollments count
│   └── Pending requests count
└── Request History/Archive (by status filter)
```

#### Enrollment Request Details View
```component
EnrollmentRequestDetail
├── Student information (Name, ID, Semester, CGPA)
├── Course details (Name, Code, Professor)
├── Course capacity info
├── Request submission time
├── Decision panel (Approve/Reject with reason)
└── Action history/notes
```

---

## Business Logic

### Enrollment Request Flow
```
Student Requests Enrollment
        ↓
Check ifStudent has Faculty Advisor ✓
        ↓
Check for existing enrollment/request ✓
        ↓
Create PENDING request ✓
        ↓
Faculty Advisor Reviews
        ├─ APPROVE: Create enrollment + increment course count
        └─ REJECT: Mark as rejected + store reason
```

### Course Drop Flow
```
Student Requests Drop
        ↓
Check if enrollment exists & is ACTIVE ✓
        ↓
Update status to DROPPED ✓
        ↓
Decrement course enrollment count ✓
        ↓
Success
```

---

## Authentication & Authorization

- Faculty Advisor endpoints require FA role/user type
- Student endpoints check `req.user.id` for student context
- All endpoints require `authMiddleware` verification

---

## Error Handling

### Common Errors & Responses

| Error | HTTP Code | Reason |
|-------|-----------|--------|
| Already enrolled in course | 409 | Student already has active enrollment |
| Pending request exists | 409 | Request for same course already pending |
| No FA assigned | 400 | Student doesn't have faculty advisor |
| Course not found | 404 | Invalid course_id |
| Request not found | 404 | Invalid request_id |
| Request not pending | 400 | Can't approve/reject non-pending request |
| Course is full | 400 | No available seats |
| No active enrollment | 404 | Student not enrolled in course |

---

## Testing URLs

### Test with cURL

#### Submit Enrollment Request
```bash
curl -X POST http://localhost:5000/api/students/enroll \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"course_id": 101}'
```

#### Get Pending Requests
```bash
curl -X GET http://localhost:5000/api/students/pending-requests \
  -H "Authorization: Bearer <token>"
```

#### FA: Get Pending Requests
```bash
curl -X GET http://localhost:5000/api/faculty-advisor/pending-requests \
  -H "Authorization: Bearer <token>"
```

#### FA: Approve Request
```bash
curl -X POST http://localhost:5000/api/faculty-advisor/approve-request \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"request_id": 5}'
```

#### FA: Reject Request
```bash
curl -X POST http://localhost:5000/api/faculty-advisor/reject-request \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"request_id": 5, "rejection_reason": "Prerequisite not met"}'
```

#### Drop Course
```bash
curl -X POST http://localhost:5000/api/students/drop-course \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"course_id": 101}'
```

---

## Next Steps

1. ✅ Database schema created
2. ✅ Backend API endpoints implemented
3. ⏳ TODO: Create Faculty Advisor authentication/login
4. ⏳ TODO: Create Faculty Advisor Dashboard UI
5. ⏳ TODO: Update Student Dashboard with new enrollment flow
6. ⏳ TODO: Create enrollment request status page
7. ⏳ TODO: Add email notifications for approvals/rejections
8. ⏳ TODO: Add course drop confirmation modal

---

## Notes

- Faculty Advisors can be assigned to specific semesters
- Students are auto-assigned to FA based on their semester
- CGPA and DROPPED status tracking enables future advanced features like academic probation
- Rejection reason stored for audit trail and student feedback
