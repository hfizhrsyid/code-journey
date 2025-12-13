"""
End-to-end integration test for Quiz Application
Tests the complete flow: Signup → Login → Get Questions → Submit Answer
"""

import os
import sys
os.environ['DJANGO_SETTINGS_MODULE'] = 'backend_ai.settings'

import django
django.setup()

from django.test import TestCase, Client
from django.contrib.auth.models import User
from quiz.models import Question, Topic, QuestionAttempt
import json

print("\n" + "=" * 70)
print("END-TO-END INTEGRATION TEST")
print("=" * 70)

# Initialize test client
client = Client()
BASE_URL = "/api"

# Test 1: Create and login user
print("\n[1] Testing User Signup & Login...")
test_username = "testuser_e2e"
test_email = "testuser_e2e@test.com"
test_password = "TestPassword123!"

# Signup
signup_response = client.post(
    f"{BASE_URL}/auth/signup/",
    json.dumps({
        "username": test_username,
        "email": test_email,
        "password": test_password,
        "password2": test_password
    }),
    content_type="application/json"
)
print(f"  Signup Status: {signup_response.status_code}")
if signup_response.status_code == 201:
    print(f"  ✓ User created successfully")
else:
    print(f"  ✗ Signup failed: {signup_response.content}")

# Login
login_response = client.post(
    f"{BASE_URL}/auth/login/",
    json.dumps({
        "username": test_username,
        "password": test_password
    }),
    content_type="application/json"
)
print(f"  Login Status: {login_response.status_code}")
if login_response.status_code == 200:
    print(f"  ✓ Login successful")
else:
    print(f"  ✗ Login failed: {login_response.content}")

# Test 2: Get Topics
print("\n[2] Testing GET /api/topics/...")
topics_response = client.get(f"{BASE_URL}/topics/")
print(f"  Status: {topics_response.status_code}")
if topics_response.status_code == 200:
    data = json.loads(topics_response.content)
    print(f"  ✓ Topics found: {data['count']}")
    for topic in data.get('topics', [])[:3]:
        print(f"    - {topic['name']}: {topic['question_count']} questions")
else:
    print(f"  ✗ Failed to fetch topics")

# Test 3: Get Questions (requires authentication)
print("\n[3] Testing GET /api/questions/?topic=Python%20Basics (authenticated)...")
questions_response = client.get(f"{BASE_URL}/questions/?topic=Python%20Basics")
print(f"  Status: {questions_response.status_code}")
if questions_response.status_code == 200:
    data = json.loads(questions_response.content)
    print(f"  ✓ Questions found: {data['count']}")
    if data['count'] > 0:
        q = data['questions'][0]
        print(f"    Sample question: {q['question_text'][:60]}...")
        question_id = q['id']
    else:
        question_id = None
else:
    print(f"  ✗ Failed to fetch questions")
    question_id = None

# Test 4: Submit Answer
if question_id:
    print(f"\n[4] Testing POST /api/questions/submit/ (question_id={question_id})...")
    submit_response = client.post(
        f"{BASE_URL}/questions/submit/",
        json.dumps({
            "question_id": question_id,
            "answer": "A"
        }),
        content_type="application/json"
    )
    print(f"  Status: {submit_response.status_code}")
    if submit_response.status_code == 201:
        data = json.loads(submit_response.content)
        print(f"  ✓ Answer submitted")
        print(f"    Correct: {data['correct']}")
        print(f"    Feedback: {data['feedback'][:60]}...")
    else:
        print(f"  ✗ Failed to submit answer: {submit_response.content}")

# Test 5: Get User Attempts
print("\n[5] Testing GET /api/questions/attempts/ (authenticated)...")
attempts_response = client.get(f"{BASE_URL}/questions/attempts/")
print(f"  Status: {attempts_response.status_code}")
if attempts_response.status_code == 200:
    data = json.loads(attempts_response.content)
    print(f"  ✓ User attempts retrieved")
    print(f"    Total: {data['count']}, Correct: {data['correct']}, Incorrect: {data['incorrect']}")
else:
    print(f"  ✗ Failed to fetch attempts")

# Test 6: Database Verification
print("\n[6] Verifying Database State...")
user_count = User.objects.count()
question_count = Question.objects.count()
attempt_count = QuestionAttempt.objects.count()
topic_count = Topic.objects.count()

print(f"  Users in database: {user_count}")
print(f"  Topics in database: {topic_count}")
print(f"  Questions in database: {question_count}")
print(f"  Attempts in database: {attempt_count}")

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70 + "\n")
