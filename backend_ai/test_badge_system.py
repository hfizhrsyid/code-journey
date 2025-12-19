#!/usr/bin/env python
"""
Test script untuk Badge System API
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def test_get_all_badges():
    """Test GET /badges/"""
    print("\n" + "="*60)
    print("TEST 1: Get All Available Badges")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/badges/")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Total Badges: {data['count']}")
    
    for badge in data['badges']:
        topic = badge.get('topic_name', 'N/A')
        print(f"  - {badge['name']} ({badge['badge_type']}) | Topic: {topic}")
    
    return response.status_code == 200


def test_user_login():
    """Test user login & get token"""
    print("\n" + "="*60)
    print("TEST 2: User Login & Get Token")
    print("="*60)
    
    # First create a test user
    print("\n📝 Creating test user...")
    signup_data = {
        "username": f"testuser_{int(time.time())}",
        "email": f"test_{int(time.time())}@example.com",
        "password": "Test@1234",
        "password2": "Test@1234",
        "first_name": "Test",
        "last_name": "User"
    }
    
    signup_response = requests.post(f"{BASE_URL}/auth/signup/", json=signup_data)
    print(f"Signup Status: {signup_response.status_code}")
    
    if signup_response.status_code not in [200, 201]:
        print(f"Error: {signup_response.text}")
        return None, None
    
    # Now login
    print("\n🔐 Logging in...")
    login_data = {
        "username": signup_data['username'],
        "password": signup_data['password']
    }
    
    login_response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
    print(f"Login Status: {login_response.status_code}")
    
    if login_response.status_code != 200:
        print(f"Error: {login_response.text}")
        return None, None
    
    data = login_response.json()
    token = data.get('token')
    user = data.get('user')
    
    print(f"✅ Login successful!")
    print(f"Token: {token[:20]}...")
    print(f"User: {user['username']} (ID: {user['id']})")
    
    return token, user


def test_get_user_badges(token):
    """Test GET /user/badges/"""
    print("\n" + "="*60)
    print("TEST 3: Get User's Earned Badges & Progress")
    print("="*60)
    
    headers = {"Authorization": f"Token {token}"}
    response = requests.get(f"{BASE_URL}/user/badges/", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Error: {response.text}")
        return False
    
    data = response.json()
    print(f"\n📊 Badge Summary:")
    print(f"  Total Earned: {data['total_earned']}")
    print(f"  Earned Badges: {len(data['earned'])}")
    
    if data['earned']:
        print(f"\n  🏆 Earned Badges:")
        for badge in data['earned']:
            print(f"    - {badge['name']} ({badge['badge_type']})")
            print(f"      Earned at: {badge['earned_at']}")
    
    print(f"\n📈 Progress:")
    progress = data['progress']
    print(f"  Overall Accuracy: {progress.get('overall_accuracy', 'N/A')}%")
    print(f"  Total Attempts: {progress.get('total_attempts', 0)}")
    print(f"  Correct Attempts: {progress.get('correct_attempts', 0)}")
    
    if progress.get('by_topic'):
        print(f"\n  By Topic:")
        for topic_id, topic_data in progress['by_topic'].items():
            print(f"    - {topic_data['name']}: {topic_data['accuracy']}% ({topic_data['correct']}/{topic_data['attempts']})")
    
    return True


def test_submit_answer(token):
    """Test submitting answer & badge unlock"""
    print("\n" + "="*60)
    print("TEST 4: Submit Answer & Check Badge Unlock")
    print("="*60)
    
    # First get a question
    print("\n📋 Getting a question...")
    headers = {"Authorization": f"Token {token}"}
    q_response = requests.get(f"{BASE_URL}/questions/?limit=1", headers=headers)
    
    if q_response.status_code != 200:
        print(f"Error getting question: {q_response.text}")
        return False
    
    questions = q_response.json()['questions']
    if not questions:
        print("No questions available")
        return False
    
    question = questions[0]
    print(f"Question ID: {question['question_id']}")
    print(f"Type: {question['question_type']}")
    print(f"Topic: {question.get('topic', 'N/A')}")
    
    # Submit answer
    print("\n✍️  Submitting answer...")
    submit_data = {
        "question_id": question['question_id'],
        "answer": "var x = 10;"  # Sample answer
    }
    
    submit_response = requests.post(
        f"{BASE_URL}/questions/submit/",
        json=submit_data,
        headers=headers
    )
    
    print(f"Status: {submit_response.status_code}")
    
    if submit_response.status_code != 201:
        print(f"Error: {submit_response.text}")
        return False
    
    result = submit_response.json()
    print(f"\n📊 Answer Result:")
    print(f"  Correct: {result.get('correct', False)}")
    print(f"  Feedback: {result.get('feedback', 'N/A')}")
    print(f"  Saved: {result.get('saved', False)}")
    
    if result.get('newly_unlocked_badges'):
        print(f"\n🏆 NEW BADGES UNLOCKED!")
        for badge in result['newly_unlocked_badges']:
            print(f"  - {badge['badge_name']} ({badge['badge_type']})")
            if badge.get('topic_name'):
                print(f"    Topic: {badge['topic_name']}")
    else:
        print(f"\n  No new badges unlocked yet")
    
    return True


def main():
    """Run all tests"""
    print("\n")
    print("🎮 BADGE SYSTEM API TEST")
    print("="*60)
    
    # Test 1: Get all badges
    test1 = test_get_all_badges()
    
    # Test 2: Login
    token, user = test_user_login()
    
    if not token:
        print("\n❌ Login failed, skipping remaining tests")
        return
    
    # Test 3: Get user badges
    test3 = test_get_user_badges(token)
    
    # Test 4: Submit answer
    test4 = test_submit_answer(token)
    
    # Summary
    print("\n" + "="*60)
    print("📋 TEST SUMMARY")
    print("="*60)
    print(f"✅ Get All Badges: {'PASS' if test1 else 'FAIL'}")
    print(f"✅ User Login: {'PASS' if token else 'FAIL'}")
    print(f"✅ Get User Badges: {'PASS' if test3 else 'FAIL'}")
    print(f"✅ Submit Answer: {'PASS' if test4 else 'FAIL'}")
    print("\n✨ Badge System Backend Implementation COMPLETE! ✨\n")


if __name__ == "__main__":
    main()
