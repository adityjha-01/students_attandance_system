# Student Profile Feature

## Overview
Comprehensive student profile management system allowing students to view and edit their personal, academic, and contact information.

## Features Implemented

### 1. **Profile Information Management**
- **Basic Information:**
  - Student ID (read-only)
  - Roll Number (editable, unique)
  - Full Name
  - Email (read-only)
  - Phone Number
  - Date of Birth
  - Blood Group
  - Current Semester (auto-updated)
  - CGPA (read-only)
  - Enrollment Date
  - Backlog Status (editable)

- **Address Information:**
  - Full address with multi-line text support

- **Emergency Contact:**
  - Emergency contact name
  - Emergency contact number

- **Parent/Guardian Information:**
  - Parent/Guardian name
  - Parent/Guardian phone

### 2. **Academic Performance Tracking**
- View all semester marks in a structured table
- Add new semester marks manually
- Fields tracked per subject:
  - Semester (1-8)
  - Subject Name
  - Marks Obtained
  - Maximum Marks
  - Calculated Percentage
  - Grade (optional)
  - Academic Year (optional)

### 3. **Password Management**
- Secure password change functionality
- Requires current password verification
- Minimum 6 characters requirement
- Password confirmation matching

### 4. **Semester Auto-Update System**
- Students can request semester update
- Requirements for update:
  - 6 months must have passed since last update
  - Student must have no backlogs
  - Maximum semester capped at 8
- System tracks last semester update date

## Database Schema Changes

### Modified `students` Table
New columns added:
```sql
- roll_no VARCHAR2(20) UNIQUE
- address VARCHAR2(500)
- date_of_birth DATE
- blood_group VARCHAR2(5)
- emergency_contact VARCHAR2(15)
- emergency_contact_name VARCHAR2(100)
- parent_name VARCHAR2(100)
- parent_phone VARCHAR2(15)
- profile_picture VARCHAR2(500)
- last_semester_update DATE
- has_backlog NUMBER(1) DEFAULT 0
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### New `semester_marks` Table
```sql
CREATE TABLE semester_marks (
    mark_id NUMBER PRIMARY KEY,
    student_id NUMBER REFERENCES students(student_id) ON DELETE CASCADE,
    semester NUMBER(1) NOT NULL,
    subject_name VARCHAR2(100) NOT NULL,
    marks_obtained NUMBER(5,2) NOT NULL,
    max_marks NUMBER(5,2) DEFAULT 100,
    grade VARCHAR2(5),
    academic_year VARCHAR2(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Profile Management
- **GET** `/api/profile` - Get student profile with all marks
- **PUT** `/api/profile` - Update student profile
- **PUT** `/api/profile/password` - Change password
- **POST** `/api/profile/marks` - Add semester marks
- **PUT** `/api/profile/semester` - Update semester (if eligible)

## User Interface

### Profile Page Features
1. **View Mode (Default)**
   - Display all information in read-only format
   - Action buttons: Edit Profile, Change Password, Add Marks, Update Semester

2. **Edit Mode**
   - All editable fields become active
   - Save/Cancel buttons appear
   - Real-time validation

3. **Modals**
   - Password Change Modal: Secure form with confirmation
   - Add Marks Modal: Form to enter semester marks

4. **Navigation**
   - "My Profile" button added to Student Dashboard
   - Accessible via `/student/profile` route

### Dark Mode Support
- Full dark mode compatibility
- All forms, tables, and modals adapt to theme
- Proper contrast for all text elements

## Security Features

1. **Authentication Required**
   - All profile endpoints require valid JWT token
   - Students can only access their own profile

2. **Password Security**
   - Current password verification before change
   - Bcrypt hashing for new passwords
   - Minimum length validation

3. **Data Validation**
   - Server-side validation for all fields
   - Unique constraint on roll_no
   - Type checking for all inputs

## Usage Instructions

### For Students

1. **View Profile:**
   - Click "👤 My Profile" button in Student Dashboard
   - All information is displayed in organized sections

2. **Edit Profile:**
   - Click "✏️ Edit Profile" button
   - Modify any editable fields
   - Click "💾 Save Changes" or "❌ Cancel"

3. **Change Password:**
   - Click "🔒 Change Password" button
   - Enter current password and new password
   - Confirm new password
   - Submit form

4. **Add Academic Marks:**
   - Click "📝 Add Marks" button
   - Fill in semester, subject, marks details
   - Submit form
   - Marks appear in Academic Performance table

5. **Update Semester:**
   - Click "📈 Update Semester" button
   - System validates eligibility:
     - Checks if 6 months have passed
     - Verifies no backlogs exist
   - Semester increments if eligible

### Field Editability

**Editable Fields:**
- Name, Phone, Roll Number, Address
- Date of Birth, Blood Group
- Emergency Contact (name and number)
- Parent Information (name and phone)
- Backlog Status (checkbox)

**Read-only Fields:**
- Student ID, Email
- Semester, CGPA
- Enrollment Date, Last Semester Update
- All academic marks

## Error Handling

1. **Profile Update Errors:**
   - Duplicate roll number detection
   - Missing required fields validation
   - Database constraint violations

2. **Password Change Errors:**
   - Current password mismatch
   - New password too short
   - Password confirmation mismatch

3. **Semester Update Errors:**
   - Less than 6 months elapsed
   - Student has backlogs
   - Already at maximum semester (8)

4. **Marks Entry Errors:**
   - Missing required fields
   - Invalid marks values

## Files Created/Modified

### Backend
- `database/04_add_profile_fields.sql` - Database schema updates
- `backend/controllers/profileController.js` - Profile business logic (300+ lines)
- `backend/routes/profileRoutes.js` - Profile routes
- `backend/server.js` - Added profile routes

### Frontend
- `frontend/src/components/StudentProfile/index.js` - Profile component (600+ lines)
- `frontend/src/components/StudentProfile/StudentProfile.css` - Profile styles (450+ lines)
- `frontend/src/services/api.js` - Added 5 profile API functions
- `frontend/src/App.js` - Added profile route
- `frontend/src/components/StudentDashboard/index.js` - Added profile button

## Future Enhancements

1. **Profile Picture Upload:**
   - File upload functionality
   - Image preview and cropping
   - Storage in filesystem or database

2. **Automated Semester Updates:**
   - Cron job to check and update semesters automatically
   - Email notifications for semester updates

3. **Marks Validation:**
   - Admin/professor approval for marks entry
   - Integration with course grading system
   - Automatic CGPA calculation from marks

4. **Document Upload:**
   - Upload and store academic documents
   - Certificates, mark sheets, ID proof
   - Document verification workflow

5. **Profile Completeness Indicator:**
   - Show percentage of profile completion
   - Prompt for missing fields
   - Encourage complete profiles

## Testing Checklist

- [x] Database schema applied successfully
- [x] All API endpoints created and connected
- [x] Profile view displays all information
- [x] Edit mode enables field editing
- [x] Profile update saves changes
- [x] Password change works with validation
- [x] Add marks creates database records
- [x] Semester update validates eligibility
- [x] Dark mode styles applied
- [x] Navigation link in dashboard works
- [x] Error messages display correctly
- [x] Success messages display correctly

## Notes

- Profile pictures feature is prepared (database column exists) but upload functionality not implemented
- Semester auto-update requires manual trigger (no cron job yet)
- Marks entry is self-service (no admin approval workflow)
- CGPA field exists but not automatically calculated from marks
