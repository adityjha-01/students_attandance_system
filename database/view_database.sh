#!/bin/bash
# Student Attendance System - Database Query Commands
# ====================================================

echo "======================================================"
echo "STUDENT ATTENDANCE SYSTEM - DATABASE QUERIES"
echo "======================================================"
echo ""

# Database connection details
DB_USER="sagar"
DB_PASS="2066"
DB_SID="XEPDB1"

# Function to run SQL query
run_query() {
    local query="$1"
    sqlplus -s ${DB_USER}/${DB_PASS}@${DB_SID} <<EOF
SET PAGESIZE 50
SET LINESIZE 200
SET FEEDBACK OFF
SET HEADING ON
$query
EXIT;
EOF
}

# 1. ALL PROFESSORS
echo "======================================================"
echo "1. ALL PROFESSORS"
echo "======================================================"
run_query "
SELECT 
    prof_id AS \"ID\",
    name AS \"Name\",
    email AS \"Email\",
    department AS \"Department\",
    phone AS \"Phone\",
    TO_CHAR(created_at, 'YYYY-MM-DD') AS \"Registered\"
FROM professors
ORDER BY prof_id;
"

# 2. ALL STUDENTS
echo ""
echo "======================================================"
echo "2. ALL STUDENTS"
echo "======================================================"
run_query "
SELECT 
    student_id AS \"ID\",
    name AS \"Name\",
    email AS \"Email\",
    semester AS \"Sem\",
    cgpa AS \"CGPA\",
    phone AS \"Phone\",
    TO_CHAR(enrollment_date, 'YYYY-MM-DD') AS \"Joined\"
FROM students
ORDER BY student_id;
"

# 3. ALL COURSES
echo ""
echo "======================================================"
echo "3. ALL COURSES"
echo "======================================================"
run_query "
SELECT 
    c.course_id AS \"ID\",
    c.course_name AS \"Course Name\",
    c.subject_code AS \"Code\",
    p.name AS \"Professor\",
    c.semester_offered AS \"Sem\",
    c.credits AS \"Cr\",
    c.current_enrollment || '/' || c.max_enrollment AS \"Enrolled\",
    TO_CHAR(c.course_start_date, 'YYYY-MM-DD') AS \"Start Date\"
FROM courses c
JOIN professors p ON c.prof_id = p.prof_id
ORDER BY c.semester_offered, c.course_id;
"

# 4. PROFESSORS WITH THEIR COURSES
echo ""
echo "======================================================"
echo "4. PROFESSORS WITH THEIR COURSES"
echo "======================================================"
run_query "
SELECT 
    p.name AS \"Professor\",
    p.email AS \"Email\",
    p.department AS \"Dept\",
    COUNT(c.course_id) AS \"Total Courses\",
    SUM(c.current_enrollment) AS \"Total Students\"
FROM professors p
LEFT JOIN courses c ON p.prof_id = c.prof_id
GROUP BY p.prof_id, p.name, p.email, p.department
ORDER BY p.name;
"

echo ""
echo "--- Course Details by Professor ---"
run_query "
SELECT 
    p.name AS \"Professor\",
    c.course_name AS \"Course\",
    c.subject_code AS \"Code\",
    c.semester_offered AS \"Sem\",
    c.current_enrollment || '/' || c.max_enrollment AS \"Enrolled\"
FROM professors p
LEFT JOIN courses c ON p.prof_id = c.prof_id
ORDER BY p.name, c.course_id;
"

# 5. STUDENTS WITH THEIR ENROLLED COURSES
echo ""
echo "======================================================"
echo "5. STUDENTS WITH ENROLLED COURSES"
echo "======================================================"
run_query "
SELECT 
    s.name AS \"Student\",
    s.email AS \"Email\",
    s.semester AS \"Sem\",
    COUNT(e.enrollment_id) AS \"Courses Enrolled\"
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id AND e.status = 'ACTIVE'
GROUP BY s.student_id, s.name, s.email, s.semester
ORDER BY s.name;
"

echo ""
echo "--- Enrollment Details ---"
run_query "
SELECT 
    s.name AS \"Student\",
    s.semester AS \"Sem\",
    c.course_name AS \"Course\",
    c.subject_code AS \"Code\",
    p.name AS \"Professor\",
    TO_CHAR(e.enrollment_date, 'YYYY-MM-DD') AS \"Enrolled On\",
    e.status AS \"Status\"
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN courses c ON e.course_id = c.course_id
LEFT JOIN professors p ON c.prof_id = p.prof_id
WHERE e.enrollment_id IS NOT NULL
ORDER BY s.name, e.enrollment_date;
"

# 6. ATTENDANCE STATISTICS
echo ""
echo "======================================================"
echo "6. ATTENDANCE STATISTICS BY STUDENT"
echo "======================================================"
run_query "
SELECT 
    s.name AS \"Student\",
    c.course_name AS \"Course\",
    COUNT(a.attendance_id) AS \"Classes\",
    SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS \"Present\",
    SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS \"Absent\",
    SUM(CASE WHEN a.status = 'LEAVE' THEN 1 ELSE 0 END) AS \"Leave\",
    ROUND((SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 2) || '%' AS \"Attendance %\"
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
LEFT JOIN attendance a ON s.student_id = a.student_id AND c.course_id = a.course_id
WHERE e.status = 'ACTIVE'
GROUP BY s.student_id, s.name, c.course_id, c.course_name
ORDER BY s.name, c.course_name;
"

# 7. COURSE ENROLLMENT SUMMARY
echo ""
echo "======================================================"
echo "7. COURSE ENROLLMENT SUMMARY"
echo "======================================================"
run_query "
SELECT 
    c.course_name AS \"Course\",
    c.subject_code AS \"Code\",
    c.semester_offered AS \"Sem\",
    p.name AS \"Professor\",
    c.current_enrollment AS \"Enrolled\",
    c.max_enrollment AS \"Capacity\",
    (c.max_enrollment - c.current_enrollment) AS \"Available\",
    ROUND((c.current_enrollment / c.max_enrollment) * 100, 1) || '%' AS \"Fill %\"
FROM courses c
JOIN professors p ON c.prof_id = p.prof_id
ORDER BY c.semester_offered, c.course_id;
"

# 8. RECENT ATTENDANCE (Last 10 records)
echo ""
echo "======================================================"
echo "8. RECENT ATTENDANCE RECORDS"
echo "======================================================"
run_query "
SELECT * FROM (
    SELECT 
        s.name AS \"Student\",
        c.course_name AS \"Course\",
        TO_CHAR(a.attendance_date, 'YYYY-MM-DD') AS \"Date\",
        a.status AS \"Status\",
        p.name AS \"Marked By\"
    FROM attendance a
    JOIN students s ON a.student_id = s.student_id
    JOIN courses c ON a.course_id = c.course_id
    JOIN professors p ON a.marked_by = p.prof_id
    ORDER BY a.marked_timestamp DESC
) WHERE ROWNUM <= 10;
"

echo ""
echo "======================================================"
echo "END OF REPORT"
echo "======================================================"
