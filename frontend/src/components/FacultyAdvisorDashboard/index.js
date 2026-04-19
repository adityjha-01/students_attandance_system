import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';
import { logout, getCurrentUser } from '../../services/api';
import axiosInstance from '../../services/api';
import './FacultyAdvisorDashboard.css';

function FacultyAdvisorDashboard() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [requestsRes, studentsRes] = await Promise.all([
        axiosInstance.get('/faculty-advisor/pending-requests'),
        axiosInstance.get('/faculty-advisor/assigned-students')
      ]);

      if (requestsRes.data.success) {
        setPendingRequests(requestsRes.data.data);
      }
      if (studentsRes.data.success) {
        setAssignedStudents(studentsRes.data.data);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setApproving(true);
    try {
      const response = await axiosInstance.post('/faculty-advisor/approve', {
        request_id: requestId
      });

      if (response.data.success) {
        alert('✅ Request approved! Student is now enrolled.');
        loadData();
      }
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || 'Failed to approve'));
    } finally {
      setApproving(false);
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setRejecting(true);
    try {
      const response = await axiosInstance.post('/faculty-advisor/reject', {
        request_id: selectedRequest.REQUEST_ID,
        rejection_reason: rejectionReason
      });

      if (response.data.success) {
        alert('✅ Request rejected.');
        setRejectModalOpen(false);
        loadData();
      }
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || 'Failed to reject'));
    } finally {
      setRejecting(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="fa-dashboard-container">
        <div className="loading">Loading Faculty Advisor Dashboard...</div>
      </div>
    );
  }

  const stats = {
    pending: pendingRequests.filter(r => r.STATUS === 'PENDING').length,
    total_students: assignedStudents.length
  };

  return (
    <div className="fa-dashboard-container">
      {/* Navigation */}
      <nav className="fa-nav">
        <h2>Faculty Advisor Portal</h2>
        <div className="nav-user">
          <span>Welcome, {user?.name}</span>
          <ThemeToggle />
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="fa-content">
        {error && <div className="error-message">{error}</div>}

        {/* Stats */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_students}</div>
            <div className="stat-label">Assigned Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{pendingRequests.length}</div>
            <div className="stat-label">Total Requests</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            📋 Pending Requests ({stats.pending})
          </button>
          <button
            className={`tab ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            👥 Assigned Students ({stats.total_students})
          </button>
        </div>

        {/* Pending Requests Tab */}
        {activeTab === 'pending' && (
          <div className="tab-content">
            <h3>Pending Enrollment Requests</h3>
            
            {pendingRequests.filter(r => r.STATUS === 'PENDING').length === 0 ? (
              <div className="empty-message">
                <p>No pending requests at this time.</p>
              </div>
            ) : (
              <div className="requests-container">
                {pendingRequests
                  .filter(r => r.STATUS === 'PENDING')
                  .map(request => (
                    <div key={request.REQUEST_ID} className="request-card">
                      <div className="request-header">
                        <h4>{request.STUDENT_NAME}</h4>
                        <span className="request-date">{request.REQUEST_DATE}</span>
                      </div>

                      <div className="request-body">
                        <div className="student-info">
                          <p><strong>📧 Email:</strong> {request.STUDENT_EMAIL}</p>
                          <p><strong>📚 Semester:</strong> {request.STUDENT_SEMESTER}</p>
                          <p><strong>📊 CGPA:</strong> {request.CGPA}</p>
                        </div>

                        <div className="course-info">
                          <p><strong>📖 Course:</strong> {request.COURSE_NAME}</p>
                          <p><strong>🔖 Code:</strong> {request.SUBJECT_CODE}</p>
                          <p><strong>👨‍🏫 Professor:</strong> {request.PROFESSOR_NAME}</p>
                          <p><strong>⏰ Credits:</strong> {request.CREDITS}</p>
                          <p><strong>🏢 Capacity:</strong> {request.CURRENT_ENROLLMENT}/{request.MAX_ENROLLMENT}
                            <span className="capacity-bar">
                              <span 
                                className="capacity-fill"
                                style={{width: `${(request.CURRENT_ENROLLMENT / request.MAX_ENROLLMENT) * 100}%`}}
                              ></span>
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="request-actions">
                        <button
                          className="btn-approve"
                          onClick={() => handleApprove(request.REQUEST_ID)}
                          disabled={approving}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleRejectClick(request)}
                          disabled={rejecting}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Assigned Students Tab */}
        {activeTab === 'students' && (
          <div className="tab-content">
            <h3>My Assigned Students</h3>
            
            {assignedStudents.length === 0 ? (
              <div className="empty-message">
                <p>No students assigned yet.</p>
              </div>
            ) : (
              <div className="students-table">
                <table>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Semester</th>
                      <th>CGPA</th>
                      <th>Active Courses</th>
                      <th>Pending Requests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedStudents.map(student => (
                      <tr key={student.STUDENT_ID}>
                        <td>{student.STUDENT_ID}</td>
                        <td>{student.NAME}</td>
                        <td>{student.EMAIL}</td>
                        <td>{student.SEMESTER}</td>
                        <td>{student.CGPA}</td>
                        <td>
                          <span className="badge">{student.ACTIVE_ENROLLMENTS}</span>
                        </td>
                        <td>
                          {student.PENDING_REQUESTS > 0 ? (
                            <span className="badge badge-warning">{student.PENDING_REQUESTS}</span>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Reject Enrollment Request</h3>
              <button
                className="modal-close"
                onClick={() => setRejectModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p><strong>{selectedRequest.STUDENT_NAME}</strong></p>
              <p>Course: <strong>{selectedRequest.COURSE_NAME}</strong></p>
              <textarea
                placeholder="Enter rejection reason (e.g., Prerequisite not met, Course level too high)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows="4"
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-reject"
                onClick={confirmReject}
                disabled={rejecting}
              >
                {rejecting ? 'Rejecting...' : 'Reject Request'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setRejectModalOpen(false)}
                disabled={rejecting}
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

export default FacultyAdvisorDashboard;
