-- ============================================
-- ATTENDANCE PACKAGE
-- ============================================

CREATE OR REPLACE PACKAGE attendance_pkg IS
    -- Mark attendance for students in a course
    PROCEDURE mark_attendance(
        p_prof_id IN NUMBER,
        p_course_id IN NUMBER,
        p_student_id IN NUMBER,
        p_status IN VARCHAR2,
        p_remarks IN VARCHAR2,
        p_message OUT VARCHAR2
    );
    
    -- Get attendance summary for course
    PROCEDURE get_course_attendance_summary(
        p_course_id IN NUMBER,
        p_attendance_date IN DATE,
        p_cursor OUT SYS_REFCURSOR
    );
    
    -- Get attendance summary for student
    PROCEDURE get_student_attendance_summary(
        p_student_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    );
    
END attendance_pkg;
/

CREATE OR REPLACE PACKAGE BODY attendance_pkg IS

    PROCEDURE mark_attendance(
        p_prof_id IN NUMBER,
        p_course_id IN NUMBER,
        p_student_id IN NUMBER,
        p_status IN VARCHAR2,
        p_remarks IN VARCHAR2,
        p_message OUT VARCHAR2
    ) IS
        v_count NUMBER;
    BEGIN
        -- Validate professor owns the course
        SELECT COUNT(*) INTO v_count
        FROM courses
        WHERE course_id = p_course_id
          AND prof_id = p_prof_id;
        
        IF v_count = 0 THEN
            p_message := 'UNAUTHORIZED';
            RETURN;
        END IF;
        
        -- Check if student is enrolled
        SELECT COUNT(*) INTO v_count
        FROM enrollments
        WHERE student_id = p_student_id
          AND course_id = p_course_id
          AND status = 'ACTIVE';
        
        IF v_count = 0 THEN
            p_message := 'STUDENT_NOT_ENROLLED';
            RETURN;
        END IF;
        
        -- Insert or update attendance
        BEGIN
            INSERT INTO attendance (
                attendance_id,
                student_id,
                course_id,
                attendance_date,
                status,
                marked_by,
                remarks
            ) VALUES (
                attendance_id_seq.NEXTVAL,
                p_student_id,
                p_course_id,
                TRUNC(SYSDATE),
                p_status,
                p_prof_id,
                p_remarks
            );
            
            p_message := 'ATTENDANCE_MARKED';
        EXCEPTION
            WHEN DUP_VAL_ON_INDEX THEN
                UPDATE attendance
                SET status = p_status,
                    remarks = p_remarks,
                    marked_timestamp = SYSTIMESTAMP
                WHERE student_id = p_student_id
                  AND course_id = p_course_id
                  AND attendance_date = TRUNC(SYSDATE);
                
                p_message := 'ATTENDANCE_UPDATED';
        END;
        
        COMMIT;
        
    EXCEPTION
        WHEN OTHERS THEN
            p_message := 'ERROR: ' || SQLERRM;
            ROLLBACK;
    END mark_attendance;

    PROCEDURE get_course_attendance_summary(
        p_course_id IN NUMBER,
        p_attendance_date IN DATE,
        p_cursor OUT SYS_REFCURSOR
    ) IS
    BEGIN
        OPEN p_cursor FOR
        SELECT 
            s.student_id,
            s.name,
            s.email,
            COALESCE(a.status, 'NOT_MARKED') AS attendance_status,
            COALESCE(a.remarks, '') AS remarks
        FROM students s
        JOIN enrollments e ON s.student_id = e.student_id
        LEFT JOIN attendance a ON s.student_id = a.student_id
                              AND a.course_id = p_course_id
                              AND a.attendance_date = p_attendance_date
        WHERE e.course_id = p_course_id
          AND e.status = 'ACTIVE'
        ORDER BY s.name;
    END get_course_attendance_summary;

    PROCEDURE get_student_attendance_summary(
        p_student_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    ) IS
    BEGIN
        OPEN p_cursor FOR
        SELECT 
            c.course_id,
            c.course_name,
            c.subject_code,
            COUNT(*) AS total_classes,
            SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count,
            SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_count,
            SUM(CASE WHEN a.status = 'LEAVE' THEN 1 ELSE 0 END) AS leave_count,
            ROUND((SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS attendance_percentage
        FROM courses c
        JOIN enrollments e ON c.course_id = e.course_id
        LEFT JOIN attendance a ON c.course_id = a.course_id AND e.student_id = a.student_id
        WHERE e.student_id = p_student_id
          AND e.status = 'ACTIVE'
        GROUP BY c.course_id, c.course_name, c.subject_code
        ORDER BY c.course_name;
    END get_student_attendance_summary;

END attendance_pkg;
/