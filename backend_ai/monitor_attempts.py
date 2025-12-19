#!/usr/bin/env python
"""Real-time monitoring of attempts being saved"""
import os
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_ai.settings')
django.setup()

from quiz.models import QuestionAttempt
from django.contrib.auth.models import User

print('=' * 70)
print('REAL-TIME ATTEMPT MONITOR')
print('=' * 70)
print('\nMonitoring attempts... (Press Ctrl+C to stop)\n')

# Get initial count
user = User.objects.get(username='Rama')
prev_count = QuestionAttempt.objects.filter(user=user).count()
print(f'Initial count: {prev_count} attempts\n')

try:
    while True:
        current_count = QuestionAttempt.objects.filter(user=user).count()
        
        if current_count > prev_count:
            # New attempt detected!
            new_attempts = QuestionAttempt.objects.filter(user=user).order_by('-created_at')[:current_count - prev_count]
            
            for attempt in reversed(list(new_attempts)):
                status = '✅ CORRECT' if attempt.is_correct else '❌ WRONG'
                print(f'[{attempt.created_at.strftime("%H:%M:%S")}] NEW ATTEMPT: Q{attempt.question_id} - Answer: {attempt.answer} - {status}')
            
            prev_count = current_count
            print(f'Total attempts: {current_count}\n')
        
        time.sleep(1)  # Check every second
        
except KeyboardInterrupt:
    print('\n\nMonitoring stopped.')
    print(f'Final count: {QuestionAttempt.objects.filter(user=user).count()} attempts')
    print('=' * 70)
