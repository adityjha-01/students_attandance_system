# Frontend - Student Attendance System

React-based frontend application for the Student Attendance Management System.

## Features

- **Responsive Design** - Works on desktop and mobile devices
- **Role-based Access** - Different interfaces for students and professors
- **Real-time Updates** - Dynamic data fetching and updates
- **Secure Authentication** - JWT-based authentication with protected routes

## Technology Stack

- **React.js** - Frontend framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS3** - Styling and responsive design

## Project Structure

```
frontend/
├── public/              # Static files
│   └── index.html      # HTML template
└── src/
    ├── components/     # Reusable components
    │   ├── StudentDashboard/
    │   ├── ProfessorDashboard/
    │   ├── Login/
    │   └── Navigation/
    ├── pages/          # Page components
    │   ├── StudentEnroll.js
    │   ├── StudentAttendance.js
    │   ├── ProfessorMarkAttendance.js
    │   └── CreateCourse.js
    ├── services/       # API services
    │   └── api.js      # Axios configuration
    ├── styles/         # CSS files
    │   └── App.css
    ├── App.js          # Main app component
    └── index.js        # Entry point
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on http://localhost:5000

## Installation

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   
   The app will open at http://localhost:3000

## Available Scripts

### `npm start`
Runs the app in development mode with hot reload.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.
- Optimizes the build for best performance
- Files are minified and hashed

### `npm run eject`
**Note: This is a one-way operation!**

## Components

### StudentDashboard
Main dashboard for students showing:
- Enrolled courses
- Attendance summary
- Quick actions

### ProfessorDashboard
Main dashboard for professors showing:
- Teaching courses
- Recent attendance
- Quick actions

### Login
Authentication component with:
- Email/password login
- Role-based redirection
- Error handling

### Navigation
Top navigation bar with:
- App branding
- Navigation links
- User menu

## Pages

### StudentEnroll
Course enrollment page for students to:
- Browse available courses
- Enroll in new courses
- View enrolled courses

### StudentAttendance
Attendance viewing page showing:
- Attendance records by course
- Attendance percentage
- Date-wise attendance

### ProfessorMarkAttendance
Attendance marking interface for professors to:
- Select course and date
- Mark student attendance
- Submit attendance records

### CreateCourse
Course creation form for professors with:
- Course details input
- Validation
- Success/error feedback

## API Integration

The `services/api.js` file configures Axios with:
- Base URL from environment variables
- Request interceptor for auth tokens
- Response interceptor for error handling
- Automatic token management

Example usage:
```javascript
import api from './services/api';

// GET request
const courses = await api.get('/courses');

// POST request
await api.post('/enrollments', { courseId: 123 });
```

## Authentication Flow

1. User logs in via Login component
2. Backend returns JWT token
3. Token stored in localStorage
4. Token automatically added to all requests
5. On 401 error, user redirected to login

## Environment Variables

- `REACT_APP_API_URL` - Backend API base URL

## Build and Deploy

### Production Build
```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

### Deployment Options

**Static Hosting (Netlify, Vercel, etc.):**
```bash
npm run build
# Deploy the build/ directory
```

**Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/build;
    
    location / {
        try_files $uri /index.html;
    }
}
```

## Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React best practices
- Keep components focused and reusable
- Use meaningful variable and function names

### Adding New Components
1. Create component directory in `src/components/`
2. Create `index.js` with component code
3. Export the component
4. Import in parent component or App.js

### Adding New Pages
1. Create page file in `src/pages/`
2. Add route in `App.js`
3. Add navigation link in Navigation component

## Troubleshooting

### Port 3000 already in use
```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CORS errors
- Ensure backend has CORS enabled
- Check API URL in .env file
- Verify backend is running

## Resources

- [React Documentation](https://react.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)
- [Create React App Documentation](https://create-react-app.dev/)
