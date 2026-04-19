# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user (student or professor).

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "userType": "student|professor",
  "additionalInfo": {}
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "number",
    "token": "string"
  }
}
```

#### POST /auth/login
Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "string",
    "user": {}
  }
}
```

### Courses

#### GET /courses
Get all available courses.

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "courseId": "number",
      "courseName": "string",
      "courseCode": "string",
      "professorName": "string"
    }
  ]
}
```

#### POST /courses (Professor only)
Create a new course.

**Request Body:**
```json
{
  "courseName": "string",
  "courseCode": "string",
  "semester": "string",
  "academicYear": "string"
}
```

### Enrollment

#### POST /enrollments (Student only)
Enroll in a course.

**Request Body:**
```json
{
  "courseId": "number"
}
```

#### GET /enrollments/student/:studentId
Get all enrollments for a student.

### Attendance

#### POST /attendance/mark (Professor only)
Mark attendance for a class session.

**Request Body:**
```json
{
  "courseId": "number",
  "classDate": "date",
  "attendanceRecords": [
    {
      "studentId": "number",
      "status": "present|absent|late"
    }
  ]
}
```

#### GET /attendance/student/:studentId
Get attendance records for a student.

#### GET /attendance/course/:courseId
Get attendance records for a course.

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Additional error details"
}
```

### Common Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
