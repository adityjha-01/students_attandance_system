import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEnrolledStudents, getCourseAttendance, bulkMarkAttendance, getProfessorCourses, getCurrentUser } from '../services/api';
import '../styles/MarkAttendance.css';

function ProfessorMarkAttendance() {
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { courseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [courseId, navigate]);

  useEffect(() => {
    // Fetch attendance when date changes
    if (students.length > 0) {
      fetchAttendanceForDate();
    }
  }, [attendanceDate]);

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
        // Fetch attendance for current date
        await fetchAttendanceForDate(studentsResponse.data);
      } else {
        setError(studentsResponse.message);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForDate = async (studentList = students) => {
    try {
      const response = await getCourseAttendance(courseId, attendanceDate);
      if (response.success) {
        // Build attendance status map
        const statusMap = {};
        response.data.attendance_records.forEach(record => {
          statusMap[record.STUDENT_ID] = record.ATTENDANCE_STATUS || 'NOT_MARKED';
        });
        setAttendanceStatus(statusMap);
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const newStatus = {};
    students.forEach(student => {
      newStatus[student.STUDENT_ID] = status;
    });
    setAttendanceStatus(newStatus);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // Build attendance records array
      const attendanceRecords = students.map(student => ({
        student_id: student.STUDENT_ID,
        status: attendanceStatus[student.STUDENT_ID] || 'ABSENT'
      }));

      const response = await bulkMarkAttendance(courseId, attendanceDate, attendanceRecords);
      
      if (response.success) {
        setSuccess(`Attendance marked successfully for ${response.data.total} students!`);
        fetchAttendanceForDate(); // Refresh
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PRESENT': return '#28a745';
      case 'ABSENT': return '#dc3545';
      case 'LEAVE': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <div className="mark-attendance-container">
      <div className="mark-attendance-card">
        <div className="page-header">
          <div>
            <h2>Mark Attendance</h2>
            {course && (
              <p className="course-info">{course.COURSE_NAME} ({course.SUBJECT_CODE})</p>
            )}
          </div>
          <div className="header-actions">
            <button onClick={() => navigate(`/professor/students/${courseId}`)} className="btn-secondary">
              View Students
            </button>
            <button onClick={() => navigate('/professor/dashboard')} className="btn-back">
              ← Back
            </button>
          </div>
        </div>

        <div className="attendance-controls">
          <div className="date-control">
            <label htmlFor="attendanceDate">Select Date:</label>
            <input
              type="date"
              id="attendanceDate"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="bulk-actions">
            <span>Mark All:</span>
            <button onClick={() => handleMarkAll('PRESENT')} className="btn-mark-all present">
              All Present
            </button>
            <button onClick={() => handleMarkAll('ABSENT')} className="btn-mark-all absent">
              All Absent
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {loading ? (
          <div className="loading">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <p>No students enrolled in this course yet.</p>
          </div>
        ) : (
          <>
            <div className="students-attendance-table">
              <table>
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Overall %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.STUDENT_ID}>
                      <td>{student.STUDENT_ID}</td>
                      <td className="student-name">{student.NAME}</td>
                      <td>{student.EMAIL}</td>
                      <td className="attendance-percent">
                        <span style={{color: getStatusColor(student.ATTENDANCE_PERCENTAGE >= 75 ? 'PRESENT' : 'ABSENT')}}>
                          {student.ATTENDANCE_PERCENTAGE || 0}%
                        </span>
                      </td>
                      <td>
                        <div className="status-buttons">
                          <button
                            onClick={() => handleStatusChange(student.STUDENT_ID, 'PRESENT')}
                            className={`status-btn present ${attendanceStatus[student.STUDENT_ID] === 'PRESENT' ? 'active' : ''}`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.STUDENT_ID, 'ABSENT')}
                            className={`status-btn absent ${attendanceStatus[student.STUDENT_ID] === 'ABSENT' ? 'active' : ''}`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.STUDENT_ID, 'LEAVE')}
                            className={`status-btn leave ${attendanceStatus[student.STUDENT_ID] === 'LEAVE' ? 'active' : ''}`}
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="submit-actions">
              <button onClick={handleSubmit} className="btn-submit" disabled={submitting}>
                {submitting ? 'Submitting...' : `Submit Attendance for ${attendanceDate}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProfessorMarkAttendance;
