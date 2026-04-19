import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnrolledCourses, getCurrentUser, logout, dropCourse } from '../../services/api';
import ThemeToggle from '../ThemeToggle';
import LowAttendanceAlert from '../LowAttendanceAlert';
import './StudentDashboard.css';

function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [dropModalOpen, setDropModalOpen] = useState(false);
  const [selectedCourseForDrop, setSelectedCourseForDrop] = useState(null);
  const [droppingCourse, setDroppingCourse] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    fetchEnrolledCourses();
  }, [navigate]);

  const fetchEnrolledCourses = async () => {
    try {
      const response = await getEnrolledCourses();
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

  const handleViewAttendance = (courseId) => {
    navigate(`/student/attendance/${courseId}`);
  };

  const handleDropCourseClick = (course) => {
    setSelectedCourseForDrop(course);
    setDropModalOpen(true);
  };

  const confirmDropCourse = async () => {
    if (!selectedCourseForDrop) return;
    
    setDroppingCourse(true);
    try {
      const response = await dropCourse(selectedCourseForDrop.COURSE_ID);
      if (response.success) {
        alert('✅ Course dropped successfully!');
        setDropModalOpen(false);
        setSelectedCourseForDrop(null);
        fetchEnrolledCourses(); // Refresh the list
      } else {
        alert('❌ Failed to drop course: ' + response.message);
      }
    } catch (err) {
      alert('❌ Error: ' + (err.message || 'Failed to drop course'));
    } finally {
      setDroppingCourse(false);
    }
  };

  const cancelDropCourse = () => {
    setDropModalOpen(false);
    setSelectedCourseForDrop(null);
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h2>Student Portal</h2>
        <div className="nav-user">
          <span>Welcome, {user?.name}</span>
          <ThemeToggle />
          <button onClick={() => navigate('/student/profile')} className="btn-secondary">
            👤 My Profile
          </button>
          <button onClick={() => navigate('/student/enroll')} className="btn-secondary">
            📚 Enroll in Course
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h1>My Enrolled Courses</h1>

        <LowAttendanceAlert userType="student" />

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <p>You are not enrolled in any courses yet.</p>
            <button onClick={() => navigate('/student/enroll')} className="btn-primary">
              Browse Available Courses
            </button>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course.COURSE_ID} className="course-card">
                <h3>{course.COURSE_NAME}</h3>
                <div className="course-info">
                  <p><strong>Code:</strong> {course.SUBJECT_CODE}</p>
                  <p><strong>Professor:</strong> {course.PROFESSOR_NAME}</p>
                  <p><strong>Credits:</strong> {course.CREDITS}</p>
                  <p><strong>Status:</strong> 
                    <span className={`status-badge status-${course.STATUS?.toLowerCase()}`}>
                      {course.STATUS}
                    </span>
                  </p>
                </div>
                <div className="attendance-info">
                  <div className="attendance-percentage">
                    <span className="percentage-value">
                      {course.ATTENDANCE_PERCENTAGE || 0}%
                    </span>
                    <span className="percentage-label">Attendance</span>
                  </div>
                  <button 
                    onClick={() => handleViewAttendance(course.COURSE_ID)}
                    className="btn-view"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleDropCourseClick(course)}
                    className="btn-drop"
                    title="Drop this course"
                  >
                    🗑️ Drop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drop Course Modal */}
      {dropModalOpen && selectedCourseForDrop && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>⚠️ Confirm Course Drop</h3>
              <button 
                className="modal-close" 
                onClick={cancelDropCourse}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to drop the following course?</p>
              <div className="course-details-modal">
                <p><strong>Course:</strong> {selectedCourseForDrop.COURSE_NAME}</p>
                <p><strong>Code:</strong> {selectedCourseForDrop.SUBJECT_CODE}</p>
                <p><strong>Professor:</strong> {selectedCourseForDrop.PROFESSOR_NAME}</p>
                <p><strong>Current Attendance:</strong> {selectedCourseForDrop.ATTENDANCE_PERCENTAGE || 0}%</p>
              </div>
              <p className="warning-text">
                ⚠️ <strong>Warning:</strong> You will lose access to course materials, 
                grades, and attendance records for this course.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-danger" 
                onClick={confirmDropCourse}
                disabled={droppingCourse}
              >
                {droppingCourse ? 'Dropping...' : 'Yes, Drop Course'}
              </button>
              <button 
                className="btn-secondary" 
                onClick={cancelDropCourse}
                disabled={droppingCourse}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
