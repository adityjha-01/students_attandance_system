import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEnrolledStudents, getProfessorCourses } from '../services/api';
import '../styles/ViewStudents.css';

function ViewStudents() {
  const { courseId } = useParams();
  const [students, setStudents] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const coursesResponse = await getProfessorCourses();
      if (coursesResponse.success) {
        const courseData = coursesResponse.data.find(c => c.COURSE_ID === parseInt(courseId));
        setCourse(courseData);
      }

      // Fetch enrolled students
      const studentsResponse = await getEnrolledStudents(courseId);
      if (studentsResponse.success) {
        setStudents(studentsResponse.data || []);
      } else {
        setError(studentsResponse.message);
      }
    } catch (err) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (percentage) => {
    if (!percentage) return '#999';
    if (percentage >= 75) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="view-students-container">
      <div className="view-students-card">
        <div className="page-header">
          <div>
            <h2>{course?.COURSE_NAME || 'Course Students'}</h2>
            {course && (
              <p className="course-code">{course.SUBJECT_CODE} | Semester {course.SEMESTER_OFFERED}</p>
            )}
          </div>
          <div className="header-actions">
            <button 
              onClick={() => navigate(`/professor/mark-attendance/${courseId}`)} 
              className="btn-primary"
            >
              Mark Attendance
            </button>
            <button onClick={() => navigate('/professor/dashboard')} className="btn-back">
              ← Back
            </button>
          </div>
        </div>

        {course && (
          <div className="course-stats">
            <div className="stat-card">
              <div className="stat-value">{students.length}</div>
              <div className="stat-label">Total Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{course.CURRENT_ENROLLMENT} / {course.MAX_ENROLLMENT}</div>
              <div className="stat-label">Enrollment</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{course.AVAILABLE_SEATS}</div>
              <div className="stat-label">Seats Available</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{course.CREDITS}</div>
              <div className="stat-label">Credits</div>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <p>No students enrolled yet.</p>
            <p>Students will appear here once they enroll in this course.</p>
          </div>
        ) : (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Semester</th>
                  <th>CGPA</th>
                  <th>Enrolled On</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const percentage = student.ATTENDANCE_PERCENTAGE || 0;
                  const isLowAttendance = percentage < 75;
                  
                  return (
                    <tr key={student.STUDENT_ID} className={isLowAttendance ? 'low-attendance-row' : ''}>
                      <td>{student.STUDENT_ID}</td>
                      <td className="student-name">
                        {student.NAME}
                        {isLowAttendance && <span className="warning-icon" title="Low Attendance"> ⚠️</span>}
                      </td>
                      <td>{student.EMAIL}</td>
                      <td>{student.SEMESTER}</td>
                      <td>{student.CGPA ? student.CGPA.toFixed(2) : 'N/A'}</td>
                      <td>{new Date(student.ENROLLMENT_DATE).toLocaleDateString()}</td>
                      <td>
                        <span 
                          className="attendance-badge"
                          style={{ backgroundColor: getAttendanceColor(student.ATTENDANCE_PERCENTAGE) }}
                        >
                          {student.ATTENDANCE_PERCENTAGE ? `${student.ATTENDANCE_PERCENTAGE}%` : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewStudents;
