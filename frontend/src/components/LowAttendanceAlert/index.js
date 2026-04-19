import React, { useState, useEffect } from 'react';
import { getLowAttendanceStudents } from '../../services/api';
import './LowAttendanceAlert.css';

function LowAttendanceAlert({ userType }) {
  const [lowAttendance, setLowAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchLowAttendance();
  }, []);

  const fetchLowAttendance = async () => {
    try {
      const response = await getLowAttendanceStudents();
      if (response.success) {
        setLowAttendance(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch low attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || lowAttendance.length === 0) {
    return null;
  }

  return (
    <div className="low-attendance-alert">
      <div 
        className="alert-header" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="alert-icon">⚠️</div>
        <div className="alert-title">
          <strong>Low Attendance Alert</strong>
          <span className="alert-count">
            {lowAttendance.length} {userType === 'professor' ? 'student(s)' : 'course(s)'} below 75%
          </span>
        </div>
        <button className="expand-btn">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="alert-body">
          {userType === 'professor' ? (
            <div className="students-list">
              {lowAttendance.map((item, index) => (
                <div key={index} className="alert-item">
                  <div className="item-info">
                    <strong>{item.FULL_NAME}</strong>
                    <span className="course-name">{item.COURSE_NAME} ({item.SUBJECT_CODE})</span>
                  </div>
                  <div className="attendance-stat">
                    <span className="percentage danger">
                      {item.ATTENDANCE_PERCENTAGE || 0}%
                    </span>
                    <span className="details">
                      {item.CLASSES_ATTENDED || 0}/{item.TOTAL_CLASSES || 0} classes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="courses-list">
              {lowAttendance.map((item, index) => (
                <div key={index} className="alert-item">
                  <div className="item-info">
                    <strong>{item.COURSE_NAME}</strong>
                    <span className="course-code">{item.SUBJECT_CODE}</span>
                  </div>
                  <div className="attendance-stat">
                    <span className="percentage danger">
                      {item.ATTENDANCE_PERCENTAGE || 0}%
                    </span>
                    <span className="details">
                      {item.CLASSES_ATTENDED || 0}/{item.TOTAL_CLASSES || 0} classes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LowAttendanceAlert;
