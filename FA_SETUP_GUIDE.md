# Faculty Advisor System - Setup & Demo Guide

## ✅ What's Fixed

1. **Faculty Advisor Registration** - Now accepts 'faculty_advisor' as valid user type
2. **Faculty Advisor Login** - FA can now login with credentials
3. **Drop Course** - Working perfectly ✅
4. **Demo FA Credentials** - Two demo FAs created in database

---

## 🚀 Demo Faculty Advisor Accounts

### Faculty Advisor 1
```
Email: fa_advisor1@college.edu
Password: FA123456
Department: Computer Science (CS)
Assigned Semester: 2
```

### Faculty Advisor 2
```
Email: fa_advisor2@college.edu
Password: FA123456
Department: Information Technology (IT)
Assigned Semester: 4
```

---

## 📋 Setup Steps Already Completed

### Step 1: Backend Updates ✅
- Updated `authController.js` to accept 'faculty_advisor' user type
- Added FA registration logic (inserts into faculty_advisors table)
- Added FA login logic (queries faculty_advisors table)
- Generated bcrypt hash for demo passwords

### Step 2: Database Setup ✅
```bash
# Already ran in database:
# - 03_faculty_advisor.sql (created tables)
# - 04_faculty_advisor_data.sql (created sequences)
# - 05_demo_fa_credentials.sql (inserted demo FA accounts)
```

### Step 3: Frontend Added ✅
- FA login option in Login component
- FA Dashboard component created
- All endpoints integrated

---

## 🧪 How to Test Faculty Advisor Features

### Test 1: Login as Faculty Advisor
1. Go to http://localhost:3001/login
2. Select "I am a: Faculty Advisor"
3. Enter:
   - Email: `fa_advisor1@college.edu`
   - Password: `FA123456`
4. Click "Login"
5. ✅ You should be redirected to FA Dashboard

### Test 2: FA Dashboard Features
Once logged in as FA, you should see:
- **Pending Requests Tab**: Shows enrollment requests from students
  - View student info (name, email, semester, CGPA)
  - View course details and capacity
  - Click "Approve" to enroll student automatically
  - Click "Reject" to reject with reason
  
- **Assigned Students Tab**: Shows all students assigned to this FA
  - View student details
  - See active enrollments count
  - See pending requests count

### Test 3: Test Enrollment Workflow
1. Login as student
2. Go to "Enroll in Course"
3. Request enrollment in a course
4. Status should show "PENDING" waiting for FA approval
5. Login as matching FA (check which semester students are)
6. Go to "Pending Requests" tab
7. Click "Approve" to enroll student
8. Student now has active enrollment
9. Student can now click "Drop" to remove from course

### Test 4: Test Course Drop
1. Login as student with enrolled courses
2. On Student Dashboard, each course card shows "🗑️ Drop" button
3. Click "Drop"
4. Confirm in modal
5. ✅ Course is dropped, space becomes available

---

## 🔐 Behind the Scenes: What Changed

### Backend Changes

#### 1. auth Controller - User Type Validation
```javascript
// Now accepts 'faculty_advisor' as valid user type
if (!['student', 'professor', 'faculty_advisor'].includes(user_type)) {
    return errorResponse(res, 'Invalid user type', 400);
}
```

#### 2. FA Registration Logic
```javascript
INSERT INTO faculty_advisors (fa_id, prof_id, name, email, password_hash, department, phone, assigned_semester)
VALUES (faculty_advisor_seq.NEXTVAL, prof_id, name, email, hashed_password, department, phone, semester)
```

#### 3. FA Login Logic
```javascript
SELECT fa_id, name, password_hash, department, assigned_semester 
FROM faculty_advisors 
WHERE email = :email
```

#### 4. API Endpoints Available for FA
- `GET /api/faculty-advisor/pending-requests` - View pending requests
- `GET /api/faculty-advisor/all-requests?status=pending|approved|rejected` - Query history
- `POST /api/faculty-advisor/approve-request` - Approve with auto-enrollment
- `POST /api/faculty-advisor/reject-request` - Reject with reason
- `GET /api/faculty-advisor/assigned-students` - View assigned students

### Frontend Changes

