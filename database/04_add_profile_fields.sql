-- Add additional profile fields for students

-- Add new columns to students table
ALTER TABLE students ADD (
    roll_no VARCHAR2(20),
    address VARCHAR2(500),
    date_of_birth DATE,
    blood_group VARCHAR2(5),
    emergency_contact VARCHAR2(15),
    emergency_contact_name VARCHAR2(100),
    parent_name VARCHAR2(100),
    parent_phone VARCHAR2(15),
    profile_picture VARCHAR2(500),
    last_semester_update DATE,
    has_backlog NUMBER(1) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint on roll_no
ALTER TABLE students ADD CONSTRAINT uk_roll_no UNIQUE (roll_no);

-- Add check constraint for blood group
ALTER TABLE students ADD CONSTRAINT chk_blood_group 
    CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));

-- Add check constraint for has_backlog (0 or 1)
ALTER TABLE students ADD CONSTRAINT chk_has_backlog 
    CHECK (has_backlog IN (0, 1));

-- Create a table for semester marks
CREATE TABLE semester_marks (
    mark_id NUMBER PRIMARY KEY,
    student_id NUMBER NOT NULL,
    semester NUMBER(1) NOT NULL,
    subject_name VARCHAR2(100) NOT NULL,
    marks_obtained NUMBER(5,2),
    max_marks NUMBER(5,2) DEFAULT 100,
    grade VARCHAR2(5),
    academic_year VARCHAR2(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_marks_student FOREIGN KEY (student_id) 
        REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT chk_marks_range CHECK (marks_obtained >= 0 AND marks_obtained <= max_marks)
);

-- Create sequence for semester marks
CREATE SEQUENCE semester_marks_seq START WITH 1 INCREMENT BY 1;

-- Create trigger for semester marks ID
CREATE OR REPLACE TRIGGER semester_marks_bi
BEFORE INSERT ON semester_marks
FOR EACH ROW
BEGIN
    IF :NEW.mark_id IS NULL THEN
        SELECT semester_marks_seq.NEXTVAL INTO :NEW.mark_id FROM dual;
    END IF;
END;
/

-- Create table for storing last semester update date
COMMENT ON COLUMN students.last_semester_update IS 'Last date when semester was auto-updated';
COMMENT ON COLUMN students.has_backlog IS '0 = No backlog, 1 = Has backlog (prevents auto semester update)';

-- Show confirmation
SELECT 'Profile fields added successfully!' as status FROM dual;
