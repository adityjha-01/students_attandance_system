#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "════════════════════════════════════════════════════════════"
echo "    🧪 API ENDPOINT TESTS"
echo "════════════════════════════════════════════════════════════"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
echo "GET $BASE_URL/health"
curl -s $BASE_URL/health | python3 -m json.tool
echo ""
echo "───────────────────────────────────────────────────────────"
echo ""

# Test 2: Register Student
echo "2️⃣  Testing Student Registration..."
echo "POST $BASE_URL/auth/register"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.student@university.edu",
    "password": "Student123",
    "name": "Test Student",
    "user_type": "student",
    "semester": 5
  }')

echo "$REGISTER_RESPONSE" | python3 -m json.tool
STUDENT_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
echo ""
echo "───────────────────────────────────────────────────────────"
echo ""

# Test 3: Register Professor
echo "3️⃣  Testing Professor Registration..."
echo "POST $BASE_URL/auth/register"
PROF_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prof.test@university.edu",
    "password": "Professor123",
    "name": "Test Professor",
    "user_type": "professor",
    "department": "CS"
  }')

echo "$PROF_RESPONSE" | python3 -m json.tool
PROF_TOKEN=$(echo "$PROF_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
echo ""
echo "───────────────────────────────────────────────────────────"
echo ""

# Test 4: Login
echo "4️⃣  Testing Login..."
echo "POST $BASE_URL/auth/login"
curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.student@university.edu",
    "password": "Student123",
    "user_type": "student"
  }' | python3 -m json.tool
echo ""
echo "───────────────────────────────────────────────────────────"
echo ""

# Test 5: Create Course (Professor)
if [ ! -z "$PROF_TOKEN" ]; then
    echo "5️⃣  Testing Create Course (Professor)..."
    echo "POST $BASE_URL/professor/create-course"
    curl -s -X POST $BASE_URL/professor/create-course \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $PROF_TOKEN" \
      -d '{
        "course_name": "Database Management Systems",
        "subject_code": "CS301",
        "credits": 3,
        "semester_offered": 5,
        "max_enrollment": 60,
        "course_start_date": "2026-04-01",
        "course_end_date": "2026-07-31"
      }' | python3 -m json.tool
    echo ""
    echo "───────────────────────────────────────────────────────────"
    echo ""
fi

# Test 6: Get Professor Courses
if [ ! -z "$PROF_TOKEN" ]; then
    echo "6️⃣  Testing Get Professor Courses..."
    echo "GET $BASE_URL/professor/courses"
    curl -s -X GET $BASE_URL/professor/courses \
      -H "Authorization: Bearer $PROF_TOKEN" | python3 -m json.tool
    echo ""
    echo "───────────────────────────────────────────────────────────"
    echo ""
fi

# Test 7: Get Available Courses (Student)
if [ ! -z "$STUDENT_TOKEN" ]; then
    echo "7️⃣  Testing Get Available Courses (Student)..."
    echo "GET $BASE_URL/student/available-courses/5"
    curl -s -X GET $BASE_URL/student/available-courses/5 \
      -H "Authorization: Bearer $STUDENT_TOKEN" | python3 -m json.tool
    echo ""
    echo "───────────────────────────────────────────────────────────"
    echo ""
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "    ✅ API Tests Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Student Token: $STUDENT_TOKEN"
echo "Professor Token: $PROF_TOKEN"
echo ""
