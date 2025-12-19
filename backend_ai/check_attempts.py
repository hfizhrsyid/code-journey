#!/usr/bin/env python
"""Check attempts in database"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import QuestionAttempt, Question, Topic
from django.contrib.auth.models import User

print('=' * 70)
print('CHECKING ATTEMPTS IN DATABASE')
print('=' * 70)

# Check users
users = User.objects.all()
print(f'\nTotal users: {users.count()}')
for u in users:
    count = QuestionAttempt.objects.filter(user=u).count()
    print(f'  {u.username}: {count} attempts')

# Check Variabel topic
t = Topic.objects.filter(name__icontains='Variabel').first()
if t:
    print(f'\nTopic: {t.name} (ID: {t.id})')
    attempts = QuestionAttempt.objects.filter(question__topic=t)
    print(f'Total attempts for this topic: {attempts.count()}')
    
    if attempts.exists():
        print('\nAttempts:')
        for a in attempts[:20]:
            user_name = a.user.username if a.user else 'Anonymous'
            status = '✓' if a.is_correct else '✗'
            print(f'  {user_name}: Q{a.question_id} - {status}')
    else:
        print('  ⚠️  NO ATTEMPTS FOUND!')

print('\n' + '=' * 70)
