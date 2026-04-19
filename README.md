# Student Attendance System

A comprehensive web-based attendance management system built for educational institutions using Oracle 21c, Node.js/Express, and React. This system allows professors to mark attendance and students to view their attendance records efficiently.

## ✅ Implementation Status

**Backend & Database**: ✅ **FULLY FUNCTIONAL**  
**Frontend**: ⏳ Scaffolded (pending development)

### What's Working:
- ✅ Complete Oracle database schema (5 tables, 5 sequences)
- ✅ All REST API endpoints operational
- ✅ JWT authentication with role-based access
- ✅ Professor and student registration/login
- ✅ Course management
- ✅ FCFS enrollment logic
- ✅ Attendance marking and tracking

See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for detailed status.

## Features

### For Students
- 🎓 Enroll in courses (First-Come-First-Serve)
- 📊 View attendance records
- 📈 Track attendance percentage
- 👤 Manage profile

### For Professors
- ✅ Mark student attendance
- 📚 Create and manage courses
- 📋 View attendance reports
- 👥 View enrolled students

## Technology Stack

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **node-oracledb** - Oracle database driver

### Database
- **Oracle Database 21c XE** - Relational database
- Direct SQL queries (no PL/SQL packages)
- Connection pooling for performance

## Project Structure

```
student-attendance-system/
├── backend/              # ✅ Express backend API (WORKING)
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── middleware/      # Authentication middleware
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   ├── .env             # Environment configuration
│   └── server.js        # Entry point
├── database/            # ✅ Oracle SQL scripts (COMPLETE)
│   ├── 02_tables_fixed.sql    # Table definitions
│   ├── setup_database.sql     # Setup script
│   └── 04_packages/           # (Not used)
├── frontend/            # ⏳ React frontend (SCAFFOLDED)
│   ├── public/          # Static files
│   └── src/             # Source files
│       ├── components/  # Reusable components
│       ├── pages/       # Page components
│       └── services/    # API integration
└── docs/                # ✅ Documentation (COMPLETE)
    ├── API_DOCUMENTATION.md
    ├── DATABASE_SCHEMA.md
    ├── SETUP_GUIDE.md
    └── USER_GUIDE.md
```

## Quick Start

### Prerequisites
- Node.js v18+
- Oracle Database 21c Express Edition
- Oracle Instant Client
- npm or yarn

### 1. Database Setup

```bash
# Run SQL script
cd database
sqlplus your_username/your_password@XEPDB1 @setup_database.sql
```

### 2. Backend Setup

```bash
cd backend
npm install

# Configure .env file with your database credentials
# DB_USER=your_username
# DB_PASSWORD=your_password
# DB_CONNECT_STRING=XEPDB1
# ORACLE_LIB_DIR=/path/to/oracle/lib
# JWT_SECRET=your_secret_key
# PORT=5000

# Start server
node server.js
```

Server will start at: http://localhost:5000

### 3. Test API

```bash
cd backend
./test_api_quick.sh
```

### 4. Frontend Setup (Not yet tested)

```bash
cd frontend
npm install
npm start
```

Frontend will start at: http://localhost:3000

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new student or professor
- `POST /login` - Login with JWT token

### Students (`/api/students`)
- `GET /available-courses/:semester` - Get available courses
- `GET /enrolled-courses` - Get enrolled courses
- `POST /enroll` - Enroll in a course
- `GET /attendance/:course_id` - Get attendance for course

### Professors (`/api/professors`)
- `POST /courses` - Create a new course
- `GET /courses` - Get professor's courses
- `GET /courses/:course_id/students` - Get enrolled students

### Attendance (`/api/attendance`)
- `POST /mark` - Mark attendance
- `GET /course/:course_id` - Get attendance summary by date

See [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for detailed API reference.

## Database Schema

### Tables
1. **PROFESSORS** - Professor credentials and information
2. **STUDENTS** - Student credentials and information
3. **COURSES** - Course details with enrollment limits
4. **ENROLLMENTS** - Student-Course relationships (M:M)
5. **ATTENDANCE** - Daily attendance records

### Sequences
- student_id_seq (starts: 1000)
- professor_id_seq (starts: 2000)
- course_id_seq (starts: 3000)
- enrollment_id_seq (starts: 4000)
- attendance_id_seq (starts: 5000)

See [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for complete schema details.

## Testing

### Test Users
- **Professor**: john.smith@university.edu / prof123
- **Student**: alice.johnson@university.edu / student123

### Sample Requests

**Register Professor:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_type": "professor",
    "name": "Dr. John Smith",
    "email": "john.smith@university.edu",
    "password": "prof123",
    "department": "CS",
    "phone": "1234567890"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.smith@university.edu",
    "password": "prof123",
    "user_type": "professor"
  }'
```

## Development

### Running in Development Mode

**Backend:**
```bash
cd backend
node server.js    # or use nodemon for auto-reload
```

**Frontend:**
```bash
cd frontend
npm start
```

### Architecture Decisions

**Direct SQL vs PL/SQL Packages:**
- Used direct SQL queries instead of PL/SQL packages
- Reason: User account lacked CREATE PACKAGE privilege
- Benefit: Easier to maintain, better portability
- All business logic in application layer with proper validation

## Documentation

- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Complete implementation status
- [SETUP_GUIDE.md](docs/SETUP_GUIDE.md) - Detailed setup instructions
- [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - Database design
- [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) - API reference
- [USER_GUIDE.md](docs/USER_GUIDE.md) - User guide

## Next Steps

1. **Frontend Development**
   - Install dependencies and test React app
   - Integrate with backend API
   - Test UI flows

2. **Additional Features**
   - Course drop functionality
   - Attendance analytics
   - Email notifications
   - PDF report generation
   - Admin dashboard

3. **Production Deployment**
   - Environment configuration
   - Cloud database setup
   - Deploy backend service
   - Build and deploy frontend
   - Set up monitoring

## Known Limitations

- No PL/SQL packages (due to database privileges)
- Frontend not yet compiled/tested
- No email verification
- No password reset
- No bulk operations
- No real-time notifications

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is developed for educational purposes.

## Authors

- Database Management System Project

## Acknowledgments

- Oracle Database documentation
- Node.js and Express.js communities
- React.js community