#### 1. Login Component
- Added "Faculty Advisor" option to user type dropdown
- FA registration includes department selection
- Redirect to `/faculty-advisor/dashboard` on FA login

#### 2. FA Dashboard Component
- Stats showing pending requests and assigned students
- Two tabs: "Pending Requests" and "Assigned Students"
- Request cards with approve/reject buttons
- Students table with enrollment details
- Reject modal for entering rejection reason

#### 3. Student Dashboard Component
- Added "🗑️ Drop" button on each course
- Drop modal with confirmation
- Auto-refresh after drop

---

## 📊 Demo Data Setup

### Created in Database

**2 Faculty Advisors:**
1. Dr. Rajesh Kumar (CS Department, Semester 2)
2. Dr. Priya Singh (IT Department, Semester 4)

**Students Assigned:**
- Semester 2 students → Dr. Rajesh Kumar
- Semester 4 students → Dr. Priya Singh

---

## 🔗 API Testing with cURL

### FA Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fa_advisor1@college.edu",
    "password": "FA123456",
    "user_type": "faculty_advisor"
  }'
```

### Get Pending Requests
```bash
curl -X GET http://localhost:5000/api/faculty-advisor/pending-requests \
  -H "Authorization: Bearer <FA_TOKEN>"
```

### Approve Request
```bash
curl -X POST http://localhost:5000/api/faculty-advisor/approve-request \
  -H "Authorization: Bearer <FA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"request_id": 5}'
```

### Reject Request
```bash
curl -X POST http://localhost:5000/api/faculty-advisor/reject-request \
  -H "Authorization: Bearer <FA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": 5,
    "rejection_reason": "Prerequisite not met"
  }'
```

### Drop Course (Student)
```bash
curl -X POST http://localhost:5000/api/students/drop-course \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"course_id": 101}'
```

---

## ✅ Verification Checklist

- [x] FA can register with 'faculty_advisor' user type
- [x] FA can login with demo credentials
- [x] FA Dashboard shows pending requests
- [x] FA can approve requests (auto-enrolls student)
- [x] FA can reject requests (with reason)
- [x] FA can see assigned students
- [x] Student can drop courses
- [x] Drop modal shows confirmation
- [x] Course capacity updated after drop
- [x] Frontend compiles without errors
- [x] Backend running on localhost:5000
- [x] All API endpoints working

---

## 🆘 Troubleshooting

### Issue: "Invalid user type" error on FA registration
**Solution:** Already fixed! Backend now accepts 'faculty_advisor'

### Issue: FA can't login
**Solution:** Check demo credentials are correct:
- Email: `fa_advisor1@college.edu` (not fa_advisor@...)
- Password: `FA123456` (case-sensitive)
- User type: Select "Faculty Advisor" dropdown

### Issue: FA sees no pending requests
**Solution:** 
- Make sure students are enrolled in courses matching FA's assigned semester
- Students must have submitted enrollment requests (not already enrolled)
- Check student is assigned to this FA

### Issue: Drop button not appearing
**Solution:**
- Only shows for ACTIVE enrollments
- Refresh page if not showing
- Check you're in Student Dashboard, not enrollment page

---

## 📝 Files Modified

1. `/backend/controllers/authController.js` - Added FA support
2. `/frontend/src/components/Login/index.js` - Added FA option
3. `/frontend/src/components/FacultyAdvisorDashboard/index.js` - Created
4. `/frontend/src/components/FacultyAdvisorDashboard/FacultyAdvisorDashboard.css` - Created
5. `/frontend/src/App.js` - Added FA route
6. `/frontend/src/services/api.js` - Added dropCourse()
7. `/frontend/src/components/StudentDashboard/index.js` - Added drop functionality
8. `/database/05_demo_fa_credentials.sql` - Created

---

## 🎯 Next Steps (Optional)

1. Create more demo students and assign to different FAs
2. Test full workflow: Student enrolls → FA approves → Student drops
3. Add email notifications for approvals/rejections
4. Customize rejection reasons (predefined vs. custom)
5. Add FA dashboard refresh timer
6. Add approval history filters
7. Add bulk operations for FA

---

**System is ready for testing! 🚀**
