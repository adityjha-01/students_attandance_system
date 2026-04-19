# Faculty Advisor System - Frontend Implementation Guide

## 1️⃣ Setup Database

Run these SQL scripts in order (in Oracle SQL*Plus):

```bash
cd /home/sagar-jadhav/student-attendance-system/database

# 1. Create Faculty Advisor tables
sqlplus sagar/2066@XEPDB1
SQL> @03_faculty_advisor.sql

# 2. Create sequences and insert test data
SQL> @04_faculty_advisor_data.sql

SQL> EXIT
```

---

## 2️⃣ Backend API Reference (Ready to Use!)

All endpoints are live at `http://localhost:5000`

### **Student Endpoints**

#### Submit Enrollment Request
```
POST /api/students/enroll
Authorization: Bearer {token}
Content-Type: application/json

{
  "course_id": 101
}

✅ Success (201):
{
  "status": true,
  "data": { "request_id": 5 },
  "message": "Enrollment request submitted. Awaiting Faculty Advisor approval."
}

❌ Errors:
- 409: "Already enrolled in this course" / "You already have a pending request"
- 400: "No Faculty Advisor assigned. Contact administration."
- 404: "Course not found"
```

#### View Pending Enrollment Requests
```
GET /api/students/pending-requests
Authorization: Bearer {token}

✅ Success (200):
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
    }
  ]
}
```

#### Drop Course
```
POST /api/students/drop-course
Authorization: Bearer {token}
Content-Type: application/json

{
  "course_id": 101
}

✅ Success (200):
{
  "status": true,
  "data": {},
  "message": "Course dropped successfully"
}

❌ Errors:
- 404: "No active enrollment found for this course"
```

---

### **Faculty Advisor Endpoints**

#### View Pending Requests
```
GET /api/faculty-advisor/pending-requests
Authorization: Bearer {token}

✅ Success (200):
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

#### Get Request History (Filter by Status)
```
GET /api/faculty-advisor/all-requests?status=pending
GET /api/faculty-advisor/all-requests?status=approved
GET /api/faculty-advisor/all-requests?status=rejected
GET /api/faculty-advisor/all-requests  (all statuses)

Authorization: Bearer {token}
```

#### Approve Enrollment Request
```
POST /api/faculty-advisor/approve-request
Authorization: Bearer {token}
Content-Type: application/json

{
  "request_id": 5
}

✅ Success (200):
{
  "status": true,
  "data": { "enrollment_id": 501 },
  "message": "Enrollment approved successfully"
}
```

#### Reject Enrollment Request
```
POST /api/faculty-advisor/reject-request
Authorization: Bearer {token}
Content-Type: application/json

{
  "request_id": 5,
  "rejection_reason": "Course level too high for your current semester"
}

✅ Success (200):
{
  "status": true,
  "data": {},
  "message": "Enrollment request rejected"
}
```

#### Get Assigned Students
```
GET /api/faculty-advisor/assigned-students
Authorization: Bearer {token}

✅ Success (200):
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
    }
  ]
}
```

---

## 3️⃣ Frontend Components to Create

### **For Students**

#### Component 1: Enroll Request Form
```jsx
// File: frontend/src/components/StudentEnrollRequest/index.js

import React, { useState, useEffect } from 'react';
import { fetchAvailableCourses, submitEnrollmentRequest } from '../../services/api';

function StudentEnrollRequest() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [semester, setSemester] = useState(1);

  useEffect(() => {
    loadCourses();
  }, [semester]);

  const loadCourses = async () => {
    try {
      const data = await fetchAvailableCourses(semester);
      setCourses(data);
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  };

  const handleSubmitRequest = async (courseId) => {
    setLoading(true);
    try {
      const response = await submitEnrollmentRequest(courseId);
      alert('✅ Enrollment request submitted! Waiting for Faculty Advisor approval.');
      setSelectedCourse(null);
      loadCourses();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Failed to submit request'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enroll-request-container">
      <h2>Request Course Enrollment</h2>
      
      <select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
          <option key={sem} value={sem}>Semester {sem}</option>
        ))}
      </select>

      <table>
        <thead>
          <tr>
            <th>Course Name</th>
            <th>Code</th>
            <th>Professor</th>
            <th>Credits</th>
            <th>Seats</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course.COURSE_ID}>
              <td>{course.COURSE_NAME}</td>
              <td>{course.SUBJECT_CODE}</td>
              <td>{course.PROFESSOR_NAME}</td>
              <td>{course.CREDITS}</td>
              <td>{course.SEATS_AVAILABLE}/{course.MAX_ENROLLMENT}</td>
              <td>
                <button 
                  onClick={() => handleSubmitRequest(course.COURSE_ID)}
                  disabled={loading}
                >
                  Request Enrollment
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentEnrollRequest;
```

#### Component 2: Pending Requests View
```jsx
// File: frontend/src/components/StudentPendingRequests/index.js

