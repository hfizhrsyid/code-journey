#!/usr/bin/env python
"""Verify all questions have proper topic associations"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import Question, Topic

print('=' * 70)
print('QUESTION-TOPIC ASSOCIATION VERIFICATION')
print('=' * 70)

# Get all topics
topics = Topic.objects.all().order_by('order')

total_questions = 0
orphan_questions = 0

for topic in topics:
    questions = Question.objects.filter(topic=topic, is_active=True)
    count = questions.count()
    total_questions += count
    
    print(f'\n{topic.order}. {topic.name}')
    print(f'   Questions: {count}')
    
    if count > 0:
        # Show first 3 questions as sample
        for q in questions[:3]:
            print(f'   - Q{q.id}: {q.question_text[:60]}...')
        if count > 3:
            print(f'   ... and {count - 3} more')
    else:
        print('   ⚠️  NO QUESTIONS!')

# Check for orphan questions (no topic)
orphans = Question.objects.filter(topic__isnull=True, is_active=True)
orphan_count = orphans.count()

print('\n' + '=' * 70)
print('SUMMARY')
print('=' * 70)
print(f'Total Topics: {topics.count()}')
print(f'Total Questions: {total_questions}')
print(f'Orphan Questions (no topic): {orphan_count}')

if orphan_count > 0:
    print('\n⚠️  WARNING: Found questions without topics!')
    print('These questions will not be counted in topic progress:')
    for q in orphans[:10]:
        print(f'  Q{q.id}: {q.question_text[:60]}...')
    if orphan_count > 10:
        print(f'  ... and {orphan_count - 10} more')
else:
    print('\n✅ All questions have proper topic associations!')

print('=' * 70)
