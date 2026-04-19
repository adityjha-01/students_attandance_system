# Database Query Commands - Quick Reference
# ==========================================

## Connect to Database
```bash
sqlplus sagar/2066@XEPDB1
```

## Quick Queries (Copy-paste in sqlplus)

### 1. View All Professors
```sql
SET LINESIZE 200
SET PAGESIZE 50
SELECT prof_id, name, email, department, phone FROM professors ORDER BY prof_id;
```

### 2. View All Students
```sql
SELECT student_id, name, email, semester, cgpa, phone FROM students ORDER BY student_id;
```

### 3. View All Courses
```sql
SELECT 
    c.course_id, 
    c.course_name, 
    c.subject_code,
    p.name AS professor_name,
    c.semester_offered,
    c.current_enrollment || '/' || c.max_enrollment AS enrollment
FROM courses c
JOIN professors p ON c.prof_id = p.prof_id
ORDER BY c.semester_offered;
```

### 4. Professors with Their Courses
```sql
SELECT 
    p.name AS professor,
    c.course_name,
    c.subject_code,
    c.semester_offered,
    c.current_enrollment || '/' || c.max_enrollment AS enrollment
FROM professors p
LEFT JOIN courses c ON p.prof_id = c.prof_id
ORDER BY p.name, c.course_id;
```

### 5. Students with Enrolled Courses
```sql
SELECT 
    s.name AS student,
    s.semester,
    c.course_name,
    c.subject_code,
    p.name AS professor,
    e.status
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN courses c ON e.course_id = c.course_id
LEFT JOIN professors p ON c.prof_id = p.prof_id
ORDER BY s.name;
```

### 6. Attendance Summary by Student
```sql
SELECT 
    s.name AS student,
    c.course_name,
    COUNT(a.attendance_id) AS total_classes,
    SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS present,
    SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS absent,
    ROUND((SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS attendance_percent
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
LEFT JOIN attendance a ON s.student_id = a.student_id AND c.course_id = a.course_id
GROUP BY s.name, c.course_name
ORDER BY s.name;
```

### 7. Course Enrollment Summary
```sql
SELECT 
    c.course_name,
    c.subject_code,
    c.semester_offered,
    p.name AS professor,
    c.current_enrollment,
    c.max_enrollment,
    (c.max_enrollment - c.current_enrollment) AS available_seats
FROM courses c
JOIN professors p ON c.prof_id = p.prof_id
ORDER BY c.semester_offered;
```

### 8. Recent Attendance Records (Last 10)
```sql
SELECT * FROM (
    SELECT 
        s.name AS student,
        c.course_name,
        a.attendance_date,
        a.status,
        p.name AS marked_by
    FROM attendance a
    JOIN students s ON a.student_id = s.student_id
    JOIN courses c ON a.course_id = c.course_id
    JOIN professors p ON a.marked_by = p.prof_id
    ORDER BY a.marked_timestamp DESC
) WHERE ROWNUM <= 10;
```

## One-line Commands (Run from terminal)

### View All Professors
```bash
echo "SELECT prof_id, name, email, department FROM professors;" | sqlplus -s sagar/2066@XEPDB1
```

### View All Students
```bash
echo "SELECT student_id, name, email, semester FROM students;" | sqlplus -s sagar/2066@XEPDB1
```

### View All Courses
```bash
echo "SELECT c.course_id, c.course_name, p.name AS prof FROM courses c JOIN professors p ON c.prof_id = p.prof_id;" | sqlplus -s sagar/2066@XEPDB1
```

### Count Summary
```bash
echo "
SELECT 'Professors' AS type, COUNT(*) AS count FROM professors
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Courses', COUNT(*) FROM courses
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM enrollments WHERE status = 'ACTIVE'
UNION ALL
SELECT 'Attendance Records', COUNT(*) FROM attendance;
" | sqlplus -s sagar/2066@XEPDB1
```

## Use the Automated Script
```bash
cd /home/sagar-jadhav/student-attendance-system/database
./view_database.sh
```

This will show you everything in a nicely formatted report!
