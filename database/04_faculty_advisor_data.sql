-- ============================================
-- SEQUENCES FOR FACULTY ADVISOR SYSTEM
-- ============================================

-- Drop sequences if they exist
BEGIN
   EXECUTE IMMEDIATE 'DROP SEQUENCE enrollment_request_seq';
EXCEPTION
   WHEN OTHERS THEN NULL;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'DROP SEQUENCE faculty_advisor_seq';
EXCEPTION
   WHEN OTHERS THEN NULL;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'DROP SEQUENCE student_fa_assignment_seq';
EXCEPTION
   WHEN OTHERS THEN NULL;
END;
/

-- Create sequences
CREATE SEQUENCE enrollment_request_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE faculty_advisor_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE student_fa_assignment_seq START WITH 1 INCREMENT BY 1;

-- ============================================
-- INSERT TEST DATA FOR FACULTY ADVISORS
-- ============================================

-- Insert Faculty Advisors (can be professors teaching at the department)
INSERT INTO faculty_advisors (fa_id, prof_id, name, email, department, phone, password_hash, assigned_semester)
SELECT 
    faculty_advisor_seq.NEXTVAL,
    prof_id,
    name,
    'fa_' || LOWER(SUBSTR(name, 1, 3)) || '@college.edu',
    department,
    phone,
    password_hash,
    MOD(prof_id, 8) + 1  -- Assign semesters 1-8
FROM professors
WHERE ROWNUM <= 2;  -- Only first 2 professors as FAs

-- ============================================
-- ASSIGN FACULTY ADVISORS TO STUDENTS
-- ============================================

-- Assign students to faculty advisors (based on student semester)
INSERT INTO student_fa_assignment (assignment_id, student_id, fa_id)
SELECT 
    student_fa_assignment_seq.NEXTVAL,
    s.student_id,
    (SELECT fa_id FROM faculty_advisors WHERE assigned_semester = s.semester AND ROWNUM = 1)
FROM students s
WHERE EXISTS (SELECT 1 FROM faculty_advisors fa WHERE fa.assigned_semester = s.semester);

COMMIT;

PROMPT Faculty Advisor test data inserted successfully!
