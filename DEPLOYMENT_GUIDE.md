# Student Attendance System - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Oracle Database 21c Express Edition
- Oracle Instant Client
- npm

### 1. Start Backend

```bash
cd backend
node server.js
```

Backend will start on: **http://localhost:5000**

### 2. Start Frontend

```bash
cd frontend
npm start
```

Frontend will start on: **http://localhost:3000**

### 3. Access Application

Open your browser and navigate to: **http://localhost:3000**

## 📝 Test Credentials

### Professor Account
- **Email:** john.smith@university.edu
- **Password:** prof123

### Student Account
- **Email:** alice.johnson@university.edu
- **Password:** student123

## 🎯 Complete User Flow Test

### Step 1: Professor Creates Course

1. Open http://localhost:3000
2. Select "Professor" from dropdown
3. Login with: john.smith@university.edu / prof123
4. Click "Create New Course"
5. Fill course details and submit
6. View course on dashboard

### Step 2: Student Enrolls

1. Open http://localhost:3000 in new tab
2. Select "Student" from dropdown
3. Login with: alice.johnson@university.edu / student123
4. Click "Enroll in Course"
5. Select semester and enroll
6. View enrolled course on dashboard

### Step 3: Professor Marks Attendance

1. Back to professor tab
2. Refresh if needed to see enrollment
3. Click "Mark Attendance" on course
4. Mark student as Present/Absent/Leave
5. See confirmation message

### Step 4: Student Views Attendance

1. Back to student tab
2. Refresh dashboard
3. See updated attendance percentage

## 🛠️ Troubleshooting

### Backend Not Starting

**Module not found:**
```bash
cd backend && npm install
```

**Database connection failed:**
- Check Oracle is running
- Verify credentials in `.env`
- Test: `sqlplus sagar/2066@XEPDB1`

### Frontend Not Loading

**Install dependencies:**
```bash
cd frontend
npm install
```

**Clear cache:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📊 System Status

**Check backend:**
```bash
curl http://localhost:5000/api/health
```

**Check frontend:**
Open http://localhost:3000 in browser

## 🔐 Production Deployment

Before production:
1. Set secure JWT_SECRET
2. Configure CORS properly  
3. Enable HTTPS
4. Build frontend: `npm run build`
5. Use process manager (pm2)
6. Set up database backups
7. Configure monitoring

---

**Status:** Ready for Testing  
**Version:** 1.0.0
