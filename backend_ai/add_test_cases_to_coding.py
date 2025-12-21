"""
Script to add test cases to existing coding questions using AI
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Question
from quiz.services import get_groq_client

def generate_test_cases(question_text, code_template, answer_key):
    """Generate test cases using Groq AI"""
    client = get_groq_client()
    
    prompt = f"""Generate test cases for this Python coding question.

Question: {question_text}

Code Template:
{code_template}

Expected Solution Approach: {answer_key}

Generate 3-5 test cases in this EXACT JSON format:
[
  {{"input": "input_values", "expected_output": "expected_result"}},
  {{"input": "input_values", "expected_output": "expected_result"}}
]

Rules:
1. "input" should be the function arguments (e.g., "5, 5" for two parameters)
2. "expected_output" should be what print() will output (e.g., "True" or "25")
3. Cover edge cases (empty, zero, negative, large values)
4. Make sure outputs are EXACT strings that print() would produce
5. Return ONLY the JSON array, no explanation

Example for a function that adds two numbers:
[
  {{"input": "2, 3", "expected_output": "5"}},
  {{"input": "0, 0", "expected_output": "0"}},
  {{"input": "-5, 5", "expected_output": "0"}}
]"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert at creating test cases for Python coding questions. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        response = completion.choices[0].message.content.strip()
        
        # Extract JSON from markdown code blocks if present
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            response = response.split("```")[1].split("```")[0].strip()
        
        # Parse JSON
        test_cases = json.loads(response)
        
        # Validate structure
        if isinstance(test_cases, list) and len(test_cases) > 0:
            for tc in test_cases:
                if not isinstance(tc, dict) or 'input' not in tc or 'expected_output' not in tc:
                    print(f"⚠️ Invalid test case structure: {tc}")
                    return None
            return test_cases
        
        return None
    
    except Exception as e:
        print(f"❌ Error generating test cases: {e}")
        return None


def add_test_cases_to_coding_questions():
    """Add test cases to all coding questions that don't have them"""
    
    # Get coding questions without test cases
    coding_questions = Question.objects.filter(
        question_type='coding',
        is_active=True,
        test_cases__isnull=True
    )
    
    print(f"📋 Found {coding_questions.count()} coding questions without test cases\n")
    
    success_count = 0
    fail_count = 0
    
    for question in coding_questions:
        print(f"\n🔧 Processing Q{question.id}: {question.question_text[:60]}...")
        
        # Generate test cases
        test_cases = generate_test_cases(
            question.question_text,
            question.code_template or "",
            str(question.answer_key)
        )
        
        if test_cases:
            # Update question
            question.test_cases = test_cases
            question.save()
            print(f"   ✅ Added {len(test_cases)} test cases")
            print(f"   Test cases: {json.dumps(test_cases, indent=2)}")
            success_count += 1
        else:
            print(f"   ❌ Failed to generate test cases")
            fail_count += 1
    
    print(f"\n" + "="*50)
    print(f"✅ Successfully added test cases to {success_count} questions")
    print(f"❌ Failed for {fail_count} questions")
    print(f"📊 Total processed: {success_count + fail_count}")


if __name__ == '__main__':
    print("🚀 Starting test case generation for coding questions...")
    add_test_cases_to_coding_questions()
