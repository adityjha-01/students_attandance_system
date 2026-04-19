import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourse } from '../services/api';
import '../styles/CreateCourse.css';

function CreateCourse() {
  const [formData, setFormData] = useState({
    course_name: '',
    subject_code: '',
    credits: 3,
    semester_offered: 1,
    max_enrollment: 60,
    course_start_date: '',
    course_end_date: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate dates
    const startDate = new Date(formData.course_start_date);
    const endDate = new Date(formData.course_end_date);
    
    if (endDate <= startDate) {
      setError('End date must be after start date');
      return;
    }

    if (startDate < new Date()) {
      setError('Start date cannot be in the past');
      return;
    }

    setLoading(true);

    try {
      const response = await createCourse(formData);
      
      if (response.success) {
        alert('Course created successfully!');
        navigate('/professor/dashboard');
      } else {
        setError(response.message || 'Failed to create course');
      }
    } catch (err) {
      setError(err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-course-container">
      <div className="create-course-card">
        <div className="page-header">
          <h2>Create New Course</h2>
          <button onClick={() => navigate('/professor/dashboard')} className="btn-back">
            ← Back to Dashboard
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="course_name">Course Name *</label>
              <input
                type="text"
                id="course_name"
                name="course_name"
                value={formData.course_name}
                onChange={handleChange}
                placeholder="e.g., Data Structures and Algorithms"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject_code">Subject Code *</label>
              <input
                type="text"
                id="subject_code"
                name="subject_code"
                value={formData.subject_code}
                onChange={handleChange}
                placeholder="e.g., CS201"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="credits">Credits *</label>
              <select
                id="credits"
                name="credits"
                value={formData.credits}
                onChange={handleChange}
                required
              >
                <option value="1">1 Credit</option>
                <option value="2">2 Credits</option>
                <option value="3">3 Credits</option>
                <option value="4">4 Credits</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="semester_offered">Semester *</label>
              <select
                id="semester_offered"
                name="semester_offered"
                value={formData.semester_offered}
                onChange={handleChange}
                required
              >
                {[1,2,3,4,5,6,7,8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="max_enrollment">Max Students *</label>
              <input
                type="number"
                id="max_enrollment"
                name="max_enrollment"
                value={formData.max_enrollment}
                onChange={handleChange}
                min="10"
                max="200"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="course_start_date">Start Date *</label>
              <input
                type="date"
                id="course_start_date"
                name="course_start_date"
                value={formData.course_start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="course_end_date">End Date *</label>
              <input
                type="date"
                id="course_end_date"
                name="course_end_date"
                value={formData.course_end_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/professor/dashboard')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCourse;
