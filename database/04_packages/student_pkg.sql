-- ============================================
-- STUDENT PACKAGE
-- ============================================

CREATE OR REPLACE PACKAGE student_pkg IS
    -- Get all available courses for enrollment
    PROCEDURE get_available_courses(
        p_semester IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    );
    
    -- Get student's enrolled courses
    PROCEDURE get_enrolled_courses(
        p_student_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    );
    
    -- Get student's attendance record
    PROCEDURE get_student_attendance(
        p_student_id IN NUMBER,
        p_course_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    );
    
    -- Calculate attendance percentage
    FUNCTION get_attendance_percentage(
        p_student_id IN NUMBER,
        p_course_id IN NUMBER
    ) RETURN NUMBER;
    
END student_pkg;
/

CREATE OR REPLACE PACKAGE BODY student_pkg IS

    PROCEDURE get_available_courses(
        p_semester IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    ) IS
    BEGIN
        OPEN p_cursor FOR
        SELECT 
            c.course_id,
            c.course_name,
            c.subject_code,
            p.name AS professor_name,
            c.credits,
            c.max_enrollment,
            c.current_enrollment,
            (c.max_enrollment - c.current_enrollment) AS seats_available,
            c.course_start_date,
            c.course_end_date
        FROM courses c
        JOIN professors p ON c.prof_id = p.prof_id
        WHERE c.semester_offered = p_semester
          AND c.current_enrollment < c.max_enrollment
          AND c.course_start_date > SYSDATE
        ORDER BY c.course_name;
    END get_available_courses;

    PROCEDURE get_enrolled_courses(
        p_student_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    ) IS
    BEGIN
        OPEN p_cursor FOR
        SELECT 
            c.course_id,
            c.course_name,
            c.subject_code,
            p.name AS professor_name,
            c.credits,
            e.enrollment_date,
            e.status,
            student_pkg.get_attendance_percentage(p_student_id, c.course_id) AS attendance_percentage
        FROM enrollments e
        JOIN courses c ON e.course_id = c.course_id
        JOIN professors p ON c.prof_id = p.prof_id
        WHERE e.student_id = p_student_id
          AND e.status = 'ACTIVE'
        ORDER BY c.course_name;
    END get_enrolled_courses;

    PROCEDURE get_student_attendance(
        p_student_id IN NUMBER,
        p_course_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    ) IS
    BEGIN
        OPEN p_cursor FOR
        SELECT 
            attendance_id,
            attendance_date,
            status,
            remarks,
            marked_timestamp
        FROM attendance
        WHERE student_id = p_student_id
          AND course_id = p_course_id
        ORDER BY attendance_date DESC;
    END get_student_attendance;

    FUNCTION get_attendance_percentage(
        p_student_id IN NUMBER,
        p_course_id IN NUMBER
    ) RETURN NUMBER IS
        v_total_classes NUMBER := 0;
        v_present_classes NUMBER := 0;
        v_percentage NUMBER := 0;
    BEGIN
        SELECT COUNT(*) INTO v_total_classes
        FROM attendance
        WHERE student_id = p_student_id
          AND course_id = p_course_id;
        
        IF v_total_classes = 0 THEN
            RETURN 0;
        END IF;
        
        SELECT COUNT(*) INTO v_present_classes
        FROM attendance
        WHERE student_id = p_student_id
          AND course_id = p_course_id
          AND status = 'PRESENT';
        
        v_percentage := ROUND((v_present_classes / v_total_classes) * 100, 2);
        RETURN v_percentage;
    END get_attendance_percentage;

END student_pkg;
/