import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getStudentProfile, 
  updateStudentProfile, 
  changePassword, 
  addSemesterMarks, 
  updateSemester 
} from '../../services/api';
import './StudentProfile.css';

const StudentProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [marksForm, setMarksForm] = useState({
    semester: '',
    subject_name: '',
    marks_obtained: '',
    max_marks: 100,
    grade: '',
    academic_year: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getStudentProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.NAME || '',
        phone: response.data.PHONE || '',
        roll_no: response.data.ROLL_NO || '',
        address: response.data.ADDRESS || '',
        date_of_birth: response.data.DATE_OF_BIRTH ? new Date(response.data.DATE_OF_BIRTH).toISOString().split('T')[0] : '',
        blood_group: response.data.BLOOD_GROUP || '',
        emergency_contact: response.data.EMERGENCY_CONTACT || '',
        emergency_contact_name: response.data.EMERGENCY_CONTACT_NAME || '',
        parent_name: response.data.PARENT_NAME || '',
        parent_phone: response.data.PARENT_PHONE || '',
        has_backlog: response.data.HAS_BACKLOG === 1
      });
    } catch (error) {
      showMessage('error', error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
  };

  const handleMarksChange = (e) => {
    const { name, value } = e.target;
    setMarksForm({
      ...marksForm,
      [name]: value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await updateStudentProfile(formData);
      showMessage('success', response.message);
      setEditMode(false);
      fetchProfile();
    } catch (error) {
      showMessage('error', error.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }
    
    try {
      const response = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showMessage('success', response.message);
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showMessage('error', error.message || 'Failed to change password');
    }
  };

  const handleAddMarks = async (e) => {
    e.preventDefault();
    try {
      const response = await addSemesterMarks(marksForm);
      showMessage('success', response.message);
      setShowMarksModal(false);
      setMarksForm({
        semester: '',
        subject_name: '',
        marks_obtained: '',
        max_marks: 100,
        grade: '',
        academic_year: ''
      });
      fetchProfile();
    } catch (error) {
      showMessage('error', error.message || 'Failed to add marks');
    }
  };

  const handleUpdateSemester = async () => {
    if (!window.confirm('Are you sure you want to update your semester? This requires 6 months since last update and no backlogs.')) {
      return;
    }
    
    try {
      const response = await updateSemester();
      showMessage('success', response.message);
      fetchProfile();
    } catch (error) {
      showMessage('error', error.message || 'Failed to update semester');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not Set';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="profile-error">Failed to load profile</div>;
  }

  return (
    <div className="student-profile">
      <div className="profile-header">
        <div className="profile-header-left">
          <button className="btn-back" onClick={() => navigate('/student/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>My Profile</h1>
        </div>
        <div className="profile-actions">
          {!editMode ? (
            <>
              <button className="btn-edit" onClick={() => setEditMode(true)}>
                ✏️ Edit Profile
              </button>
              <button className="btn-password" onClick={() => setShowPasswordModal(true)}>
                🔒 Change Password
              </button>
              <button className="btn-marks" onClick={() => setShowMarksModal(true)}>
                📝 Add Marks
              </button>
              <button className="btn-semester" onClick={handleUpdateSemester}>
                📈 Update Semester
              </button>
            </>
          ) : (
            <button className="btn-cancel" onClick={() => { setEditMode(false); fetchProfile(); }}>
              ❌ Cancel
            </button>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`profile-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-content">
        <form onSubmit={handleUpdateProfile}>
          {/* Basic Information */}
          <div className="profile-section">
            <h2>Basic Information</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <label>Student ID</label>
                <input type="text" value={profile.STUDENT_ID} disabled />
              </div>
              
              <div className="profile-field">
                <label>Roll Number</label>
                <input 
                  type="text" 
                  name="roll_no"
                  value={formData.roll_no}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="Enter roll number"
                />
              </div>

              <div className="profile-field">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  required
                />
              </div>

              <div className="profile-field">
                <label>Email</label>
                <input type="email" value={profile.EMAIL} disabled />
              </div>

              <div className="profile-field">
                <label>Phone</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="10-digit number"
                />
              </div>

              <div className="profile-field">
                <label>Date of Birth</label>
                <input 
                  type="date" 
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  disabled={!editMode}
                />
              </div>

              <div className="profile-field">
                <label>Blood Group</label>
                <input 
                  type="text" 
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="e.g., A+, B-, O+"
                  maxLength="5"
                />
              </div>

              <div className="profile-field">
                <label>Semester</label>
                <input type="text" value={profile.SEMESTER} disabled />
              </div>

              <div className="profile-field">
                <label>CGPA</label>
                <input type="text" value={profile.CGPA || 'N/A'} disabled />
              </div>

              <div className="profile-field">
                <label>Enrollment Date</label>
                <input type="text" value={formatDate(profile.ENROLLMENT_DATE)} disabled />
              </div>

              <div className="profile-field">
                <label>Last Semester Update</label>
                <input type="text" value={formatDate(profile.LAST_SEMESTER_UPDATE)} disabled />
              </div>

              <div className="profile-field">
                <label>Has Backlog</label>
                <div className="checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    name="has_backlog"
                    checked={formData.has_backlog}
                    onChange={handleInputChange}
                    disabled={!editMode}
                  />
                  <span>{formData.has_backlog ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            <div className="profile-field-full">
              <label>Address</label>
              <textarea 
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!editMode}
                rows="3"
                placeholder="Enter your complete address"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="profile-section">
            <h2>Emergency Contact</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <label>Contact Name</label>
                <input 
                  type="text" 
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="Contact person name"
                />
              </div>

              <div className="profile-field">
                <label>Contact Number</label>
                <input 
                  type="tel" 
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="Emergency phone number"
                />
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div className="profile-section">
            <h2>Parent/Guardian Information</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <label>Parent/Guardian Name</label>
                <input 
                  type="text" 
                  name="parent_name"
                  value={formData.parent_name}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="Parent or guardian name"
                />
              </div>

              <div className="profile-field">
                <label>Parent/Guardian Phone</label>
                <input 
                  type="tel" 
                  name="parent_phone"
                  value={formData.parent_phone}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="Parent phone number"
                />
              </div>
            </div>
          </div>

          {editMode && (
            <div className="profile-actions-bottom">
              <button type="submit" className="btn-save">💾 Save Changes</button>
              <button type="button" className="btn-cancel" onClick={() => { setEditMode(false); fetchProfile(); }}>
                ❌ Cancel
              </button>
            </div>
          )}
        </form>

        {/* Academic Marks */}
        <div className="profile-section">
          <h2>Academic Performance</h2>
          {profile.MARKS && profile.MARKS.length > 0 ? (
            <div className="marks-table-wrapper">
              <table className="marks-table">
                <thead>
                  <tr>
                    <th>Semester</th>
                    <th>Subject</th>
                    <th>Marks</th>
                    <th>Max Marks</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Academic Year</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.MARKS.map((mark) => (
                    <tr key={mark.MARK_ID}>
                      <td>{mark.SEMESTER}</td>
                      <td>{mark.SUBJECT_NAME}</td>
                      <td>{mark.MARKS_OBTAINED}</td>
                      <td>{mark.MAX_MARKS}</td>
                      <td>{((mark.MARKS_OBTAINED / mark.MAX_MARKS) * 100).toFixed(2)}%</td>
                      <td>{mark.GRADE || '-'}</td>
                      <td>{mark.ACADEMIC_YEAR || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-marks">No marks recorded yet. Click "Add Marks" to add your academic records.</p>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save">Change Password</button>
                <button type="button" className="btn-cancel" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Marks Modal */}
      {showMarksModal && (
        <div className="modal-overlay" onClick={() => setShowMarksModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Semester Marks</h2>
            <form onSubmit={handleAddMarks}>
              <div className="form-group">
                <label>Semester</label>
                <input
                  type="number"
                  name="semester"
                  value={marksForm.semester}
                  onChange={handleMarksChange}
                  min="1"
                  max="8"
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject Name</label>
                <input
                  type="text"
                  name="subject_name"
                  value={marksForm.subject_name}
                  onChange={handleMarksChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Marks Obtained</label>
                <input
                  type="number"
                  name="marks_obtained"
                  value={marksForm.marks_obtained}
                  onChange={handleMarksChange}
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Maximum Marks</label>
                <input
                  type="number"
                  name="max_marks"
                  value={marksForm.max_marks}
                  onChange={handleMarksChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Grade (Optional)</label>
                <input
                  type="text"
                  name="grade"
                  value={marksForm.grade}
                  onChange={handleMarksChange}
                  placeholder="e.g., A, B+, O"
                />
              </div>
              <div className="form-group">
                <label>Academic Year (Optional)</label>
                <input
                  type="text"
                  name="academic_year"
                  value={marksForm.academic_year}
                  onChange={handleMarksChange}
                  placeholder="e.g., 2023-24"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save">Add Marks</button>
                <button type="button" className="btn-cancel" onClick={() => setShowMarksModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
