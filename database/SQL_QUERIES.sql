-- ==========================================
-- STUDENT ATTENDANCE SYSTEM - SQL QUERIES
-- Copy and paste these into sqlplus
-- ==========================================

-- First, connect to database:
-- sqlplus sagar/2066@XEPDB1

-- Set formatting for better output
SET LINESIZE 200
SET PAGESIZE 50
SET FEEDBACK ON

-- ==========================================
-- 1. VIEW ALL PROFESSORS
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 1: ALL PROFESSORS (Details)
PROMPT ========================================
SELECT 
    prof_id AS "ID",
    name AS "Name",
    email AS "Email",
    department AS "Department",
    phone AS "Phone"
FROM professors
ORDER BY prof_id;


-- ==========================================
-- 2. VIEW ALL STUDENTS
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 2: ALL STUDENTS (Details)
PROMPT ========================================
SELECT 
    student_id AS "ID",
    name AS "Name",
    email AS "Email",
    semester AS "Sem",
    cgpa AS "CGPA",
    phone AS "Phone"
FROM students
ORDER BY student_id;


-- ==========================================
-- 3. VIEW ALL COURSES
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 3: ALL COURSES (With Professor Info)
PROMPT ========================================
SELECT 
    c.course_id AS "ID",
    c.course_name AS "Course Name",
    c.subject_code AS "Code",
    p.name AS "Professor",
    c.semester_offered AS "Sem",
    c.credits AS "Credits",
    c.current_enrollment || '/' || c.max_enrollment AS "Enrolled"
FROM courses c
JOIN professors p ON c.prof_id = p.prof_id
ORDER BY c.semester_offered, c.course_id;


-- ==========================================
-- 4. PROFESSORS WITH THEIR COURSES
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 4: PROFESSORS COURSE SUMMARY (By Professor)
PROMPT ========================================
SELECT 
    p.name AS "Professor",
    p.department AS "Department",
    COUNT(c.course_id) AS "Total Courses",
    SUM(c.current_enrollment) AS "Total Students"
FROM professors p
LEFT JOIN courses c ON p.prof_id = c.prof_id
GROUP BY p.prof_id, p.name, p.department
ORDER BY p.name;

PROMPT
PROMPT ========================================
PROMPT >>> QUERY 4B: DETAILED COURSES PER PROFESSOR
PROMPT ========================================
SELECT 
    p.name AS "Professor",
    c.course_name AS "Course",
    c.subject_code AS "Code",
    c.semester_offered AS "Sem",
    c.current_enrollment || '/' || c.max_enrollment AS "Enrolled"
FROM professors p
LEFT JOIN courses c ON p.prof_id = c.prof_id
ORDER BY p.name, c.course_id;


-- ==========================================
-- 5. STUDENTS WITH ENROLLED COURSES
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 5: STUDENTS ENROLLMENT SUMMARY
PROMPT ========================================
SELECT 
    s.name AS "Student",
    s.email AS "Email",
    s.semester AS "Sem",
    COUNT(e.enrollment_id) AS "Courses"
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id AND e.status = 'ACTIVE'
GROUP BY s.student_id, s.name, s.email, s.semester
ORDER BY s.name;

PROMPT
PROMPT ========================================
PROMPT >>> QUERY 5B: DETAILED STUDENT ENROLLMENTS
PROMPT ========================================
SELECT 
    s.name AS "Student",
    s.semester AS "Stu Sem",
    c.course_name AS "Course",
    c.subject_code AS "Code",
    c.semester_offered AS "Crs Sem",
    p.name AS "Professor",
    TO_CHAR(e.enrollment_date, 'YYYY-MM-DD') AS "Enrolled On"
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
JOIN professors p ON c.prof_id = p.prof_id
WHERE e.status = 'ACTIVE'
ORDER BY s.name, e.enrollment_date;


