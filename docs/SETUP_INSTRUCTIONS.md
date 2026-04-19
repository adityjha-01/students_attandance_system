# Setup Instructions

## Prerequisites

### Required Software
1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Oracle Database** (21c or higher)
   - Oracle Database Express Edition recommended for development
   - Download from: https://www.oracle.com/database/technologies/

3. **Oracle Instant Client**
   - Required for node-oracledb
   - Download from: https://www.oracle.com/database/technologies/instant-client.html

4. **Git**
   - For version control
   - Download from: https://git-scm.com/

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd student-attendance-system
```

### 2. Database Setup

#### Step 1: Install Oracle Database
- Follow the Oracle Database installation guide for your operating system
- Create a database instance
- Note the connection details (hostname, port, service name)

#### Step 2: Run SQL Scripts
Execute the SQL scripts in the following order:

```bash
cd database

# Connect to Oracle SQL*Plus or SQL Developer
sqlplus username/password@localhost:1521/XEPDB1

# Run scripts in order
@01_users.sql
@02_tables.sql

# Run package files
@04_packages/01_auth_package.sql
@04_packages/02_course_package.sql
@04_packages/03_enrollment_package.sql
@04_packages/04_attendance_package.sql
```

#### Step 3: Verify Database Setup
```sql
-- Check if all tables are created
SELECT table_name FROM user_tables;

-- Check if all sequences are created
SELECT sequence_name FROM user_sequences;

-- Check if all packages are created
SELECT object_name FROM user_objects WHERE object_type = 'PACKAGE';
```

### 3. Backend Setup

#### Step 1: Install Dependencies
```bash
cd backend
npm install
```

#### Step 2: Configure Environment Variables
Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_CONNECTION_STRING=localhost:1521/XEPDB1

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development
```

#### Step 3: Start Backend Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend server should start on http://localhost:5000

### 4. Frontend Setup

#### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

#### Step 2: Configure Environment Variables
Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### Step 3: Start Frontend Development Server
```bash
npm start
```

The frontend should open automatically in your browser at http://localhost:3000

## Testing the Installation

### 1. Check Backend Health
```bash
curl http://localhost:5000/api/health
```

### 2. Test Database Connection
The backend console should show a message like:
```
Database connected successfully
Server running on port 5000
```

### 3. Access Frontend
Open your browser and navigate to:
```
http://localhost:3000
```

## Common Issues

### Issue: node-oracledb installation fails
**Solution:**
- Ensure Oracle Instant Client is installed
- Set environment variables:
  - Windows: Add Instant Client directory to PATH
  - Linux/Mac: Set LD_LIBRARY_PATH or DYLD_LIBRARY_PATH

### Issue: Database connection fails
**Solution:**
- Verify Oracle Database is running
- Check connection string format: `hostname:port/service_name`
- Verify firewall allows connections on Oracle port (default: 1521)
- Test connection using SQL*Plus or SQL Developer first

### Issue: CORS errors in frontend
**Solution:**
- Verify backend CORS configuration in `server.js`
- Ensure frontend API URL matches backend address

## Development Workflow

1. **Start Database** (if not running as a service)
2. **Start Backend Server** (`cd backend && npm run dev`)
3. **Start Frontend Server** (`cd frontend && npm start`)
4. **Make Changes** and test in the browser
5. **Backend changes** will auto-reload with nodemon
6. **Frontend changes** will auto-refresh in the browser

## Production Deployment

### Backend
```bash
cd backend
npm install --production
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the build/ directory with a static file server
```

## Additional Resources

- [Oracle Database Documentation](https://docs.oracle.com/en/database/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)

## Support

For issues or questions, please refer to the project documentation or contact the development team.
