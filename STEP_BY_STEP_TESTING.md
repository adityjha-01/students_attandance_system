# Step-by-Step FA Testing Guide

## System Status
✅ Both servers running
✅ Database fixed
✅ All code updated
✅ Ready for testing

---

## Tutorial 1: Login as Demo FA (2 minutes)

### Step 1: Open Browser
- Navigate to: **http://localhost:3000**

### Step 2: See Demo Credentials
You will see on the login page:
```
Demo Credentials:
Professor: john.smith@university.edu / prof123
Student: alice.johnson@university.edu / student123
FA: demo.fa@college.edu / fa123456 ← THIS IS NEW
```

### Step 3: Select FA Type
In the dropdown "I am a:", select: **Faculty Advisor**

### Step 4: Enter Credentials
```
Email:    demo.fa@college.edu
Password: fa123456
```

### Step 5: Click Login
Button text: "Login"

### Step 6: See FA Dashboard
✅ **Success**: You should see "Faculty Advisor Dashboard" with:
- Pending Enrollment Requests section
- Assigned Students section
- Statistics cards

❌ **If you see error**: Check browser console (F12 → Console tab)

---

## Tutorial 2: Register New FA (5 minutes)

### Step 1: Go to Register
On login page, click: **"Don't have an account? Register"**

### Step 2: Select FA Type
In dropdown "I am a:", select: **Faculty Advisor**

**Important**: The form will change to show:
- Name field
- Email field
- Password field
- Department field
- **Specialized Semester field** ← NEW!

### Step 3: Fill the Form

```
Full Name:              Dr. Test FA
Email:                  testfa123@college.edu
Password:               test123456
Department:             Computer Science
Specialized Semester:   All Semesters  ← SELECT THIS!
Phone:                  9876543210
```

### Step 4: Click Register
Button text: "Register"

### Expected Result:
✅ **Success messages**:
- "Registration successful!"
- Page shows: "Already have an account? Login"

❌ **If you see errors**:
- "Invalid user type" → Refresh page and try again
- "cannot insert NULL" → This should NOT appear (we fixed it!)
- "Email already registered" → Use different email

### Step 5: Login with New Account
- Click "Already have an account? Login"
- Select: Faculty Advisor
- Enter your email and password
- Click Login

✅ **Expected**: FA Dashboard loads

---

## Tutorial 3: Verify FA Can See All Requests

### Prerequisites
- You are logged in as FA (any FA account)

### Step 1: View Pending Requests
- Look for tab or section: "Pending Enrollment Requests"
- This should show ALL pending requests in system

### Step 2: Check Requests
- You should see requests from students of ANY semester
- Not limited to your assigned semester
- Not limited to students assigned to you

### Step 3: Approve a Request
- Click "Approve" button on any request
- See confirmation
- Request status changes to "APPROVED"

### Step 4: Check History
- Click on "All Requests" or "Request History" tab
- Filter by status if available
- See approved requests listed

✅ **Success**: FA has global view and can manage all requests

---

## Tutorial 4: Student Enrolls, FA Approves

### Part A: Student Perspective

#### Step 1: Login as Student
```
Email: alice.johnson@university.edu
Password: student123
```

#### Step 2: View Available Courses
- Click "Enroll in Course" or similar button
- You should see courses from ALL semesters
- Not just your own semester

#### Step 3: Request Course
- Select any course
- Click "Request" or "Enroll"
- See message: "Request submitted. Awaiting FA approval."

#### Step 4: Check Request Status
- Go to "My Requests" or "Pending Requests" section
- See your request listed
- Status: PENDING

✅ **Student part done**

### Part B: FA Perspective

#### Step 1: Login as FA
```
Email: demo.fa@college.edu
Password: fa123456
```

#### Step 2: See Student's Request
- FA Dashboard → Pending Requests
- You should see the student's request
- Shows: Student name, email, course, details

#### Step 3: Approve Request
- Click "Approve" button
- Confirm
- Request status changes to "APPROVED"

✅ **FA part done**

### Part C: Verify Student is Enrolled

#### Step 1: Logout FA
- Click logout/settings

#### Step 2: Login as Student again
```
Same credentials as Part A
```

#### Step 3: Check Enrolled Courses
- Go to "Enrolled Courses" or "My Courses"
- The course you requested should now appear
- Status: ACTIVE

✅ **Complete workflow done!**

---

## Test Checklist

### Technical Tests
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend responds at http://localhost:5000/api/health
- [ ] No errors in browser console (F12 → Console)
- [ ] No errors in backend terminal

### FA Registration Tests
- [ ] Can see demo FA credentials on login page
- [ ] Can login as demo FA successfully
- [ ] Can register new FA (no "invalid user type" error)
- [ ] Can register new FA (no "cannot insert NULL" error)
- [ ] New FA can login successfully

### FA Dashboard Tests
- [ ] FA sees pending requests from all semesters
- [ ] FA can approve requests
- [ ] FA can reject requests with reason
- [ ] FA can see assigned students (if any)
- [ ] Request history shows all requests

### Student Workflow Tests
- [ ] Student sees courses from all semesters (not just own)
- [ ] Student can request course from different semester
- [ ] Student sees pending request status
- [ ] After FA approval, course appears in enrolled list
- [ ] Drop course button works and removes course

### Database Tests
- [ ] Can query: `SELECT * FROM faculty_advisors;`
- [ ] New FAs have: prof_id = NULL (not error)
- [ ] assigned_semester = NULL means "all semesters"
- [ ] Can create multiple FAs without conflicts

---

## Troubleshooting

### Problem: "Cannot reach server"
**Solution**:
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# If not, restart backend
cd backend && npm start
```

### Problem: "Invalid user type" error
**Solution**:
1. Refresh browser (Ctrl+R)
2. Clear cache (Ctrl+Shift+Delete)
3. Try again

### Problem: "cannot insert NULL" error
**Solution**:
1. Restart backend server
2. Verify database fix was applied:
   ```sql
   DESC faculty_advisors;
   -- Check that PROF_ID shows "Null?" = empty (allows NULL)
   ```

### Problem: Login page doesn't show FA credentials
**Solution**:
1. Hard refresh: Ctrl+Shift+R
2. Check browser console for errors
3. Rebuild frontend:
   ```bash
   cd frontend && npm run build
   ```

### Problem: FA Dashboard is blank
**Solution**:
1. Wait 2 seconds for data to load
2. Refresh page (F5)
3. Check browser console for API errors
4. Verify token with: `localStorage.getItem('token')`

---

## Expected Success Signs

When everything works:

1. ✅ Demo FA shows on login page
2. ✅ Can login without errors
3. ✅ FA Dashboard loads with data
4. ✅ Can register new FA (no database errors)
5. ✅ Student can see all semester courses
6. ✅ FA can approve/reject requests
7. ✅ Student enrollment workflow completes
8. ✅ No errors in any console

---

## Time Estimates

| Test | Time |
|------|------|
| Login as demo FA | 1 minute |
| Register new FA | 2 minutes |
| Full enrollment workflow | 5 minutes |
| All checks | 10 minutes |

---

**Ready to Test?** Start with Tutorial 1! 🚀

If any issue, check the troubleshooting section above.
