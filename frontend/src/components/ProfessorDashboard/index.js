import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getProfessorCourses, 
  deleteCourse, 
  downloadCourseExcel, 
  downloadCoursePDF, 
  getCurrentUser, 
  logout 
} from '../../services/api';
import ThemeToggle from '../ThemeToggle';
import LowAttendanceAlert from '../LowAttendanceAlert';
import './ProfessorDashboard.css';

function ProfessorDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    fetchCourses();
  }, [navigate]);

  const fetchCourses = async () => {
    try {
      const response = await getProfessorCourses();
      if (response.success) {
        setCourses(response.data || []);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleMarkAttendance = (courseId) => {
    navigate(`/professor/mark-attendance/${courseId}`);
  };

  const handleViewStudents = (courseId) => {
    navigate(`/professor/students/${courseId}`);
  };

  const handleDownloadExcel = async (courseId, courseName) => {
    try {
      setError('');
      const blob = await downloadCourseExcel(courseId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${courseName}-${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess('Excel report downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to download Excel report');
    }
  };

  const handleDownloadPDF = async (courseId, courseName) => {
    try {
      setError('');
      const blob = await downloadCoursePDF(courseId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${courseName}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess('PDF report downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to download PDF report');
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!window.confirm(`Are you sure you want to delete "${courseName}"?\n\nThis will also delete:\n- All student enrollments\n- All attendance records\n\nThis action cannot be undone!`)) {
      return;
    }

    setDeletingCourse(courseId);
    setError('');
    setSuccess('');

    try {
      const response = await deleteCourse(courseId);
      if (response.success) {
        setSuccess(`Course "${courseName}" deleted successfully`);
        // Refresh course list
        fetchCourses();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.message || 'Failed to delete course');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete course');
    } finally {
      setDeletingCourse(null);
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h2>Professor Portal</h2>
        <div className="nav-user">
          <span>Welcome, {user?.name}</span>
          <ThemeToggle />
          <button onClick={() => navigate('/professor/create-course')} className="btn-secondary">
            Create New Course
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h1>My Courses</h1>

        <LowAttendanceAlert userType="professor" />

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {loading ? (
          <div className="loading">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <p>You haven't created any courses yet.</p>
            <button onClick={() => navigate('/professor/create-course')} className="btn-primary">
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course.COURSE_ID} className="course-card">
                <h3>{course.COURSE_NAME}</h3>
                <div className="course-info">
                  <p><strong>Code:</strong> {course.SUBJECT_CODE}</p>
                  <p><strong>Credits:</strong> {course.CREDITS}</p>
                  <p><strong>Semester:</strong> {course.SEMESTER_OFFERED}</p>
                  <p><strong>Enrollment:</strong> {course.CURRENT_ENROLLMENT} / {course.MAX_ENROLLMENT}</p>
                  <p><strong>Available Seats:</strong> {course.AVAILABLE_SEATS}</p>
                </div>
                <div className="course-dates">
                  <p><strong>Start:</strong> {new Date(course.COURSE_START_DATE).toLocaleDateString()}</p>
                  <p><strong>End:</strong> {new Date(course.COURSE_END_DATE).toLocaleDateString()}</p>
                </div>
                <div className="course-actions">
                  <button 
                    onClick={() => handleMarkAttendance(course.COURSE_ID)}
                    className="btn-primary"
                  >
                    Mark Attendance
                  </button>
                  <button 
                    onClick={() => handleViewStudents(course.COURSE_ID)}
                    className="btn-view"
                  >
                    View Students
                  </button>
                  <button 
                    onClick={() => handleDownloadExcel(course.COURSE_ID, course.COURSE_NAME)}
                    className="btn-download"
                    title="Download Excel Report"
                  >
                    📊 Excel
                  </button>
                  <button 
                    onClick={() => handleDownloadPDF(course.COURSE_ID, course.COURSE_NAME)}
                    className="btn-download"
                    title="Download PDF Report"
                  >
                    📄 PDF
                  </button>
                  <button 
                    onClick={() => handleDeleteCourse(course.COURSE_ID, course.COURSE_NAME)}
                    className="btn-delete"
                    disabled={deletingCourse === course.COURSE_ID}
                  >
                    {deletingCourse === course.COURSE_ID ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfessorDashboard;
