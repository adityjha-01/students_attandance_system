import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../../services/api';
import './Login.css';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('CS');
  const [semester, setSemester] = useState(1);
  const [userType, setUserType] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        console.log('[DEBUG] Login attempt:', { email, userType });
        const response = await login(email, password, userType);
        console.log('[DEBUG] Login response:', response);
        
        if (response.success) {
          console.log('[DEBUG] Login successful, redirecting to:', `/${userType}/dashboard`);
          // Redirect based on user type
          if (userType === 'student') {
            navigate('/student/dashboard');
          } else if (userType === 'professor') {
            navigate('/professor/dashboard');
          } else if (userType === 'faculty_advisor') {
            navigate('/faculty-advisor/dashboard');
          }
        } else {
          console.error('[DEBUG] Login returned success=false:', response.message);
          setError(response.message || 'Login failed');
        }
      } else {
        // Register
        const userData = {
          user_type: userType,
          name,
          email,
          password,
          phone
        };
        
        if (userType === 'professor' || userType === 'faculty_advisor') {
          userData.department = department;
          if (userType === 'faculty_advisor') {
            userData.semester = semester === 0 ? null : semester; // 0 becomes null for "all semesters"
          }
        } else {
          userData.semester = semester;
        }

        const response = await register(userData);
        
        if (response.success) {
          setError('');
          alert('Registration successful! Please login.');
          setIsLogin(true);
          // Clear form
          setName('');
          setPassword('');
        } else {
          setError(response.message || 'Registration failed');
        }
      }
    } catch (err) {
      console.error('[DEBUG] Error during submit:', err);
      console.error('[DEBUG] Error type:', typeof err);
      console.error('[DEBUG] Error message:', err.message);
      console.error('[DEBUG] Error keys:', Object.keys(err));
      setError(err.message || (isLogin ? 'Login failed. Please check your credentials.' : 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Student Attendance System</h2>
        <h3>{isLogin ? 'Login' : 'Register'}</h3>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userType">I am a:</label>
            <select
              id="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              required
            >
              <option value="student">Student</option>
              <option value="professor">Professor</option>
              <option value="faculty_advisor">Faculty Advisor</option>
            </select>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="phone">Phone:</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              {userType === 'professor' || userType === 'faculty_advisor' ? (
                <>
                  <div className="form-group">
                    <label htmlFor="department">Department:</label>
                    <select
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    >
                      <option value="CS">Computer Science</option>
                      <option value="IT">Information Technology</option>
                      <option value="EC">Electronics</option>
                      <option value="MECH">Mechanical</option>
                      <option value="CIVIL">Civil</option>
                      <option value="EE">Electrical</option>
                    </select>
                  </div>
                  {userType === 'faculty_advisor' && (
                    <div className="form-group">
                      <label htmlFor="faSpecializedSemester">Specialized Semester (optional):</label>
                      <select
                        id="faSpecializedSemester"
                        value={semester}
                        onChange={(e) => setSemester(parseInt(e.target.value))}
                      >
                        <option value="0">All Semesters</option>
                        {[1,2,3,4,5,6,7,8].map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <div className="form-group">
                  <label htmlFor="semester">Semester:</label>
                  <select
                    id="semester"
                    value={semester}
                    onChange={(e) => setSemester(parseInt(e.target.value))}
                    required
                  >
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (isLogin ? 'Logging in...' : 'Registering...') : (isLogin ? 'Login' : 'Register')}
          </button>

          <div className="form-toggle">
            <button type="button" onClick={toggleForm} className="btn-link">
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>
        </form>

        {isLogin && (
          <div className="demo-credentials">
            <p><strong>Demo Credentials:</strong></p>
            <p>Professor: john.smith@university.edu / prof123</p>
            <p>Student: alice.johnson@university.edu / student123</p>
            <p>FA: demo.fa@college.edu / fa123456</p>
            <p style={{ fontSize: '0.85em', color: '#666', marginTop: '8px' }}>
              <em>FA can be created anytime with any email. Existing demo FA for testing.</em>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
