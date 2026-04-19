#!/bin/bash

BASE_URL="http://localhost:5000"
PROF_TOKEN=""
STUDENT_TOKEN=""

echo "========================================="
echo "TESTING STUDENT ATTENDANCE SYSTEM API"
echo "========================================="

# Test 1: Health Check
echo -e "\n1. Health Check"
curl -s "${BASE_URL}/api/health" | jq '.'

# Test 2: Register Professor
echo -e "\n2. Register Professor"
PROF_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "user_type": "professor",
    "name": "Dr. John Smith",
    "email": "john.smith@university.edu",
    "password": "prof123",
    "department": "CS",
    "phone": "1234567890"
  }')
echo "$PROF_RESPONSE" | jq '.'
PROF_TOKEN=$(echo "$PROF_RESPONSE" | jq -r '.data.token // empty')

# Test 3: Register Student
echo -e "\n3. Register Student"
STUDENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "user_type": "student",
    "name": "Alice Johnson",
    "email": "alice.johnson@university.edu",
    "password": "student123",
    "semester": 5,
    "phone": "9876543210",
    "cgpa": 8.5
  }')
echo "$STUDENT_RESPONSE" | jq '.'
STUDENT_TOKEN=$(echo "$STUDENT_RESPONSE" | jq -r '.data.token // empty')

# Test 4: Professor Login
echo -e "\n4. Professor Login"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.smith@university.edu",
    "password": "prof123",
    "user_type": "professor"
  }')
echo "$LOGIN_RESPONSE" | jq '.'
PROF_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')

if [ -z "$PROF_TOKEN" ] || [ "$PROF_TOKEN" = "null" ]; then
  echo "❌ Failed to get professor token. Stopping tests."
  exit 1
fi

echo "✅ Professor Token: ${PROF_TOKEN:0:20}..."

# Test 5: Create Course
echo -e "\n5. Create Course (as Professor)"
COURSE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/professors/courses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROF_TOKEN" \
  -d '{
    "course_name": "Database Management Systems",
    "subject_code": "CS401",
    "credits": 4,
    "semester_offered": 5,
    "max_enrollment": 60,
    "course_start_date": "2025-01-15",
    "course_end_date": "2025-05-15"
  }')
echo "$COURSE_RESPONSE" | jq '.'

# Test 6: Get Professor's Courses
echo -e "\n6. Get Professor's Courses"
curl -s -X GET "${BASE_URL}/api/professors/courses" \
  -H "Authorization: Bearer $PROF_TOKEN" | jq '.'

# Test 7: Student Login  
echo -e "\n7. Student Login"
STUDENT_LOGIN=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.johnson@university.edu",
    "password": "student123",
    "user_type": "student"
  }')
echo "$STUDENT_LOGIN" | jq '.'
STUDENT_TOKEN=$(echo "$STUDENT_LOGIN" | jq -r '.data.token // empty')

if [ -z "$STUDENT_TOKEN" ] || [ "$STUDENT_TOKEN" = "null" ]; then
  echo "❌ Failed to get student token"
  exit 1
fi

echo "✅ Student Token: ${STUDENT_TOKEN:0:20}..."

# Test 8: Get Available Courses
echo -e "\n8. Get Available Courses (Semester 5)"
curl -s -X GET "${BASE_URL}/api/students/available-courses/5" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.'

echo -e "\n========================================="
echo "✅ API TESTS COMPLETED"
echo "========================================="
