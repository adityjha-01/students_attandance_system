-- ============================================
-- PROFESSOR PACKAGE
-- ============================================

CREATE OR REPLACE PACKAGE professor_pkg IS
    -- Create a new course
    PROCEDURE create_course(
        p_prof_id IN NUMBER,
        p_course_name IN VARCHAR2,
        p_subject_code IN VARCHAR2,
        p_credits IN NUMBER,
        p_semester_offered IN NUMBER,
        p_max_enrollment IN NUMBER,
        p_course_start_date IN DATE,
        p_course_end_date IN DATE,
        p_message OUT VARCHAR2
    );
    
    -- Get all courses taught by professor
    PROCEDURE get_professor_courses(
        p_prof_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    );
    
    -- Get students enrolled in a specific course
    PROCEDURE get_enrolled_students(
        p_course_id IN NUMBER,
        p_prof_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    );
    
    -- Get course details
    PROCEDURE get_course_details(
        p_course_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    );
    
END professor_pkg;
/

CREATE OR REPLACE PACKAGE BODY professor_pkg IS

    PROCEDURE create_course(
        p_prof_id IN NUMBER,
        p_course_name IN VARCHAR2,
        p_subject_code IN VARCHAR2,
        p_credits IN NUMBER,
        p_semester_offered IN NUMBER,
        p_max_enrollment IN NUMBER,
        p_course_start_date IN DATE,
        p_course_end_date IN DATE,
        p_message OUT VARCHAR2
    ) IS
        v_count NUMBER;
    BEGIN
        -- Check if subject code already exists
        SELECT COUNT(*) INTO v_count
        FROM courses
        WHERE subject_code = p_subject_code;
        
        IF v_count > 0 THEN
            p_message := 'SUBJECT_CODE_EXISTS';
            RETURN;
        END IF;
        
        -- Validate dates
        IF p_course_end_date <= p_course_start_date THEN
            p_message := 'INVALID_DATES';
            RETURN;
        END IF;
        
        -- Insert new course
        INSERT INTO courses (
            course_id,
            prof_id,
            course_name,
            subject_code,
            credits,
            semester_offered,
            max_enrollment,
            current_enrollment,
            course_start_date,
            course_end_date
        ) VALUES (
            course_id_seq.NEXTVAL,
            p_prof_id,
            p_course_name,
            p_subject_code,
            p_credits,
            p_semester_offered,
            p_max_enrollment,
            0,
            p_course_start_date,
            p_course_end_date
        );
        
        p_message := 'COURSE_CREATED';
        COMMIT;
        
    EXCEPTION
        WHEN OTHERS THEN
            p_message := 'ERROR: ' || SQLERRM;
            ROLLBACK;
    END create_course;

    PROCEDURE get_professor_courses(
        p_prof_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    ) IS
    BEGIN
        OPEN p_cursor FOR
        SELECT 
            c.course_id,
            c.course_name,
            c.subject_code,
            c.credits,
            c.semester_offered,
            c.max_enrollment,
            c.current_enrollment,
            (c.max_enrollment - c.current_enrollment) AS seats_available,
            c.course_start_date,
            c.course_end_date,
            c.created_at
        FROM courses c
        WHERE c.prof_id = p_prof_id
        ORDER BY c.course_start_date DESC;
    END get_professor_courses;

    PROCEDURE get_enrolled_students(
        p_course_id IN NUMBER,
        p_prof_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    ) IS
        v_count NUMBER;
    BEGIN
        -- Verify professor owns the course
        SELECT COUNT(*) INTO v_count
        FROM courses
        WHERE course_id = p_course_id
          AND prof_id = p_prof_id;
        
        IF v_count = 0 THEN
            -- Return empty cursor if unauthorized
            OPEN p_cursor FOR
            SELECT NULL AS student_id FROM dual WHERE 1=0;
            RETURN;
        END IF;
        
        OPEN p_cursor FOR
        SELECT 
            s.student_id,
            s.name,
            s.email,
            s.semester,
            s.cgpa,
            e.enrollment_date,
            e.status AS enrollment_status,
            student_pkg.get_attendance_percentage(s.student_id, p_course_id) AS attendance_percentage
        FROM students s
        JOIN enrollments e ON s.student_id = e.student_id
        WHERE e.course_id = p_course_id
          AND e.status = 'ACTIVE'
        ORDER BY s.name;
    END get_enrolled_students;

    PROCEDURE get_course_details(
        p_course_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    ) IS
    BEGIN
        OPEN p_cursor FOR
        SELECT 
            c.course_id,
            c.course_name,
            c.subject_code,
            c.credits,
            c.semester_offered,
            c.max_enrollment,
            c.current_enrollment,
            c.course_start_date,
            c.course_end_date,
            p.prof_id,
            p.name AS professor_name,
            p.email AS professor_email,
            p.department
        FROM courses c
        JOIN professors p ON c.prof_id = p.prof_id
        WHERE c.course_id = p_course_id;
    END get_course_details;

END professor_pkg;
/
