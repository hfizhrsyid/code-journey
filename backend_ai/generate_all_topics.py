#!/usr/bin/env python
"""
Generate questions for all Indonesian topics
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Topic, Question
from django.core.management import call_command

# Define topics with their question counts per difficulty level
topics = [
    ("Variabel dan Tipe Data", 10),
    ("Operator", 10),
    ("Percabangan", 10),
    ("Perulangan", 10),
    ("Pengurutan", 10),
    ("Pencarian", 10),
]

# Generate for difficulties 1, 2, and 3
difficulties = [1, 2, 3]

print("=" * 60)
print("Generating questions for all topics...")
print("=" * 60)

for topic_name, count in topics:
    # Check if topic exists
    topic = Topic.objects.filter(name=topic_name).first()
    if not topic:
        print(f"\n❌ Topic '{topic_name}' not found, skipping...")
        continue
    
    # Generate for each difficulty level
    for difficulty in difficulties:
        # Check existing questions for this difficulty
        existing = Question.objects.filter(
            topic=topic, 
            is_active=True, 
            difficulty=difficulty
        ).count()
        
        if existing >= count:
            print(f"\n✓ {topic_name} (Difficulty {difficulty}): Already has {existing} questions, skipping...")
            continue
        
        needed = count - existing
        print(f"\n📝 {topic_name} (Difficulty {difficulty}): Has {existing} questions, generating {needed} more...")
        
        try:
            call_command('generate_questions', 
                        topic=topic_name, 
                        count=needed, 
                        difficulty=difficulty)
            print(f"   ✅ Done!")
        except Exception as e:
            print(f"   ❌ Error: {e}")

print("\n" + "=" * 60)
print("Summary:")
print("=" * 60)
for topic in Topic.objects.all():
    for diff in difficulties:
        q_count = Question.objects.filter(
            topic=topic, 
            is_active=True, 
            difficulty=diff
        ).count()
        if q_count > 0:
            print(f"  {topic.name} (Difficulty {diff}): {q_count} questions")
print("=" * 60)
