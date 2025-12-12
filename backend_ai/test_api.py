import requests
import json
import time

API_URL = "http://localhost:8000/api/"

def test_generate_mcq():
    """Test generate multiple choice question"""
    print("=" * 60)
    print("TEST 1: Generate MCQ Question")
    print("=" * 60)
    
    try:
        response = requests.post(
            f"{API_URL}generate-question/",
            json={
                "difficulty": 2,
                "question_type": "mcq"
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        
        if response.status_code == 201:
            return response.json()
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
    
    return None


def test_generate_fill():
    """Test generate fill-in-blank question"""
    print("\n" + "=" * 60)
    print("TEST 2: Generate Fill-in-Blank Question")
    print("=" * 60)
    
    try:
        response = requests.post(
            f"{API_URL}generate-question/",
            json={
                "difficulty": 1,
                "question_type": "fill"
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        
        if response.status_code == 201:
            return response.json()
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
    
    return None


def test_generate_coding():
    """Test generate coding question"""
    print("\n" + "=" * 60)
    print("TEST 3: Generate Coding Question")
    print("=" * 60)
    
    try:
        response = requests.post(
            f"{API_URL}generate-question/",
            json={
                "difficulty": 3,
                "question_type": "coding"
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        
        if response.status_code == 201:
            return response.json()
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
    
    return None


def test_check_answer(question_data, user_answer):
    """Test check answer"""
    print("\n" + "=" * 60)
    print(f"TEST 4: Check Answer (Q_ID: {question_data.get('question_id')})")
    print("=" * 60)
    
    try:
        response = requests.post(
            f"{API_URL}check-answer/",
            json={
                "question_id": question_data.get("question_id"),
                "answer": user_answer
            },
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"User Answer: {user_answer}")
        print(f"Response:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"ERROR: {str(e)}")


def test_get_question(question_id):
    """Test get question"""
    print("\n" + "=" * 60)
    print(f"TEST 5: Get Question (Q_ID: {question_id})")
    print("=" * 60)
    
    try:
        response = requests.get(
            f"{API_URL}question/{question_id}/",
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"ERROR: {str(e)}")


def check_available_models():
    import google.generativeai as genai
    from django.conf import settings
    
    genai.configure(api_key=settings.GOOGLE_API_KEY)
    print("Available models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"  - {m.name}")


if __name__ == "__main__":
    print("\n" + "🚀" * 30)
    print("TESTING BACKEND API")
    print("🚀" * 30)
    
    # Test 1: Generate MCQ
    mcq_data = test_generate_mcq()
    
    # Test 2: Generate Fill
    fill_data = test_generate_fill()
    
    # Test 3: Generate Coding
    coding_data = test_generate_coding()
    
    # Test 4 & 5: Check answers and get question
    if mcq_data:
        time.sleep(1)
        test_check_answer(mcq_data, "B")  # Test wrong answer for MCQ
        time.sleep(1)
        test_get_question(mcq_data.get("question_id"))
    
    if fill_data:
        time.sleep(1)
        test_check_answer(fill_data, "11")  # Test answer for fill
    
    print("\n" + "✅" * 30)
    print("TESTING COMPLETED!")
    print("✅" * 30 + "\n")
    
    check_available_models()