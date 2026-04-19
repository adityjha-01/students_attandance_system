-- ============================================
-- DEMO FACULTY ADVISOR CREDENTIALS
-- ============================================

-- Use this script to insert demo Faculty Advisors for testing
-- Copy and paste into sqlplus

-- Before running, make sure you've already run:
-- @03_faculty_advisor.sql
-- @04_faculty_advisor_data.sql

-- Demo Credentials:
-- Email: fa_advisor1@college.edu | Password: FA123456
-- Email: fa_advisor2@college.edu | Password: FA123456

-- Get professor IDs to link with FAs
DECLARE
  prof_id_1 NUMBER;
  prof_id_2 NUMBER;
BEGIN
  -- Get first two professor IDs
  SELECT prof_id INTO prof_id_1 FROM professors WHERE ROWNUM = 1;
  
  SELECT prof_id INTO prof_id_2 FROM professors WHERE prof_id != prof_id_1 AND ROWNUM = 1;
  
  -- Insert FA 1
  INSERT INTO faculty_advisors (fa_id, prof_id, name, email, department, phone, password_hash, assigned_semester, created_at)
  VALUES (
      faculty_advisor_seq.NEXTVAL,
      prof_id_1,
      'Dr. Rajesh Kumar',
      'fa_advisor1@college.edu',
      'CS',
      '+91-9876543210',
      '$2a$10$yuUkvyLJKCpFUIU7p5Bsh.nvNJ7fkxuS1/NzTmb/gNI4TA49mDe4q',
      2,
      SYSTIMESTAMP
  );
  
  -- Insert FA 2
  INSERT INTO faculty_advisors (fa_id, prof_id, name, email, department, phone, password_hash, assigned_semester, created_at)
  VALUES (
      faculty_advisor_seq.NEXTVAL,
      prof_id_2,
      'Dr. Priya Singh',
      'fa_advisor2@college.edu',
      'IT',
      '+91-9876543211',
      '$2a$10$yuUkvyLJKCpFUIU7p5Bsh.nvNJ7fkxuS1/NzTmb/gNI4TA49mDe4q',
      4,
      SYSTIMESTAMP
  );
  
  COMMIT;
END;
/

-- Assign some students to these FAs
INSERT INTO student_fa_assignment (assignment_id, student_id, fa_id)
SELECT 
    student_fa_assignment_seq.NEXTVAL,
    s.student_id,
    (SELECT fa_id FROM faculty_advisors WHERE assigned_semester = s.semester AND ROWNUM = 1)
FROM students s
WHERE EXISTS (SELECT 1 FROM faculty_advisors fa WHERE fa.assigned_semester = s.semester);

COMMIT;

PROMPT Demo Faculty Advisor credentials inserted!
PROMPT ============================================
PROMPT Faculty Advisor 1:
PROMPT Email: fa_advisor1@college.edu
PROMPT Password: FA123456
PROMPT Department: CS
PROMPT ============================================
PROMPT Faculty Advisor 2:
PROMPT Email: fa_advisor2@college.edu
PROMPT Password: FA123456
PROMPT Department: IT
PROMPT ============================================
