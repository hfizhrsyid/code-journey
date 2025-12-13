#!/usr/bin/env python
"""Test script for new database-first endpoints"""
import requests
import json
import time

# Base URL
BASE_URL = "http://localhost:8000/api"

print("\n" + "=" * 60)
print("Testing New Database-First Endpoints")
print("=" * 60)

# 1. Test get_topics endpoint (no auth required)
print("\n[1] Testing GET /api/topics/...")
try:
    response = requests.get(f"{BASE_URL}/topics/")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Topics found: {data.get('count', 0)}")
        for topic in data.get('topics', [])[:3]:
            print(f"  - {topic['name']}: {topic.get('question_count', 0)} questions")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# 2. Sign up and login
print("\n[2] Testing signup...")
signup_data = {
    "username": f"testuser_{int(time.time())}",
    "email": f"test_{int(time.time())}@example.com",
    "password": "TestPassword123!"
}

try:
    response = requests.post(
        f"{BASE_URL}/auth/signup/",
        json=signup_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("Signup successful")
        signup_username = signup_data["username"]
    else:
        print(f"Error: {response.text}")
        signup_username = None
except Exception as e:
    print(f"Error: {e}")
    signup_username = None

# 3. Login
if signup_username:
    print(f"\n[3] Testing login with {signup_username}...")
    login_data = {
        "username": signup_username,
        "password": signup_data["password"]
    }
    
    session = requests.Session()
    try:
        response = session.post(
            f"{BASE_URL}/auth/login/",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Login successful")
            # Check cookies
            print(f"Cookies: {session.cookies}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # 4. Test get_questions with auth
    print("\n[4] Testing GET /api/questions/ (authenticated)...")
    try:
        response = session.get(f"{BASE_URL}/questions/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Questions returned: {data.get('count', 0)}")
            for q in data.get('questions', []):
                print(f"  - [{q['id']}] {q['question_text'][:50]}...")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # 5. Test get_user_attempts
    print("\n[5] Testing GET /api/questions/attempts/ (authenticated)...")
    try:
        response = session.get(f"{BASE_URL}/questions/attempts/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"User attempts: {data.get('count', 0)}")
            print(f"Correct: {data.get('correct', 0)}, Incorrect: {data.get('incorrect', 0)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

print("\n" + "=" * 60)
print("Test Complete")
print("=" * 60 + "\n")
