#!/usr/bin/env python
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'backend_ai.settings'

import django
django.setup()

# Import services to apply the monkey patch
from quiz.services import generate_question

try:
    print("Attempting to generate a Python Basics question...")
    result = generate_question(difficulty=1, question_type="mcq")
    print(f"\nSuccess! Generated question:")
    for key, value in result.items():
        if key == "options" and isinstance(value, list):
            print(f"  {key}: {value}")
        else:
            val_str = str(value)[:100]
            print(f"  {key}: {val_str}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()

    
    print(f"Status: {response.status_code}")
    print(f"Time elapsed: {elapsed:.2f}s")
    
    if response.status_code == 201:
        data = response.json()
        print(f"✓ Successfully generated {data['created_count']} questions")
        for q in data['questions']:
            print(f"  - {q['question_type'].upper()}: {q['question_text'][:50]}...")
    else:
        print(f"✗ Error: {response.text}")
    
    # Test case 2: Max count limit (should be capped at 20)
    print("\n✓ Test 2: Request 30 questions (should be capped at 20)")
    payload = {
        "topic": "Python Functions",
        "difficulty": 3,
        "count": 30,
        "mcq_count": 10,
        "max_workers": 4
    }
    
    response = requests.post(f"{BASE_URL}/api/generate-set/", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        print(f"✓ Generated {data['created_count']} questions (requested: {data['requested_count']})")
    elif response.status_code == 400:
        print(f"✓ Validation caught error: {response.json()['error']}")
    
    # Test case 3: Invalid parameters
    print("\n✓ Test 3: Invalid difficulty (should fail)")
    payload = {
        "topic": "Python Basics",
        "difficulty": 10,
        "count": 5,
        "mcq_count": 2
    }
    
    response = requests.post(f"{BASE_URL}/api/generate-set/", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 400:
        print(f"✓ Validation error caught: {response.json()['error']}")
    
    # Test case 4: Empty topic
    print("\n✓ Test 4: Empty topic (should fail)")
    payload = {
        "topic": "",
        "difficulty": 2,
        "count": 5,
        "mcq_count": 2
    }
    
    response = requests.post(f"{BASE_URL}/api/generate-set/", json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 400:
        print(f"✓ Validation error caught: {response.json()['error']}")
    
    print("\n" + "="*60)
    print("Test Complete!")
    print("="*60)


def test_single_question():
    """Test single question generation"""
    
    print("\n" + "="*60)
    print("Testing Single Question Generation")
    print("="*60)
    
    payload = {
        "difficulty": 2,
        "question_type": "mcq"
    }
    
    print("\n✓ Generating single MCQ question...")
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/api/generate-question/", json=payload)
    elapsed = time.time() - start_time
    
    print(f"Status: {response.status_code}")
    print(f"Time elapsed: {elapsed:.2f}s")
    
    if response.status_code == 201:
        data = response.json()
        print(f"✓ Question generated:")
        print(f"  Type: {data['question_type']}")
        print(f"  Text: {data['question_text'][:60]}...")
        print(f"  Options: {data['options']}")
    else:
        print(f"✗ Error: {response.text}")


if __name__ == "__main__":
    try:
        test_single_question()
        test_generate_question_set()
        print("\n✓ All tests completed!")
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
