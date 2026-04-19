import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import ProfessorDashboard from './components/ProfessorDashboard';
import FacultyAdvisorDashboard from './components/FacultyAdvisorDashboard';
import StudentProfile from './components/StudentProfile';
import StudentEnroll from './pages/StudentEnroll';
import StudentAttendance from './pages/StudentAttendance';
import ProfessorMarkAttendance from './pages/ProfessorMarkAttendance';
import CreateCourse from './pages/CreateCourse';
import ViewStudents from './pages/ViewStudents';
import './App.css';
import './styles/dark-mode.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
            <Route path="/faculty-advisor/dashboard" element={<FacultyAdvisorDashboard />} />
            <Route path="/student/enroll" element={<StudentEnroll />} />
            <Route path="/student/attendance/:courseId" element={<StudentAttendance />} />
            <Route path="/professor/mark-attendance/:courseId" element={<ProfessorMarkAttendance />} />
            <Route path="/professor/students/:courseId" element={<ViewStudents />} />
            <Route path="/professor/create-course" element={<CreateCourse />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
