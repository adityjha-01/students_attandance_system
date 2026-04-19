import axios from 'axios';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const register = async (userData) => {
  try {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const login = async (email, password, userType) => {
  try {
    const response = await axiosInstance.post('/auth/login', {
      email,
      password,
      user_type: userType
    });
    
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Student APIs
export const getAvailableCourses = async (semester) => {
  try {
    const response = await axiosInstance.get(`/students/available-courses/${semester}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const enrollCourse = async (courseId) => {
  try {
    const response = await axiosInstance.post('/students/enroll', {
      course_id: courseId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getEnrolledCourses = async () => {
  try {
    const response = await axiosInstance.get('/students/enrolled-courses');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getStudentAttendance = async (courseId) => {
  try {
    const response = await axiosInstance.get(`/students/attendance/${courseId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const dropCourse = async (courseId) => {
  try {
    const response = await axiosInstance.post('/students/drop-course', {
      course_id: courseId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Professor APIs
export const createCourse = async (courseData) => {
  try {
    const response = await axiosInstance.post('/professors/courses', courseData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getProfessorCourses = async () => {
  try {
    const response = await axiosInstance.get('/professors/courses');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteCourse = async (courseId) => {
  try {
    const response = await axiosInstance.delete(`/professors/courses/${courseId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getEnrolledStudents = async (courseId) => {
  try {
    const response = await axiosInstance.get(`/professors/courses/${courseId}/students`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Attendance APIs
export const markAttendance = async (courseId, studentId, status, remarks = '') => {
  try {
    const response = await axiosInstance.post('/attendance/mark', {
      course_id: courseId,
      student_id: studentId,
      status: status,
      remarks: remarks
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const bulkMarkAttendance = async (courseId, attendanceDate, attendanceRecords) => {
  try {
    const response = await axiosInstance.post('/attendance/bulk-mark', {
      course_id: courseId,
      attendance_date: attendanceDate,
      attendance_records: attendanceRecords
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCourseAttendance = async (courseId, date = null) => {
  try {
    const url = date 
      ? `/attendance/course/${courseId}?date=${date}`
      : `/attendance/course/${courseId}`;
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Export axios instance as default for direct use
export default axiosInstance;


// Analytics APIs
export const getLowAttendanceStudents = async () => {
  try {
    const response = await axiosInstance.get('/analytics/low-attendance');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Reports APIs
export const downloadCourseExcel = async (courseId) => {
  try {
    const response = await axiosInstance.get(`/reports/course/${courseId}/excel`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const downloadCoursePDF = async (courseId) => {
  try {
    const response = await axiosInstance.get(`/reports/course/${courseId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Profile APIs
export const getStudentProfile = async () => {
  try {
    const response = await axiosInstance.get('/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateStudentProfile = async (profileData) => {
  try {
    const response = await axiosInstance.put('/profile', profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const changePassword = async (passwordData) => {
  try {
    const response = await axiosInstance.put('/profile/password', passwordData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const addSemesterMarks = async (marksData) => {
  try {
    const response = await axiosInstance.post('/profile/marks', marksData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateSemester = async () => {
  try {
    const response = await axiosInstance.put('/profile/semester');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

