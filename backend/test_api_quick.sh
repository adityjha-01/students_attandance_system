#!/bin/bash

BASE_URL="http://localhost:5000"

echo "========================================="
echo "TESTING STUDENT ATTENDANCE SYSTEM API"
echo "========================================="

# Test 1: Health Check
echo -e "\n1. Health Check"
curl -s "${BASE_URL}/api/health" | jq '.'

# Test 2: Professor Login
echo -e "\n2. Professor Login"
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

echo "✅ Professor Token obtained"

# Test 3: Get Professor's Courses
echo -e "\n3. Get Professor's Courses"
COURSES_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/professors/courses" \
  -H "Authorization: Bearer $PROF_TOKEN")
echo "$COURSES_RESPONSE" | jq '.'

# Extract course_id from response
COURSE_ID=$(echo "$COURSES_RESPONSE" | jq -r '.data[0].COURSE_ID // empty')

if [ -n "$COURSE_ID" ] && [ "$COURSE_ID" != "null" ]; then
  echo "✅ Found Course ID: $COURSE_ID"
  
  # Test 4: Get Enrolled Students
  echo -e "\n4. Get Enrolled Students for Course $COURSE_ID"
  curl -s -X GET "${BASE_URL}/api/professors/courses/${COURSE_ID}/students" \
    -H "Authorization: Bearer $PROF_TOKEN" | jq '.'
else
  echo "⚠ No courses found, skipping enrolled students test"
fi

# Test 5: Student Login  
echo -e "\n5. Student Login"
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

echo "✅ Student Token obtained"

# Test 6: Get Available Courses
echo -e "\n6. Get Available Courses (Semester 5)"
curl -s -X GET "${BASE_URL}/api/students/available-courses/5" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.'

# Test 7: Get Enrolled Courses
echo -e "\n7. Get Student's Enrolled Courses"
curl -s -X GET "${BASE_URL}/api/students/enrolled-courses" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.'

echo -e "\n========================================="
echo "✅ API TESTS COMPLETED"
echo "========================================="