-- ==========================================
-- 6. ATTENDANCE STATISTICS BY STUDENT
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 6: STUDENT ATTENDANCE STATISTICS
PROMPT ========================================
SELECT 
    s.name AS "Student",
    c.course_name AS "Course",
    COUNT(a.attendance_id) AS "Classes",
    SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS "Present",
    SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS "Absent",
    SUM(CASE WHEN a.status = 'LEAVE' THEN 1 ELSE 0 END) AS "Leave",
    ROUND((SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) || '%' AS "Attendance"
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
LEFT JOIN attendance a ON s.student_id = a.student_id AND c.course_id = a.course_id
WHERE e.status = 'ACTIVE'
GROUP BY s.name, c.course_name
ORDER BY s.name, c.course_name;


-- ==========================================
-- 7. COURSE ENROLLMENT SUMMARY
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 7: COURSE CAPACITY & ENROLLMENT
PROMPT ========================================
SELECT 
    c.course_name AS "Course",
    c.subject_code AS "Code",
    c.semester_offered AS "Sem",
    p.name AS "Professor",
    c.current_enrollment AS "Enrolled",
    c.max_enrollment AS "Capacity",
    (c.max_enrollment - c.current_enrollment) AS "Available",
    ROUND((c.current_enrollment / c.max_enrollment) * 100, 1) || '%' AS "Fill %"
FROM courses c
JOIN professors p ON c.prof_id = p.prof_id
ORDER BY c.semester_offered, c.course_id;


-- ==========================================
-- 8. RECENT ATTENDANCE RECORDS (Last 20)
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 8: RECENT ATTENDANCE RECORDS (Last 20)
PROMPT ========================================
SELECT * FROM (
    SELECT 
        s.name AS "Student",
        c.course_name AS "Course",
        TO_CHAR(a.attendance_date, 'YYYY-MM-DD') AS "Date",
        a.status AS "Status",
        p.name AS "Marked By",
        TO_CHAR(a.marked_timestamp, 'YYYY-MM-DD HH24:MI') AS "Time"
    FROM attendance a
    JOIN students s ON a.student_id = s.student_id
    JOIN courses c ON a.course_id = c.course_id
    JOIN professors p ON a.marked_by = p.prof_id
    ORDER BY a.marked_timestamp DESC
) WHERE ROWNUM <= 20;


-- ==========================================
-- 9. DATABASE SUMMARY (Quick Stats)
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 9: DATABASE SUMMARY (Overall Stats)
PROMPT ========================================
SELECT 'Professors' AS "Type", COUNT(*) AS "Count" FROM professors
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Courses', COUNT(*) FROM courses
UNION ALL
SELECT 'Active Enrollments', COUNT(*) FROM enrollments WHERE status = 'ACTIVE'
UNION ALL
SELECT 'Attendance Records', COUNT(*) FROM attendance;


-- ==========================================
-- 10. STUDENTS BY SEMESTER
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 10: STUDENTS BY SEMESTER
PROMPT ========================================
SELECT 
    semester AS "Semester",
    COUNT(*) AS "Total Students"
FROM students
GROUP BY semester
ORDER BY semester;


-- ==========================================
-- 11. COURSES BY SEMESTER
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 11: COURSES BY SEMESTER
PROMPT ========================================
SELECT 
    semester_offered AS "Semester",
    COUNT(*) AS "Total Courses",
    SUM(current_enrollment) AS "Total Enrollments"
FROM courses
GROUP BY semester_offered
ORDER BY semester_offered;


-- ==========================================
-- 12. FIND STUDENTS NOT ENROLLED IN ANY COURSE
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 12: UNROLLED STUDENTS
PROMPT ========================================
SELECT 
    s.student_id AS "ID",
    s.name AS "Name",
    s.email AS "Email",
    s.semester AS "Semester"
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id AND e.status = 'ACTIVE'
WHERE e.enrollment_id IS NULL;


-- ==========================================
-- 13. FIND COURSES WITH NO ENROLLMENTS
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 13: EMPTY COURSES (No Students)
PROMPT ========================================
SELECT 
    c.course_id AS "ID",
    c.course_name AS "Course",
    c.subject_code AS "Code",
    c.semester_offered AS "Semester",
    c.max_enrollment AS "Capacity"
FROM courses c
WHERE c.current_enrollment = 0;


-- ==========================================
-- 14. SEARCH SPECIFIC STUDENT (Change name)
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 14: SEARCH STUDENT BY NAME
PROMPT ========================================
SELECT 
    s.student_id AS "ID",
    s.name AS "Name",
    s.email AS "Email",
    s.semester AS "Semester",
    COUNT(e.enrollment_id) AS "Courses Enrolled"
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id AND e.status = 'ACTIVE'
WHERE LOWER(s.name) LIKE '%alice%'  -- Change 'alice' to search name
GROUP BY s.student_id, s.name, s.email, s.semester;


-- ==========================================
-- 15. ATTENDANCE FOR SPECIFIC DATE
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 15: ATTENDANCE BY DATE
PROMPT ========================================
SELECT 
    c.course_name AS "Course",
    s.name AS "Student",
    a.status AS "Status"
FROM attendance a
JOIN students s ON a.student_id = s.student_id
JOIN courses c ON a.course_id = c.course_id
WHERE a.attendance_date = TO_DATE('2026-04-01', 'YYYY-MM-DD')  -- Change date
ORDER BY c.course_name, s.name;


-- ==========================================
-- ============================================
-- FACULTY ADVISOR (FA) QUERIES START HERE
-- ============================================
-- ==========================================

-- ==========================================
-- 16. VIEW ALL FACULTY ADVISORS
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 16: ALL FACULTY ADVISORS
PROMPT ========================================
SELECT 
    fa_id AS "ID",
    name AS "Name",
    email AS "Email",
    department AS "Department",
    assigned_semester AS "Assigned Sem",
    phone AS "Phone",
    created_at AS "Created"
FROM faculty_advisors
ORDER BY fa_id;


-- ==========================================
-- 17. FA WITH ASSIGNED STUDENTS
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 17: FA WITH THEIR STUDENTS
PROMPT ========================================
SELECT 
    fa.fa_id AS "FA ID",
    fa.name AS "FA Name",
    fa.assigned_semester AS "FA Sem",
    COUNT(sfa.student_id) AS "Total Students",
    LISTAGG(s.name, ', ') WITHIN GROUP (ORDER BY s.name) AS "Students"
FROM faculty_advisors fa
LEFT JOIN student_fa_assignment sfa ON fa.fa_id = sfa.fa_id
LEFT JOIN students s ON sfa.student_id = s.student_id
GROUP BY fa.fa_id, fa.name, fa.assigned_semester
ORDER BY fa.fa_id;


-- ==========================================
-- 18. VIEW ALL PENDING ENROLLMENT REQUESTS
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 18: PENDING ENROLLMENT REQUESTS
PROMPT ========================================
SELECT 
    er.enrollment_request_id AS "Request ID",
    s.name AS "Student Name",
    s.email AS "Student Email",
    c.course_name AS "Course",
    c.subject_code AS "Code",
    fa.name AS "FA",
    er.status AS "Status",
    TO_CHAR(er.created_at, 'YYYY-MM-DD HH24:MI') AS "Created"
FROM enrollment_requests er
JOIN students s ON er.student_id = s.student_id
JOIN courses c ON er.course_id = c.course_id
LEFT JOIN faculty_advisors fa ON er.fa_id = fa.fa_id
WHERE er.status = 'PENDING'
ORDER BY er.created_at DESC;


-- ==========================================
-- 19. ENROLLMENT REQUESTS BY FA
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 19: ENROLLMENT REQUESTS SUMMARY BY FA
PROMPT ========================================
SELECT 
    fa.fa_id AS "FA ID",
    fa.name AS "FA Name",
    COUNT(CASE WHEN er.status = 'PENDING' THEN 1 END) AS "Pending",
    COUNT(CASE WHEN er.status = 'APPROVED' THEN 1 END) AS "Approved",
    COUNT(CASE WHEN er.status = 'REJECTED' THEN 1 END) AS "Rejected",
    COUNT(er.enrollment_request_id) AS "Total"
FROM faculty_advisors fa
LEFT JOIN enrollment_requests er ON fa.fa_id = er.fa_id
GROUP BY fa.fa_id, fa.name
ORDER BY fa.fa_id;


-- ==========================================
-- 20. STUDENT-FA ASSIGNMENTS (Details)
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 20: STUDENT-FA ASSIGNMENTS (Detailed)
PROMPT ========================================
SELECT 
    sfa.assignment_id AS "Assignment ID",
    s.student_id AS "Student ID",
    s.name AS "Student Name",
    s.email AS "Student Email",
    s.semester AS "Student Sem",
    fa.fa_id AS "FA ID",
    fa.name AS "FA Name",
    fa.assigned_semester AS "FA Sem",
    TO_CHAR(sfa.assigned_at, 'YYYY-MM-DD HH24:MI') AS "Assigned"
FROM student_fa_assignment sfa
JOIN students s ON sfa.student_id = s.student_id
JOIN faculty_advisors fa ON sfa.fa_id = fa.fa_id
ORDER BY sfa.assignment_id;


-- ==========================================
-- 21. STUDENTS NOT ASSIGNED TO ANY FA
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 21: UNASSIGNED STUDENTS (Need FA)
PROMPT ========================================
SELECT 
    s.student_id AS "ID",
    s.name AS "Name",
    s.email AS "Email",
    s.semester AS "Semester"
FROM students s
LEFT JOIN student_fa_assignment sfa ON s.student_id = sfa.student_id
WHERE sfa.assignment_id IS NULL
ORDER BY s.student_id;


-- ==========================================
-- 22. FA STATISTICS SUMMARY
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 22: FA SYSTEM STATISTICS
PROMPT ========================================
SELECT 
    COUNT(DISTINCT fa_id) AS "Total FAs",
    COUNT(DISTINCT sfa.student_id) AS "Students Assigned",
    (SELECT COUNT(*) FROM enrollment_requests WHERE status = 'PENDING') AS "Pending Requests",
    (SELECT COUNT(*) FROM enrollment_requests WHERE status = 'APPROVED') AS "Approved Requests"
FROM faculty_advisors fa
LEFT JOIN student_fa_assignment sfa ON fa.fa_id = sfa.fa_id;


-- ==========================================
-- 23. VIEW FAS BY SEMESTER
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 23: FA ASSIGNMENT BY SEMESTER
PROMPT ========================================
SELECT 
    fa.assigned_semester AS "Semester",
    COUNT(fa.fa_id) AS "Total FAs",
    LISTAGG(fa.name, ', ') WITHIN GROUP (ORDER BY fa.name) AS "FA Names"
FROM faculty_advisors fa
WHERE fa.assigned_semester IS NOT NULL
GROUP BY fa.assigned_semester
ORDER BY fa.assigned_semester;


-- ==========================================
-- 24. FA WITH THEIR ENROLLMENT APPROVALS
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 24: FA APPROVAL STATISTICS
PROMPT ========================================
SELECT 
    fa.fa_id AS "FA ID",
    fa.name AS "FA Name",
    COUNT(er.enrollment_request_id) AS "Total Requests",
    SUM(CASE WHEN er.status = 'APPROVED' THEN 1 ELSE 0 END) AS "Approved",
    SUM(CASE WHEN er.status = 'REJECTED' THEN 1 ELSE 0 END) AS "Rejected",
    SUM(CASE WHEN er.status = 'PENDING' THEN 1 ELSE 0 END) AS "Pending"
FROM faculty_advisors fa
LEFT JOIN enrollment_requests er ON fa.fa_id = er.fa_id
GROUP BY fa.fa_id, fa.name
ORDER BY fa.fa_id;


-- ==========================================
-- 25. SEARCH SPECIFIC FA (Change name)
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 25: SEARCH FA BY NAME (Modify query)
PROMPT ========================================
SELECT 
    fa.fa_id AS "ID",
    fa.name AS "Name",
    fa.email AS "Email",
    fa.department AS "Department",
    fa.assigned_semester AS "Assigned Sem",
    COUNT(sfa.student_id) AS "Students Assigned",
    COUNT(er.enrollment_request_id) AS "Requests Handled"
FROM faculty_advisors fa
LEFT JOIN student_fa_assignment sfa ON fa.fa_id = sfa.fa_id
LEFT JOIN enrollment_requests er ON fa.fa_id = er.fa_id
WHERE LOWER(fa.name) LIKE '%shubham%'  -- Change 'shubham' to search FA name
GROUP BY fa.fa_id, fa.name, fa.email, fa.department, fa.assigned_semester;


-- ==========================================
-- 26. VIEW ALL ENROLLMENT REQUESTS (Complete History)
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 26: ALL ENROLLMENT REQUESTS (History)
PROMPT ========================================
SELECT 
    er.enrollment_request_id AS "Request ID",
    s.name AS "Student",
    c.course_name AS "Course",
    fa.name AS "FA",
    er.status AS "Status",
    TO_CHAR(er.created_at, 'YYYY-MM-DD') AS "Created",
    TO_CHAR(er.updated_at, 'YYYY-MM-DD') AS "Updated"
FROM enrollment_requests er
JOIN students s ON er.student_id = s.student_id
JOIN courses c ON er.course_id = c.course_id
LEFT JOIN faculty_advisors fa ON er.fa_id = fa.fa_id
ORDER BY er.created_at DESC;


-- ==========================================
-- 27. FA WORKLOAD ANALYSIS
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 27: FA WORKLOAD ANALYSIS (Most Requests)
PROMPT ========================================
SELECT 
    fa.name AS "FA Name",
    fa.assigned_semester AS "Semester",
    COUNT(DISTINCT sfa.student_id) AS "Students",
    COUNT(DISTINCT er.enrollment_request_id) AS "Requests",
    ROUND(COUNT(DISTINCT er.enrollment_request_id) / NULLIF(COUNT(DISTINCT sfa.student_id), 0), 2) AS "Requests/Student"
FROM faculty_advisors fa
LEFT JOIN student_fa_assignment sfa ON fa.fa_id = sfa.fa_id
LEFT JOIN enrollment_requests er ON fa.fa_id = er.fa_id
GROUP BY fa.fa_id, fa.name, fa.assigned_semester
ORDER BY COUNT(DISTINCT er.enrollment_request_id) DESC;


-- ==========================================
-- 28. FIND UNASSIGNED STUDENTS BY SEMESTER
-- ==========================================
PROMPT
PROMPT ========================================
PROMPT >>> QUERY 28: UNASSIGNED STUDENTS BY SEMESTER
PROMPT ========================================
SELECT 
    s.semester AS "Semester",
    COUNT(s.student_id) AS "Unassigned Students",
    LISTAGG(s.name, ', ') WITHIN GROUP (ORDER BY s.name) AS "Student Names"
FROM students s
LEFT JOIN student_fa_assignment sfa ON s.student_id = sfa.student_id
WHERE sfa.assignment_id IS NULL
GROUP BY s.semester
ORDER BY s.semester;

PROMPT
PROMPT ========================================
PROMPT >>> ALL QUERIES COMPLETED (28 Total)
PROMPT ========================================
PROMPT
