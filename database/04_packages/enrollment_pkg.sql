-- ============================================
-- ENROLLMENT PACKAGE (FCFS - First Come First Serve)
-- ============================================

CREATE OR REPLACE PACKAGE enrollment_pkg IS
    -- Enroll student in course (FCFS logic)
    PROCEDURE enroll_student(
        p_student_id IN NUMBER,
        p_course_id IN NUMBER,
        p_message OUT VARCHAR2
    );
    
    -- Drop course
    PROCEDURE drop_course(
        p_enrollment_id IN NUMBER,
        p_message OUT VARCHAR2
    );
    
END enrollment_pkg;
/

CREATE OR REPLACE PACKAGE BODY enrollment_pkg IS

    PROCEDURE enroll_student(
        p_student_id IN NUMBER,
        p_course_id IN NUMBER,
        p_message OUT VARCHAR2
    ) IS
        v_current_enrollment NUMBER;
        v_max_enrollment NUMBER;
        v_enrollment_id NUMBER;
    BEGIN
        -- Check if student already enrolled
        BEGIN
            SELECT enrollment_id INTO v_enrollment_id
            FROM enrollments
            WHERE student_id = p_student_id
              AND course_id = p_course_id
              AND status = 'ACTIVE';
            
            p_message := 'ALREADY_ENROLLED';
            RETURN;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                NULL;
        END;
        
        -- Check course capacity
        SELECT current_enrollment, max_enrollment 
        INTO v_current_enrollment, v_max_enrollment
        FROM courses
        WHERE course_id = p_course_id;
        
        IF v_current_enrollment >= v_max_enrollment THEN
            p_message := 'COURSE_FULL';
            RETURN;
        END IF;
        
        -- Enroll student (FCFS)
        INSERT INTO enrollments (enrollment_id, student_id, course_id, status)
        VALUES (enrollment_id_seq.NEXTVAL, p_student_id, p_course_id, 'ACTIVE');
        
        -- Update course enrollment count
        UPDATE courses
        SET current_enrollment = current_enrollment + 1
        WHERE course_id = p_course_id;
        
        p_message := 'ENROLLMENT_SUCCESS';
        COMMIT;
        
    EXCEPTION
        WHEN OTHERS THEN
            p_message := 'ERROR: ' || SQLERRM;
            ROLLBACK;
    END enroll_student;

    PROCEDURE drop_course(
        p_enrollment_id IN NUMBER,
        p_message OUT VARCHAR2
    ) IS
        v_course_id NUMBER;
    BEGIN
        -- Get course ID
        SELECT course_id INTO v_course_id
        FROM enrollments
        WHERE enrollment_id = p_enrollment_id;
        
        -- Update enrollment status
        UPDATE enrollments
        SET status = 'DROPPED'
        WHERE enrollment_id = p_enrollment_id;
        
        -- Update course enrollment count
        UPDATE courses
        SET current_enrollment = current_enrollment - 1
        WHERE course_id = v_course_id;
        
        p_message := 'DROPPED_SUCCESS';
        COMMIT;
        
    EXCEPTION
        WHEN OTHERS THEN
            p_message := 'ERROR: ' || SQLERRM;
            ROLLBACK;
    END drop_course;

END enrollment_pkg;
/