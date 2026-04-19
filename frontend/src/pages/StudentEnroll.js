import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableCourses, enrollCourse, getCurrentUser } from '../services/api';
import '../styles/StudentEnroll.css';

function StudentEnroll() {
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [enrolling, setEnrolling] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    // Get semester from user object
    const userSemester = currentUser.semester || 1;
    fetchCourses(userSemester);
  }, [navigate]);

  const fetchCourses = async (semester) => {
    setLoading(true);
    setError('');
    try {
      const response = await getAvailableCourses(semester);
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

  const handleEnroll = async (courseId, seatsAvailable) => {
    if (seatsAvailable === 0) {
      setError('Course is full!');
      return;
    }

    setEnrolling(courseId);
    setError('');
    setSuccess('');

    try {
      const response = await enrollCourse(courseId);
      if (response.success) {
        setSuccess('✓ Request submitted successfully! Your FA will review and approve soon.');
        setError('');
        // Refresh courses list
        const userSemester = user.semester || 1;
        fetchCourses(userSemester);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit enrollment request.');
    } finally {
      setEnrolling(null);
    }
  };

  const getSeatStatus = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage === 0) return { text: 'Full', color: '#dc3545' };
    if (percentage <= 20) return { text: 'Almost Full', color: '#ffc107' };
    return { text: 'Available', color: '#28a745' };
  };

  return (
    <div className="student-enroll-container">
      <div className="enroll-content">
        <div className="page-header">
          <div>
            <h2>Available Courses</h2>
            {user && (
              <p className="semester-info">
                Showing courses for Semester {user.semester || 1}
              </p>
            )}
          </div>
          <button onClick={() => navigate('/student/dashboard')} className="btn-back">
            ← Back to Dashboard
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="info-banner">
          <strong>📋 Enrollment Policy:</strong> Courses are filled on a First Come First Served (FCFS) basis. 
          Enroll early to secure your spot!
        </div>

        {loading ? (
          <div className="loading">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <h3>No Courses Available</h3>
            <p>There are no courses available for your semester at the moment.</p>
            <p>Check back later or contact your academic advisor.</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => {
              const seatStatus = getSeatStatus(course.SEATS_AVAILABLE, course.MAX_ENROLLMENT);
              const isFull = course.SEATS_AVAILABLE === 0;
              const isEnrolling = enrolling === course.COURSE_ID;

              return (
                <div key={course.COURSE_ID} className={`enroll-course-card ${isFull ? 'full' : ''}`}>
                  <div className="course-header">
                    <h3>{course.COURSE_NAME}</h3>
                    <span className="course-code">{course.SUBJECT_CODE}</span>
                  </div>

                  <div className="course-details">
                    <div className="detail-row">
                      <span className="detail-label">👨‍🏫 Professor:</span>
                      <span className="detail-value">{course.PROFESSOR_NAME}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">📚 Credits:</span>
                      <span className="detail-value">{course.CREDITS}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">📅 Start Date:</span>
                      <span className="detail-value">
                        {new Date(course.COURSE_START_DATE).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">📅 End Date:</span>
                      <span className="detail-value">
                        {new Date(course.COURSE_END_DATE).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="seats-info">
                    <div className="seats-bar">
                      <div 
                        className="seats-filled"
                        style={{
                          width: `${((course.MAX_ENROLLMENT - course.SEATS_AVAILABLE) / course.MAX_ENROLLMENT) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className="seats-text">
                      <span style={{color: seatStatus.color, fontWeight: 'bold'}}>
                        {seatStatus.text}
                      </span>
                      <span>
                        {course.SEATS_AVAILABLE} / {course.MAX_ENROLLMENT} seats
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleEnroll(course.COURSE_ID, course.SEATS_AVAILABLE)}
                    className="btn-enroll"
                    disabled={isFull || isEnrolling}
                  >
                    {isEnrolling ? 'Enrolling...' : (isFull ? '❌ Course Full' : '✅ Enroll Now')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentEnroll;
