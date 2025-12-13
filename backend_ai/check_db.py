#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Question, Topic
from django.contrib.auth.models import User

print("=" * 50)
print("Database Status Check")
print("=" * 50)

# Check users
users = User.objects.all()
print(f"\nUsers: {users.count()}")
for user in users:
    print(f"  - {user.username} ({user.email})")

# Check topics
topics = Topic.objects.all()
print(f"\nTopics: {topics.count()}")
for topic in topics:
    count = Question.objects.filter(topic=topic, is_active=True).count()
    print(f"  - {topic.name} ({topic.id}): {count} active questions")

# Check questions
questions = Question.objects.filter(is_active=True)
print(f"\nActive Questions: {questions.count()}")
if questions.count() > 0:
    print("  Sample questions:")
    for q in questions[:3]:
        print(f"    - [{q.id}] {q.question_text[:50]}... ({q.question_type}, difficulty {q.difficulty})")

print("\n" + "=" * 50)
