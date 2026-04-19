# Quick Testing Reference - FA System Enhancements

## Status Check
Both servers should be running:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api/health

---

## Test Case 1: Register New Faculty Advisor

**Navigate to**: http://localhost:3000 → Register

**Fill Form**:
```
I am a:           Faculty Advisor
Full Name:        Dr. New FA
Email:            newfa@college.edu
Password:         fa123456
Department:       Computer Science
Specialized Sem:  All Semesters (0)
Phone:            9876543210
```

**Expected Result**: ✓ "Registration successful!" message
**Navigate to**: Login → Use same credentials
**Expected Result**: ✓ FA Dashboard loads

---

## Test Case 2: Verify Students See All Courses

**Setup**: Have Semester 1 Student logged in

**Action**: Go to Enroll in Course

**Expected Result**: 
- ✓ See courses from ALL semesters (not just semester 1)
- ✓ Each course shows: Name, Code, Professor, Semester Offered
- ✓ Can request course from any semester

**Test**: Request a Semester 4 Course

**Expected Result**: ✓ Request submitted, appears in "My Pending Requests"

---

## Test Case 3: FA Sees All Pending Requests

**Setup**: FA account logged in

**Navigate to**: FA Dashboard > Pending Enrollment Requests tab

**Expected Result**:
- ✓ Shows requests from ALL semesters
- ✓ Shows students from different semesters
- ✓ No semester filtering applied
- ✓ Displays: Student name, email, semester, course, details

**Action**: Look for cross-semester request from Test Case 2

**Expected Result**: ✓ Request visible to FA (from semester 1 student requesting semester 4 course)

---

## Test Case 4: FA Approves Cross-Semester Request

**Setup**: Pending request is visible (from Test Case 3)

**Action**: Click "Approve" button on cross-semester request

**Expected Result**: ✓ Modal shows request details
- ✓ Approve button confirmed
- ✓ Request status changes to "APPROVED"

**Verify**: 
- Go to student account
- Check "Enrolled Courses"

**Expected Result**: ✓ Cross-semester course now appears in enrolled list

---

## Test Case 5: Professor-FA Dual Role

**Register New FA Linked to Existing Professor**:
```
1. Get an existing professor ID (e.g., prof_id = 101)
2. Register as FA with:
   - Email: different from professor
   - Same name or different
   - prof_id_link: 101 (in request body if using API)
```

**Test Professor Login**:
```
Email:    original.prof@college.edu
Password: professor_password
Navigate: Professor Dashboard
```

**Test FA Login**:
```
Email:    newfa.email@college.edu
Password: new_fa_password
Navigate: FA Dashboard
```

**Expected Result**: ✓ Same person can login with two different accounts/roles

---

## Test Case 6: Drop Course Functionality

**Setup**: Student has enrolled courses

**Action**: Click "Drop" button on any course

**Expected**: 
- ✓ Modal appears with warning
- ✓ Shows course details and warning message
- ✓ Confirm/Cancel buttons

**Click**: Confirm

**Expected Result**:
- ✓ Course removed from "Enrolled Courses" immediately
- ✓ Course capacity updated
- ✓ FA dashboard still shows original request (not affected)

---

## Test Case 7: Error Handling

### Invalid User Type (Fixed)
**Attempt**: Register with invalid user_type
**Expected**: ✓ Clear error: "Invalid user type. Must be one of: student, professor, faculty_advisor"

### Missing Semester for FA
**Attempt**: Register FA without selecting semester
**Expected**: ✓ Default to "All Semesters" (0)

### Missing Email
**Attempt**: Register without email
**Expected**: ✓ Error: "Missing fields: email"

---

## Curl Testing (For API Verification)

### Test FA Registration API
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_type": "faculty_advisor",
    "name": "Dr. Test FA",
    "email": "curl.test.fa@college.edu",
    "password": "test123",
    "department": "CS",
    "semester": 0,
    "phone": "9999999999"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user_id": 1001,
    "token": "eyJhbGc...",
    "user_type": "faculty_advisor"
  }
}
```

### Test Get All Courses (No Semester Filter)
```bash
curl -X GET http://localhost:5000/api/students/available-courses/1 \
  -H "Authorization: Bearer <student_token>"
```

**Expected**: Returns courses from ALL semesters

### Test Get All FA Pending Requests
```bash
curl -X GET http://localhost:5000/api/faculty-advisor/pending-requests \
  -H "Authorization: Bearer <fa_token>"
```

**Expected**: Returns ALL pending requests in system

---

## Demo Credentials (From Previous Setup)

**Faculty Advisor 1**:
- Email: fa_advisor1@college.edu
- Password: FA123456
- Department: CS
- Semester: 2

**Faculty Advisor 2**:
- Email: fa_advisor2@college.edu
- Password: FA123456
- Department: IT
- Semester: 4

**Try logging in** with these to see existing FA setup

---

## Troubleshooting

### Frontend Shows Old Data
**Solution**: 
```bash
# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

### Backend Not Accepting FA Registration
**Solution**:
1. Restart backend: `Ctrl+C` in backend terminal
2. Run: `npm start`
3. Check console for validation errors
4. Try curl request above to test directly

### Enrolled Course Not Showing After Approval
**Solution**:
1. Student page may be cached
2. Click refresh or navigate away and back
3. Check if approval timestamp exists in database

### FA Doesn't See All Requests
**Solution**:
1. Verify token has correct user_type: "faculty_advisor"
2. Check server logs for query errors
3. Restart backend and retry

---

## Success Checklist

- [ ] FA can register without "invalid user type" error
- [ ] Students see courses from all semesters
- [ ] All FAs see all pending requests
- [ ] Any FA can approve any request
- [ ] Cross-semester enrollment workflow succeeds
- [ ] Professor-FA dual role works
- [ ] Course drop functionality works
- [ ] Error messages are clear and helpful

---

## Files Modified

1. `/backend/controllers/authController.js` - Enhanced validation, prof_id_link support
2. `/backend/controllers/studentController.js` - Removed semester filter for courses
3. `/backend/controllers/facultyAdvisorController.js` - All FAs see all requests
4. `/frontend/src/components/Login/index.js` - FA semester field added
5. `/frontend/src/services/api.js` - (No changes needed, APIs work same way)

---

**Last Updated**: April 19, 2026
**Status**: Ready for Comprehensive Testing
