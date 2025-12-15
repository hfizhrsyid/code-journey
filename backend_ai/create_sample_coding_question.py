#!/usr/bin/env python
"""
Create a sample coding question with test cases
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question

# Get first topic
topic = Topic.objects.first()

# Create a coding question with test cases
question = Question.objects.create(
    question_type="coding",
    difficulty=1,
    topic=topic,
    question_text="Tulis program Python yang mencetak 'Hello, World!'",
    code_template="# Tulis kode Anda di sini\n",
    answer_key={"answer": "print('Hello, World!')"},
    explanation="Gunakan fungsi print() untuk mencetak teks",
    test_cases=[
        {
            "input": "",
            "expected_output": "Hello, World!"
        }
    ],
    is_active=True
)

print(f"✅ Created coding question with ID: {question.id}")
print(f"   Topic: {topic.name}")
print(f"   Test cases: {len(question.test_cases)}")
print(f"\nYou can test it at: http://localhost:8081/level/codingQuestion")