import React, { useState, useEffect } from 'react';
import { getPendingRequests } from '../../services/api';

function StudentPendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await getPendingRequests();
      setRequests(data);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: '#FFA500',
      APPROVED: '#28a745',
      REJECTED: '#dc3545'
    };
    return (
      <span style={{ backgroundColor: colors[status], color: 'white', padding: '5px 10px', borderRadius: '4px' }}>
        {status}
      </span>
    );
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="pending-requests-container">
      <h2>My Enrollment Requests</h2>
      
      {requests.length === 0 ? (
        <p>No enrollment requests yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Code</th>
              <th>Professor</th>
              <th>Credits</th>
              <th>Status</th>
              <th>Requested On</th>
              <th>Approved On</th>
              <th>Reason (if rejected)</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.REQUEST_ID}>
                <td>{req.COURSE_NAME}</td>
                <td>{req.SUBJECT_CODE}</td>
                <td>{req.PROFESSOR_NAME}</td>
                <td>{req.CREDITS}</td>
                <td>{getStatusBadge(req.STATUS)}</td>
                <td>{req.REQUEST_DATE}</td>
                <td>{req.APPROVAL_DATE || '-'}</td>
                <td>{req.REJECTION_REASON || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StudentPendingRequests;
```

#### Component 3: Enrolled Courses (with Drop Option)
```jsx
// File: frontend/src/components/StudentEnrolledCourses/index.js
// (Update existing with Drop button)

import React, { useState, useEffect } from 'react';
import { getEnrolledCourses, dropCourse } from '../../services/api';

function StudentEnrolledCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropModalOpen, setDropModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await getEnrolledCourses();
      setCourses(data);
    } catch (err) {
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDropClick = (course) => {
    setSelectedCourse(course);
    setDropModalOpen(true);
  };

  const confirmDrop = async () => {
    try {
      await dropCourse(selectedCourse.COURSE_ID);
      alert('✅ Course dropped successfully.');
      setDropModalOpen(false);
      loadCourses();
    } catch (err) {
      alert('❌ Failed to drop course: ' + err.response?.data?.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="enrolled-courses-container">
      <h2>My Enrolled Courses</h2>
      
      <table>
        <thead>
          <tr>
            <th>Course Name</th>
            <th>Code</th>
            <th>Professor</th>
            <th>Credits</th>
            <th>Attendance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course.COURSE_ID}>
              <td>{course.COURSE_NAME}</td>
              <td>{course.SUBJECT_CODE}</td>
              <td>{course.PROFESSOR_NAME}</td>
              <td>{course.CREDITS}</td>
              <td>{course.ATTENDANCE_PERCENTAGE || 'N/A'}%</td>
              <td>
                <button onClick={() => handleDropClick(course)} className="btn-danger">
                  Drop Course
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {dropModalOpen && selectedCourse && (
        <div className="modal">
          <div className="modal-content">
            <h3>⚠️ Confirm Course Drop</h3>
            <p>Are you sure you want to drop <strong>{selectedCourse.COURSE_NAME}</strong>?</p>
            <p>You will lose access to course materials and attendance records.</p>
            <div className="modal-buttons">
              <button onClick={confirmDrop} className="btn-danger">Drop Course</button>
              <button onClick={() => setDropModalOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentEnrolledCourses;
```

---

### **For Faculty Advisors**

#### Component 1: FA Dashboard
```jsx
// File: frontend/src/components/FacultyAdvisorDashboard/index.js

import React, { useState, useEffect } from 'react';
import { 
  getPendingEnrollmentRequests, 
  approveEnrollmentRequest, 
  rejectEnrollmentRequest,
  getAssignedStudents 
} from '../../services/api';

function FacultyAdvisorDashboard() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [requests, students] = await Promise.all([
        getPendingEnrollmentRequests(),
        getAssignedStudents()
      ]);
      setPendingRequests(requests);
      setAssignedStudents(students);
    } catch (err) {
      console.error('Error loading FA data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await approveEnrollmentRequest(requestId);
      alert('✅ Request approved! Student is now enrolled.');
      loadData();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Failed to approve'));
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await rejectEnrollmentRequest(selectedRequest.REQUEST_ID, rejectionReason);
      alert('✅ Request rejected.');
      setRejectModalOpen(false);
      loadData();
    } catch (err) {
      alert('❌ Failed to reject request');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="fa-dashboard-container">
      <h1>Faculty Advisor Dashboard</h1>

      {/* Stats */}
      <div className="fa-stats">
        <div className="stat-card">
          <h3>{pendingRequests.filter(r => r.STATUS === 'PENDING').length}</h3>
          <p>Pending Requests</p>
        </div>
        <div className="stat-card">
          <h3>{assignedStudents.length}</h3>
          <p>Assigned Students</p>
        </div>
      </div>

      {/* Pending Requests Table */}
      <div className="section">
        <h2>📋 Pending Enrollment Requests</h2>
        
        {pendingRequests.filter(r => r.STATUS === 'PENDING').length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Sem</th>
                <th>CGPA</th>
                <th>Course</th>
                <th>Code</th>
                <th>Professor</th>
                <th>Requested On</th>
                <th>Available Seats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.filter(r => r.STATUS === 'PENDING').map(req => (
                <tr key={req.REQUEST_ID}>
                  <td>{req.STUDENT_NAME}</td>
                  <td>{req.STUDENT_EMAIL}</td>
                  <td>{req.STUDENT_SEMESTER}</td>
                  <td>{req.CGPA}</td>
                  <td>{req.COURSE_NAME}</td>
                  <td>{req.SUBJECT_CODE}</td>
                  <td>{req.PROFESSOR_NAME}</td>
                  <td>{req.REQUEST_DATE}</td>
                  <td>{req.MAX_ENROLLMENT - req.CURRENT_ENROLLMENT}/{req.MAX_ENROLLMENT}</td>
                  <td>
                    <button 
                      onClick={() => handleApprove(req.REQUEST_ID)}
                      className="btn-success"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleRejectClick(req)}
                      className="btn-danger"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assigned Students */}
      <div className="section">
        <h2>👥 My Assigned Students</h2>
        
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Semester</th>
              <th>CGPA</th>
              <th>Active Enrollments</th>
              <th>Pending Requests</th>
            </tr>
          </thead>
          <tbody>
            {assignedStudents.map(student => (
              <tr key={student.STUDENT_ID}>
                <td>{student.STUDENT_ID}</td>
                <td>{student.NAME}</td>
                <td>{student.EMAIL}</td>
                <td>{student.SEMESTER}</td>
                <td>{student.CGPA}</td>
                <td>{student.ACTIVE_ENROLLMENTS}</td>
                <td>{student.PENDING_REQUESTS}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && selectedRequest && (
        <div className="modal">
          <div className="modal-content">
            <h3>Reject Enrollment Request</h3>
            <p><strong>Student:</strong> {selectedRequest.STUDENT_NAME}</p>
            <p><strong>Course:</strong> {selectedRequest.COURSE_NAME}</p>
            <textarea 
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows="4"
            />
            <div className="modal-buttons">
              <button onClick={confirmReject} className="btn-danger">Reject</button>
              <button onClick={() => setRejectModalOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyAdvisorDashboard;
```

---

## 4️⃣ Update API Service File

```javascript
// File: frontend/src/services/api.js
// Add these new functions:

// Student endpoints
export const submitEnrollmentRequest = (courseId) =>
  api.post('/students/enroll', { course_id: courseId });

export const getPendingRequests = () =>
  api.get('/students/pending-requests');

export const dropCourse = (courseId) =>
  api.post('/students/drop-course', { course_id: courseId });

// Faculty Advisor endpoints
export const getPendingEnrollmentRequests = () =>
  api.get('/faculty-advisor/pending-requests');

export const getAllEnrollmentRequests = (status = 'all') =>
  api.get(`/faculty-advisor/all-requests?status=${status}`);

export const approveEnrollmentRequest = (requestId) =>
  api.post('/faculty-advisor/approve-request', { request_id: requestId });

export const rejectEnrollmentRequest = (requestId, reason) =>
  api.post('/faculty-advisor/reject-request', { 
    request_id: requestId, 
    rejection_reason: reason 
  });

export const getAssignedStudents = () =>
  api.get('/faculty-advisor/assigned-students');
```

---

## 5️⃣ Testing with cURL

```bash
# Submit Enrollment Request
curl -X POST http://localhost:5000/api/students/enroll \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"course_id": 101}'

# Get Pending Requests
curl-X GET http://localhost:5000/api/students/pending-requests \
  -H "Authorization: Bearer YOUR_TOKEN"

# Drop Course
curl -X POST http://localhost:5000/api/students/drop-course \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"course_id": 101}'

# FA: Get Pending Requests
curl -X GET http://localhost:5000/api/faculty-advisor/pending-requests \
  -H "Authorization: Bearer YOUR_FA_TOKEN"

# FA: Approve Request
curl -X POST http://localhost:5000/api/faculty-advisor/approve-request \
  -H "Authorization: Bearer YOUR_FA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"request_id": 5}'

# FA: Reject Request
curl -X POST http://localhost:5000/api/faculty-advisor/reject-request \
  -H "Authorization: Bearer YOUR_FA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"request_id": 5, "rejection_reason": "Prerequisite not met"}'
```

---

## ✅ Checklist

- ✅ Backend API implemented
- ✅ Database schema created
- ⏳ Run SQL scripts to create tables & seed data
- ⏳ Create Student components: EnrollRequest, PendingRequests, Drop
- ⏳ Create FA Dashboard component
- ⏳ Update API service file
- ⏳ Update routing to include new pages
- ⏳ Style components
- ⏳ Test end-to-end workflow

---

**Next Step:** Run the SQL scripts in Oracle to set up the database tables!
