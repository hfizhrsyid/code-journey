#!/usr/bin/env python
"""Quick script to check database state for debugging"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import QuestionAttempt, Question, Topic
from django.contrib.auth.models import User

print('=' * 60)
print('DATABASE ANALYSIS - Progress Tracking Issue')
print('=' * 60)

# Check Variabel topic
t = Topic.objects.filter(name__icontains='Variabel').first()
if t:
    print(f'\n✓ Topic Found: {t.name} (ID: {t.id}, Order: {t.order})')
    
    # Check questions
    questions = Question.objects.filter(topic=t, is_active=True)
    print(f'  Questions: {questions.count()}')
    for q in questions:
        print(f'    Q{q.id}: {q.question_text[:60]}...')
    
    # Check attempts
    attempts = QuestionAttempt.objects.filter(question__topic=t)
    print(f'\n  Attempts for this topic: {attempts.count()}')
    if attempts.exists():
        for a in attempts[:10]:
            user_name = a.user.username if a.user else 'Anonymous (None)'
            status = '✓ CORRECT' if a.is_correct else '✗ WRONG'
            print(f'    User: {user_name:15} | Q{a.question_id} | {status}')
    else:
        print('    ⚠️  NO ATTEMPTS FOUND!')
else:
    print('\n✗ Topic "Variabel" not found!')

# Overall stats
print(f'\n' + '=' * 60)
print('OVERALL DATABASE STATS')
print('=' * 60)
print(f'Total Topics: {Topic.objects.count()}')
print(f'Total Questions: {Question.objects.count()}')
print(f'Total Attempts: {QuestionAttempt.objects.count()}')
print(f'Total Users: {User.objects.count()}')

# Check if there are any attempts without users
orphan_attempts = QuestionAttempt.objects.filter(user__isnull=True)
print(f'\n⚠️  Attempts without user: {orphan_attempts.count()}')

# Check all users
print(f'\nRegistered Users:')
for u in User.objects.all():
    attempt_count = QuestionAttempt.objects.filter(user=u).count()
    print(f'  - {u.username}: {attempt_count} attempts')

print('\n' + '=' * 60)
