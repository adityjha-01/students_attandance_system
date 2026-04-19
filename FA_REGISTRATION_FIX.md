# FA Registration Fix - Complete Testing Guide

## ✅ Changes Implemented

### 1. Database Schema Fix
- **Modified**: `faculty_advisors.prof_id` column now allows NULL
- **Reason**: FAs can be standalone without being linked to a professor
- **Impact**: FA registration no longer fails with "cannot insert NULL" error

### 2. Backend Logic Updated
- **File**: `authController.js`
- **Change**: Semester value of 0 (All Semesters) now converts to NULL in database
- **Logic**: `semester && parseInt(semester) > 0 ? parseInt(semester) : null`

### 3. Frontend Updated
- **File**: `Login/index.js`
- **Changes**:
  - Added demo FA credentials to login page
  - Email: `demo.fa@college.edu`
  - Password: `fa123456`
  - Frontend correctly converts semester 0 to null

### 4. Demo Data Created
- **Email**: demo.fa@college.edu
- **Password**: fa123456
- **Name**: Demo FA
- **Department**: CS
- **Assigned Semester**: NULL (All Semesters)
- **Prof ID**: NULL (Standalone FA)

---

## 🧪 How to Test FA Registration

### Test 1: Login with Existing Demo FA ✓

**Step 1**: Go to http://localhost:3000

**Step 2**: Login Page shows:
```
Demo Credentials:
Professor: john.smith@university.edu / prof123
Student: alice.johnson@university.edu / student123
FA: demo.fa@college.edu / fa123456
```

**Step 3**: Click on "I am a: Faculty Advisor" dropdown

**Step 4**: Enter credentials:
```
Email:    demo.fa@college.edu
Password: fa123456
```

**Step 5**: Click Login

**Expected Result**: ✓ FA Dashboard loads successfully

---

### Test 2: Register New FA ✓

**Step 1**: Click "Don't have an account? Register"

**Step 2**: Select "I am a: Faculty Advisor"

**Step 3**: Fill the registration form:
```
Full Name:              Dr. New FA Test
Email:                  newfatest@college.edu
Password:               testpass123
Department:             Computer Science
Specialized Semester:   All Semesters
Phone:                  9876543210
```

**Step 4**: Click Register

**Expected Result**: ✓ "Registration successful!" message
- No "invalid user type" error
- No "cannot insert NULL" database error

**Step 5**: Click "Already have an account? Login"

**Step 6**: Login with new credentials:
```
Select:   Faculty Advisor
Email:    newfatest@college.edu
Password: testpass123
```

**Expected Result**: ✓ FA Dashboard loads

---

### Test 3: Register FA with Specific Semester

**Step 1**: Click Register (same as Test 2)

**Step 2**: Fill form with:
```
Full Name:              Dr. Semester FA
Email:                  semesterfa@college.edu
Password:               semtest123
Department:             IT
Specialized Semester:   Semester 2  (instead of "All Semesters")
Phone:                  9876543211
```

**Step 3**: Click Register

**Expected Result**: ✓ Registration successful
- FA created and assigned to Semester 2
- Can still see all requests (FAs have global visibility)

---

### Test 4: Verify Database Storage

**Step 1**: Open terminal or SSH to database

**Step 2**: Login to Oracle:
```bash
sqlplus sagar/2066@XEPDB1
```

**Step 3**: Query FA data:
```sql
SELECT fa_id, name, email, assigned_semester FROM faculty_advisors;
```

**Expected Result**: 
```
FA_ID  NAME           EMAIL                    ASSIGNED_SEMESTER
-----  -----------    ---------------------    -------------------
   9   Demo FA        demo.fa@college.edu      (NULL)
   3   Dr. Rajesh Kumar   fa_advisor1@college.edu      2
   4   Dr. Priya Singh    fa_advisor2@college.edu      4
   5   Dr. New FA Test    newfatest@college.edu        (NULL)
   6   Dr. Semester FA    semesterfa@college.edu       2
```

---

## 📋 Demo Credentials Summary

### Already in Database:

#### FA Demo 1:
- Email: `fa_advisor1@college.edu`
- Password: `FA123456`
- Department: CS
- Semester: 2

#### FA Demo 2:
- Email: `fa_advisor2@college.edu`
- Password: `FA123456`
- Department: IT
- Semester: 4

#### FA Demo 3 (New):
- Email: `demo.fa@college.edu`
- Password: `fa123456`
- Department: CS
- Semester: All Semesters (NULL)

---

## 🔍 Troubleshooting

### Error: "Invalid user type"
**Solution**: 
- Verify dropdown shows "Faculty Advisor"
- Check browser console for submitted value
- Ensure internet connection (token validation)

### Error: "Email already registered"
**Solution**:
- Use different email (each account needs unique email)
- Or login with existing email

### Error: "cannot insert NULL into PROF_ID"
**Status**: ✓ FIXED
- This error should NOT appear anymore
- If it does, restart backend server

### Error: "Database error ORA-02290: check constraint violated"
**Solution**:
- This occurs if semester > 8 or < 0
- Select semester 1-8 or "All Semesters"

### FA Login Shows Blank Dashboard
**Solution**:
1. Hard refresh browser: `Ctrl+Shift+R`
2. Check browser console for errors
3. Verify token is stored: `localStorage.getItem('token')`

---

## ✨ Success Indicators

When FA registration works correctly, you should see:

1. ✓ **No database errors** in backend console
2. ✓ **Frontend shows demo credentials** on login page
3. ✓ **Can login as demo FA** without errors
4. ✓ **Can register new FA** with "All Semesters"
5. ✓ **FA Dashboard loads successfully**
6. ✓ **Database shows NULL for prof_id** in faculty_advisors

---

## 📊 Database Changes Made

### Column Modification:
```sql
ALTER TABLE faculty_advisors MODIFY (prof_id NUMBER NULL);
```

This allows:
- FA without linked professor (prof_id = NULL)
- FA linked to professor (prof_id = professor_id)
- Both approaches work now

### Check Constraint:
```sql
-- Constraint on assigned_semester allows: NULL, or 1-8
-- NULL means "handles all semesters"
-- 1-8 means "specialized in that semester"
```

---

## 🚀 Next Steps

1. **Test all scenarios** above
2. **Verify database** shows correct NULL values
3. **Test FA workflows** (see all requests, approve/reject)
4. **Test student enrollment** (request course, see pending status)
5. **Test FA approval** (approve request, student gets enrolled)

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `database/` | prof_id column now allows NULL |
| `backend/authController.js` | Convert semester 0 to NULL |
| `frontend/Login/index.js` | Add demo FA credentials, convert semester 0 to null |

---

## 📞 Support

If issues persist:
1. Restart both servers (kill terminal and restart)
2. Check browser console for JavaScript errors
3. Check backend console for database/API errors
4. Verify database connection: `curl http://localhost:5000/api/health`

---

**Last Updated**: April 19, 2026
**Status**: ✅ Ready for Production Testing
**Servers**: Both running ✓
**Database**: Fixed ✓
